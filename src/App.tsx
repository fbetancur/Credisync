import { useEffect, useState } from "react";
import { Authenticator } from "@aws-amplify/ui-react";
import "@aws-amplify/ui-react/styles.css";
import { Amplify } from "aws-amplify";
import outputs from "../amplify_outputs.json";
import TestDatabase from "./components/TestDatabase";

Amplify.configure(outputs);

export default function App() {
  return (
    <Authenticator>
      {({ signOut, user }) => (
        <main>
          <div style={{ padding: '20px', textAlign: 'center', borderBottom: '1px solid #ccc' }}>
            <h1>🏦 CrediSync360</h1>
            <p>Usuario: {user?.signInDetails?.loginId}</p>
            <button onClick={signOut} style={{ padding: '8px 16px', cursor: 'pointer' }}>
              Cerrar Sesión
            </button>
          </div>
          
          <TestDatabase />
        </main>
      )}
    </Authenticator>
  );
}