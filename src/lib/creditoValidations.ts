import { db } from './db';

/**
 * Validaciones inteligentes para otorgar créditos
 */

export interface ValidacionCredito {
  permitido: boolean;
  mensaje?: string;
  advertencia?: string;
  creditosActivos?: any[];
  historial?: {
    totalCreditos: number;
    creditosPagados: number;
    creditosConMora: number;
    ultimoCredito?: any;
  };
}

/**
 * Valida si un cliente puede recibir un nuevo crédito
 */
export async function validarNuevoCredito(clienteId: string): Promise<ValidacionCredito> {
  try {
    // Obtener cliente
    const cliente = await db.clientes.get(clienteId);
    
    if (!cliente) {
      return {
        permitido: false,
        mensaje: '❌ Cliente no encontrado',
      };
    }

    // Verificar estado del cliente
    if (cliente.estado === 'VETADO') {
      return {
        permitido: false,
        mensaje: '🚫 Cliente vetado. No puede recibir créditos.',
      };
    }

    if (cliente.estado === 'INACTIVO') {
      return {
        permitido: false,
        mensaje: '⚠️ Cliente inactivo. Actívalo primero.',
      };
    }

    // Obtener créditos activos
    const creditosActivos = await db.creditos
      .filter(c => c.clienteId === clienteId && c.estado === 'ACTIVO')
      .toArray();

    // Verificar mora
    const tieneMora = creditosActivos.some(c => (c.diasAtraso || 0) > 0);
    if (tieneMora) {
      const creditoConMora = creditosActivos.find(c => (c.diasAtraso || 0) > 0);
      return {
        permitido: false,
        mensaje: `⚠️ Cliente tiene ${creditoConMora?.diasAtraso} día(s) de atraso. Debe ponerse al día primero.`,
        creditosActivos,
      };
    }

    // Política: Máximo 2 créditos activos simultáneos
    if (creditosActivos.length >= 2) {
      return {
        permitido: false,
        mensaje: '⚠️ Cliente ya tiene el máximo de créditos activos (2).',
        creditosActivos,
      };
    }

    // Obtener historial completo
    const todosCreditos = await db.creditos
      .filter(c => c.clienteId === clienteId)
      .toArray();

    const creditosPagados = todosCreditos.filter(c => c.estado === 'CANCELADO').length;
    const creditosConMora = todosCreditos.filter(c => c.estado === 'CASTIGADO').length;
    
    // Ordenar por fecha para obtener el último
    const ultimoCredito = todosCreditos
      .sort((a, b) => new Date(b.fechaDesembolso).getTime() - new Date(a.fechaDesembolso).getTime())[0];

    const historial = {
      totalCreditos: todosCreditos.length,
      creditosPagados,
      creditosConMora,
      ultimoCredito,
    };

    // Cliente nuevo (sin historial)
    if (todosCreditos.length === 0) {
      return {
        permitido: true,
        advertencia: '💡 Cliente nuevo sin historial crediticio.',
        creditosActivos: [],
        historial,
      };
    }

    // Cliente con historial de mora
    if (creditosConMora > 0) {
      return {
        permitido: true,
        advertencia: `⚠️ Cliente tiene ${creditosConMora} crédito(s) castigado(s) en su historial.`,
        creditosActivos,
        historial,
      };
    }

    // Cliente con buen historial
    if (creditosPagados >= 3 && creditosConMora === 0) {
      return {
        permitido: true,
        advertencia: `✅ Cliente confiable: ${creditosPagados} crédito(s) pagado(s) sin mora.`,
        creditosActivos,
        historial,
      };
    }

    // Cliente normal
    return {
      permitido: true,
      creditosActivos,
      historial,
    };

  } catch (error: any) {
    return {
      permitido: false,
      mensaje: `❌ Error al validar: ${error.message}`,
    };
  }
}

/**
 * Verifica si un crédito está listo para renovación
 */
export async function verificarRenovacion(creditoId: string): Promise<{
  esRenovable: boolean;
  mensaje?: string;
  creditoAnterior?: any;
}> {
  try {
    const credito = await db.creditos.get(creditoId);
    
    if (!credito) {
      return { esRenovable: false, mensaje: 'Crédito no encontrado' };
    }

    // Solo se puede renovar si está cancelado (pagado completamente)
    if (credito.estado !== 'CANCELADO') {
      return { esRenovable: false, mensaje: 'El crédito debe estar completamente pagado' };
    }

    // Verificar que no tenga otros créditos activos
    const creditosActivos = await db.creditos
      .filter(c => c.clienteId === credito.clienteId && c.estado === 'ACTIVO')
      .toArray();

    if (creditosActivos.length > 0) {
      return { esRenovable: false, mensaje: 'Cliente ya tiene créditos activos' };
    }

    return {
      esRenovable: true,
      creditoAnterior: credito,
    };

  } catch (error: any) {
    return { esRenovable: false, mensaje: error.message };
  }
}

/**
 * Calcula el monto sugerido para renovación
 */
export function calcularMontoSugerido(creditoAnterior: any): {
  montoMinimo: number;
  montoSugerido: number;
  montoMaximo: number;
} {
  const montoAnterior = creditoAnterior.montoOriginal;

  return {
    montoMinimo: Math.round(montoAnterior * 0.8), // 80% del anterior
    montoSugerido: montoAnterior, // Mismo monto
    montoMaximo: Math.round(montoAnterior * 1.5), // 150% del anterior
  };
}
