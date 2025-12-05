import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getCurrentUser, fetchAuthSession } from 'aws-amplify/auth';

/**
 * Contexto de autenticación y datos del usuario
 */

interface Usuario {
  id: string;
  email: string;
  nombre: string;
  empresaId: string;
  rol: 'admin' | 'supervisor' | 'cobrador';
  rutaAsignadaId?: string;
}

interface AuthContextType {
  usuario: Usuario | null;
  loading: boolean;
  error: string | null;
  recargarUsuario: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cargarUsuario = async () => {
    try {
      setLoading(true);
      setError(null);

      // Obtener usuario autenticado de Cognito
      const currentUser = await getCurrentUser();
      const session = await fetchAuthSession();

      // TODO: Obtener datos completos del usuario desde la base de datos
      // Por ahora, usar datos de ejemplo
      const usuarioData: Usuario = {
        id: currentUser.userId,
        email: currentUser.signInDetails?.loginId || '',
        nombre: 'Usuario Demo', // TODO: Obtener del perfil
        empresaId: 'empresa-demo-001', // TODO: Obtener de la base de datos
        rol: 'cobrador', // TODO: Obtener del perfil
        rutaAsignadaId: undefined,
      };

      setUsuario(usuarioData);
    } catch (err: any) {
      console.error('Error cargando usuario:', err);
      setError(err.message);
      setUsuario(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarUsuario();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        usuario,
        loading,
        error,
        recargarUsuario: cargarUsuario,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Hook para acceder al contexto de autenticación
 */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return context;
};

/**
 * Hook simplificado para obtener IDs del usuario actual
 */
export const useCurrentUser = () => {
  const { usuario } = useAuth();

  return {
    usuarioId: usuario?.id || '',
    empresaId: usuario?.empresaId || '',
    email: usuario?.email || '',
    nombre: usuario?.nombre || '',
    rol: usuario?.rol || 'cobrador',
    rutaAsignadaId: usuario?.rutaAsignadaId,
  };
};
