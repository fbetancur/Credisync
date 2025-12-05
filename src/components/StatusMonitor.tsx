import { useState, useEffect } from 'react';
import { syncManager } from '../lib/syncManager';
import { db } from '../lib/db';

/**
 * Componente para monitorear el estado de la aplicación
 */
export default function StatusMonitor() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncStats, setSyncStats] = useState({ pendientes: 0, fallidos: 0, sincronizados: 0 });
  const [dbStats, setDbStats] = useState<any>({});
  const [mostrarDetalles, setMostrarDetalles] = useState(false);

  useEffect(() => {
    // Monitorear conexión
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Actualizar estadísticas cada 10 segundos
    const interval = setInterval(async () => {
      const stats = await syncManager.obtenerEstadisticas();
      setSyncStats(stats);

      const dbStatsData = {
        clientes: await db.clientes.count(),
        creditos: await db.creditos.count(),
        cuotas: await db.cuotas.count(),
        pagos: await db.pagos.count(),
        productos: await db.productos.count(),
        rutas: await db.rutas.count(),
      };
      setDbStats(dbStatsData);
    }, 10000);

    // Cargar inicial
    (async () => {
      const stats = await syncManager.obtenerEstadisticas();
      setSyncStats(stats);
    })();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

  const forzarSincronizacion = async () => {
    await syncManager.procesarCola();
    const stats = await syncManager.obtenerEstadisticas();
    setSyncStats(stats);
  };

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        zIndex: 1000,
      }}
    >
      {/* Indicador compacto */}
      <div
        onClick={() => setMostrarDetalles(!mostrarDetalles)}
        style={{
          padding: '10px 15px',
          backgroundColor: isOnline ? '#28a745' : '#dc3545',
          color: 'white',
          borderRadius: '20px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontSize: '14px',
          fontWeight: 'bold',
        }}
      >
        <div
          style={{
            width: '10px',
            height: '10px',
            borderRadius: '50%',
            backgroundColor: 'white',
            animation: isOnline ? 'pulse 2s infinite' : 'none',
          }}
        />
        {isOnline ? '🟢 En línea' : '🔴 Sin conexión'}
        {syncStats.pendientes > 0 && (
          <span
            style={{
              padding: '2px 8px',
              backgroundColor: 'rgba(255,255,255,0.3)',
              borderRadius: '10px',
              fontSize: '12px',
            }}
          >
            {syncStats.pendientes} pendiente{syncStats.pendientes !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Panel de detalles */}
      {mostrarDetalles && (
        <div
          style={{
            position: 'absolute',
            bottom: '60px',
            right: 0,
            width: '320px',
            backgroundColor: 'white',
            borderRadius: '12px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
            padding: '20px',
            maxHeight: '500px',
            overflowY: 'auto',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <h3 style={{ margin: 0, fontSize: '18px' }}>📊 Estado del Sistema</h3>
            <button
              onClick={() => setMostrarDetalles(false)}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '20px',
                cursor: 'pointer',
                padding: '0',
              }}
            >
              ✕
            </button>
          </div>

          {/* Estado de conexión */}
          <div
            style={{
              padding: '12px',
              backgroundColor: isOnline ? '#d4edda' : '#f8d7da',
              borderRadius: '8px',
              marginBottom: '15px',
            }}
          >
            <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>
              {isOnline ? '✅ Conectado' : '❌ Sin conexión'}
            </div>
            <div style={{ fontSize: '13px', color: '#666' }}>
              {isOnline
                ? 'Los datos se sincronizan automáticamente'
                : 'Los datos se guardan localmente y se sincronizarán cuando haya conexión'}
            </div>
          </div>

          {/* Estadísticas de sincronización */}
          <div style={{ marginBottom: '15px' }}>
            <h4 style={{ margin: '0 0 10px 0', fontSize: '14px' }}>🔄 Sincronización</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', fontSize: '13px' }}>
              <div style={{ textAlign: 'center', padding: '10px', backgroundColor: '#fff3cd', borderRadius: '8px' }}>
                <div style={{ fontSize: '20px', fontWeight: 'bold' }}>{syncStats.pendientes}</div>
                <div style={{ color: '#666' }}>Pendientes</div>
              </div>
              <div style={{ textAlign: 'center', padding: '10px', backgroundColor: '#f8d7da', borderRadius: '8px' }}>
                <div style={{ fontSize: '20px', fontWeight: 'bold' }}>{syncStats.fallidos}</div>
                <div style={{ color: '#666' }}>Fallidos</div>
              </div>
              <div style={{ textAlign: 'center', padding: '10px', backgroundColor: '#d4edda', borderRadius: '8px' }}>
                <div style={{ fontSize: '20px', fontWeight: 'bold' }}>{syncStats.sincronizados}</div>
                <div style={{ color: '#666' }}>OK</div>
              </div>
            </div>
          </div>

          {/* Botón de sincronización manual */}
          {syncStats.pendientes > 0 && isOnline && (
            <button
              onClick={forzarSincronizacion}
              style={{
                width: '100%',
                padding: '10px',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 'bold',
                marginBottom: '15px',
              }}
            >
              🔄 Sincronizar Ahora
            </button>
          )}

          {/* Estadísticas de base de datos */}
          <div>
            <h4 style={{ margin: '0 0 10px 0', fontSize: '14px' }}>💾 Datos Locales</h4>
            <div style={{ fontSize: '13px', lineHeight: '1.8' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid #eee' }}>
                <span>👥 Clientes:</span>
                <strong>{dbStats.clientes || 0}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid #eee' }}>
                <span>💳 Créditos:</span>
                <strong>{dbStats.creditos || 0}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid #eee' }}>
                <span>📋 Cuotas:</span>
                <strong>{dbStats.cuotas || 0}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid #eee' }}>
                <span>💵 Pagos:</span>
                <strong>{dbStats.pagos || 0}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid #eee' }}>
                <span>💰 Productos:</span>
                <strong>{dbStats.productos || 0}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0' }}>
                <span>🗺️ Rutas:</span>
                <strong>{dbStats.rutas || 0}</strong>
              </div>
            </div>
          </div>

          {/* Información adicional */}
          <div
            style={{
              marginTop: '15px',
              padding: '10px',
              backgroundColor: '#f8f9fa',
              borderRadius: '8px',
              fontSize: '12px',
              color: '#666',
            }}
          >
            💡 Los datos se sincronizan automáticamente cada 30 segundos cuando hay conexión
          </div>
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}
