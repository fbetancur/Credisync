import { useState, useEffect } from 'react';
import { generateClient } from 'aws-amplify/data';
import { db } from '../../lib/db';
import ClienteDetail from './ClienteDetail';
import { validarNuevoCredito } from '../../lib/creditoValidations';

// @ts-ignore - Ignorar errores de tipo de Amplify
const client = generateClient();

export default function ClientesList() {
  const [clientes, setClientes] = useState<any[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [loading, setLoading] = useState(false);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [clienteSeleccionado, setClienteSeleccionado] = useState<string | null>(null);
  const [clienteParaCredito, setClienteParaCredito] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    nombre: '',
    documento: '',
    telefono: '',
    direccion: '',
    barrio: '',
    referencia: '',
    fiadorNombre: '',
    fiadorTelefono: '',
  });

  const [ubicacion, setUbicacion] = useState<{ lat: number; lng: number } | null>(null);
  const [capturandoGPS, setCapturandoGPS] = useState(false);

  useEffect(() => {
    cargarClientes();
  }, []);

  const cargarClientes = async () => {
    setLoading(true);
    try {
      const clientesLocal = await db.clientes.toArray();
      setClientes(clientesLocal);

      try {
        // @ts-ignore
        const response = await client.models.Cliente.list();
        const clientesAWS = response.data || [];
        
        for (const cliente of clientesAWS) {
          await db.clientes.put({
            id: cliente.id,
            empresaId: cliente.empresaId,
            rutaId: cliente.rutaId || undefined,
            nombre: cliente.nombre,
            documento: cliente.documento,
            telefono: cliente.telefono || undefined,
            direccion: cliente.direccion || undefined,
            barrio: cliente.barrio || undefined,
            referencia: cliente.referencia || undefined,
            latitud: cliente.latitud || undefined,
            longitud: cliente.longitud || undefined,
            fiadorNombre: cliente.fiadorNombre || undefined,
            fiadorTelefono: cliente.fiadorTelefono || undefined,
            fiadorDireccion: cliente.fiadorDireccion || undefined,
            estado: cliente.estado || 'ACTIVO',
            observaciones: cliente.observaciones || undefined,
            createdAt: cliente.createdAt,
            updatedAt: cliente.updatedAt,
            _lastSync: new Date().toISOString(),
            _pendingSync: false,
          });
        }

        const clientesActualizados = await db.clientes.toArray();
        setClientes(clientesActualizados);
      } catch (syncError) {
        console.log('Error sincronizando con AWS:', syncError);
      }
    } catch (error: any) {
      setMensaje(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const capturarGPS = () => {
    if (!navigator.geolocation) {
      setMensaje('❌ Tu navegador no soporta geolocalización');
      return;
    }

    setCapturandoGPS(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUbicacion({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setMensaje('✅ Ubicación capturada correctamente');
        setCapturandoGPS(false);
      },
      (error) => {
        setMensaje(`❌ Error al capturar GPS: ${error.message}`);
        setCapturandoGPS(false);
      }
    );
  };

  const crearCliente = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nombre || !formData.documento) {
      setMensaje('❌ Nombre y documento son obligatorios');
      return;
    }

    if (!ubicacion) {
      setMensaje('❌ Debes capturar la ubicación GPS del cliente');
      return;
    }

    setLoading(true);
    setMensaje('');

    try {
      const empresaId = 'empresa-demo-001';
      const nuevoClienteLocal = {
        id: `cliente-${Date.now()}`,
        empresaId,
        nombre: formData.nombre,
        documento: formData.documento,
        telefono: formData.telefono || undefined,
        direccion: formData.direccion || undefined,
        barrio: formData.barrio || undefined,
        referencia: formData.referencia || undefined,
        latitud: ubicacion.lat,
        longitud: ubicacion.lng,
        fiadorNombre: formData.fiadorNombre || undefined,
        fiadorTelefono: formData.fiadorTelefono || undefined,
        estado: 'ACTIVO' as const,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        _pendingSync: true,
      };

      await db.clientes.add(nuevoClienteLocal);

      try {
        // @ts-ignore
        const response = await client.models.Cliente.create({
          empresaId,
          nombre: formData.nombre,
          documento: formData.documento,
          telefono: formData.telefono || undefined,
          direccion: formData.direccion || undefined,
          barrio: formData.barrio || undefined,
          referencia: formData.referencia || undefined,
          latitud: ubicacion.lat,
          longitud: ubicacion.lng,
          fiadorNombre: formData.fiadorNombre || undefined,
          fiadorTelefono: formData.fiadorTelefono || undefined,
          estado: 'ACTIVO',
        });

        if (response?.data) {
          await db.clientes.update(nuevoClienteLocal.id, {
            id: response.data.id,
            _pendingSync: false,
            _lastSync: new Date().toISOString(),
          });
        }
      } catch (syncError) {
        console.log('Cliente guardado offline');
      }

      setMensaje('✅ Cliente creado correctamente');
      setMostrarFormulario(false);
      limpiarFormulario();
      cargarClientes();
    } catch (error: any) {
      setMensaje(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const limpiarFormulario = () => {
    setFormData({
      nombre: '',
      documento: '',
      telefono: '',
      direccion: '',
      barrio: '',
      referencia: '',
      fiadorNombre: '',
      fiadorTelefono: '',
    });
    setUbicacion(null);
  };

  const handleOtorgarCredito = async (clienteId: string) => {
    const validacion = await validarNuevoCredito(clienteId);
    
    if (!validacion.permitido) {
      setMensaje(validacion.mensaje || '❌ No se puede otorgar crédito');
      return;
    }

    setClienteParaCredito(clienteId);
    // Aquí se mostrará el formulario de crédito
  };

  const clientesFiltrados = clientes.filter((cliente) =>
    cliente.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    cliente.documento.includes(busqueda) ||
    (cliente.telefono && cliente.telefono.includes(busqueda))
  );

  // Si hay un cliente seleccionado, mostrar vista detalle
  if (clienteSeleccionado) {
    return (
      <ClienteDetail
        clienteId={clienteSeleccionado}
        onBack={() => setClienteSeleccionado(null)}
        onOtorgarCredito={handleOtorgarCredito}
      />
    );
  }

  // Si hay un cliente para crédito, mostrar formulario de crédito
  if (clienteParaCredito) {
    return (
      <div style={{ padding: '20px' }}>
        <button
          onClick={() => setClienteParaCredito(null)}
          style={{
            padding: '10px 20px',
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            marginBottom: '20px',
          }}
        >
          ← Volver
        </button>
        <div style={{
          padding: '20px',
          backgroundColor: '#e3f2fd',
          borderRadius: '8px',
          marginBottom: '20px',
        }}>
          <h3>🎯 Otorgar Crédito</h3>
          <p>Cliente ID: {clienteParaCredito}</p>
          <p style={{ fontSize: '14px', color: '#666' }}>
            Aquí se mostrará el formulario de crédito (CreditoForm) con el cliente pre-seleccionado
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>👥 Clientes</h2>
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
          }}
        >
          {mostrarFormulario ? '❌ Cancelar' : '➕ Nuevo Cliente'}
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

      {mostrarFormulario && (
        <form
          onSubmit={crearCliente}
          style={{
            padding: '20px',
            marginBottom: '20px',
            backgroundColor: '#f8f9fa',
            border: '1px solid #dee2e6',
            borderRadius: '8px',
          }}
        >
          <h3>Nuevo Cliente</h3>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Nombre completo *
            </label>
            <input
              type="text"
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              required
              style={{ width: '100%', padding: '8px', fontSize: '16px', borderRadius: '4px', border: '1px solid #ccc' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Documento *</label>
              <input
                type="text"
                value={formData.documento}
                onChange={(e) => setFormData({ ...formData, documento: e.target.value })}
                required
                style={{ width: '100%', padding: '8px', fontSize: '16px', borderRadius: '4px', border: '1px solid #ccc' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Teléfono</label>
              <input
                type="tel"
                value={formData.telefono}
                onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                style={{ width: '100%', padding: '8px', fontSize: '16px', borderRadius: '4px', border: '1px solid #ccc' }}
              />
            </div>
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Dirección</label>
            <input
              type="text"
              value={formData.direccion}
              onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
              style={{ width: '100%', padding: '8px', fontSize: '16px', borderRadius: '4px', border: '1px solid #ccc' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Barrio</label>
              <input
                type="text"
                value={formData.barrio}
                onChange={(e) => setFormData({ ...formData, barrio: e.target.value })}
                style={{ width: '100%', padding: '8px', fontSize: '16px', borderRadius: '4px', border: '1px solid #ccc' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Referencia</label>
              <input
                type="text"
                value={formData.referencia}
                onChange={(e) => setFormData({ ...formData, referencia: e.target.value })}
                placeholder="Ej: Casa azul al lado de la tienda"
                style={{ width: '100%', padding: '8px', fontSize: '16px', borderRadius: '4px', border: '1px solid #ccc' }}
              />
            </div>
          </div>

          <div style={{ marginBottom: '15px', padding: '15px', backgroundColor: '#e3f2fd', borderRadius: '8px' }}>
            <h4>📍 Ubicación GPS</h4>
            <button
              type="button"
              onClick={capturarGPS}
              disabled={capturandoGPS}
              style={{
                padding: '10px 20px',
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: capturandoGPS ? 'not-allowed' : 'pointer',
                fontSize: '16px',
                marginBottom: '10px',
              }}
            >
              {capturandoGPS ? '⏳ Capturando...' : '📍 Capturar Ubicación'}
            </button>
            {ubicacion && (
              <div style={{ fontSize: '14px', color: '#155724' }}>
                ✅ Lat: {ubicacion.lat.toFixed(6)}, Lng: {ubicacion.lng.toFixed(6)}
              </div>
            )}
          </div>

          <details style={{ marginBottom: '15px' }}>
            <summary style={{ cursor: 'pointer', fontWeight: 'bold', marginBottom: '10px' }}>
              👤 Datos del Fiador (Opcional)
            </summary>
            <div style={{ paddingLeft: '20px' }}>
              <div style={{ marginBottom: '10px' }}>
                <label style={{ display: 'block', marginBottom: '5px' }}>Nombre del fiador</label>
                <input
                  type="text"
                  value={formData.fiadorNombre}
                  onChange={(e) => setFormData({ ...formData, fiadorNombre: e.target.value })}
                  style={{ width: '100%', padding: '8px', fontSize: '16px', borderRadius: '4px', border: '1px solid #ccc' }}
                />
              </div>
              <div style={{ marginBottom: '10px' }}>
                <label style={{ display: 'block', marginBottom: '5px' }}>Teléfono del fiador</label>
                <input
                  type="tel"
                  value={formData.fiadorTelefono}
                  onChange={(e) => setFormData({ ...formData, fiadorTelefono: e.target.value })}
                  style={{ width: '100%', padding: '8px', fontSize: '16px', borderRadius: '4px', border: '1px solid #ccc' }}
                />
              </div>
            </div>
          </details>

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
            {loading ? '⏳ Guardando...' : '✅ Guardar Cliente'}
          </button>
        </form>
      )}

      <div style={{ marginBottom: '20px' }}>
        <input
          type="text"
          placeholder="🔍 Buscar por nombre, documento o teléfono..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          style={{
            width: '100%',
            padding: '12px',
            fontSize: '16px',
            borderRadius: '8px',
            border: '1px solid #ccc',
          }}
        />
      </div>

      <div>
        <h3>📋 {clientesFiltrados.length} cliente(s)</h3>
        {loading && <p>⏳ Cargando...</p>}
        {clientesFiltrados.map((cliente) => (
          <div
            key={cliente.id}
            style={{
              padding: '15px',
              marginBottom: '15px',
              backgroundColor: 'white',
              border: '1px solid #dee2e6',
              borderRadius: '12px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            }}
          >
            <div
              onClick={() => setClienteSeleccionado(cliente.id)}
              style={{ cursor: 'pointer' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '10px' }}>
                <div style={{ flex: 1 }}>
                  <h4 style={{ margin: '0 0 8px 0' }}>👤 {cliente.nombre}</h4>
                  <div style={{ fontSize: '14px', color: '#666' }}>
                    <div>📄 {cliente.documento}</div>
                    {cliente.telefono && <div>📱 {cliente.telefono}</div>}
                  </div>
                </div>
                <div>
                  <span
                    style={{
                      padding: '4px 12px',
                      backgroundColor: cliente.estado === 'ACTIVO' ? '#d4edda' : '#f8d7da',
                      color: cliente.estado === 'ACTIVO' ? '#155724' : '#721c24',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: 'bold',
                    }}
                  >
                    {cliente.estado}
                  </span>
                </div>
              </div>
            </div>

            {/* Botón Otorgar Crédito */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleOtorgarCredito(cliente.id);
              }}
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: '#6f42c1',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: 'bold',
                marginTop: '10px',
              }}
            >
              💰 Otorgar Crédito
            </button>

            {cliente._pendingSync && (
              <div style={{ marginTop: '8px', fontSize: '12px', color: '#856404', backgroundColor: '#fff3cd', padding: '4px 8px', borderRadius: '4px' }}>
                ⏳ Pendiente de sincronización
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}