import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { obtenerEstadoCliente } from '../../lib/clienteUtils';
import { eventBus } from '../../lib/eventBus';

interface ClienteCardProps {
  cliente: any;
  onClick: (clienteId: string) => void;
}

interface EstadoCliente {
  estado: 'AL_DIA' | 'MORA' | 'SIN_CREDITOS';
  color: string;
  icono: string;
  texto: string;
  saldoPendiente: number;
  fechaUltimoPago: string | null;
}

export default function ClienteCard({ cliente, onClick }: ClienteCardProps) {
  const [estadoCliente, setEstadoCliente] = useState<EstadoCliente>({
    estado: 'SIN_CREDITOS',
    color: '#6c757d',
    icono: '💤',
    texto: 'SIN CRÉDITOS',
    saldoPendiente: 0,
    fechaUltimoPago: null,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarEstado();

    // Suscribirse a eventos para actualizar en tiempo real
    const unsubscribePago = eventBus.on('pago-registrado', (data) => {
      if (data.clienteId === cliente.id) {
        cargarEstado();
      }
    });

    const unsubscribeCredito = eventBus.on('credito-creado', (data) => {
      if (data.clienteId === cliente.id) {
        cargarEstado();
      }
    });

    const unsubscribeCreditoActualizado = eventBus.on('credito-actualizado', (data) => {
      if (data.clienteId === cliente.id) {
        cargarEstado();
      }
    });

    return () => {
      unsubscribePago();
      unsubscribeCredito();
      unsubscribeCreditoActualizado();
    };
  }, [cliente.id]);

  const cargarEstado = async () => {
    setLoading(true);
    try {
      const estado = await obtenerEstadoCliente(cliente.id);
      setEstadoCliente(estado);
    } catch (error) {
      console.error('Error cargando estado del cliente:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      onClick={() => onClick(cliente.id)}
      style={{
        padding: '15px',
        marginBottom: '15px',
        backgroundColor: 'white',
        border: '1px solid #dee2e6',
        borderRadius: '12px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        cursor: 'pointer',
        transition: 'all 0.2s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
      }}
    >
      {/* Header: Nombre y Badge de Estado */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'start',
        marginBottom: '12px',
      }}>
        <div style={{ flex: 1 }}>
          <h4 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: 'bold' }}>
            👤 {cliente.nombre}
          </h4>
        </div>
        
        {!loading && (
          <div
            style={{
              padding: '6px 12px',
              backgroundColor: estadoCliente.color,
              color: 'white',
              borderRadius: '12px',
              fontSize: '12px',
              fontWeight: 'bold',
              whiteSpace: 'nowrap',
              marginLeft: '10px',
            }}
          >
            {estadoCliente.icono} {estadoCliente.texto}
          </div>
        )}
      </div>

      {/* Información Básica */}
      <div style={{ fontSize: '14px', color: '#666', marginBottom: '12px', lineHeight: '1.8' }}>
        <div>📄 {cliente.documento}</div>
        {cliente.telefono && <div>📱 {cliente.telefono}</div>}
      </div>

      {/* Información Financiera */}
      {!loading && estadoCliente.estado !== 'SIN_CREDITOS' && (
        <div style={{
          padding: '12px',
          backgroundColor: '#f8f9fa',
          borderRadius: '8px',
          fontSize: '13px',
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '8px',
          }}>
            <span style={{ color: '#666' }}>💰 Saldo pendiente:</span>
            <span style={{ fontWeight: 'bold', fontSize: '16px', color: '#6f42c1' }}>
              ${estadoCliente.saldoPendiente.toLocaleString()}
            </span>
          </div>
          
          {estadoCliente.fechaUltimoPago && (
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <span style={{ color: '#666' }}>📅 Último pago:</span>
              <span style={{ fontWeight: 'bold', color: '#28a745' }}>
                {format(new Date(estadoCliente.fechaUltimoPago), 'dd/MM/yyyy')}
              </span>
            </div>
          )}
        </div>
      )}

      {!loading && estadoCliente.estado === 'SIN_CREDITOS' && (
        <div style={{
          padding: '12px',
          backgroundColor: '#f8f9fa',
          borderRadius: '8px',
          fontSize: '13px',
          color: '#666',
          textAlign: 'center',
        }}>
          Sin créditos activos
        </div>
      )}

      {loading && (
        <div style={{
          padding: '12px',
          backgroundColor: '#f8f9fa',
          borderRadius: '8px',
          fontSize: '13px',
          color: '#666',
          textAlign: 'center',
        }}>
          ⏳ Cargando información...
        </div>
      )}

      {/* Indicador de sincronización pendiente */}
      {cliente._pendingSync && (
        <div style={{
          marginTop: '8px',
          fontSize: '11px',
          color: '#856404',
          backgroundColor: '#fff3cd',
          padding: '4px 8px',
          borderRadius: '4px',
          textAlign: 'center',
        }}>
          ⏳ Pendiente de sincronización
        </div>
      )}
    </div>
  );
}
