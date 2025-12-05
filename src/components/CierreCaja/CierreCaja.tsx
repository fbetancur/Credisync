import { useState, useEffect } from 'react';
import { db } from '../../lib/db';
import { format } from 'date-fns';

interface MovimientoCaja {
  id: string;
  tipo: 'ENTRADA' | 'GASTO';
  detalle: string;
  valor: number;
  fecha: string;
}

interface CierreCaja {
  id: string;
  fecha: string;
  cajaBase: number;
  totalCobrado: number;
  totalCreditos: number;
  totalEntradas: number;
  totalGastos: number;
  totalCaja: number;
  cerrado: boolean;
  movimientos: MovimientoCaja[];
}

export default function CierreCajaComponent() {
  const [cierreActual, setCierreActual] = useState<CierreCaja | null>(null);
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState('');
  
  // Modales
  const [mostrarModalEntrada, setMostrarModalEntrada] = useState(false);
  const [mostrarModalGasto, setMostrarModalGasto] = useState(false);
  const [mostrarModalCerrar, setMostrarModalCerrar] = useState(false);
  
  // Formularios
  const [detalleEntrada, setDetalleEntrada] = useState('');
  const [valorEntrada, setValorEntrada] = useState('');
  const [detalleGasto, setDetalleGasto] = useState('');
  const [valorGasto, setValorGasto] = useState('');

  useEffect(() => {
    cargarCierreDelDia();
  }, []);

  const cargarCierreDelDia = async () => {
    setLoading(true);
    try {
      const hoy = format(new Date(), 'yyyy-MM-dd');
      
      // Buscar cierre del día
      const cierres = await db.cierresCaja?.toArray() || [];
      let cierre = cierres.find(c => c.fecha === hoy);

      if (!cierre) {
        // Crear nuevo cierre
        cierre = await crearNuevoCierre(hoy);
      } else {
        // Recalcular totales
        await recalcularCierre(cierre);
      }

      setCierreActual(cierre);
    } catch (error: any) {
      setMensaje(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const crearNuevoCierre = async (fecha: string): Promise<CierreCaja> => {
    // Obtener caja base del cierre anterior
    const cierres = await db.cierresCaja?.toArray() || [];
    const cierreAnterior = cierres
      .filter(c => c.fecha < fecha && c.cerrado)
      .sort((a, b) => b.fecha.localeCompare(a.fecha))[0];

    const cajaBase = cierreAnterior?.totalCaja || 0;

    // Calcular cobrado del día
    const pagosHoy = await db.pagos
      .filter(p => p.fecha.startsWith(fecha))
      .toArray();
    const totalCobrado = pagosHoy.reduce((sum, p) => sum + p.monto, 0);

    // Calcular créditos otorgados del día
    const creditosHoy = await db.creditos
      .filter(c => c.fechaDesembolso === fecha)
      .toArray();
    const totalCreditos = creditosHoy.reduce((sum, c) => sum + c.montoOriginal, 0);

    const nuevoCierre: CierreCaja = {
      id: `cierre-${fecha}`,
      fecha,
      cajaBase,
      totalCobrado,
      totalCreditos,
      totalEntradas: 0,
      totalGastos: 0,
      totalCaja: cajaBase + totalCobrado - totalCreditos,
      cerrado: false,
      movimientos: [],
    };

    await db.cierresCaja?.add(nuevoCierre);
    return nuevoCierre;
  };

  const recalcularCierre = async (cierre: CierreCaja) => {
    const fecha = cierre.fecha;

    // Recalcular cobrado
    const pagosHoy = await db.pagos
      .filter(p => p.fecha.startsWith(fecha))
      .toArray();
    const totalCobrado = pagosHoy.reduce((sum, p) => sum + p.monto, 0);

    // Recalcular créditos
    const creditosHoy = await db.creditos
      .filter(c => c.fechaDesembolso === fecha)
      .toArray();
    const totalCreditos = creditosHoy.reduce((sum, c) => sum + c.montoOriginal, 0);

    // Recalcular entradas y gastos
    const totalEntradas = cierre.movimientos
      .filter(m => m.tipo === 'ENTRADA')
      .reduce((sum, m) => sum + m.valor, 0);

    const totalGastos = cierre.movimientos
      .filter(m => m.tipo === 'GASTO')
      .reduce((sum, m) => sum + m.valor, 0);

    const totalCaja = cierre.cajaBase + totalCobrado - totalCreditos + totalEntradas - totalGastos;

    await db.cierresCaja?.update(cierre.id, {
      totalCobrado,
      totalCreditos,
      totalEntradas,
      totalGastos,
      totalCaja,
    });

    cierre.totalCobrado = totalCobrado;
    cierre.totalCreditos = totalCreditos;
    cierre.totalEntradas = totalEntradas;
    cierre.totalGastos = totalGastos;
    cierre.totalCaja = totalCaja;
  };

  const agregarEntrada = async () => {
    if (!cierreActual || !detalleEntrada || !valorEntrada) {
      setMensaje('❌ Completa todos los campos');
      return;
    }

    const valor = parseFloat(valorEntrada);
    if (valor <= 0) {
      setMensaje('❌ El valor debe ser mayor a 0');
      return;
    }

    const nuevaEntrada: MovimientoCaja = {
      id: `mov-${Date.now()}`,
      tipo: 'ENTRADA',
      detalle: detalleEntrada,
      valor,
      fecha: new Date().toISOString(),
    };

    const movimientos = [...cierreActual.movimientos, nuevaEntrada];
    await db.cierresCaja?.update(cierreActual.id, { movimientos });

    setDetalleEntrada('');
    setValorEntrada('');
    setMostrarModalEntrada(false);
    setMensaje('✅ Entrada agregada');
    cargarCierreDelDia();
  };

  const agregarGasto = async () => {
    if (!cierreActual || !detalleGasto || !valorGasto) {
      setMensaje('❌ Completa todos los campos');
      return;
    }

    const valor = parseFloat(valorGasto);
    if (valor <= 0) {
      setMensaje('❌ El valor debe ser mayor a 0');
      return;
    }

    const nuevoGasto: MovimientoCaja = {
      id: `mov-${Date.now()}`,
      tipo: 'GASTO',
      detalle: detalleGasto,
      valor,
      fecha: new Date().toISOString(),
    };

    const movimientos = [...cierreActual.movimientos, nuevoGasto];
    await db.cierresCaja?.update(cierreActual.id, { movimientos });

    setDetalleGasto('');
    setValorGasto('');
    setMostrarModalGasto(false);
    setMensaje('✅ Gasto agregado');
    cargarCierreDelDia();
  };

  const eliminarMovimiento = async (movimientoId: string) => {
    if (!cierreActual) return;

    const movimientos = cierreActual.movimientos.filter(m => m.id !== movimientoId);
    await db.cierresCaja?.update(cierreActual.id, { movimientos });

    setMensaje('✅ Movimiento eliminado');
    cargarCierreDelDia();
  };

  const cerrarCaja = async () => {
    if (!cierreActual) return;

    await db.cierresCaja?.update(cierreActual.id, { cerrado: true });
    setMostrarModalCerrar(false);
    setMensaje('✅ Caja cerrada exitosamente');
    cargarCierreDelDia();
  };

  const reabrirCaja = async () => {
    if (!cierreActual) return;

    const confirmar = confirm('¿Estás seguro de reabrir la caja?');
    if (!confirmar) return;

    await db.cierresCaja?.update(cierreActual.id, { cerrado: false });
    setMensaje('✅ Caja reabierta');
    cargarCierreDelDia();
  };

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <div style={{ fontSize: '48px', marginBottom: '20px' }}>⏳</div>
        <div>Cargando balance...</div>
      </div>
    );
  }

  if (!cierreActual) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <div style={{ fontSize: '48px', marginBottom: '20px' }}>❌</div>
        <div>No se pudo cargar el cierre de caja</div>
      </div>
    );
  }

  const entradas = cierreActual.movimientos.filter(m => m.tipo === 'ENTRADA');
  const gastos = cierreActual.movimientos.filter(m => m.tipo === 'GASTO');

  return (
    <div style={{ backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
        padding: '15px',
        backgroundColor: '#6f42c1',
        color: 'white',
        borderRadius: '8px',
      }}>
        <h2 style={{ margin: 0 }}>💰 BALANCE</h2>
        <button
          onClick={cargarCierreDelDia}
          style={{
            padding: '8px 16px',
            backgroundColor: 'white',
            color: '#6f42c1',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontWeight: 'bold',
          }}
        >
          🔄 Recargar
        </button>
      </div>

      {mensaje && (
        <div style={{
          padding: '10px',
          marginBottom: '15px',
          backgroundColor: mensaje.includes('✅') ? '#d4edda' : '#f8d7da',
          border: `1px solid ${mensaje.includes('✅') ? '#c3e6cb' : '#f5c6cb'}`,
          borderRadius: '5px',
        }}>
          {mensaje}
        </div>
      )}

      {/* Estado Balance */}
      <div style={{
        padding: '15px',
        backgroundColor: cierreActual.cerrado ? '#87CEEB' : '#90EE90',
        borderRadius: '8px',
        textAlign: 'center',
        marginBottom: '20px',
        fontWeight: 'bold',
        fontSize: '18px',
      }}>
        {cierreActual.cerrado ? '🔒 CAJA CERRADA' : '🔓 CAJA ABIERTA'}
      </div>

      {/* Caja Base */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{
          padding: '10px',
          backgroundColor: '#e9ecef',
          borderRadius: '5px 5px 0 0',
          fontWeight: 'bold',
        }}>
          Caja Base
        </div>
        <div style={{
          padding: '20px',
          backgroundColor: 'white',
          borderRadius: '0 0 5px 5px',
          textAlign: 'center',
          fontSize: '28px',
          fontWeight: 'bold',
          color: '#333',
        }}>
          ${cierreActual.cajaBase.toLocaleString()}
        </div>
      </div>

      {/* Cobrado vs Créditos */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '0',
          backgroundColor: '#87CEEB',
          borderRadius: '5px 5px 0 0',
          overflow: 'hidden',
        }}>
          <div style={{ padding: '10px', textAlign: 'center', fontWeight: 'bold', color: 'white' }}>
            Cobrado
          </div>
          <div style={{ padding: '10px', textAlign: 'center', fontWeight: 'bold', color: 'white', borderLeft: '1px solid white' }}>
            Créditos
          </div>
        </div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '0',
          backgroundColor: 'white',
          borderRadius: '0 0 5px 5px',
        }}>
          <div style={{ padding: '20px', textAlign: 'center', fontSize: '24px', fontWeight: 'bold', color: '#28a745' }}>
            ${cierreActual.totalCobrado.toLocaleString()}
          </div>
          <div style={{ padding: '20px', textAlign: 'center', fontSize: '24px', fontWeight: 'bold', color: '#dc3545', borderLeft: '1px solid #e9ecef' }}>
            ${cierreActual.totalCreditos.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Entradas / Inversión */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ fontWeight: 'bold', marginBottom: '10px', fontSize: '16px' }}>
          Entradas / Inversión
        </div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '0',
          backgroundColor: '#87CEEB',
          borderRadius: '5px 5px 0 0',
          overflow: 'hidden',
        }}>
          <div style={{ padding: '10px', textAlign: 'center', fontWeight: 'bold', color: 'white' }}>
            Detalle
          </div>
          <div style={{ padding: '10px', textAlign: 'center', fontWeight: 'bold', color: 'white', borderLeft: '1px solid white' }}>
            Valor
          </div>
        </div>
        <div style={{ backgroundColor: 'white', borderRadius: '0 0 5px 5px' }}>
          {entradas.length === 0 ? (
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              padding: '15px',
              color: '#999',
              fontSize: '14px',
            }}>
              <div style={{ textAlign: 'center' }}>-</div>
              <div style={{ textAlign: 'center', borderLeft: '1px solid #e9ecef' }}>-</div>
            </div>
          ) : (
            entradas.map((entrada) => (
              <div
                key={entrada.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr auto',
                  padding: '10px',
                  borderBottom: '1px solid #e9ecef',
                  alignItems: 'center',
                }}
              >
                <div style={{ paddingLeft: '10px', fontSize: '14px' }}>{entrada.detalle}</div>
                <div style={{ textAlign: 'center', fontWeight: 'bold', color: '#28a745' }}>
                  ${entrada.valor.toLocaleString()}
                </div>
                {!cierreActual.cerrado && (
                  <button
                    onClick={() => eliminarMovimiento(entrada.id)}
                    style={{
                      padding: '5px 10px',
                      backgroundColor: '#dc3545',
                      color: 'white',
                      border: 'none',
                      borderRadius: '3px',
                      cursor: 'pointer',
                      fontSize: '12px',
                    }}
                  >
                    ✕
                  </button>
                )}
              </div>
            ))
          )}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            padding: '15px',
            backgroundColor: '#87CEEB',
            fontWeight: 'bold',
            color: 'white',
          }}>
            <div>Tot.Ingr.(Σ)</div>
            <div style={{ textAlign: 'center' }}>${cierreActual.totalEntradas.toLocaleString()}</div>
          </div>
        </div>
        {!cierreActual.cerrado && (
          <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
            <button
              onClick={() => setMostrarModalEntrada(true)}
              style={{
                flex: 1,
                padding: '10px',
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                fontWeight: 'bold',
              }}
            >
              ➕ Agregar
            </button>
          </div>
        )}
      </div>

      {/* Gastos / Salidas */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ fontWeight: 'bold', marginBottom: '10px', fontSize: '16px' }}>
          Gastos / Salidas
        </div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '0',
          backgroundColor: '#87CEEB',
          borderRadius: '5px 5px 0 0',
          overflow: 'hidden',
        }}>
          <div style={{ padding: '10px', textAlign: 'center', fontWeight: 'bold', color: 'white' }}>
            Detalle
          </div>
          <div style={{ padding: '10px', textAlign: 'center', fontWeight: 'bold', color: 'white', borderLeft: '1px solid white' }}>
            Valor
          </div>
        </div>
        <div style={{ backgroundColor: 'white', borderRadius: '0 0 5px 5px' }}>
          {gastos.length === 0 ? (
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              padding: '15px',
              color: '#999',
              fontSize: '14px',
            }}>
              <div style={{ textAlign: 'center' }}>-</div>
              <div style={{ textAlign: 'center', borderLeft: '1px solid #e9ecef' }}>-</div>
            </div>
          ) : (
            gastos.map((gasto) => (
              <div
                key={gasto.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr auto',
                  padding: '10px',
                  borderBottom: '1px solid #e9ecef',
                  alignItems: 'center',
                }}
              >
                <div style={{ paddingLeft: '10px', fontSize: '14px' }}>{gasto.detalle}</div>
                <div style={{ textAlign: 'center', fontWeight: 'bold', color: '#dc3545' }}>
                  ${gasto.valor.toLocaleString()}
                </div>
                {!cierreActual.cerrado && (
                  <button
                    onClick={() => eliminarMovimiento(gasto.id)}
                    style={{
                      padding: '5px 10px',
                      backgroundColor: '#dc3545',
                      color: 'white',
                      border: 'none',
                      borderRadius: '3px',
                      cursor: 'pointer',
                      fontSize: '12px',
                    }}
                  >
                    ✕
                  </button>
                )}
              </div>
            ))
          )}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            padding: '15px',
            backgroundColor: '#87CEEB',
            fontWeight: 'bold',
            color: 'white',
          }}>
            <div>Tot.Egr.(Σ)</div>
            <div style={{ textAlign: 'center' }}>${cierreActual.totalGastos.toLocaleString()}</div>
          </div>
        </div>
        {!cierreActual.cerrado && (
          <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
            <button
              onClick={() => setMostrarModalGasto(true)}
              style={{
                flex: 1,
                padding: '10px',
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                fontWeight: 'bold',
              }}
            >
              ➕ Agregar gasto
            </button>
          </div>
        )}
      </div>

      {/* Total Caja */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{
          padding: '10px',
          backgroundColor: '#e9ecef',
          borderRadius: '5px 5px 0 0',
          fontWeight: 'bold',
        }}>
          Total caja
        </div>
        <div style={{
          padding: '25px',
          backgroundColor: cierreActual.totalCaja >= 0 ? '#d4edda' : '#f8d7da',
          borderRadius: '0 0 5px 5px',
          textAlign: 'center',
          fontSize: '32px',
          fontWeight: 'bold',
          color: cierreActual.totalCaja >= 0 ? '#155724' : '#721c24',
        }}>
          ${cierreActual.totalCaja.toLocaleString()}
        </div>
      </div>

      {/* Botón Cerrar/Reabrir Caja */}
      {!cierreActual.cerrado ? (
        <button
          onClick={() => setMostrarModalCerrar(true)}
          style={{
            width: '100%',
            padding: '15px',
            backgroundColor: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '18px',
            fontWeight: 'bold',
            marginBottom: '20px',
          }}
        >
          🔒 Cerrar Caja
        </button>
      ) : (
        <button
          onClick={reabrirCaja}
          style={{
            width: '100%',
            padding: '15px',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '18px',
            fontWeight: 'bold',
            marginBottom: '20px',
          }}
        >
          🔓 Reabrir Caja
        </button>
      )}

      {/* Resumen de cálculo */}
      <div style={{
        padding: '15px',
        backgroundColor: 'white',
        borderRadius: '8px',
        fontSize: '13px',
        color: '#666',
      }}>
        <div style={{ fontWeight: 'bold', marginBottom: '10px' }}>📊 Cálculo:</div>
        <div style={{ lineHeight: '1.8' }}>
          <div>Caja Base: ${cierreActual.cajaBase.toLocaleString()}</div>
          <div style={{ color: '#28a745' }}>+ Cobrado: ${cierreActual.totalCobrado.toLocaleString()}</div>
          <div style={{ color: '#dc3545' }}>- Créditos: ${cierreActual.totalCreditos.toLocaleString()}</div>
          <div style={{ color: '#28a745' }}>+ Entradas: ${cierreActual.totalEntradas.toLocaleString()}</div>
          <div style={{ color: '#dc3545' }}>- Gastos: ${cierreActual.totalGastos.toLocaleString()}</div>
          <div style={{ borderTop: '2px solid #333', marginTop: '5px', paddingTop: '5px', fontWeight: 'bold' }}>
            = Total: ${cierreActual.totalCaja.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Modal Agregar Entrada */}
      {mostrarModalEntrada && (
        <div style={{
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
        }} onClick={() => setMostrarModalEntrada(false)}>
          <div style={{
            backgroundColor: 'white',
            padding: '25px',
            borderRadius: '12px',
            maxWidth: '400px',
            width: '90%',
          }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginTop: 0 }}>➕ Agregar Entrada</h3>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Detalle
              </label>
              <input
                type="text"
                value={detalleEntrada}
                onChange={(e) => setDetalleEntrada(e.target.value)}
                placeholder="Ej: Inversión adicional"
                style={{
                  width: '100%',
                  padding: '10px',
                  fontSize: '16px',
                  borderRadius: '5px',
                  border: '1px solid #ccc',
                }}
              />
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Valor
              </label>
              <input
                type="number"
                value={valorEntrada}
                onChange={(e) => setValorEntrada(e.target.value)}
                placeholder="0"
                style={{
                  width: '100%',
                  padding: '10px',
                  fontSize: '18px',
                  borderRadius: '5px',
                  border: '1px solid #ccc',
                }}
              />
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => setMostrarModalEntrada(false)}
                style={{
                  flex: 1,
                  padding: '12px',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                }}
              >
                Cancelar
              </button>
              <button
                onClick={agregarEntrada}
                style={{
                  flex: 1,
                  padding: '12px',
                  backgroundColor: '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                }}
              >
                Agregar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Agregar Gasto */}
      {mostrarModalGasto && (
        <div style={{
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
        }} onClick={() => setMostrarModalGasto(false)}>
          <div style={{
            backgroundColor: 'white',
            padding: '25px',
            borderRadius: '12px',
            maxWidth: '400px',
            width: '90%',
          }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginTop: 0 }}>➕ Agregar Gasto</h3>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Detalle
              </label>
              <input
                type="text"
                value={detalleGasto}
                onChange={(e) => setDetalleGasto(e.target.value)}
                placeholder="Ej: Gasolina, Almuerzo"
                style={{
                  width: '100%',
                  padding: '10px',
                  fontSize: '16px',
                  borderRadius: '5px',
                  border: '1px solid #ccc',
                }}
              />
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Valor
              </label>
              <input
                type="number"
                value={valorGasto}
                onChange={(e) => setValorGasto(e.target.value)}
                placeholder="0"
                style={{
                  width: '100%',
                  padding: '10px',
                  fontSize: '18px',
                  borderRadius: '5px',
                  border: '1px solid #ccc',
                }}
              />
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => setMostrarModalGasto(false)}
                style={{
                  flex: 1,
                  padding: '12px',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                }}
              >
                Cancelar
              </button>
              <button
                onClick={agregarGasto}
                style={{
                  flex: 1,
                  padding: '12px',
                  backgroundColor: '#dc3545',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                }}
              >
                Agregar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Confirmar Cierre */}
      {mostrarModalCerrar && (
        <div style={{
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
        }} onClick={() => setMostrarModalCerrar(false)}>
          <div style={{
            backgroundColor: 'white',
            padding: '30px',
            borderRadius: '12px',
            maxWidth: '450px',
            width: '90%',
          }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginTop: 0, color: '#dc3545' }}>🔒 Confirmar Cierre de Caja</h3>
            <div style={{ marginBottom: '20px', lineHeight: '1.6' }}>
              <p>¿Estás seguro de cerrar la caja del día?</p>
              <div style={{
                padding: '15px',
                backgroundColor: '#f8f9fa',
                borderRadius: '8px',
                marginTop: '15px',
              }}>
                <div style={{ fontWeight: 'bold', marginBottom: '10px' }}>Resumen:</div>
                <div style={{ fontSize: '14px' }}>
                  <div>Total en caja: <strong>${cierreActual.totalCaja.toLocaleString()}</strong></div>
                  <div>Cobrado: ${cierreActual.totalCobrado.toLocaleString()}</div>
                  <div>Créditos: ${cierreActual.totalCreditos.toLocaleString()}</div>
                  <div>Entradas: ${cierreActual.totalEntradas.toLocaleString()}</div>
                  <div>Gastos: ${cierreActual.totalGastos.toLocaleString()}</div>
                </div>
              </div>
              <p style={{ marginTop: '15px', fontSize: '14px', color: '#666' }}>
                Una vez cerrada, este monto será la "Caja Base" del próximo día.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => setMostrarModalCerrar(false)}
                style={{
                  flex: 1,
                  padding: '12px',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                }}
              >
                Cancelar
              </button>
              <button
                onClick={cerrarCaja}
                style={{
                  flex: 1,
                  padding: '12px',
                  backgroundColor: '#dc3545',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                }}
              >
                🔒 Cerrar Caja
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
