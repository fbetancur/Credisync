import { useState, useEffect } from 'react';
import { generateClient } from 'aws-amplify/data';
import { db } from '../../lib/db';

// @ts-ignore
const client = generateClient();

export default function ProductosList() {
  const [productos, setProductos] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [productoEditando, setProductoEditando] = useState<any>(null);

  const [formData, setFormData] = useState({
    nombre: '',
    interesPorcentaje: '20',
    numeroCuotas: '30',
    frecuencia: 'DIARIO' as 'DIARIO' | 'SEMANAL' | 'QUINCENAL' | 'MENSUAL',
    excluirDomingos: true,
    montoMinimo: '',
    montoMaximo: '',
    requiereAprobacion: false,
  });

  useEffect(() => {
    cargarProductos();
  }, []);

  const cargarProductos = async () => {
    setLoading(true);
    try {
      const productosLocal = await db.productos.toArray();
      setProductos(productosLocal);

      try {
        // @ts-ignore
        const response = await client.models.ProductoCredito.list();
        const productosAWS = response.data || [];
        
        for (const producto of productosAWS) {
          await db.productos.put({
            id: producto.id,
            empresaId: producto.empresaId,
            nombre: producto.nombre,
            interesPorcentaje: producto.interesPorcentaje,
            numeroCuotas: producto.numeroCuotas,
            frecuencia: producto.frecuencia || 'DIARIO',
            excluirDomingos: producto.excluirDomingos ?? true,
            montoMinimo: producto.montoMinimo || undefined,
            montoMaximo: producto.montoMaximo || undefined,
            requiereAprobacion: producto.requiereAprobacion ?? false,
            activo: producto.activo ?? true,
            createdAt: producto.createdAt,
            updatedAt: producto.updatedAt,
            _lastSync: new Date().toISOString(),
            _pendingSync: false,
          });
        }

        const productosActualizados = await db.productos.toArray();
        setProductos(productosActualizados);
      } catch (syncError) {
        console.log('Error sincronizando productos:', syncError);
      }
    } catch (error: any) {
      setMensaje(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const abrirFormulario = (producto?: any) => {
    if (producto) {
      setProductoEditando(producto);
      setFormData({
        nombre: producto.nombre,
        interesPorcentaje: producto.interesPorcentaje.toString(),
        numeroCuotas: producto.numeroCuotas.toString(),
        frecuencia: producto.frecuencia,
        excluirDomingos: producto.excluirDomingos ?? true,
        montoMinimo: producto.montoMinimo?.toString() || '',
        montoMaximo: producto.montoMaximo?.toString() || '',
        requiereAprobacion: producto.requiereAprobacion ?? false,
      });
    } else {
      setProductoEditando(null);
      setFormData({
        nombre: '',
        interesPorcentaje: '20',
        numeroCuotas: '30',
        frecuencia: 'DIARIO',
        excluirDomingos: true,
        montoMinimo: '',
        montoMaximo: '',
        requiereAprobacion: false,
      });
    }
    setMostrarFormulario(true);
  };

  const guardarProducto = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nombre || !formData.interesPorcentaje || !formData.numeroCuotas) {
      setMensaje('❌ Completa los campos obligatorios');
      return;
    }

    setLoading(true);
    setMensaje('');

    try {
      const empresaId = 'empresa-demo-001';
      const productoData = {
        empresaId,
        nombre: formData.nombre,
        interesPorcentaje: parseFloat(formData.interesPorcentaje),
        numeroCuotas: parseInt(formData.numeroCuotas),
        frecuencia: formData.frecuencia,
        excluirDomingos: formData.excluirDomingos,
        montoMinimo: formData.montoMinimo ? parseFloat(formData.montoMinimo) : undefined,
        montoMaximo: formData.montoMaximo ? parseFloat(formData.montoMaximo) : undefined,
        requiereAprobacion: formData.requiereAprobacion,
        activo: true,
      };

      if (productoEditando) {
        // Actualizar
        await db.productos.update(productoEditando.id, {
          ...productoData,
          updatedAt: new Date().toISOString(),
        });

        try {
          // @ts-ignore
          await client.models.ProductoCredito.update({
            id: productoEditando.id,
            ...productoData,
          });
        } catch (syncError) {
          console.log('Actualización guardada offline');
        }

        setMensaje('✅ Producto actualizado correctamente');
      } else {
        // Crear nuevo
        const nuevoProducto = {
          id: `producto-${Date.now()}`,
          ...productoData,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          _pendingSync: true,
        };

        await db.productos.add(nuevoProducto);

        try {
          // @ts-ignore
          const response = await client.models.ProductoCredito.create(productoData);

          if (response?.data) {
            await db.productos.update(nuevoProducto.id, {
              id: response.data.id,
              _pendingSync: false,
              _lastSync: new Date().toISOString(),
            });
          }
        } catch (syncError) {
          console.log('Producto guardado offline');
        }

        setMensaje('✅ Producto creado correctamente');
      }

      setMostrarFormulario(false);
      cargarProductos();
    } catch (error: any) {
      setMensaje(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const toggleActivo = async (producto: any) => {
    try {
      const nuevoEstado = !producto.activo;
      
      await db.productos.update(producto.id, {
        activo: nuevoEstado,
        updatedAt: new Date().toISOString(),
      });

      try {
        // @ts-ignore
        await client.models.ProductoCredito.update({
          id: producto.id,
          activo: nuevoEstado,
        });
      } catch (syncError) {
        console.log('Cambio guardado offline');
      }

      setMensaje(`✅ Producto ${nuevoEstado ? 'activado' : 'desactivado'}`);
      cargarProductos();
    } catch (error: any) {
      setMensaje(`❌ Error: ${error.message}`);
    }
  };

  const calcularEjemplo = () => {
    const monto = 100000;
    const interes = parseFloat(formData.interesPorcentaje) || 0;
    const cuotas = parseInt(formData.numeroCuotas) || 1;
    
    const totalAPagar = monto + (monto * interes / 100);
    const valorCuota = totalAPagar / cuotas;

    return {
      monto,
      interes: (monto * interes / 100),
      totalAPagar,
      valorCuota,
    };
  };

  const ejemplo = calcularEjemplo();

  return (
    <div style={{ padding: '0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>💰 Productos de Crédito</h2>
        <button
          onClick={() => abrirFormulario()}
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
          ➕ Nuevo Producto
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

      {/* Formulario */}
      {mostrarFormulario && (
        <form
          onSubmit={guardarProducto}
          style={{
            padding: '20px',
            marginBottom: '20px',
            backgroundColor: '#f8f9fa',
            border: '1px solid #dee2e6',
            borderRadius: '8px',
          }}
        >
          <h3>{productoEditando ? 'Editar Producto' : 'Nuevo Producto'}</h3>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Nombre del producto *
            </label>
            <input
              type="text"
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              placeholder="Ej: Crédito Diario, Crédito Semanal"
              required
              style={{ width: '100%', padding: '10px', fontSize: '16px', borderRadius: '5px', border: '1px solid #ccc' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px', marginBottom: '15px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Interés (%) *
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.interesPorcentaje}
                onChange={(e) => setFormData({ ...formData, interesPorcentaje: e.target.value })}
                required
                style={{ width: '100%', padding: '10px', fontSize: '16px', borderRadius: '5px', border: '1px solid #ccc' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Número de cuotas *
              </label>
              <input
                type="number"
                value={formData.numeroCuotas}
                onChange={(e) => setFormData({ ...formData, numeroCuotas: e.target.value })}
                required
                style={{ width: '100%', padding: '10px', fontSize: '16px', borderRadius: '5px', border: '1px solid #ccc' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Frecuencia *
              </label>
              <select
                value={formData.frecuencia}
                onChange={(e) => setFormData({ ...formData, frecuencia: e.target.value as any })}
                style={{ width: '100%', padding: '10px', fontSize: '16px', borderRadius: '5px', border: '1px solid #ccc' }}
              >
                <option value="DIARIO">Diario</option>
                <option value="SEMANAL">Semanal</option>
                <option value="QUINCENAL">Quincenal</option>
                <option value="MENSUAL">Mensual</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Monto mínimo
              </label>
              <input
                type="number"
                value={formData.montoMinimo}
                onChange={(e) => setFormData({ ...formData, montoMinimo: e.target.value })}
                placeholder="Ej: 50000"
                style={{ width: '100%', padding: '10px', fontSize: '16px', borderRadius: '5px', border: '1px solid #ccc' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Monto máximo
              </label>
              <input
                type="number"
                value={formData.montoMaximo}
                onChange={(e) => setFormData({ ...formData, montoMaximo: e.target.value })}
                placeholder="Ej: 1000000"
                style={{ width: '100%', padding: '10px', fontSize: '16px', borderRadius: '5px', border: '1px solid #ccc' }}
              />
            </div>
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={formData.excluirDomingos}
                onChange={(e) => setFormData({ ...formData, excluirDomingos: e.target.checked })}
                style={{ width: '20px', height: '20px' }}
              />
              <span>Excluir domingos (solo para frecuencia diaria)</span>
            </label>
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={formData.requiereAprobacion}
                onChange={(e) => setFormData({ ...formData, requiereAprobacion: e.target.checked })}
                style={{ width: '20px', height: '20px' }}
              />
              <span>Requiere aprobación de supervisor</span>
            </label>
          </div>

          {/* Ejemplo de cálculo */}
          <div style={{ padding: '15px', backgroundColor: '#e3f2fd', borderRadius: '8px', marginBottom: '15px' }}>
            <h4>💡 Ejemplo de cálculo (préstamo de $100,000):</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', fontSize: '14px' }}>
              <div>
                <strong>Interés:</strong> ${ejemplo.interes.toLocaleString()}
              </div>
              <div>
                <strong>Total a pagar:</strong> ${ejemplo.totalAPagar.toLocaleString()}
              </div>
              <div>
                <strong>Valor cuota:</strong> ${Math.round(ejemplo.valorCuota).toLocaleString()}
              </div>
              <div>
                <strong>Cuotas:</strong> {formData.numeroCuotas}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              onClick={() => setMostrarFormulario(false)}
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
              type="submit"
              disabled={loading}
              style={{
                flex: 2,
                padding: '12px',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '16px',
                fontWeight: 'bold',
              }}
            >
              {loading ? '⏳ Guardando...' : `✅ ${productoEditando ? 'Actualizar' : 'Crear'} Producto`}
            </button>
          </div>
        </form>
      )}

      {/* Lista de productos */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' }}>
        {productos.map((producto) => (
          <div
            key={producto.id}
            style={{
              padding: '20px',
              backgroundColor: 'white',
              border: `2px solid ${producto.activo ? '#28a745' : '#dc3545'}`,
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              opacity: producto.activo ? 1 : 0.6,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '15px' }}>
              <h3 style={{ margin: 0, fontSize: '20px' }}>{producto.nombre}</h3>
              <span
                style={{
                  padding: '4px 12px',
                  backgroundColor: producto.activo ? '#d4edda' : '#f8d7da',
                  color: producto.activo ? '#155724' : '#721c24',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: 'bold',
                }}
              >
                {producto.activo ? 'ACTIVO' : 'INACTIVO'}
              </span>
            </div>

            <div style={{ marginBottom: '15px', fontSize: '14px', lineHeight: '1.8' }}>
              <div><strong>💵 Interés:</strong> {producto.interesPorcentaje}%</div>
              <div><strong>📅 Cuotas:</strong> {producto.numeroCuotas}</div>
              <div><strong>🔄 Frecuencia:</strong> {producto.frecuencia}</div>
              {producto.montoMinimo && <div><strong>⬇️ Monto mínimo:</strong> ${producto.montoMinimo.toLocaleString()}</div>}
              {producto.montoMaximo && <div><strong>⬆️ Monto máximo:</strong> ${producto.montoMaximo.toLocaleString()}</div>}
              {producto.excluirDomingos && <div>📆 Excluye domingos</div>}
              {producto.requiereAprobacion && <div>✋ Requiere aprobación</div>}
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => abrirFormulario(producto)}
                style={{
                  flex: 1,
                  padding: '10px',
                  backgroundColor: '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  fontSize: '14px',
                }}
              >
                ✏️ Editar
              </button>
              <button
                onClick={() => toggleActivo(producto)}
                style={{
                  flex: 1,
                  padding: '10px',
                  backgroundColor: producto.activo ? '#dc3545' : '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  fontSize: '14px',
                }}
              >
                {producto.activo ? '🚫 Desactivar' : '✅ Activar'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {productos.length === 0 && !loading && (
        <div
          style={{
            padding: '60px 20px',
            textAlign: 'center',
            backgroundColor: '#f8f9fa',
            borderRadius: '12px',
          }}
        >
          <div style={{ fontSize: '64px', marginBottom: '20px' }}>💰</div>
          <h3>No hay productos de crédito</h3>
          <p style={{ color: '#666', marginBottom: '20px' }}>
            Crea tu primer producto para empezar a otorgar créditos
          </p>
          <button
            onClick={() => abrirFormulario()}
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
            ➕ Crear Primer Producto
          </button>
        </div>
      )}
    </div>
  );
}