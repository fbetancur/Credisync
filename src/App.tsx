import { useState } from 'react';
import { Authenticator } from "@aws-amplify/ui-react";
import "@aws-amplify/ui-react/styles.css";
import { Amplify } from "aws-amplify";
import outputs from "../amplify_outputs.json";
import ClientesList from "./components/Clientes/ClientesList";
import CreditoForm from "./components/Creditos/CreditoForm";
import CobrosList from "./components/Cobros/CobrosList";
import RutasList from "./components/Rutas/RutasList";
import RutaDelDia from "./components/Rutas/RutaDelDia";
import ProductosList from "./components/Productos/ProductosList";
import CierreCaja from "./components/CierreCaja/CierreCaja";

Amplify.configure(outputs);

export default function App() {
  const [vistaActual, setVistaActual] = useState<'cobros' | 'productos' | 'clientes' | 'creditos' | 'rutas' | 'rutaDelDia' | 'cierreCaja'>('rutaDelDia');

  return (
    <Authenticator>
      {({ signOut, user }) => (
        <main style={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
          <div style={{ 
            position: 'sticky',
            top: 0,
            zIndex: 1000,
            padding: '10px 12px', 
            backgroundColor: '#6f42c1',
            color: 'white',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          }}>
            <div style={{ 
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '10px',
              gap: '8px',
            }}>
              <h1 style={{ 
                margin: 0, 
                fontSize: '16px', 
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                flex: '0 1 auto',
              }}>
                🏦 CrediSync360
              </h1>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px',
                flex: '0 0 auto',
              }}>
                <span style={{ 
                  fontSize: '11px', 
                  whiteSpace: 'nowrap', 
                  overflow: 'hidden', 
                  textOverflow: 'ellipsis', 
                  maxWidth: '120px',
                  display: 'none',
                }}>
                  {user?.signInDetails?.loginId}
                </span>
                <button 
                  onClick={signOut}
                  style={{ 
                    padding: '5px 10px', 
                    cursor: 'pointer',
                    backgroundColor: 'white',
                    color: '#6f42c1',
                    border: 'none',
                    borderRadius: '4px',
                    fontWeight: 'bold',
                    fontSize: '11px',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Salir
                </button>
              </div>
            </div>

            <div style={{ 
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(90px, 1fr))',
              gap: '6px',
            }}>
              <button
                onClick={() => setVistaActual('rutaDelDia')}
                style={{
                  padding: '6px 8px',
                  backgroundColor: vistaActual === 'rutaDelDia' ? 'white' : 'transparent',
                  color: vistaActual === 'rutaDelDia' ? '#6f42c1' : 'white',
                  border: vistaActual === 'rutaDelDia' ? 'none' : '1px solid white',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: '12px',
                  whiteSpace: 'nowrap',
                  textAlign: 'center',
                }}
              >
                🗺️ Mi Ruta
              </button>
              <button
                onClick={() => setVistaActual('cobros')}
                style={{
                  padding: '6px 8px',
                  backgroundColor: vistaActual === 'cobros' ? 'white' : 'transparent',
                  color: vistaActual === 'cobros' ? '#6f42c1' : 'white',
                  border: vistaActual === 'cobros' ? 'none' : '1px solid white',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: '12px',
                  whiteSpace: 'nowrap',
                  textAlign: 'center',
                }}
              >
                💵 Cobros
              </button>
              <button
                onClick={() => setVistaActual('cierreCaja')}
                style={{
                  padding: '6px 8px',
                  backgroundColor: vistaActual === 'cierreCaja' ? 'white' : 'transparent',
                  color: vistaActual === 'cierreCaja' ? '#6f42c1' : 'white',
                  border: vistaActual === 'cierreCaja' ? 'none' : '1px solid white',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: '12px',
                  whiteSpace: 'nowrap',
                  textAlign: 'center',
                }}
              >
                💰 Caja
              </button>
              <button
                onClick={() => setVistaActual('productos')}
                style={{
                  padding: '6px 8px',
                  backgroundColor: vistaActual === 'productos' ? 'white' : 'transparent',
                  color: vistaActual === 'productos' ? '#6f42c1' : 'white',
                  border: vistaActual === 'productos' ? 'none' : '1px solid white',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: '12px',
                  whiteSpace: 'nowrap',
                  textAlign: 'center',
                }}
              >
                📦 Productos
              </button>
              <button
                onClick={() => setVistaActual('rutas')}
                style={{
                  padding: '6px 8px',
                  backgroundColor: vistaActual === 'rutas' ? 'white' : 'transparent',
                  color: vistaActual === 'rutas' ? '#6f42c1' : 'white',
                  border: vistaActual === 'rutas' ? 'none' : '1px solid white',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: '12px',
                  whiteSpace: 'nowrap',
                  textAlign: 'center',
                }}
              >
                🗺️ Rutas
              </button>
              <button
                onClick={() => setVistaActual('clientes')}
                style={{
                  padding: '6px 8px',
                  backgroundColor: vistaActual === 'clientes' ? 'white' : 'transparent',
                  color: vistaActual === 'clientes' ? '#6f42c1' : 'white',
                  border: vistaActual === 'clientes' ? 'none' : '1px solid white',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: '12px',
                  whiteSpace: 'nowrap',
                  textAlign: 'center',
                }}
              >
                👥 Clientes
              </button>
              <button
                onClick={() => setVistaActual('creditos')}
                style={{
                  padding: '6px 8px',
                  backgroundColor: vistaActual === 'creditos' ? 'white' : 'transparent',
                  color: vistaActual === 'creditos' ? '#6f42c1' : 'white',
                  border: vistaActual === 'creditos' ? 'none' : '1px solid white',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: '12px',
                  whiteSpace: 'nowrap',
                  textAlign: 'center',
                }}
              >
                💳 Créditos
              </button>
            </div>
          </div>
          
          <div style={{ padding: '12px' }}>
            {vistaActual === 'rutaDelDia' && <RutaDelDia />}
            {vistaActual === 'cobros' && <CobrosList />}
            {vistaActual === 'cierreCaja' && <CierreCaja />}
            {vistaActual === 'productos' && <ProductosList />}
            {vistaActual === 'rutas' && <RutasList />}
            {vistaActual === 'clientes' && <ClientesList />}
            {vistaActual === 'creditos' && <CreditoForm />}
          </div>
        </main>
      )}
    </Authenticator>
  );
}