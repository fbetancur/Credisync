/**
 * Sistema de resolución de conflictos para sincronización
 */

export enum ConflictStrategy {
  SERVER_WINS = 'SERVER_WINS', // El servidor siempre gana
  CLIENT_WINS = 'CLIENT_WINS', // El cliente siempre gana
  LAST_WRITE_WINS = 'LAST_WRITE_WINS', // Gana el último que escribió
  MERGE = 'MERGE', // Intentar fusionar cambios
  MANUAL = 'MANUAL', // Requiere intervención manual
}

export interface Conflict<T> {
  entidad: string;
  entidadId: string;
  local: T;
  remoto: T;
  strategy: ConflictStrategy;
}

/**
 * Resuelve conflictos entre datos locales y remotos
 */
export class ConflictResolver {
  /**
   * Detecta si hay conflicto entre dos versiones
   */
  detectarConflicto<T extends { updatedAt?: string }>(
    local: T,
    remoto: T
  ): boolean {
    if (!local.updatedAt || !remoto.updatedAt) {
      return false;
    }

    const localDate = new Date(local.updatedAt);
    const remotoDate = new Date(remoto.updatedAt);

    // Si las fechas son diferentes, hay conflicto potencial
    return Math.abs(localDate.getTime() - remotoDate.getTime()) > 1000; // 1 segundo de tolerancia
  }

  /**
   * Resuelve un conflicto según la estrategia
   */
  resolver<T extends { updatedAt?: string }>(
    conflict: Conflict<T>
  ): T {
    switch (conflict.strategy) {
      case ConflictStrategy.SERVER_WINS:
        return conflict.remoto;

      case ConflictStrategy.CLIENT_WINS:
        return conflict.local;

      case ConflictStrategy.LAST_WRITE_WINS:
        return this.lastWriteWins(conflict.local, conflict.remoto);

      case ConflictStrategy.MERGE:
        return this.merge(conflict.local, conflict.remoto);

      case ConflictStrategy.MANUAL:
        throw new Error('Conflicto requiere resolución manual');

      default:
        return conflict.remoto; // Por defecto, el servidor gana
    }
  }

  /**
   * Estrategia: Gana el último que escribió
   */
  private lastWriteWins<T extends { updatedAt?: string }>(
    local: T,
    remoto: T
  ): T {
    if (!local.updatedAt || !remoto.updatedAt) {
      return remoto;
    }

    const localDate = new Date(local.updatedAt);
    const remotoDate = new Date(remoto.updatedAt);

    return localDate > remotoDate ? local : remoto;
  }

  /**
   * Estrategia: Fusionar cambios (solo para campos no conflictivos)
   */
  private merge<T extends { updatedAt?: string }>(
    local: T,
    remoto: T
  ): T {
    // Crear objeto fusionado
    const merged = { ...remoto };

    // Iterar sobre campos locales
    for (const key in local) {
      const localValue = local[key];
      const remotoValue = remoto[key];

      // Si el valor local es diferente y no es undefined, usarlo
      if (localValue !== remotoValue && localValue !== undefined) {
        // Para campos numéricos (como saldos), usar el valor más reciente
        if (typeof localValue === 'number' && typeof remotoValue === 'number') {
          // Usar el valor del más reciente
          if (local.updatedAt && remoto.updatedAt) {
            const localDate = new Date(local.updatedAt);
            const remotoDate = new Date(remoto.updatedAt);
            merged[key] = localDate > remotoDate ? localValue : remotoValue;
          }
        }
        // Para strings, concatenar si son diferentes
        else if (typeof localValue === 'string' && typeof remotoValue === 'string') {
          if (key === 'observaciones' || key === 'notas') {
            // Concatenar observaciones
            merged[key] = `${remotoValue}\n[Local]: ${localValue}` as any;
          } else {
            // Para otros strings, usar el más reciente
            merged[key] = local.updatedAt && remoto.updatedAt &&
              new Date(local.updatedAt) > new Date(remoto.updatedAt)
              ? localValue
              : remotoValue;
          }
        }
      }
    }

    return merged;
  }

  /**
   * Determina la estrategia según el tipo de entidad
   */
  determinarEstrategia(entidad: string, campo?: string): ConflictStrategy {
    // Para pagos, el cliente siempre gana (datos capturados en campo)
    if (entidad === 'Pago') {
      return ConflictStrategy.CLIENT_WINS;
    }

    // Para cuotas, fusionar cambios
    if (entidad === 'Cuota') {
      return ConflictStrategy.MERGE;
    }

    // Para créditos, el servidor gana (datos críticos)
    if (entidad === 'Credito') {
      return ConflictStrategy.SERVER_WINS;
    }

    // Para clientes, fusionar cambios
    if (entidad === 'Cliente') {
      return ConflictStrategy.MERGE;
    }

    // Por defecto, el último que escribió gana
    return ConflictStrategy.LAST_WRITE_WINS;
  }
}

export const conflictResolver = new ConflictResolver();
