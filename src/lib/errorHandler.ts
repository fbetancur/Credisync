/**
 * Sistema centralizado de manejo de errores
 */

export enum ErrorType {
  VALIDATION = 'VALIDATION',
  NETWORK = 'NETWORK',
  DATABASE = 'DATABASE',
  AUTH = 'AUTH',
  BUSINESS_LOGIC = 'BUSINESS_LOGIC',
  UNKNOWN = 'UNKNOWN',
}

export interface AppError {
  type: ErrorType;
  message: string;
  userMessage: string;
  originalError?: any;
  timestamp: Date;
  context?: any;
}

/**
 * Clase para errores de la aplicación
 */
export class ApplicationError extends Error {
  type: ErrorType;
  userMessage: string;
  context?: any;

  constructor(type: ErrorType, message: string, userMessage: string, context?: any) {
    super(message);
    this.name = 'ApplicationError';
    this.type = type;
    this.userMessage = userMessage;
    this.context = context;
  }
}

/**
 * Maneja errores y los convierte en mensajes amigables
 */
export const manejarError = (error: any, contexto?: string): AppError => {
  console.error(`Error en ${contexto}:`, error);

  // Error de validación
  if (error.name === 'ValidationError') {
    return {
      type: ErrorType.VALIDATION,
      message: error.message,
      userMessage: `❌ ${error.message}`,
      originalError: error,
      timestamp: new Date(),
      context: contexto,
    };
  }

  // Error de red
  if (error.name === 'NetworkError' || error.message?.includes('network') || error.message?.includes('fetch')) {
    return {
      type: ErrorType.NETWORK,
      message: error.message,
      userMessage: '❌ Error de conexión. Los datos se guardarán localmente y se sincronizarán cuando haya conexión.',
      originalError: error,
      timestamp: new Date(),
      context: contexto,
    };
  }

  // Error de base de datos
  if (error.name === 'DatabaseError' || error.message?.includes('Dexie') || error.message?.includes('IndexedDB')) {
    return {
      type: ErrorType.DATABASE,
      message: error.message,
      userMessage: '❌ Error al guardar los datos localmente. Por favor, intenta de nuevo.',
      originalError: error,
      timestamp: new Date(),
      context: contexto,
    };
  }

  // Error de autenticación
  if (error.name === 'AuthError' || error.message?.includes('auth') || error.message?.includes('unauthorized')) {
    return {
      type: ErrorType.AUTH,
      message: error.message,
      userMessage: '❌ Error de autenticación. Por favor, inicia sesión nuevamente.',
      originalError: error,
      timestamp: new Date(),
      context: contexto,
    };
  }

  // Error de lógica de negocio
  if (error instanceof ApplicationError) {
    return {
      type: error.type,
      message: error.message,
      userMessage: error.userMessage,
      originalError: error,
      timestamp: new Date(),
      context: contexto,
    };
  }

  // Error desconocido
  return {
    type: ErrorType.UNKNOWN,
    message: error.message || 'Error desconocido',
    userMessage: '❌ Ocurrió un error inesperado. Por favor, intenta de nuevo.',
    originalError: error,
    timestamp: new Date(),
    context: contexto,
  };
};

/**
 * Logger de errores (puede enviarse a un servicio externo)
 */
export const logError = async (error: AppError): Promise<void> => {
  // Guardar en localStorage para análisis posterior
  try {
    const errores = JSON.parse(localStorage.getItem('app_errors') || '[]');
    errores.push({
      ...error,
      timestamp: error.timestamp.toISOString(),
    });

    // Mantener solo los últimos 100 errores
    if (errores.length > 100) {
      errores.shift();
    }

    localStorage.setItem('app_errors', JSON.stringify(errores));
  } catch (e) {
    console.error('Error al guardar log:', e);
  }

  // TODO: Enviar a servicio de monitoreo (Sentry, CloudWatch, etc.)
  // await enviarAServicioMonitoreo(error);
};

/**
 * Hook para manejo de errores en componentes
 */
export const useErrorHandler = () => {
  const [error, setError] = useState<AppError | null>(null);

  const handleError = (err: any, contexto?: string) => {
    const appError = manejarError(err, contexto);
    setError(appError);
    logError(appError);
    
    // Limpiar error después de 5 segundos
    setTimeout(() => setError(null), 5000);
  };

  const clearError = () => setError(null);

  return { error, handleError, clearError };
};

/**
 * Wrapper para funciones async con manejo de errores
 */
export const conManejoDeErrores = async <T>(
  fn: () => Promise<T>,
  contexto: string,
  onError?: (error: AppError) => void
): Promise<T | null> => {
  try {
    return await fn();
  } catch (error) {
    const appError = manejarError(error, contexto);
    await logError(appError);
    
    if (onError) {
      onError(appError);
    }
    
    return null;
  }
};

// Importar useState para el hook
import { useState } from 'react';
