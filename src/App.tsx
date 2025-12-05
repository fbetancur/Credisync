import { Authenticator } from "@aws-amplify/ui-react";
import "@aws-amplify/ui-react/styles.css";
import { Amplify } from "aws-amplify";
import outputs from "../amplify_outputs.json";
import ClientesList from "./components/Clientes/ClientesList";

Amplify.configure(outputs);

export default function App() {
  return (
    <Authenticator>
      {({ signOut, user }) => (
        <main style={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
          <div style={{ 
            padding: '15px 20px', 
            backgroundColor: '#6f42c1',
            color: 'white',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
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
          
          <ClientesList />
        </main>
      )}
    </Authenticator>
  );
}