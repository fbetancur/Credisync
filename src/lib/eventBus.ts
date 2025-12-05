/**
 * Event Bus para sincronización de datos en tiempo real
 * Permite que componentes se suscriban a cambios en la base de datos
 */

type EventType = 
  | 'pago-registrado'
  | 'credito-creado'
  | 'credito-actualizado'
  | 'cuota-actualizada'
  | 'cliente-actualizado'
  | 'cliente-creado';

type EventCallback = (data: any) => void;

class EventBus {
  private listeners: Map<EventType, Set<EventCallback>> = new Map();

  /**
   * Suscribirse a un evento
   */
  on(event: EventType, callback: EventCallback): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    
    this.listeners.get(event)!.add(callback);
    
    // Retornar función para desuscribirse
    return () => {
      this.listeners.get(event)?.delete(callback);
    };
  }

  /**
   * Emitir un evento
   */
  emit(event: EventType, data?: any): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error en callback de evento ${event}:`, error);
        }
      });
    }
  }

  /**
   * Limpiar todos los listeners (útil para testing)
   */
  clear(): void {
    this.listeners.clear();
  }
}

// Instancia única (singleton)
export const eventBus = new EventBus();
