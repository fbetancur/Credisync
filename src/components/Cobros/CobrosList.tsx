import { useState, useEffect } from 'react';
import { db } from '../../lib/db';
import { format, parseISO, differenceInDays } from 'date-fns';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../../amplify/data/resource';

const client = generateClient<Schema>();

export default function CobrosList() {
  const [cuotasHoy, setCuotasHoy] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [mostrarModalPago, setMostrarModalPago] = useState(false);
  const [cuotaSeleccionada, setCuotaSeleccionada] = useState<any>(null);
  const [montoPago, setMontoPago] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [ubicacion, setUbicacion] = useState<{ lat: number; lng: number } | null>(null);

  // Estadísticas del día
  const [totalRecaudado, setTotalRecaudado] = useState(0);
  const [cuotasCobradas, setCuotasCobradas] = useState(0);

  useEffect(() => {
    cargarCuotasDelDia();
    cargarEstadisticas();
  }, []);

  const cargarCuotasDelDia = async () => {
    setLoading(true);
    try {
      const hoy = format(new Date(), 'yyyy-MM-dd');
      
      // Obtener cuotas programadas para hoy o atrasadas
      const cuotas = await db.cuotas
        .where('fechaProgramada')
        .belowOrEqual(hoy)
        .and((cuota) => cuota.estado !== 'PAGADA')
        .toArray();

      // Enriquecer con datos del cliente y crédito
      const cuotasEnriquecidas = await Promise.all(
        cuotas.map(async (cuota) => {
          const cliente = await db.clientes.get(cuota.clienteId);
          const credito = await db.creditos.get(cuota.creditoId);
          
          // Calcular días de atraso
          const diasAtraso = differenceInDays(new Date(), parseISO(cuota.fechaProgramada));
          
          return {
            ...cuota,
            cliente,
            credito,
            diasAtraso: diasAtraso > 0 ? diasAtraso : 0,
          };
        })
      );

      // Ordenar: primero las más atrasadas
      cuotasEnriquecidas.sort((a, b) => b.diasAtraso - a.diasAtraso);

      setCuotasHoy(cuotasEnriquecidas);
    } catch (error: any) {
      setMensaje(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const cargarEstadisticas = async () => {
    const hoy = format(new Date(), 'yyyy-MM-dd');
    const pagosHoy = await db.pagos
      .where('fecha')
      .between(hoy + 'T00:00:00', hoy + 'T23:59:59')
      .toArray();

    const total = pagosHoy.reduce((sum, pago) => sum + (pago.monto || 0), 0);
    setTotalRecaudado(total);
    setCuotasCobradas(pagosHoy.length);
  };

  const abrirModalPago = (cuota: any) => {
    setCuotaSeleccionada(cuota);
    setMontoPago(cuota.saldoPendiente?.toString() || cuota.montoProgramado.toString());
    setMostrarModalPago(true);
    capturarUbicacion();
  };

  const capturarUbicacion = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUbicacion({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.error('Error capturando ubicación:', error);
        }
      );
    }
  };

  const registrarPago = async () => {
    if (!cuotaSeleccionada) return;

    const montoNum = parseFloat(montoPago);
    if (!montoNum || montoNum <= 0) {
      setMensaje('❌ El monto debe ser mayor a 0');
      return;
    }

    setLoading(true);
    setMensaje('');

    try {
      const empresaId = 'empresa-demo-001';
      const cobradorId = 'cobrador-demo-001';
      const pagoId = `pago-${Date.now()}`;

      // 1. Crear registro de pago
      const nuevoPago = {
        id: pagoId,
        empresaId,
        creditoId: cuotaSeleccionada.creditoId,
        cuotaId: cuotaSeleccionada.id,
        clienteId: cuotaSeleccionada.clienteId,
        cobradorId,
        rutaId: cuotaSeleccionada.rutaId || 'ruta-default',
        monto: montoNum,
        tipo: (montoNum >= cuotaSeleccionada.montoProgramado ? 'CUOTA_NORMAL' : 'PAGO_PARCIAL') as 'CUOTA_NORMAL' | 'PAGO_PARCIAL',
        fecha: new Date().toISOString(),
        latitud: ubicacion?.lat,
        longitud: ubicacion?.lng,
        observaciones,
        sincronizado: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        _pendingSync: true,
      };

      await db.pagos.add(nuevoPago);

      // 2. Actualizar estado de la cuota
      const montoPagadoAnterior = cuotaSeleccionada.montoPagado || 0;
      const nuevoMontoPagado = montoPagadoAnterior + montoNum;
      const nuevoSaldo = cuotaSeleccionada.montoProgramado - nuevoMontoPagado;

      let nuevoEstado: 'PENDIENTE' | 'PAGADA' | 'PARCIAL' = 'PENDIENTE';
      if (nuevoSaldo <= 0) {
        nuevoEstado = 'PAGADA';
      } else if (nuevoMontoPagado > 0) {
        nuevoEstado = 'PARCIAL';
      }

      await db.cuotas.update(cuotaSeleccionada.id, {
        montoPagado: nuevoMontoPagado,
        saldoPendiente: nuevoSaldo > 0 ? nuevoSaldo : 0,
        estado: nuevoEstado,
        fechaPago: nuevoEstado === 'PAGADA' ? format(new Date(), 'yyyy-MM-dd') : undefined,
        visitada: true,
        updatedAt: new Date().toISOString(),
      });

      // 3. Actualizar el crédito
      const credito = await db.creditos.get(cuotaSeleccionada.creditoId);
      if (credito) {
        const nuevoSaldoPendiente = (credito.saldoPendiente || credito.totalAPagar) - montoNum;
        const cuotasPagadasActuales = credito.cuotasPagadas || 0;
        const nuevasCuotasPagadas = nuevoEstado === 'PAGADA' 
          ? cuotasPagadasActuales + 1 
          : cuotasPagadasActuales;

        await db.creditos.update(cuotaSeleccionada.creditoId, {
          saldoPendiente: nuevoSaldoPendiente > 0 ? nuevoSaldoPendiente : 0,
          cuotasPagadas: nuevasCuotasPagadas,
          cuotasPendientes: credito.numeroCuotas - nuevasCuotasPagadas,
          estado: nuevoSaldoPendiente <= 0 ? 'CANCELADO' : 'ACTIVO',
          updatedAt: new Date().toISOString(),
        });
      }

      // 4. Sincronizar con AWS (background)
      try {
        // @ts-ignore
        await client.models.Pago.create({
          empresaId,
          creditoId: cuotaSeleccionada.creditoId,
          cuotaId: cuotaSeleccionada.id,
          clienteId: cuotaSeleccionada.clienteId,
          cobradorId,
          rutaId: cuotaSeleccionada.rutaId || 'ruta-default',
          monto: montoNum,
          tipo: nuevoPago.tipo,
          fecha: nuevoPago.fecha,
          latitud: ubicacion?.lat,
          longitud: ubicacion?.lng,
          observaciones,
          sincronizado: true,
        });

        await db.pagos.update(pagoId, {
          sincronizado: true,
          _pendingSync: false,
          _lastSync: new Date().toISOString(),
        });
      } catch (syncError) {
        console.log('Pago guardado offline, se sincronizará después');
      }

      setMensaje('✅ Pago registrado exitosamente');
      setMostrarModalPago(false);
      setCuotaSeleccionada(null);
      setMontoPago('');
      setObservaciones('');
      
      cargarCuotasDelDia();
      cargarEstadisticas();
    } catch (error: any) {
      setMensaje(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>💵 Cobros del Día</h2>

      {mensaje && (
        <div
          style={{
            padding: '10px',
            marginBottom: '20px',
            backgroundColor: mensaje.includes('✅') ? '#d4edda' : '#f8d7da',
            border: `1px solid ${mensaje.includes('✅') ? '#c3e6cb' : '#f5c6cb'}`,
            borderRadius: '5px',
          }}
        >
          {mensaje}
        </div>
      )}

      {/* Estadísticas del día */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '15px',
          marginBottom: '20px',
        }}
      >
        <div
          style={{
            padding: '20px',
            backgroundColor: '#d4edda',
            border: '1px solid #c3e6cb',
            borderRadius: '8px',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#155724' }}>
            ${totalRecaudado.toLocaleString()}
          </div>
          <div style={{ fontSize: '14px', color: '#155724' }}>Total Recaudado Hoy</div>
        </div>

        <div
          style={{
            padding: '20px',
            backgroundColor: '#cce5ff',
            border: '1px solid #b8daff',
            borderRadius: '8px',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#004085' }}>
            {cuotasCobradas}
          </div>
          <div style={{ fontSize: '14px', color: '#004085' }}>Cuotas Cobradas</div>
        </div>

        <div
          style={{
            padding: '20px',
            backgroundColor: '#fff3cd',
            border: '1px solid #ffeeba',
            borderRadius: '8px',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#856404' }}>
            {cuotasHoy.length}
          </div>
          <div style={{ fontSize: '14px', color: '#856404' }}>Pendientes</div>
        </div>
      </div>

      {/* Lista de cuotas */}
      <div>
        <h3>📋 Cuotas para cobrar ({cuotasHoy.length})</h3>
        {loading && <p>⏳ Cargando...</p>}
        
        {cuotasHoy.map((cuota) => (
          <div
            key={cuota.id}
            style={{
              padding: '15px',
              marginBottom: '15px',
              backgroundColor: 'white',
              border: `2px solid ${cuota.diasAtraso > 0 ? '#dc3545' : '#28a745'}`,
              borderRadius: '8px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '10px' }}>
              <div style={{ flex: 1 }}>
                <h4 style={{ margin: '0 0 5px 0', fontSize: '18px' }}>
                  {cuota.cliente?.nombre || 'Cliente desconocido'}
                </h4>
                <div style={{ fontSize: '14px', color: '#666' }}>
                  <div>📄 {cuota.cliente?.documento}</div>
                  <div>📱 {cuota.cliente?.telefono}</div>
                  <div>📍 {cuota.cliente?.direccion}</div>
                </div>
              </div>
              
              <div style={{ textAlign: 'right' }}>
                {cuota.diasAtraso > 0 && (
                  <div
                    style={{
                      padding: '4px 12px',
                      backgroundColor: '#dc3545',
                      color: 'white',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      marginBottom: '5px',
                    }}
                  >
                    ⚠️ {cuota.diasAtraso} día(s) de atraso
                  </div>
                )}
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#28a745' }}>
                  ${(cuota.saldoPendiente || cuota.montoProgramado).toLocaleString()}
                </div>
                <div style={{ fontSize: '12px', color: '#666' }}>
                  Cuota #{cuota.numero} - {cuota.fechaProgramada}
                </div>
              </div>
            </div>

            {cuota.estado === 'PARCIAL' && (
              <div style={{
                padding: '8px',
                backgroundColor: '#fff3cd',
                borderRadius: '4px',
                fontSize: '13px',
                marginBottom: '10px',
              }}>
                💰 Pagado: ${(cuota.montoPagado || 0).toLocaleString()} de ${cuota.montoProgramado.toLocaleString()}
              </div>
            )}

            <button
              onClick={() => abrirModalPago(cuota)}
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: 'bold',
              }}
            >
              💵 Registrar Pago
            </button>
          </div>
        ))}

        {cuotasHoy.length === 0 && !loading && (
          <div
            style={{
              padding: '40px',
              textAlign: 'center',
              backgroundColor: '#f8f9fa',
              borderRadius: '8px',
              color: '#666',
            }}
          >
            <div style={{ fontSize: '48px', marginBottom: '10px' }}>🎉</div>
            <div style={{ fontSize: '18px' }}>¡No hay cuotas pendientes para hoy!</div>
          </div>
        )}
      </div>

      {/* Modal de pago */}
      {mostrarModalPago && cuotaSeleccionada && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => setMostrarModalPago(false)}
        >
          <div
            style={{
              backgroundColor: 'white',
              padding: '30px',
              borderRadius: '12px',
              maxWidth: '500px',
              width: '90%',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ marginTop: 0 }}>💵 Registrar Pago</h3>

            <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
              <strong>{cuotaSeleccionada.cliente?.nombre}</strong>
              <div style={{ fontSize: '14px', color: '#666', marginTop: '5px' }}>
                Cuota #{cuotaSeleccionada.numero} | {cuotaSeleccionada.fechaProgramada}
                <br />
                <strong>Saldo pendiente: ${(cuotaSeleccionada.saldoPendiente || cuotaSeleccionada.montoProgramado).toLocaleString()}</strong>
              </div>
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                💰 Monto del pago
              </label>
              <input
                type="number"
                value={montoPago}
                onChange={(e) => setMontoPago(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  fontSize: '18px',
                  borderRadius: '5px',
                  border: '1px solid #ccc',
                }}
              />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                📝 Observaciones (opcional)
              </label>
              <textarea
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                rows={3}
                style={{
                  width: '100%',
                  padding: '10px',
                  fontSize: '14px',
                  borderRadius: '5px',
                  border: '1px solid #ccc',
                  fontFamily: 'inherit',
                }}
                placeholder="Ej: Cliente pagó en efectivo"
              />
            </div>

            {ubicacion && (
              <div style={{
                padding: '10px',
                backgroundColor: '#d4edda',
                borderRadius: '5px',
                fontSize: '13px',
                marginBottom: '15px',
              }}>
                ✅ Ubicación capturada: {ubicacion.lat.toFixed(6)}, {ubicacion.lng.toFixed(6)}
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => setMostrarModalPago(false)}
                style={{
                  flex: 1,
                  padding: '12px',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  fontSize: '16px',
                }}
              >
                Cancelar
              </button>
              <button
                onClick={registrarPago}
                disabled={loading}
                style={{
                  flex: 2,
                  padding: '12px',
                  backgroundColor: loading ? '#ccc' : '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontSize: '16px',
                  fontWeight: 'bold',
                }}
              >
                {loading ? '⏳ Guardando...' : '✅ Confirmar Pago'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}