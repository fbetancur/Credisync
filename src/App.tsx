import { useState } from 'react';
import { Authenticator } from "@aws-amplify/ui-react";
import "@aws-amplify/ui-react/styles.css";
import { Amplify } from "aws-amplify";
import outputs from "../amplify_outputs.json";
import ClientesList from "./components/Clientes/ClientesList";
import CreditoForm from "./components/Creditos/CreditoForm";

Amplify.configure(outputs);

export default function App() {
  const [vistaActual, setVistaActual] = useState<'clientes' | 'creditos'>('clientes');

  return (
    <Authenticator>
      {({ signOut, user }) => (
        <main style={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
          {/* Header */}
          <div style={{ 
            padding: '15px 20px', 
            backgroundColor: '#6f42c1',
            color: 'white',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          }}>
            <div style={{ 
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '15px'
            }}>
              <h1 style={{ margin: 0, fontSize: '24px' }}>🏦 CrediSync360</h1>
              <div>
                <span style={{ marginRight: '15px', fontSize: '14px' }}>
                  {user?.signInDetails?.loginId}
                </span>
                <button 
                  onClick={signOut}
                  style={{ 
                    padding: '8px 16px', 
                    cursor: 'pointer',
                    backgroundColor: 'white',
                    color: '#6f42c1',
                    border: 'none',
                    borderRadius: '4px',
                    fontWeight: 'bold'
                  }}
                >
                  Cerrar Sesión
                </button>
              </div>
            </div>

            {/* Navegación */}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => setVistaActual('clientes')}
                style={{
                  padding: '10px 20px',
                  backgroundColor: vistaActual === 'clientes' ? 'white' : 'transparent',
                  color: vistaActual === 'clientes' ? '#6f42c1' : 'white',
                  border: vistaActual === 'clientes' ? 'none' : '1px solid white',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: '16px',
                }}
              >
                👥 Clientes
              </button>
              <button
                onClick={() => setVistaActual('creditos')}
                style={{
                  padding: '10px 20px',
                  backgroundColor: vistaActual === 'creditos' ? 'white' : 'transparent',
                  color: vistaActual === 'creditos' ? '#6f42c1' : 'white',
                  border: vistaActual === 'creditos' ? 'none' : '1px solid white',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: '16px',
                }}
              >
                💳 Créditos
              </button>
            </div>
          </div>
          
          {/* Contenido */}
          {vistaActual === 'clientes' && <ClientesList />}
          {vistaActual === 'creditos' && <CreditoForm />}
        </main>
      )}
    </Authenticator>
  );
}