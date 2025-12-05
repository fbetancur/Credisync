import { db, SyncQueue } from './db';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';

const client = generateClient<Schema>();

/**
 * Sistema de sincronización robusto con reintentos automáticos
 */
export class SyncManager {
  private isRunning = false;
  private maxRetries = 5;

  /**
   * Agrega una operación a la cola de sincronización
   */
  async addToQueue(
    entidad: SyncQueue['entidad'],
    operacion: SyncQueue['operacion'],
    entidadId: string,
    datos: any
  ): Promise<void> {
    const empresaId = datos.empresaId || 'empresa-demo-001';
    const usuarioId = 'usuario-actual'; // TODO: Obtener del contexto de auth

    await db.syncQueue.add({
      id: `sync-${Date.now()}-${Math.random()}`,
      empresaId,
      usuarioId,
      entidad,
      operacion,
      entidadId,
      datosJson: JSON.stringify(datos),
      timestamp: new Date().toISOString(),
      intentos: 0,
      sincronizado: false,
    });

    // Intentar sincronizar inmediatamente
    this.procesarCola();
  }

  /**
   * Procesa la cola de sincronización
   */
  async procesarCola(): Promise<void> {
    if (this.isRunning) return;
    if (!navigator.onLine) {
      console.log('Sin conexión, esperando...');
      return;
    }

    this.isRunning = true;

    try {
      const pendientes = await db.syncQueue
        .filter(item => !item.sincronizado && item.intentos < this.maxRetries)
        .toArray();

      console.log(`📤 Sincronizando ${pendientes.length} operaciones pendientes`);

      for (const item of pendientes) {
        try {
          await this.sincronizarItem(item);
          
          // Marcar como sincronizado
          await db.syncQueue.update(item.id, {
            sincronizado: true,
            sincronizadoAt: new Date().toISOString(),
          });

          // Actualizar la entidad local
          await this.actualizarEntidadLocal(item);

        } catch (error: any) {
          console.error(`Error sincronizando ${item.entidad}:`, error);
          
          // Incrementar intentos
          await db.syncQueue.update(item.id, {
            intentos: item.intentos + 1,
            ultimoIntento: new Date().toISOString(),
            error: error.message,
          });

          // Si alcanzó el máximo de reintentos, notificar
          if (item.intentos + 1 >= this.maxRetries) {
            console.error(`❌ Falló después de ${this.maxRetries} intentos:`, item);
            // TODO: Notificar al usuario o enviar a un log de errores
          }
        }
      }
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Sincroniza un item específico con AWS
   */
  private async sincronizarItem(item: SyncQueue): Promise<void> {
    const datos = JSON.parse(item.datosJson);

    switch (item.entidad) {
      case 'Cliente':
        if (item.operacion === 'CREATE') {
          // @ts-ignore
          await client.models.Cliente.create(datos);
        } else if (item.operacion === 'UPDATE') {
          // @ts-ignore
          await client.models.Cliente.update({ id: item.entidadId, ...datos });
        } else if (item.operacion === 'DELETE') {
          // @ts-ignore
          await client.models.Cliente.delete({ id: item.entidadId });
        }
        break;

      case 'Credito':
        if (item.operacion === 'CREATE') {
          // @ts-ignore
          await client.models.Credito.create(datos);
        } else if (item.operacion === 'UPDATE') {
          // @ts-ignore
          await client.models.Credito.update({ id: item.entidadId, ...datos });
        }
        break;

      case 'Cuota':
        if (item.operacion === 'CREATE') {
          // @ts-ignore
          await client.models.Cuota.create(datos);
        } else if (item.operacion === 'UPDATE') {
          // @ts-ignore
          await client.models.Cuota.update({ id: item.entidadId, ...datos });
        }
        break;

      case 'Pago':
        if (item.operacion === 'CREATE') {
          // @ts-ignore
          await client.models.Pago.create(datos);
        }
        break;

      case 'ProductoCredito':
        if (item.operacion === 'CREATE') {
          // @ts-ignore
          await client.models.ProductoCredito.create(datos);
        } else if (item.operacion === 'UPDATE') {
          // @ts-ignore
          await client.models.ProductoCredito.update({ id: item.entidadId, ...datos });
        }
        break;

      case 'Ruta':
        if (item.operacion === 'CREATE') {
          // @ts-ignore
          await client.models.Ruta.create(datos);
        } else if (item.operacion === 'UPDATE') {
          // @ts-ignore
          await client.models.Ruta.update({ id: item.entidadId, ...datos });
        }
        break;

      default:
        throw new Error(`Entidad no soportada: ${item.entidad}`);
    }
  }

  /**
   * Actualiza el estado de sincronización en la entidad local
   */
  private async actualizarEntidadLocal(item: SyncQueue): Promise<void> {
    const updateData = {
      _pendingSync: false,
      _lastSync: new Date().toISOString(),
    };

    switch (item.entidad) {
      case 'Cliente':
        await db.clientes.update(item.entidadId, updateData);
        break;
      case 'Credito':
        await db.creditos.update(item.entidadId, updateData);
        break;
      case 'Cuota':
        await db.cuotas.update(item.entidadId, updateData);
        break;
      case 'Pago':
        await db.pagos.update(item.entidadId, updateData);
        break;
      case 'ProductoCredito':
        await db.productos.update(item.entidadId, updateData);
        break;
      case 'Ruta':
        await db.rutas.update(item.entidadId, updateData);
        break;
    }
  }

  /**
   * Inicia el procesamiento automático de la cola
   */
  iniciarSincronizacionAutomatica(): void {
    // Procesar cada 30 segundos
    setInterval(() => {
      this.procesarCola();
    }, 30000);

    // Procesar cuando se recupera la conexión
    window.addEventListener('online', () => {
      console.log('✅ Conexión restaurada, sincronizando...');
      this.procesarCola();
    });

    // Procesar al cargar
    this.procesarCola();
  }

  /**
   * Obtiene estadísticas de sincronización
   */
  async obtenerEstadisticas(): Promise<{
    pendientes: number;
    fallidos: number;
    sincronizados: number;
  }> {
    const pendientes = await db.syncQueue
      .filter(item => !item.sincronizado && item.intentos < this.maxRetries)
      .count();

    const fallidos = await db.syncQueue
      .filter(item => !item.sincronizado && item.intentos >= this.maxRetries)
      .count();

    const sincronizados = await db.syncQueue
      .filter(item => item.sincronizado === true)
      .count();

    return { pendientes, fallidos, sincronizados };
  }
}

// Instancia singleton
export const syncManager = new SyncManager();
