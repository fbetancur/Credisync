import { useState, useEffect } from 'react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';
import { db, getDatabaseStats } from '../lib/db';

const client = generateClient<Schema>();

export default function TestDatabase() {
  const [nombre, setNombre] = useState('');
  const [nit, setNit] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [empresas, setEmpresas] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    const statistics = await getDatabaseStats();
    setStats(statistics);
  };

  const crearEmpresa = async () => {
    if (!nombre || !nit) {
      setMessage('❌ Por favor llena nombre y NIT');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const { data, errors } = await client.models.Empresa.create({
        nombre,
        nit,
        activa: true,
      });

      if (errors) {
        setMessage(`❌ Error: ${errors[0].message}`);
      } else if (data) {
        await db.empresas.add({
          id: data.id,
          nombre: data.nombre,
          nit: data.nit,
          activa: data.activa ?? true,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
          _lastSync: new Date().toISOString(),
          _pendingSync: false,
        });

        setMessage(`✅ Empresa creada: ${data.nombre}`);
        setNombre('');
        setNit('');
        listarEmpresas();
        loadStats();
      }
    } catch (error: any) {
      setMessage(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const listarEmpresas = async () => {
    setLoading(true);
    try {
      const { data } = await client.models.Empresa.list();
      setEmpresas(data);
      setMessage(`✅ ${data.length} empresa(s) en AWS`);
    } catch (error: any) {
      setMessage(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const listarEmpresasOffline = async () => {
    setLoading(true);
    try {
      const data = await db.empresas.toArray();
      setEmpresas(data);
      setMessage(`✅ ${data.length} empresa(s) en IndexedDB`);
    } catch (error: any) {
      setMessage(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      padding: '20px', 
      maxWidth: '800px', 
      margin: '0 auto',
      maxHeight: 'calc(100vh - 140px)',
      overflowY: 'auto'
    }}>
      <h2>🧪 Test de Base de Datos</h2>
      
      {stats && (
        <div style={{
          padding: '15px',
          marginBottom: '20px',
          backgroundColor: '#e3f2fd',
          border: '1px solid #2196f3',
          borderRadius: '8px',
        }}>
          <h3>📊 Estadísticas IndexedDB (Offline)</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', fontSize: '14px' }}>
            <div><strong>Empresas:</strong> {stats.empresas}</div>
            <div><strong>Usuarios:</strong> {stats.usuarios}</div>
            <div><strong>Rutas:</strong> {stats.rutas}</div>
            <div><strong>Clientes:</strong> {stats.clientes}</div>
            <div><strong>Productos:</strong> {stats.productos}</div>
            <div><strong>Créditos:</strong> {stats.creditos}</div>
            <div><strong>Cuotas:</strong> {stats.cuotas}</div>
            <div><strong>Pagos:</strong> {stats.pagos}</div>
            <div><strong>Pendientes:</strong> {stats.pendientesSync}</div>
          </div>
        </div>
      )}

      <div style={{ marginBottom: '20px', padding: '15px', border: '1px solid #ccc', borderRadius: '8px' }}>
        <h3>Crear Empresa</h3>
        <input
          type="text"
          placeholder="Nombre de la empresa"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          style={{ width: '100%', padding: '8px', marginBottom: '10px', fontSize: '16px' }}
        />
        <input
          type="text"
          placeholder="NIT"
          value={nit}
          onChange={(e) => setNit(e.target.value)}
          style={{ width: '100%', padding: '8px', marginBottom: '10px', fontSize: '16px' }}
        />
        <button
          onClick={crearEmpresa}
          disabled={loading}
          style={{
            padding: '10px 20px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '16px',
            width: '100%'
          }}
        >
          {loading ? '⏳ Creando...' : '✅ Crear Empresa (AWS + Offline)'}
        </button>
      </div>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <button
          onClick={listarEmpresas}
          disabled={loading}
          style={{
            flex: 1,
            minWidth: '150px',
            padding: '10px 15px',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '14px',
          }}
        >
          ☁️ AWS
        </button>

        <button
          onClick={listarEmpresasOffline}
          disabled={loading}
          style={{
            flex: 1,
            minWidth: '150px',
            padding: '10px 15px',
            backgroundColor: '#ff9800',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '14px',
          }}
        >
          📱 Offline
        </button>

        <button
          onClick={loadStats}
          style={{
            flex: 1,
            minWidth: '150px',
            padding: '10px 15px',
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '14px',
          }}
        >
          🔄 Stats
        </button>
      </div>

      {message && (
        <div style={{
          padding: '10px',
          marginBottom: '20px',
          backgroundColor: message.includes('✅') ? '#d4edda' : '#f8d7da',
          border: `1px solid ${message.includes('✅') ? '#c3e6cb' : '#f5c6cb'}`,
          borderRadius: '5px',
        }}>
          {message}
        </div>
      )}

      {empresas.length > 0 && (
        <div>
          <h3>📋 Empresas ({empresas.length}):</h3>
          {empresas.map((empresa) => (
            <div
              key={empresa.id}
              style={{
                padding: '10px',
                marginBottom: '10px',
                backgroundColor: '#f8f9fa',
                border: '1px solid #dee2e6',
                borderRadius: '5px',
              }}
            >
              <strong>{empresa.nombre}</strong> - NIT: {empresa.nit}
              <br />
              <small style={{ color: '#666' }}>ID: {empresa.id}</small>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}