import { db } from './db';

/**
 * Utilidades para manejo de clientes y cache de estados
 */

interface EstadoCliente {
  estado: 'AL_DIA' | 'MORA' | 'SIN_CREDITOS';
  color: string;
  icono: string;
  texto: string;
  saldoPendiente: number;
  fechaUltimoPago: string | null;
}

interface CacheEntry {
  estado: EstadoCliente;
  timestamp: number;
}

// Cache en memoria con TTL de 1 minuto
const estadosClienteCache = new Map<string, CacheEntry>();
const CACHE_TTL = 60000; // 1 minuto

/**
 * Obtener estado del cliente con cache
 */
export async function obtenerEstadoCliente(clienteId: string): Promise<EstadoCliente> {
  // Verificar cache
  const cached = estadosClienteCache.get(clienteId);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.estado;
  }

  // Calcular estado
  const estado = await calcularEstadoCliente(clienteId);
  
  // Guardar en cache
  estadosClienteCache.set(clienteId, {
    estado,
    timestamp: Date.now(),
  });

  return estado;
}

/**
 * Calcular estado del cliente desde IndexedDB
 */
async function calcularEstadoCliente(clienteId: string): Promise<EstadoCliente> {
  try {
    // Obtener créditos activos
    const creditosActivos = await db.creditos
      .filter(c => c.clienteId === clienteId && c.estado === 'ACTIVO')
      .toArray();

    if (creditosActivos.length === 0) {
      return {
        estado: 'SIN_CREDITOS',
        color: '#6c757d',
        icono: '💤',
        texto: 'SIN CRÉDITOS',
        saldoPendiente: 0,
        fechaUltimoPago: null,
      };
    }

    // Calcular saldo pendiente total
    const saldoPendiente = creditosActivos.reduce(
      (sum, credito) => sum + (credito.saldoPendiente || credito.totalAPagar),
      0
    );

    // Verificar si tiene mora
    const tieneMora = creditosActivos.some(c => (c.diasAtraso || 0) > 0);

    // Obtener fecha del último pago
    const pagos = await db.pagos
      .filter(p => p.clienteId === clienteId)
      .toArray();

    let fechaUltimoPago: string | null = null;
    if (pagos.length > 0) {
      pagos.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
      fechaUltimoPago = pagos[0].fecha;
    }

    if (tieneMora) {
      return {
        estado: 'MORA',
        color: '#dc3545',
        icono: '⚠️',
        texto: 'MORA',
        saldoPendiente,
        fechaUltimoPago,
      };
    }

    return {
      estado: 'AL_DIA',
      color: '#28a745',
      icono: '✅',
      texto: 'AL DÍA',
      saldoPendiente,
      fechaUltimoPago,
    };
  } catch (error) {
    console.error('Error calculando estado del cliente:', error);
    return {
      estado: 'SIN_CREDITOS',
      color: '#6c757d',
      icono: '💤',
      texto: 'SIN CRÉDITOS',
      saldoPendiente: 0,
      fechaUltimoPago: null,
    };
  }
}

/**
 * Invalidar cache de un cliente específico
 */
export function invalidarCacheCliente(clienteId: string): void {
  estadosClienteCache.delete(clienteId);
}

/**
 * Invalidar todo el cache
 */
export function invalidarTodoCache(): void {
  estadosClienteCache.clear();
}

/**
 * Obtener tamaño del cache (para debugging)
 */
export function obtenerTamanoCache(): number {
  return estadosClienteCache.size;
}
