import { useState, useEffect } from 'react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../../amplify/data/resource';
import { db } from '../../lib/db';
import { addDays, format, isSunday } from 'date-fns';

const client = generateClient<Schema>();

interface CreditoFormProps {
  clienteId?: string;
  onSuccess?: () => void;
}

export default function CreditoForm({ clienteId, onSuccess }: CreditoFormProps) {
  const [clientes, setClientes] = useState<any[]>([]);
  const [clienteSeleccionado, setClienteSeleccionado] = useState(clienteId || '');
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [paso, setPaso] = useState(1);

  // Datos del crédito
  const [monto, setMonto] = useState('');
  const [interes, setInteres] = useState('20');
  const [numeroCuotas, setNumeroCuotas] = useState('30');
  const [frecuencia, setFrecuencia] = useState<'DIARIO' | 'SEMANAL' | 'QUINCENAL' | 'MENSUAL'>('DIARIO');
  const [excluirDomingos, setExcluirDomingos] = useState(true);
  const [fechaDesembolso, setFechaDesembolso] = useState(format(new Date(), 'yyyy-MM-dd'));

  // Cálculos
  const [totalAPagar, setTotalAPagar] = useState(0);
  const [valorCuota, setValorCuota] = useState(0);
  const [cuotasCalculadas, setCuotasCalculadas] = useState<any[]>([]);

  useEffect(() => {
    cargarClientes();
  }, []);

  useEffect(() => {
    if (monto && interes && numeroCuotas) {
      calcularCredito();
    }
  }, [monto, interes, numeroCuotas, frecuencia, excluirDomingos, fechaDesembolso]);

  const cargarClientes = async () => {
    try {
      const clientesLocal = await db.clientes.where('estado').equals('ACTIVO').toArray();
      setClientes(clientesLocal);
    } catch (error) {
      console.error('Error cargando clientes:', error);
    }
  };

  const calcularCredito = () => {
    const montoNum = parseFloat(monto);
    const interesNum = parseFloat(interes);
    const cuotasNum = parseInt(numeroCuotas);

    if (!montoNum || !interesNum || !cuotasNum) return;

    // Calcular total a pagar
    const interesTotal = (montoNum * interesNum) / 100;
    const total = montoNum + interesTotal;
    const valorCuotaCalc = total / cuotasNum;

    setTotalAPagar(total);
    setValorCuota(valorCuotaCalc);

    // Calcular fechas de cuotas
    const fechas = calcularFechasCuotas(
      new Date(fechaDesembolso),
      cuotasNum,
      frecuencia,
      excluirDomingos
    );

    const cuotas = fechas.map((fecha, index) => ({
      numero: index + 1,
      fechaProgramada: fecha,
      montoProgramado: valorCuotaCalc,
      estado: 'PENDIENTE',
    }));

    setCuotasCalculadas(cuotas);
  };

  const calcularFechasCuotas = (
    fechaInicio: Date,
    numCuotas: number,
    frec: string,
    excluirDom: boolean
  ): string[] => {
    const fechas: string[] = [];
    let fechaActual = new Date(fechaInicio);

    // Calcular días entre cuotas según frecuencia
    const diasEntreCuotas = {
      DIARIO: 1,
      SEMANAL: 7,
      QUINCENAL: 15,
      MENSUAL: 30,
    };

    const dias = diasEntreCuotas[frec as keyof typeof diasEntreCuotas];

    for (let i = 0; i < numCuotas; i++) {
      fechaActual = addDays(fechaActual, dias);

      // Si excluir domingos está activo, saltar domingos
      if (excluirDom && frec === 'DIARIO') {
        while (isSunday(fechaActual)) {
          fechaActual = addDays(fechaActual, 1);
        }
      }

      fechas.push(format(fechaActual, 'yyyy-MM-dd'));
    }

    return fechas;
  };

  const otorgarCredito = async () => {
    if (!clienteSeleccionado) {
      setMensaje('❌ Debes seleccionar un cliente');
      return;
    }

    if (!monto || parseFloat(monto) <= 0) {
      setMensaje('❌ El monto debe ser mayor a 0');
      return;
    }

    setLoading(true);
    setMensaje('');

    try {
      const empresaId = 'empresa-demo-001'; // TODO: Obtener del usuario logueado
      const cobradorId = 'cobrador-demo-001'; // TODO: Obtener del usuario logueado

      // 1. Crear el crédito
      const creditoId = `credito-${Date.now()}`;
      const nuevoCredito = {
        id: creditoId,
        empresaId,
        clienteId: clienteSeleccionado,
        productoCreditoId: 'producto-default', // TODO: Conectar con productos reales
        cobradorId,
        montoOriginal: parseFloat(monto),
        interesPorcentaje: parseFloat(interes),
        totalAPagar,
        numeroCuotas: parseInt(numeroCuotas),
        valorCuota,
        fechaDesembolso,
        fechaPrimeraCuota: cuotasCalculadas[0]?.fechaProgramada || fechaDesembolso,
        fechaUltimaCuota: cuotasCalculadas[cuotasCalculadas.length - 1]?.fechaProgramada || fechaDesembolso,
        estado: 'ACTIVO' as const,
        saldoPendiente: totalAPagar,
        cuotasPagadas: 0,
        cuotasPendientes: parseInt(numeroCuotas),
        diasAtraso: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        _pendingSync: true,
      };

      // Guardar crédito en IndexedDB
      await db.creditos.add(nuevoCredito);

      // 2. Crear las cuotas
      for (const cuota of cuotasCalculadas) {
        const cuotaId = `cuota-${creditoId}-${cuota.numero}`;
        await db.cuotas.add({
          id: cuotaId,
          empresaId,
          creditoId,
          clienteId: clienteSeleccionado,
          rutaId: 'ruta-default', // TODO: Obtener ruta del cliente
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

      // 3. Intentar sincronizar con AWS (en background)
      try {
        // @ts-ignore
        const { data } = await client.models.Credito.create({
          empresaId,
          clienteId: clienteSeleccionado,
          productoCreditoId: 'producto-default',
          cobradorId,
          montoOriginal: parseFloat(monto),
          interesPorcentaje: parseFloat(interes),
          totalAPagar,
          numeroCuotas: parseInt(numeroCuotas),
          valorCuota,
          fechaDesembolso,
          fechaPrimeraCuota: cuotasCalculadas[0]?.fechaProgramada,
          fechaUltimaCuota: cuotasCalculadas[cuotasCalculadas.length - 1]?.fechaProgramada,
          estado: 'ACTIVO',
          saldoPendiente: totalAPagar,
          cuotasPagadas: 0,
          cuotasPendientes: parseInt(numeroCuotas),
          diasAtraso: 0,
        });

        if (data) {
          // Actualizar con ID real de AWS
          await db.creditos.update(creditoId, {
            id: data.id,
            _pendingSync: false,
            _lastSync: new Date().toISOString(),
          });
        }
      } catch (syncError) {
        console.log('Crédito guardado offline, se sincronizará después');
      }

      setMensaje('✅ Crédito otorgado exitosamente');
      setTimeout(() => {
        if (onSuccess) onSuccess();
      }, 2000);
    } catch (error: any) {
      setMensaje(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const clienteInfo = clientes.find((c) => c.id === clienteSeleccionado);

  return (
    <div style={{ padding: '20px', maxWidth: '900px', margin: '0 auto' }}>
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

      {/* Paso 1: Seleccionar Cliente */}
      {paso === 1 && (
        <div style={{ backgroundColor: '#f8f9fa', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
          <h3>1️⃣ Seleccionar Cliente</h3>
          <select
            value={clienteSeleccionado}
            onChange={(e) => setClienteSeleccionado(e.target.value)}
            style={{
              width: '100%',
              padding: '12px',
              fontSize: '16px',
              borderRadius: '5px',
              border: '1px solid #ccc',
              marginBottom: '15px',
            }}
          >
            <option value="">-- Selecciona un cliente --</option>
            {clientes.map((cliente) => (
              <option key={cliente.id} value={cliente.id}>
                {cliente.nombre} - {cliente.documento}
              </option>
            ))}
          </select>

          {clienteInfo && (
            <div
              style={{
                padding: '15px',
                backgroundColor: '#e3f2fd',
                borderRadius: '8px',
                marginBottom: '15px',
              }}
            >
              <strong>{clienteInfo.nombre}</strong>
              <div style={{ fontSize: '14px', marginTop: '5px' }}>
                📄 {clienteInfo.documento} | 📱 {clienteInfo.telefono || 'Sin teléfono'}
                <br />
                📍 {clienteInfo.direccion || 'Sin dirección'}
              </div>
            </div>
          )}

          <button
            onClick={() => setPaso(2)}
            disabled={!clienteSeleccionado}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: clienteSeleccionado ? '#007bff' : '#ccc',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: clienteSeleccionado ? 'pointer' : 'not-allowed',
              fontSize: '16px',
              fontWeight: 'bold',
            }}
          >
            Continuar →
          </button>
        </div>
      )}

      {/* Paso 2: Configurar Crédito */}
      {paso === 2 && (
        <div style={{ backgroundColor: '#f8f9fa', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
          <h3>2️⃣ Configurar Crédito</h3>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              💰 Monto a prestar
            </label>
            <input
              type="number"
              value={monto}
              onChange={(e) => setMonto(e.target.value)}
              placeholder="Ej: 500000"
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '18px',
                borderRadius: '5px',
                border: '1px solid #ccc',
              }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                📊 Interés (%)
              </label>
              <input
                type="number"
                value={interes}
                onChange={(e) => setInteres(e.target.value)}
                style={{ width: '100%', padding: '10px', fontSize: '16px', borderRadius: '5px', border: '1px solid #ccc' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                📅 Número de cuotas
              </label>
              <input
                type="number"
                value={numeroCuotas}
                onChange={(e) => setNumeroCuotas(e.target.value)}
                style={{ width: '100%', padding: '10px', fontSize: '16px', borderRadius: '5px', border: '1px solid #ccc' }}
              />
            </div>
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              🔁 Frecuencia de pago
            </label>
            <select
              value={frecuencia}
              onChange={(e) => setFrecuencia(e.target.value as any)}
              style={{ width: '100%', padding: '10px', fontSize: '16px', borderRadius: '5px', border: '1px solid #ccc' }}
            >
              <option value="DIARIO">Diario</option>
              <option value="SEMANAL">Semanal</option>
              <option value="QUINCENAL">Quincenal</option>
              <option value="MENSUAL">Mensual</option>
            </select>
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={excluirDomingos}
                onChange={(e) => setExcluirDomingos(e.target.checked)}
                style={{ marginRight: '10px', width: '20px', height: '20px' }}
              />
              <span>📅 Excluir domingos (solo para cobro diario)</span>
            </label>
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              📆 Fecha de desembolso
            </label>
            <input
              type="date"
              value={fechaDesembolso}
              onChange={(e) => setFechaDesembolso(e.target.value)}
              style={{ width: '100%', padding: '10px', fontSize: '16px', borderRadius: '5px', border: '1px solid #ccc' }}
            />
          </div>

          {/* Resumen del cálculo */}
          {totalAPagar > 0 && (
            <div
              style={{
                padding: '15px',
                backgroundColor: '#d4edda',
                border: '1px solid #c3e6cb',
                borderRadius: '8px',
                marginTop: '20px',
              }}
            >
              <h4 style={{ margin: '0 0 10px 0' }}>📊 Resumen del Crédito</h4>
              <div style={{ fontSize: '16px' }}>
                <div><strong>Monto prestado:</strong> ${parseFloat(monto).toLocaleString()}</div>
                <div><strong>Interés ({interes}%):</strong> ${((parseFloat(monto) * parseFloat(interes)) / 100).toLocaleString()}</div>
                <div style={{ fontSize: '20px', fontWeight: 'bold', marginTop: '10px', color: '#155724' }}>
                  <strong>Total a pagar:</strong> ${totalAPagar.toLocaleString()}
                </div>
                <div style={{ fontSize: '18px', marginTop: '5px' }}>
                  <strong>Valor de cada cuota:</strong> ${valorCuota.toLocaleString()}
                </div>
                <div style={{ marginTop: '10px', fontSize: '14px' }}>
                  Primera cuota: {cuotasCalculadas[0]?.fechaProgramada}
                  <br />
                  Última cuota: {cuotasCalculadas[cuotasCalculadas.length - 1]?.fechaProgramada}
                </div>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
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
              onClick={() => setPaso(3)}
              disabled={!monto || totalAPagar === 0}
              style={{
                flex: 2,
                padding: '12px',
                backgroundColor: monto && totalAPagar > 0 ? '#28a745' : '#ccc',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: monto && totalAPagar > 0 ? 'pointer' : 'not-allowed',
                fontSize: '16px',
                fontWeight: 'bold',
              }}
            >
              Ver Tabla de Cuotas →
            </button>
          </div>
        </div>
      )}

      {/* Paso 3: Confirmar y Ver Tabla de Cuotas */}
      {paso === 3 && (
        <div style={{ backgroundColor: '#f8f9fa', padding: '20px', borderRadius: '8px' }}>
          <h3>3️⃣ Tabla de Cuotas</h3>

          <div style={{ maxHeight: '400px', overflowY: 'auto', marginBottom: '20px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ position: 'sticky', top: 0, backgroundColor: '#007bff', color: 'white' }}>
                <tr>
                  <th style={{ padding: '10px', textAlign: 'left' }}>#</th>
                  <th style={{ padding: '10px', textAlign: 'left' }}>Fecha</th>
                  <th style={{ padding: '10px', textAlign: 'right' }}>Valor</th>
                  <th style={{ padding: '10px', textAlign: 'center' }}>Estado</th>
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
                      <span
                        style={{
                          padding: '4px 8px',
                          backgroundColor: '#fff3cd',
                          color: '#856404',
                          borderRadius: '4px',
                          fontSize: '12px',
                        }}
                      >
                        {cuota.estado}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => setPaso(2)}
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
                fontSize: '18px',
                fontWeight: 'bold',
              }}
            >
              {loading ? '⏳ Otorgando crédito...' : '✅ Confirmar y Otorgar Crédito'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}