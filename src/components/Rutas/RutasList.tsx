import { useState, useEffect } from 'react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../../amplify/data/resource';
import { db } from '../../lib/db';

const client = generateClient<Schema>();

export default function RutasList() {
  const [rutas, setRutas] = useState<any[]>([]);
  const [clientes, setClientes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [rutaSeleccionada, setRutaSeleccionada] = useState<any>(null);

  // Formulario de ruta
  const [nombre, setNombre] = useState('');
  const [color, setColor] = useState('#007bff');

  // Asignación de clientes
  const [mostrarAsignacion, setMostrarAsignacion] = useState(false);
  const [clientesAsignados, setClientesAsignados] = useState<string[]>([]);

  const coloresDisponibles = [
    { nombre: 'Azul', valor: '#007bff' },
    { nombre: 'Verde', valor: '#28a745' },
    { nombre: 'Rojo', valor: '#dc3545' },
    { nombre: 'Naranja', valor: '#fd7e14' },
    { nombre: 'Morado', valor: '#6f42c1' },
    { nombre: 'Cyan', valor: '#17a2b8' },
    { nombre: 'Rosa', valor: '#e83e8c' },
    { nombre: 'Amarillo', valor: '#ffc107' },
  ];

  useEffect(() => {
    cargarRutas();
    cargarClientes();
  }, []);

  const cargarRutas = async () => {
    setLoading(true);
    try {
      // Cargar desde IndexedDB
      const rutasLocal = await db.rutas.toArray();
      
      // Enriquecer con conteo de clientes
      const rutasConConteo = await Promise.all(
        rutasLocal.map(async (ruta) => {
          const clientesEnRuta = await db.clientes
            .where('rutaId')
            .equals(ruta.id)
            .count();
          
          return {
            ...ruta,
            totalClientes: clientesEnRuta,
          };
        })
      );

      setRutas(rutasConConteo);

      // Sincronizar con AWS
      const { data } = await client.models.Ruta.list();
      for (const ruta of data) {
        await db.rutas.put({
          id: ruta.id,
          empresaId: ruta.empresaId,
          nombre: ruta.nombre,
          color: ruta.color ?? '#007bff',
          activa: ruta.activa ?? true,
          createdAt: ruta.createdAt,
          updatedAt: ruta.updatedAt,
          _lastSync: new Date().toISOString(),
          _pendingSync: false,
        });
      }
    } catch (error: any) {
      console.error('Error cargando rutas:', error);
    } finally {
      setLoading(false);
    }
  };

  const cargarClientes = async () => {
    try {
      const clientesLocal = await db.clientes
        .where('estado')
        .equals('ACTIVO')
        .toArray();
      setClientes(clientesLocal);
    } catch (error) {
      console.error('Error cargando clientes:', error);
    }
  };

  const crearRuta = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nombre) {
      setMensaje('❌ El nombre es obligatorio');
      return;
    }

    setLoading(true);
    setMensaje('');

    try {
      const empresaId = 'empresa-demo-001';
      const rutaId = `ruta-${Date.now()}`;

      const nuevaRuta = {
        id: rutaId,
        empresaId,
        nombre,
        color,
        activa: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        _pendingSync: true,
      };

      await db.rutas.add(nuevaRuta);

      // Sincronizar con AWS
      try {
        const { data } = await client.models.Ruta.create({
          empresaId,
          nombre,
          color,
          activa: true,
        });

        if (data) {
          await db.rutas.update(rutaId, {
            id: data.id,
            _pendingSync: false,
            _lastSync: new Date().toISOString(),
          });
        }
      } catch (syncError) {
        console.log('Ruta guardada offline, se sincronizará después');
      }

      setMensaje('✅ Ruta creada exitosamente');
      setMostrarFormulario(false);
      limpiarFormulario();
      cargarRutas();
    } catch (error: any) {
      setMensaje(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const limpiarFormulario = () => {
    setNombre('');
    setColor('#007bff');
  };

  const abrirAsignacion = async (ruta: any) => {
    setRutaSeleccionada(ruta);
    
    // Cargar clientes ya asignados a esta ruta
    const clientesEnRuta = await db.clientes
      .where('rutaId')
      .equals(ruta.id)
      .toArray();
    
    setClientesAsignados(clientesEnRuta.map(c => c.id));
    setMostrarAsignacion(true);
  };

  const toggleClienteAsignacion = (clienteId: string) => {
    if (clientesAsignados.includes(clienteId)) {
      setClientesAsignados(clientesAsignados.filter(id => id !== clienteId));
    } else {
      setClientesAsignados([...clientesAsignados, clienteId]);
    }
  };

  const guardarAsignaciones = async () => {
    if (!rutaSeleccionada) return;

    setLoading(true);
    setMensaje('');

    try {
      // Actualizar todos los clientes
      for (const cliente of clientes) {
        if (clientesAsignados.includes(cliente.id)) {
          // Asignar a esta ruta
          await db.clientes.update(cliente.id, {
            rutaId: rutaSeleccionada.id,
            updatedAt: new Date().toISOString(),
          });
        } else if (cliente.rutaId === rutaSeleccionada.id) {
          // Remover de esta ruta
          await db.clientes.update(cliente.id, {
            rutaId: undefined,
            updatedAt: new Date().toISOString(),
          });
        }
      }

      setMensaje('✅ Clientes asignados exitosamente');
      setMostrarAsignacion(false);
      cargarRutas();
    } catch (error: any) {
      setMensaje(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const eliminarRuta = async (rutaId: string) => {
    if (!confirm('¿Estás seguro de eliminar esta ruta? Los clientes quedarán sin ruta asignada.')) {
      return;
    }

    setLoading(true);
    try {
      // Remover la ruta de los clientes
      const clientesEnRuta = await db.clientes
        .where('rutaId')
        .equals(rutaId)
        .toArray();

      for (const cliente of clientesEnRuta) {
        await db.clientes.update(cliente.id, {
          rutaId: undefined,
          updatedAt: new Date().toISOString(),
        });
      }

      // Eliminar la ruta
      await db.rutas.delete(rutaId);

      setMensaje('✅ Ruta eliminada');
      cargarRutas();
    } catch (error: any) {
      setMensaje(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const clientesSinRuta = clientes.filter(c => !c.rutaId);

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>🗺️ Rutas</h2>
        <button
          onClick={() => setMostrarFormulario(!mostrarFormulario)}
          style={{
            padding: '10px 20px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: 'bold',
          }}
        >
          {mostrarFormulario ? '❌ Cancelar' : '➕ Nueva Ruta'}
        </button>
      </div>

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

      {/* Alerta de clientes sin ruta */}
      {clientesSinRuta.length > 0 && (
        <div
          style={{
            padding: '15px',
            marginBottom: '20px',
            backgroundColor: '#fff3cd',
            border: '1px solid #ffeeba',
            borderRadius: '8px',
          }}
        >
          <strong>⚠️ {clientesSinRuta.length} cliente(s) sin ruta asignada</strong>
          <div style={{ fontSize: '14px', marginTop: '5px' }}>
            Asígnalos a una ruta para organizarlos mejor
          </div>
        </div>
      )}

      {/* Formulario de crear ruta */}
      {mostrarFormulario && (
        <form
          onSubmit={crearRuta}
          style={{
            padding: '20px',
            marginBottom: '20px',
            backgroundColor: '#f8f9fa',
            border: '1px solid #dee2e6',
            borderRadius: '8px',
          }}
        >
          <h3>Nueva Ruta</h3>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Nombre de la ruta *
            </label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: Ruta Centro, Ruta Norte"
              required
              style={{
                width: '100%',
                padding: '10px',
                fontSize: '16px',
                borderRadius: '5px',
                border: '1px solid #ccc',
              }}
            />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Color identificador
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
              {coloresDisponibles.map((c) => (
                <button
                  key={c.valor}
                  type="button"
                  onClick={() => setColor(c.valor)}
                  style={{
                    padding: '10px',
                    backgroundColor: c.valor,
                    color: 'white',
                    border: color === c.valor ? '3px solid #000' : 'none',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                  }}
                >
                  {c.nombre}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '18px',
              fontWeight: 'bold',
            }}
          >
            {loading ? '⏳ Creando...' : '✅ Crear Ruta'}
          </button>
        </form>
      )}

      {/* Lista de rutas */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
        {rutas.map((ruta) => (
          <div
            key={ruta.id}
            style={{
              padding: '20px',
              backgroundColor: 'white',
              border: `3px solid ${ruta.color}`,
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '15px' }}>
              <div>
                <h3 style={{ margin: '0 0 5px 0', fontSize: '20px' }}>{ruta.nombre}</h3>
                <div
                  style={{
                    display: 'inline-block',
                    padding: '4px 12px',
                    backgroundColor: ruta.color,
                    color: 'white',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                  }}
                >
                  {ruta.activa ? 'ACTIVA' : 'INACTIVA'}
                </div>
              </div>
            </div>

            <div
              style={{
                padding: '15px',
                backgroundColor: '#f8f9fa',
                borderRadius: '8px',
                marginBottom: '15px',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '32px', fontWeight: 'bold', color: ruta.color }}>
                {ruta.totalClientes || 0}
              </div>
              <div style={{ fontSize: '14px', color: '#666' }}>Cliente(s) asignados</div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => abrirAsignacion(ruta)}
                style={{
                  flex: 1,
                  padding: '10px',
                  backgroundColor: ruta.color,
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold',
                }}
              >
                👥 Asignar Clientes
              </button>
              <button
                onClick={() => eliminarRuta(ruta.id)}
                style={{
                  padding: '10px',
                  backgroundColor: '#dc3545',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  fontSize: '14px',
                }}
              >
                🗑️
              </button>
            </div>
          </div>
        ))}
      </div>

      {rutas.length === 0 && !loading && (
        <div
          style={{
            padding: '60px 20px',
            textAlign: 'center',
            backgroundColor: '#f8f9fa',
            borderRadius: '12px',
          }}
        >
          <div style={{ fontSize: '64px', marginBottom: '20px' }}>🗺️</div>
          <h3>No hay rutas creadas</h3>
          <p style={{ color: '#666', marginBottom: '20px' }}>
            Crea tu primera ruta para organizar a tus clientes
          </p>
          <button
            onClick={() => setMostrarFormulario(true)}
            style={{
              padding: '12px 24px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: 'bold',
            }}
          >
            ➕ Crear Primera Ruta
          </button>
        </div>
      )}

      {/* Modal de asignación de clientes */}
      {mostrarAsignacion && rutaSeleccionada && (
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
          onClick={() => setMostrarAsignacion(false)}
        >
          <div
            style={{
              backgroundColor: 'white',
              padding: '30px',
              borderRadius: '12px',
              maxWidth: '600px',
              width: '90%',
              maxHeight: '80vh',
              overflowY: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ marginTop: 0, borderBottom: `3px solid ${rutaSeleccionada.color}`, paddingBottom: '10px' }}>
              👥 Asignar Clientes a {rutaSeleccionada.nombre}
            </h3>

            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '14px', color: '#666', marginBottom: '10px' }}>
                Selecciona los clientes que pertenecen a esta ruta:
              </div>

              {clientes.length === 0 && (
                <div
                  style={{
                    padding: '20px',
                    textAlign: 'center',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '8px',
                    color: '#666',
                  }}
                >
                  No hay clientes activos para asignar
                </div>
              )}

              <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                {clientes.map((cliente) => (
                  <label
                    key={cliente.id}
                    style={{
                      display: 'block',
                      padding: '12px',
                      marginBottom: '10px',
                      backgroundColor: clientesAsignados.includes(cliente.id) ? '#e3f2fd' : '#f8f9fa',
                      border: clientesAsignados.includes(cliente.id)
                        ? `2px solid ${rutaSeleccionada.color}`
                        : '1px solid #dee2e6',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={clientesAsignados.includes(cliente.id)}
                      onChange={() => toggleClienteAsignacion(cliente.id)}
                      style={{ marginRight: '10px', width: '18px', height: '18px' }}
                    />
                    <strong>{cliente.nombre}</strong>
                    <div style={{ fontSize: '13px', color: '#666', marginTop: '4px', marginLeft: '28px' }}>
                      📄 {cliente.documento} | 📱 {cliente.telefono || 'Sin teléfono'}
                      <br />
                      📍 {cliente.direccion || 'Sin dirección'}
                      {cliente.rutaId && cliente.rutaId !== rutaSeleccionada.id && (
                        <span
                          style={{
                            marginLeft: '10px',
                            padding: '2px 8px',
                            backgroundColor: '#fff3cd',
                            borderRadius: '8px',
                            fontSize: '11px',
                          }}
                        >
                          ⚠️ En otra ruta
                        </span>
                      )}
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div
              style={{
                padding: '10px',
                backgroundColor: '#e3f2fd',
                borderRadius: '8px',
                marginBottom: '15px',
                textAlign: 'center',
              }}
            >
              <strong>{clientesAsignados.length}</strong> cliente(s) seleccionado(s)
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => setMostrarAsignacion(false)}
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
                onClick={guardarAsignaciones}
                disabled={loading}
                style={{
                  flex: 2,
                  padding: '12px',
                  backgroundColor: loading ? '#ccc' : rutaSeleccionada.color,
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontSize: '16px',
                  fontWeight: 'bold',
                }}
              >
                {loading ? '⏳ Guardando...' : '✅ Guardar Asignaciones'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}