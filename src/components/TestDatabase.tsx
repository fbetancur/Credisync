//src/components/TestDatabase.tsx
import { useState } from 'react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';

const client = generateClient<Schema>();

export default function TestDatabase() {
  const [nombre, setNombre] = useState('');
  const [nit, setNit] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [empresas, setEmpresas] = useState<any[]>([]);

  // Crear empresa
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
      } else {
        setMessage(`✅ Empresa creada: ${data?.nombre}`);
        setNombre('');
        setNit('');
        listarEmpresas(); // Refrescar lista
      }
    } catch (error: any) {
      setMessage(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Listar empresas
  const listarEmpresas = async () => {
    setLoading(true);
    try {
      const { data } = await client.models.Empresa.list();
      setEmpresas(data);
      setMessage(`✅ ${data.length} empresa(s) encontrada(s)`);
    } catch (error: any) {
      setMessage(`❌ Error al listar: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h2>🧪 Test de Base de Datos</h2>
      
      {/* Formulario */}
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
          }}
        >
          {loading ? '⏳ Creando...' : '✅ Crear Empresa'}
        </button>
      </div>

      {/* Botón listar */}
      <button
        onClick={listarEmpresas}
        disabled={loading}
        style={{
          padding: '10px 20px',
          backgroundColor: '#28a745',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: loading ? 'not-allowed' : 'pointer',
          fontSize: '16px',
          marginBottom: '20px',
        }}
      >
        {loading ? '⏳ Cargando...' : '📋 Listar Empresas'}
      </button>

      {/* Mensaje */}
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

      {/* Lista de empresas */}
      {empresas.length > 0 && (
        <div>
          <h3>📋 Empresas en la base de datos:</h3>
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
              <small>ID: {empresa.id}</small>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}