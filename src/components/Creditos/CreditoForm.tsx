import { useState, useEffect } from 'react';
import { generateClient } from 'aws-amplify/data';
import { db } from '../../lib/db';
import { addDays, format, isSunday } from 'date-fns';

// @ts-ignore
const client = generateClient();

interface CreditoFormProps {
  clienteId?: string;
  onSuccess?: () => void;
}

export default function CreditoForm({ clienteId, onSuccess }: CreditoFormProps) {
  const [paso, setPaso] = useState(1);
  const [clientes, setClientes] = useState<any[]>([]);
  const [productos, setProductos] = useState<any[]>([]);
  const [clienteSeleccionado, setClienteSeleccionado] = useState<any>(null);
  const [productoSeleccionado, setProductoSeleccionado] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState('');

  // Paso 2: Configuración del crédito
  const [monto, setMonto] = useState('');
  const [fechaDesembolso, setFechaDesembolso] = useState(format(new Date(), 'yyyy-MM-dd'));

  // Cuotas calculadas
  const [cuotasCalculadas, setCuotasCalculadas] = useState<any[]>([]);

  useEffect(() => {
    cargarClientes();
    cargarProductos();
  }, []);

  useEffect(() => {
    if (clienteId) {
      const cliente = clientes.find(c => c.id === clienteId);
      if (cliente) {
        setClienteSeleccionado(cliente);
        setPaso(2);
      }
    }
  }, [clienteId, clientes]);

  const cargarClientes = async () => {
    try {
      const clientesActivos = await db.clientes
        .where('estado')
        .equals('ACTIVO')
        .toArray();
      setClientes(clientesActivos);
    } catch (error) {
      console.error('Error cargando clientes:', error);
    }
  };

  const cargarProductos = async () => {
    try {
      // Cargar todos los productos y filtrar los activos
      const todosProductos = await db.productos.toArray();
      const productosActivos = todosProductos.filter(p => p.activo !== false);
      setProductos(productosActivos);
      
      console.log('Productos cargados:', productosActivos); // Para debug
    } catch (error) {
      console.error('Error cargando productos:', error);
    }
  };

  const seleccionarCliente = (cliente: any) => {
    setClienteSeleccionado(cliente);
    setPaso(2);
  };

  const seleccionarProducto = (producto: any) => {
    setProductoSeleccionado(producto);
    // Resetear monto si está fuera del rango
    const montoNum = parseFloat(monto);
    if (producto.montoMinimo && montoNum < producto.montoMinimo) {
      setMonto(producto.montoMinimo.toString());
    }
    if (producto.montoMaximo && montoNum > producto.montoMaximo) {
      setMonto(producto.montoMaximo.toString());
    }
  };

  const calcularFechasCuotas = (
    fechaInicio: Date,
    numeroCuotas: number,
    frecuencia: string,
    excluirDomingos: boolean
  ): string[] => {
    const fechas: string[] = [];
    let fecha = new Date(fechaInicio);

    for (let i = 0; i < numeroCuotas; i++) {
      switch (frecuencia) {
        case 'DIARIO':
          fecha = addDays(fecha, 1);
          if (excluirDomingos) {
            while (isSunday(fecha)) {
              fecha = addDays(fecha, 1);
            }
          }
          break;
        case 'SEMANAL':
          fecha = addDays(fecha, 7);
          break;
        case 'QUINCENAL':
          fecha = addDays(fecha, 15);
          break;
        case 'MENSUAL':
          fecha = addDays(fecha, 30);
          break;
      }
      fechas.push(format(fecha, 'yyyy-MM-dd'));
    }

    return fechas;
  };

  const calcularCredito = () => {
    if (!productoSeleccionado || !monto) {
      setMensaje('❌ Selecciona un producto e ingresa el monto');
      return;
    }

    const montoNum = parseFloat(monto);

    // Validar rango de monto
    if (productoSeleccionado.montoMinimo && montoNum < productoSeleccionado.montoMinimo) {
      setMensaje(`❌ El monto mínimo es $${productoSeleccionado.montoMinimo.toLocaleString()}`);
      return;
    }
    if (productoSeleccionado.montoMaximo && montoNum > productoSeleccionado.montoMaximo) {
      setMensaje(`❌ El monto máximo es $${productoSeleccionado.montoMaximo.toLocaleString()}`);
      return;
    }

    const interes = productoSeleccionado.interesPorcentaje;
    const totalAPagar = montoNum + (montoNum * interes / 100);
    const valorCuota = totalAPagar / productoSeleccionado.numeroCuotas;

    const fechas = calcularFechasCuotas(
      new Date(fechaDesembolso),
      productoSeleccionado.numeroCuotas,
      productoSeleccionado.frecuencia,
      productoSeleccionado.excluirDomingos || false
    );

    const cuotas = fechas.map((fecha, index) => ({
      numero: index + 1,
      fechaProgramada: fecha,
      montoProgramado: Math.round(valorCuota),
      estado: 'PENDIENTE',
    }));

    setCuotasCalculadas(cuotas);
    setPaso(3);
    setMensaje('');
  };

  const otorgarCredito = async () => {
    if (!clienteSeleccionado || !productoSeleccionado || cuotasCalculadas.length === 0) {
      setMensaje('❌ Datos incompletos');
      return;
    }

    setLoading(true);
    setMensaje('');

    try {
      const empresaId = 'empresa-demo-001';
      const cobradorId = 'cobrador-demo-001';
      const creditoId = `credito-${Date.now()}`;

      const montoNum = parseFloat(monto);
      const totalAPagar = montoNum + (montoNum * productoSeleccionado.interesPorcentaje / 100);
      const valorCuota = totalAPagar / productoSeleccionado.numeroCuotas;

      // 1. Crear crédito en Dexie
      const nuevoCredito = {
        id: creditoId,
        empresaId,
        clienteId: clienteSeleccionado.id,
        productoCreditoId: productoSeleccionado.id,
        cobradorId,
        montoOriginal: montoNum,
        interesPorcentaje: productoSeleccionado.interesPorcentaje,
        totalAPagar: Math.round(totalAPagar),
        numeroCuotas: productoSeleccionado.numeroCuotas,
        valorCuota: Math.round(valorCuota),
        fechaDesembolso,
        fechaPrimeraCuota: cuotasCalculadas[0].fechaProgramada,
        fechaUltimaCuota: cuotasCalculadas[cuotasCalculadas.length - 1].fechaProgramada,
        estado: 'ACTIVO' as const,
        saldoPendiente: Math.round(totalAPagar),
        cuotasPagadas: 0,
        cuotasPendientes: productoSeleccionado.numeroCuotas,
        diasAtraso: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        _pendingSync: true,
      };

      await db.creditos.add(nuevoCredito);

      // 2. Crear cuotas en Dexie
      for (const cuota of cuotasCalculadas) {
        await db.cuotas.add({
          id: `cuota-${creditoId}-${cuota.numero}`,
          empresaId,
          creditoId,
          clienteId: clienteSeleccionado.id,
          rutaId: clienteSeleccionado.rutaId || 'ruta-default',
          numero: cuota.numero,
          fechaProgramada: cuota.fechaProgramada,
          montoProgramado: cuota.montoProgramado,
          estado: 'PENDIENTE' as const,
          montoPagado: 0,
          saldoPendiente: cuota.montoProgramado,
          diasAtraso: 0,
          visitada: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          _pendingSync: true,
        });
      }

      // 3. Sincronizar con AWS (background)
      try {
        // @ts-ignore
        const { data, errors } = await client.models.Credito.create({
          empresaId,
          clienteId: clienteSeleccionado.id,
          productoCreditoId: productoSeleccionado.id,
          cobradorId,
          montoOriginal: montoNum,
          interesPorcentaje: productoSeleccionado.interesPorcentaje,
          totalAPagar: Math.round(totalAPagar),
          numeroCuotas: productoSeleccionado.numeroCuotas,
          valorCuota: Math.round(valorCuota),
          fechaDesembolso,
          fechaPrimeraCuota: cuotasCalculadas[0].fechaProgramada,
          fechaUltimaCuota: cuotasCalculadas[cuotasCalculadas.length - 1].fechaProgramada,
          estado: 'ACTIVO',
          saldoPendiente: Math.round(totalAPagar),
          cuotasPagadas: 0,
          cuotasPendientes: productoSeleccionado.numeroCuotas,
          diasAtraso: 0,
        });

        if (data) {
          await db.creditos.update(creditoId, {
            id: data.id,
            _pendingSync: false,
            _lastSync: new Date().toISOString(),
          });
        }
      } catch (syncError) {
        console.log('Crédito guardado offline');
      }

      setMensaje('✅ Crédito otorgado exitosamente');
      
      // Resetear formulario
      setTimeout(() => {
        setClienteSeleccionado(null);
        setProductoSeleccionado(null);
        setMonto('');
        setCuotasCalculadas([]);
        setPaso(1);
        setMensaje('');
        if (onSuccess) onSuccess();
      }, 2000);

    } catch (error: any) {
      setMensaje(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const totalAPagar = productoSeleccionado && monto
    ? parseFloat(monto) + (parseFloat(monto) * productoSeleccionado.interesPorcentaje / 100)
    : 0;

  const valorCuota = productoSeleccionado && totalAPagar
    ? totalAPagar / productoSeleccionado.numeroCuotas
    : 0;

  return (
    <div>
      <h2>💳 Otorgar Crédito</h2>

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

      {/* Indicador de pasos */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginBottom: '30px' }}>
        {[1, 2, 3].map((num) => (
          <div
            key={num}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                backgroundColor: paso >= num ? '#007bff' : '#e9ecef',
                color: paso >= num ? 'white' : '#6c757d',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold',
                fontSize: '18px',
              }}
            >
              {num}
            </div>
            {num < 3 && (
              <div
                style={{
                  width: '60px',
                  height: '3px',
                  backgroundColor: paso > num ? '#007bff' : '#e9ecef',
                }}
              />
            )}
          </div>
        ))}
      </div>

      {/* PASO 1: Seleccionar Cliente */}
      {paso === 1 && (
        <div>
          <h3>👤 Paso 1: Seleccionar Cliente</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '15px' }}>
            {clientes.map((cliente) => (
              <div
                key={cliente.id}
                onClick={() => seleccionarCliente(cliente)}
                style={{
                  padding: '15px',
                  backgroundColor: 'white',
                  border: '2px solid #dee2e6',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#007bff';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#dee2e6';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <h4 style={{ margin: '0 0 8px 0' }}>{cliente.nombre}</h4>
                <div style={{ fontSize: '13px', color: '#666' }}>
                  <div>📄 {cliente.documento}</div>
                  {cliente.telefono && <div>📱 {cliente.telefono}</div>}
                </div>
              </div>
            ))}
          </div>

          {clientes.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
              No hay clientes activos. Crea un cliente primero.
            </div>
          )}
        </div>
      )}

      {/* PASO 2: Configurar Crédito */}
      {paso === 2 && clienteSeleccionado && (
        <div>
          <div style={{ padding: '15px', backgroundColor: '#e3f2fd', borderRadius: '8px', marginBottom: '20px' }}>
            <strong>Cliente seleccionado:</strong> {clienteSeleccionado.nombre}
            <button
              onClick={() => setPaso(1)}
              style={{
                marginLeft: '15px',
                padding: '5px 10px',
                backgroundColor: 'white',
                border: '1px solid #007bff',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px',
              }}
            >
              Cambiar
            </button>
          </div>

          <h3>💰 Paso 2: Configurar Crédito</h3>

          {/* Selección de producto */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold' }}>
              Selecciona el producto de crédito:
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '15px' }}>
              {productos.map((producto) => (
                <div
                  key={producto.id}
                  onClick={() => seleccionarProducto(producto)}
                  style={{
                    padding: '15px',
                    backgroundColor: productoSeleccionado?.id === producto.id ? '#e3f2fd' : 'white',
                    border: `2px solid ${productoSeleccionado?.id === producto.id ? '#007bff' : '#dee2e6'}`,
                    borderRadius: '8px',
                    cursor: 'pointer',
                  }}
                >
                  <h4 style={{ margin: '0 0 10px 0' }}>{producto.nombre}</h4>
                  <div style={{ fontSize: '13px', lineHeight: '1.6' }}>
                    <div>💵 Interés: {producto.interesPorcentaje}%</div>
                    <div>📅 {producto.numeroCuotas} cuotas</div>
                    <div>🔄 {producto.frecuencia}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {productoSeleccionado && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                    💰 Monto a prestar *
                  </label>
                  <input
                    type="number"
                    value={monto}
                    onChange={(e) => setMonto(e.target.value)}
                    placeholder={`${productoSeleccionado.montoMinimo ? `Mín: $${productoSeleccionado.montoMinimo.toLocaleString()}` : 'Ingresa el monto'}`}
                    style={{
                      width: '100%',
                      padding: '12px',
                      fontSize: '18px',
                      borderRadius: '5px',
                      border: '2px solid #007bff',
                    }}
                  />
                  {productoSeleccionado.montoMinimo && (
                    <small style={{ color: '#666' }}>
                      Rango: ${productoSeleccionado.montoMinimo.toLocaleString()} - ${productoSeleccionado.montoMaximo?.toLocaleString() || '∞'}
                    </small>
                  )}
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                    📅 Fecha de desembolso
                  </label>
                  <input
                    type="date"
                    value={fechaDesembolso}
                    onChange={(e) => setFechaDesembolso(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px',
                      fontSize: '16px',
                      borderRadius: '5px',
                      border: '1px solid #ccc',
                    }}
                  />
                </div>
              </div>

              {monto && (
                <div style={{ padding: '20px', backgroundColor: '#d4edda', borderRadius: '8px', marginBottom: '20px' }}>
                  <h4>📊 Resumen del Crédito</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px', fontSize: '14px' }}>
                    <div>
                      <strong>Monto prestado:</strong><br />
                      ${parseFloat(monto).toLocaleString()}
                    </div>
                    <div>
                      <strong>Interés ({productoSeleccionado.interesPorcentaje}%):</strong><br />
                      ${(parseFloat(monto) * productoSeleccionado.interesPorcentaje / 100).toLocaleString()}
                    </div>
                    <div>
                      <strong>Total a pagar:</strong><br />
                      ${Math.round(totalAPagar).toLocaleString()}
                    </div>
                    <div>
                      <strong>Valor de cada cuota:</strong><br />
                      ${Math.round(valorCuota).toLocaleString()}
                    </div>
                  </div>
                  <div style={{ marginTop: '10px', fontSize: '13px' }}>
                    <strong>Primera cuota:</strong> {format(addDays(new Date(fechaDesembolso), 1), 'yyyy-MM-dd')} | 
                    <strong> Última cuota:</strong> {format(addDays(new Date(fechaDesembolso), productoSeleccionado.numeroCuotas), 'yyyy-MM-dd')}
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={() => setPaso(1)}
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
                  ← Atrás
                </button>
                <button
                  onClick={calcularCredito}
                  disabled={!monto || !productoSeleccionado}
                  style={{
                    flex: 2,
                    padding: '12px',
                    backgroundColor: (!monto || !productoSeleccionado) ? '#ccc' : '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: (!monto || !productoSeleccionado) ? 'not-allowed' : 'pointer',
                    fontSize: '16px',
                    fontWeight: 'bold',
                  }}
                >
                  Ver Tabla de Cuotas →
                </button>
              </div>
            </>
          )}

          {productos.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
              No hay productos activos. Crea un producto de crédito primero.
            </div>
          )}
        </div>
      )}

      {/* PASO 3: Confirmar */}
      {paso === 3 && cuotasCalculadas.length > 0 && (
        <div>
          <h3>📋 Paso 3: Tabla de Cuotas</h3>

          <div style={{ marginBottom: '20px', maxHeight: '400px', overflowY: 'auto', border: '1px solid #dee2e6', borderRadius: '8px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ position: 'sticky', top: 0, backgroundColor: '#007bff', color: 'white' }}>
                <tr>
                  <th style={{ padding: '12px', textAlign: 'left' }}>#</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Fecha</th>
                  <th style={{ padding: '12px', textAlign: 'right' }}>Valor</th>
                  <th style={{ padding: '12px', textAlign: 'center' }}>Estado</th>
                </tr>
              </thead>
              <tbody>
                {cuotasCalculadas.map((cuota) => (
                  <tr key={cuota.numero} style={{ borderBottom: '1px solid #dee2e6' }}>
                    <td style={{ padding: '10px' }}>{cuota.numero}</td>
                    <td style={{ padding: '10px' }}>{cuota.fechaProgramada}</td>
                    <td style={{ padding: '10px', textAlign: 'right' }}>
                      ${cuota.montoProgramado.toLocaleString()}
                    </td>
                    <td style={{ padding: '10px', textAlign: 'center' }}>
                      <span style={{
                        padding: '4px 12px',
                        backgroundColor: '#fff3cd',
                        borderRadius: '12px',
                        fontSize: '12px',
                      }}>
                        PENDIENTE
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => {
                setPaso(2);
                setCuotasCalculadas([]);
              }}
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
              ← Modificar
            </button>
            <button
              onClick={otorgarCredito}
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
              {loading ? '⏳ Otorgando...' : '✅ Confirmar y Otorgar Crédito'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}