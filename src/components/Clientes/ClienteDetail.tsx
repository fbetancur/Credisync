import { useState, useEffect } from 'react';
import { db } from '../../lib/db';
import { validarNuevoCredito } from '../../lib/creditoValidations';

interface ClienteDetailProps {
  clienteId: string;
  onBack: () => void;
  onOtorgarCredito: (clienteId: string) => void;
}

export default function ClienteDetail({ clienteId, onBack, onOtorgarCredito }: ClienteDetailProps) {
  const [cliente, setCliente] = useState<any>(null);
  const [creditosActivos, setCreditosActivos] = useState<any[]>([]);
  const [historial, setHistorial] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [validacion, setValidacion] = useState<any>(null);

  useEffect(() => {
    cargarCliente();
  }, [clienteId]);

  const cargarCliente = async () => {
    setLoading(true);
    try {
      // Cargar cliente
      const clienteData = await db.clientes.get(clienteId);
      setCliente(clienteData);

      // Cargar créditos activos
      const activos = await db.creditos
        .filter(c => c.clienteId === clienteId && c.estado === 'ACTIVO')
        .toArray();
      setCreditosActivos(activos);

      // Cargar historial
      const todosCreditos = await db.creditos
        .filter(c => c.clienteId === clienteId)
        .toArray();

      const creditosPagados = todosCreditos.filter(c => c.estado === 'CANCELADO').length;
      const creditosConMora = todosCreditos.filter(c => c.estado === 'CASTIGADO').length;

      setHistorial({
        total: todosCreditos.length,
        pagados: creditosPagados,
        conMora: creditosConMora,
      });

      // Validar si puede recibir crédito
      const validacionResult = await validarNuevoCredito(clienteId);
      setValidacion(validacionResult);

    } catch (error) {
      console.error('Error cargando cliente:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOtorgarCredito = () => {
    if (validacion?.permitido) {
      onOtorgarCredito(clienteId);
    } else {
      alert(validacion?.mensaje || 'No se puede otorgar crédito');
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <div style={{ fontSize: '48px' }}>⏳</div>
        <div>Cargando...</div>
      </div>
    );
  }

  if (!cliente) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <div style={{ fontSize: '48px' }}>❌</div>
        <div>Cliente no encontrado</div>
        <button onClick={onBack} style={{ marginTop: '20px', padding: '10px 20px' }}>
          Volver
        </button>
      </div>
    );
  }

  const estadoCliente = creditosActivos.some(c => (c.diasAtraso || 0) > 0)
    ? { texto: 'CON MORA', color: '#dc3545', icono: '⚠️' }
    : creditosActivos.length > 0
    ? { texto: 'AL DÍA', color: '#28a745', icono: '✅' }
    : { texto: 'SIN CRÉDITOS', color: '#6c757d', icono: '💤' };

  return (
    <div>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        marginBottom: '20px',
        gap: '15px',
      }}>
        <button
          onClick={onBack}
          style={{
            padding: '10px 15px',
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '16px',
          }}
        >
          ← Clientes
        </button>
        <h2 style={{ margin: 0, flex: 1 }}>Detalle del Cliente</h2>
      </div>

      {/* Información del Cliente */}
      <div style={{
        padding: '20px',
        backgroundColor: 'white',
        borderRadius: '12px',
        marginBottom: '20px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      }}>
        <div style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '15px' }}>
          👤 {cliente.nombre}
        </div>
        <div style={{ fontSize: '14px', lineHeight: '2', color: '#666' }}>
          <div>📄 Doc: {cliente.documento}</div>
          {cliente.telefono && <div>📱 Tel: {cliente.telefono}</div>}
          {cliente.direccion && <div>📍 {cliente.direccion}</div>}
          {cliente.barrio && <div>🏘️ Barrio: {cliente.barrio}</div>}
          {cliente.referencia && <div>🔍 Ref: {cliente.referencia}</div>}
        </div>
      </div>

      {/* Estado y Estadísticas */}
      <div style={{
        padding: '20px',
        backgroundColor: 'white',
        borderRadius: '12px',
        marginBottom: '20px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '15px',
          marginBottom: '15px',
        }}>
          <div style={{
            padding: '15px',
            backgroundColor: '#f8f9fa',
            borderRadius: '8px',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#6f42c1' }}>
              {creditosActivos.length}
            </div>
            <div style={{ fontSize: '13px', color: '#666' }}>Créditos Activos</div>
          </div>
          <div style={{
            padding: '15px',
            backgroundColor: estadoCliente.color + '20',
            borderRadius: '8px',
            textAlign: 'center',
            border: `2px solid ${estadoCliente.color}`,
          }}>
            <div style={{ fontSize: '20px', marginBottom: '5px' }}>{estadoCliente.icono}</div>
            <div style={{ fontSize: '13px', fontWeight: 'bold', color: estadoCliente.color }}>
              {estadoCliente.texto}
            </div>
          </div>
        </div>

        <div style={{
          padding: '15px',
          backgroundColor: '#e3f2fd',
          borderRadius: '8px',
          fontSize: '14px',
        }}>
          <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>📊 Historial:</div>
          <div style={{ lineHeight: '1.8' }}>
            <div>Total créditos: {historial?.total || 0}</div>
            <div style={{ color: '#28a745' }}>✅ Pagados: {historial?.pagados || 0}</div>
            {historial?.conMora > 0 && (
              <div style={{ color: '#dc3545' }}>⚠️ Con mora: {historial.conMora}</div>
            )}
          </div>
        </div>
      </div>

      {/* Botón Principal: Otorgar Crédito */}
      <button
        onClick={handleOtorgarCredito}
        disabled={!validacion?.permitido}
        style={{
          width: '100%',
          padding: '18px',
          backgroundColor: validacion?.permitido ? '#6f42c1' : '#ccc',
          color: 'white',
          border: 'none',
          borderRadius: '12px',
          cursor: validacion?.permitido ? 'pointer' : 'not-allowed',
          fontSize: '20px',
          fontWeight: 'bold',
          marginBottom: '15px',
          boxShadow: validacion?.permitido ? '0 4px 12px rgba(111,66,193,0.3)' : 'none',
        }}
      >
        🎯 OTORGAR NUEVO CRÉDITO
      </button>

      {/* Mensaje de validación */}
      {validacion && !validacion.permitido && (
        <div style={{
          padding: '15px',
          backgroundColor: '#f8d7da',
          border: '1px solid #f5c6cb',
          borderRadius: '8px',
          marginBottom: '15px',
          fontSize: '14px',
          color: '#721c24',
        }}>
          {validacion.mensaje}
        </div>
      )}

      {validacion && validacion.permitido && validacion.advertencia && (
        <div style={{
          padding: '15px',
          backgroundColor: validacion.advertencia.includes('✅') ? '#d4edda' : '#fff3cd',
          border: `1px solid ${validacion.advertencia.includes('✅') ? '#c3e6cb' : '#ffeeba'}`,
          borderRadius: '8px',
          marginBottom: '15px',
          fontSize: '14px',
        }}>
          {validacion.advertencia}
        </div>
      )}

      {/* Créditos Activos */}
      {creditosActivos.length > 0 && (
        <div style={{
          padding: '20px',
          backgroundColor: 'white',
          borderRadius: '12px',
          marginBottom: '15px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        }}>
          <h3 style={{ marginTop: 0, fontSize: '18px' }}>💳 Créditos Activos</h3>
          {creditosActivos.map((credito) => (
            <div
              key={credito.id}
              style={{
                padding: '15px',
                backgroundColor: '#f8f9fa',
                borderRadius: '8px',
                marginBottom: '10px',
                border: (credito.diasAtraso || 0) > 0 ? '2px solid #dc3545' : '1px solid #dee2e6',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <div style={{ fontWeight: 'bold' }}>
                  ${credito.montoOriginal.toLocaleString()} → ${credito.totalAPagar.toLocaleString()}
                </div>
                {(credito.diasAtraso || 0) > 0 && (
                  <div style={{
                    padding: '4px 12px',
                    backgroundColor: '#dc3545',
                    color: 'white',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                  }}>
                    ⚠️ {credito.diasAtraso} días atraso
                  </div>
                )}
              </div>
              <div style={{ fontSize: '13px', color: '#666', lineHeight: '1.6' }}>
                <div>📅 {credito.numeroCuotas} cuotas de ${credito.valorCuota.toLocaleString()}</div>
                <div>✅ {credito.cuotasPagadas || 0} pagadas | ⏳ {credito.cuotasPendientes || credito.numeroCuotas} pendientes</div>
                <div>💰 Saldo: ${(credito.saldoPendiente || credito.totalAPagar).toLocaleString()}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Botones Secundarios */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <button
          style={{
            width: '100%',
            padding: '12px',
            backgroundColor: 'white',
            color: '#6f42c1',
            border: '2px solid #6f42c1',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: 'bold',
          }}
        >
          📋 Ver Historial Completo
        </button>
        <button
          style={{
            width: '100%',
            padding: '12px',
            backgroundColor: 'white',
            color: '#6f42c1',
            border: '2px solid #6f42c1',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: 'bold',
          }}
        >
          ✏️ Editar Datos
        </button>
      </div>
    </div>
  );
}
