import { useState, useEffect } from 'react';
import { db } from '../../lib/db';
import { format } from 'date-fns';
import {
  obtenerUbicacionActual,
  ordenarPorDistancia,
  calcularDistancia,
  formatearDistancia,
  calcularDistanciaTotal,
  calcularTiempoEstimado,
  type Coordenadas,
} from '../../lib/gpsUtils';

interface CuotaConCliente {
  id: string;
  numero: number;
  fechaProgramada: string;
  montoProgramado: number;
  estado?: string;
  montoPagado?: number;
  saldoPendiente?: number;
  diasAtraso?: number;
  ordenRuta?: number;
  visitada?: boolean;
  clienteId: string;
  creditoId: string;
  // Datos del cliente
  clienteNombre?: string;
  clienteTelefono?: string;
  clienteDireccion?: string;
  latitud?: number;
  longitud?: number;
}

export default function RutaDelDia() {
  const [cuotas, setCuotas] = useState<CuotaConCliente[]>([]);
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [ubicacionActual, setUbicacionActual] = useState<Coordenadas | null>(null);
  const [optimizando, setOptimizando] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  useEffect(() => {
    cargarCuotasDelDia();
    obtenerUbicacion();
  }, []);

  const obtenerUbicacion = async () => {
    const ubicacion = await obtenerUbicacionActual();
    if (ubicacion) {
      setUbicacionActual(ubicacion);
    }
  };

  const cargarCuotasDelDia = async () => {
    setLoading(true);
    try {
      const hoy = format(new Date(), 'yyyy-MM-dd');

      // Obtener cuotas del día
      const cuotasHoy = await db.cuotas
        .filter((c) => c.fechaProgramada === hoy && c.estado !== 'PAGADA')
        .toArray();

      // Enriquecer con datos del cliente
      const cuotasEnriquecidas = await Promise.all(
        cuotasHoy.map(async (cuota) => {
          const cliente = await db.clientes.get(cuota.clienteId);
          return {
            ...cuota,
            clienteNombre: cliente?.nombre,
            clienteTelefono: cliente?.telefono,
            clienteDireccion: cliente?.direccion,
            latitud: cliente?.latitud,
            longitud: cliente?.longitud,
          };
        })
      );

      // Ordenar por ordenRuta si existe, sino por orden original
      cuotasEnriquecidas.sort((a, b) => {
        if (a.ordenRuta !== undefined && b.ordenRuta !== undefined) {
          return a.ordenRuta - b.ordenRuta;
        }
        return 0;
      });

      setCuotas(cuotasEnriquecidas);
    } catch (error: any) {
      setMensaje(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const optimizarRuta = async () => {
    if (!ubicacionActual) {
      setMensaje('❌ No se pudo obtener tu ubicación. Activa el GPS.');
      return;
    }

    setOptimizando(true);
    setMensaje('🔄 Optimizando ruta...');

    try {
      // Ordenar por distancia
      const cuotasOrdenadas = ordenarPorDistancia(cuotas, ubicacionActual);

      // Actualizar ordenRuta en cada cuota
      const cuotasConOrden = cuotasOrdenadas.map((cuota, index) => ({
        ...cuota,
        ordenRuta: index + 1,
      }));

      // Guardar en DB
      for (const cuota of cuotasConOrden) {
        await db.cuotas.update(cuota.id, { ordenRuta: cuota.ordenRuta });
      }

      setCuotas(cuotasConOrden);

      const distanciaTotal = calcularDistanciaTotal(cuotasConOrden, ubicacionActual);
      const tiempoEstimado = calcularTiempoEstimado(distanciaTotal, cuotasConOrden.length);

      setMensaje(
        `✅ Ruta optimizada: ${formatearDistancia(distanciaTotal)} - Tiempo estimado: ${tiempoEstimado}`
      );
    } catch (error: any) {
      setMensaje(`❌ Error: ${error.message}`);
    } finally {
      setOptimizando(false);
    }
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    
    if (draggedIndex === null || draggedIndex === index) return;

    const newCuotas = [...cuotas];
    const draggedItem = newCuotas[draggedIndex];
    
    // Remover el item arrastrado
    newCuotas.splice(draggedIndex, 1);
    // Insertar en la nueva posición
    newCuotas.splice(index, 0, draggedItem);

    // Actualizar ordenRuta
    const cuotasConOrden = newCuotas.map((cuota, idx) => ({
      ...cuota,
      ordenRuta: idx + 1,
    }));

    setCuotas(cuotasConOrden);
    setDraggedIndex(index);
  };

  const handleDragEnd = async () => {
    if (draggedIndex === null) return;

    // Guardar nuevo orden en DB
    try {
      for (const cuota of cuotas) {
        await db.cuotas.update(cuota.id, { ordenRuta: cuota.ordenRuta });
      }
      setMensaje('✅ Orden actualizado');
    } catch (error: any) {
      setMensaje(`❌ Error: ${error.message}`);
    }

    setDraggedIndex(null);
  };

  const marcarVisitada = async (cuotaId: string) => {
    try {
      await db.cuotas.update(cuotaId, { visitada: true });
      cargarCuotasDelDia();
      setMensaje('✅ Marcada como visitada');
    } catch (error: any) {
      setMensaje(`❌ Error: ${error.message}`);
    }
  };

  const abrirEnMaps = (latitud: number, longitud: number) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${latitud},${longitud}&travelmode=driving`;
    window.open(url, '_blank');
  };

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <div style={{ fontSize: '48px' }}>⏳</div>
        <div>Cargando ruta del día...</div>
      </div>
    );
  }

  const cuotasPendientes = cuotas.filter((c) => !c.visitada);
  const cuotasVisitadas = cuotas.filter((c) => c.visitada);
  const totalACobrar = cuotasPendientes.reduce(
    (sum, c) => sum + (c.saldoPendiente || c.montoProgramado),
    0
  );

  return (
    <div>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
      }}>
        <h2 style={{ margin: 0 }}>🗺️ Ruta del Día</h2>
        <div style={{ fontSize: '14px', color: '#666' }}>
          {format(new Date(), 'dd/MM/yyyy')}
        </div>
      </div>

      {mensaje && (
        <div style={{
          padding: '10px',
          marginBottom: '15px',
          backgroundColor: mensaje.includes('✅') ? '#d4edda' : mensaje.includes('🔄') ? '#cce5ff' : '#f8d7da',
          border: `1px solid ${mensaje.includes('✅') ? '#c3e6cb' : mensaje.includes('🔄') ? '#b8daff' : '#f5c6cb'}`,
          borderRadius: '5px',
          fontSize: '14px',
        }}>
          {mensaje}
        </div>
      )}

      {/* Estadísticas */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '15px',
        marginBottom: '20px',
      }}>
        <div style={{
          padding: '15px',
          backgroundColor: '#e3f2fd',
          borderRadius: '8px',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#1976d2' }}>
            {cuotasPendientes.length}
          </div>
          <div style={{ fontSize: '13px', color: '#666' }}>Pendientes</div>
        </div>
        <div style={{
          padding: '15px',
          backgroundColor: '#d4edda',
          borderRadius: '8px',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#28a745' }}>
            {cuotasVisitadas.length}
          </div>
          <div style={{ fontSize: '13px', color: '#666' }}>Visitadas</div>
        </div>
        <div style={{
          padding: '15px',
          backgroundColor: '#fff3cd',
          borderRadius: '8px',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#856404' }}>
            ${totalACobrar.toLocaleString()}
          </div>
          <div style={{ fontSize: '13px', color: '#666' }}>A Cobrar</div>
        </div>
      </div>

      {/* Botón Optimizar Ruta */}
      <button
        onClick={optimizarRuta}
        disabled={optimizando || !ubicacionActual || cuotasPendientes.length === 0}
        style={{
          width: '100%',
          padding: '15px',
          backgroundColor: optimizando || !ubicacionActual ? '#ccc' : '#6f42c1',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: optimizando || !ubicacionActual ? 'not-allowed' : 'pointer',
          fontSize: '16px',
          fontWeight: 'bold',
          marginBottom: '20px',
        }}
      >
        {optimizando ? '⏳ Optimizando...' : '🎯 Optimizar Ruta por Distancia'}
      </button>

      {!ubicacionActual && (
        <div style={{
          padding: '15px',
          backgroundColor: '#fff3cd',
          border: '1px solid #ffeeba',
          borderRadius: '8px',
          marginBottom: '20px',
          fontSize: '14px',
        }}>
          ⚠️ No se pudo obtener tu ubicación. Activa el GPS para optimizar la ruta.
        </div>
      )}

      {/* Instrucciones */}
      <div style={{
        padding: '15px',
        backgroundColor: '#f8f9fa',
        borderRadius: '8px',
        marginBottom: '20px',
        fontSize: '13px',
        color: '#666',
      }}>
        💡 <strong>Tip:</strong> Arrastra y suelta las tarjetas para reordenar manualmente la ruta según tus necesidades.
      </div>

      {/* Lista de Cuotas Pendientes */}
      {cuotasPendientes.length > 0 && (
        <div style={{ marginBottom: '30px' }}>
          <h3 style={{ fontSize: '18px', marginBottom: '15px' }}>
            📋 Cuotas Pendientes ({cuotasPendientes.length})
          </h3>
          {cuotasPendientes.map((cuota, index) => {
            const distancia = ubicacionActual && cuota.latitud && cuota.longitud
              ? calcularDistancia(ubicacionActual, {
                  latitud: cuota.latitud,
                  longitud: cuota.longitud,
                })
              : null;

            return (
              <div
                key={cuota.id}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                style={{
                  padding: '15px',
                  marginBottom: '10px',
                  backgroundColor: 'white',
                  border: draggedIndex === index ? '2px dashed #6f42c1' : '2px solid #dee2e6',
                  borderRadius: '12px',
                  cursor: 'grab',
                  boxShadow: draggedIndex === index ? '0 4px 12px rgba(0,0,0,0.2)' : '0 2px 4px rgba(0,0,0,0.1)',
                  transition: 'all 0.2s',
                }}
              >
                {/* Número de orden */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '15px',
                  marginBottom: '10px',
                }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    backgroundColor: '#6f42c1',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '18px',
                    fontWeight: 'bold',
                    flexShrink: 0,
                  }}>
                    {index + 1}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 'bold', fontSize: '16px', marginBottom: '5px' }}>
                      {cuota.clienteNombre || 'Cliente desconocido'}
                    </div>
                    <div style={{ fontSize: '13px', color: '#666' }}>
                      {cuota.clienteDireccion || 'Sin dirección'}
                    </div>
                  </div>
                  {distancia && (
                    <div style={{
                      padding: '6px 12px',
                      backgroundColor: '#e3f2fd',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      color: '#1976d2',
                    }}>
                      📍 {formatearDistancia(distancia)}
                    </div>
                  )}
                </div>

                {/* Información de la cuota */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '10px',
                  padding: '10px',
                  backgroundColor: '#f8f9fa',
                  borderRadius: '8px',
                  marginBottom: '10px',
                  fontSize: '14px',
                }}>
                  <div>
                    <div style={{ color: '#666', fontSize: '12px' }}>Cuota #</div>
                    <div style={{ fontWeight: 'bold' }}>{cuota.numero}</div>
                  </div>
                  <div>
                    <div style={{ color: '#666', fontSize: '12px' }}>A Cobrar</div>
                    <div style={{ fontWeight: 'bold', color: '#28a745' }}>
                      ${(cuota.saldoPendiente || cuota.montoProgramado).toLocaleString()}
                    </div>
                  </div>
                  {cuota.clienteTelefono && (
                    <div style={{ gridColumn: '1 / -1' }}>
                      <div style={{ color: '#666', fontSize: '12px' }}>Teléfono</div>
                      <div style={{ fontWeight: 'bold' }}>📱 {cuota.clienteTelefono}</div>
                    </div>
                  )}
                </div>

                {/* Botones de acción */}
                <div style={{ display: 'flex', gap: '10px' }}>
                  {cuota.latitud && cuota.longitud && (
                    <button
                      onClick={() => abrirEnMaps(cuota.latitud!, cuota.longitud!)}
                      style={{
                        flex: 1,
                        padding: '10px',
                        backgroundColor: '#007bff',
                        color: 'white',
                        border: 'none',
                        borderRadius: '5px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: 'bold',
                      }}
                    >
                      🗺️ Ir en Maps
                    </button>
                  )}
                  <button
                    onClick={() => marcarVisitada(cuota.id)}
                    style={{
                      flex: 1,
                      padding: '10px',
                      backgroundColor: '#28a745',
                      color: 'white',
                      border: 'none',
                      borderRadius: '5px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: 'bold',
                    }}
                  >
                    ✅ Marcar Visitada
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Lista de Cuotas Visitadas */}
      {cuotasVisitadas.length > 0 && (
        <div>
          <h3 style={{ fontSize: '18px', marginBottom: '15px', color: '#666' }}>
            ✅ Visitadas ({cuotasVisitadas.length})
          </h3>
          {cuotasVisitadas.map((cuota) => (
            <div
              key={cuota.id}
              style={{
                padding: '15px',
                marginBottom: '10px',
                backgroundColor: '#f8f9fa',
                border: '1px solid #dee2e6',
                borderRadius: '8px',
                opacity: 0.7,
              }}
            >
              <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>
                {cuota.clienteNombre}
              </div>
              <div style={{ fontSize: '13px', color: '#666' }}>
                ${(cuota.saldoPendiente || cuota.montoProgramado).toLocaleString()} - Cuota #{cuota.numero}
              </div>
            </div>
          ))}
        </div>
      )}

      {cuotas.length === 0 && (
        <div style={{
          padding: '60px 20px',
          textAlign: 'center',
          backgroundColor: '#f8f9fa',
          borderRadius: '12px',
        }}>
          <div style={{ fontSize: '64px', marginBottom: '20px' }}>🎉</div>
          <h3>¡No hay cuotas para hoy!</h3>
          <p style={{ color: '#666' }}>Disfruta tu día libre</p>
        </div>
      )}
    </div>
  );
}
