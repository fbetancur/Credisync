# Sistema de Sincronización en Tiempo Real

## 🎯 Problema Resuelto

**Antes:** Cuando registrabas un pago en la vista "Cobros", los cambios NO se reflejaban en la vista "Detalle del Cliente" hasta recargar la página o volver a entrar.

**Ahora:** Los cambios se sincronizan automáticamente en tiempo real usando un Event Bus.

---

## 🏗️ Arquitectura

### Event Bus (`src/lib/eventBus.ts`)

Sistema de pub/sub (publicar/suscribir) que permite comunicación entre componentes sin acoplamiento directo.

```typescript
// Componente A emite un evento
eventBus.emit('pago-registrado', { clienteId: '123', monto: 5000 });

// Componente B escucha el evento
eventBus.on('pago-registrado', (data) => {
  console.log('Pago registrado:', data);
  recargarDatos();
});
```

---

## 📡 Eventos Disponibles

### 1. `pago-registrado`
**Emitido por:** `CobrosList.tsx`  
**Escuchado por:** `ClienteDetail.tsx`, `RutaDelDia.tsx`

**Datos:**
```typescript
{
  pagoId: string;
  creditoId: string;
  cuotaId: string;
  clienteId: string;
  monto: number;
}
```

**Cuándo se emite:** Después de registrar un pago exitosamente

---

### 2. `credito-creado`
**Emitido por:** `CreditoForm.tsx`  
**Escuchado por:** `ClienteDetail.tsx`, `ClientesList.tsx`

**Datos:**
```typescript
{
  creditoId: string;
  clienteId: string;
  monto: number;
  totalAPagar: number;
}
```

**Cuándo se emite:** Después de otorgar un crédito exitosamente

---

### 3. `credito-actualizado`
**Emitido por:** Cualquier componente que modifique un crédito  
**Escuchado por:** `ClienteDetail.tsx`

**Datos:**
```typescript
{
  creditoId: string;
  clienteId: string;
  cambios: object;
}
```

**Cuándo se emite:** Después de actualizar un crédito

---

### 4. `cuota-actualizada`
**Emitido por:** Componentes que modifican cuotas  
**Escuchado por:** `RutaDelDia.tsx`, `CobrosList.tsx`

**Datos:**
```typescript
{
  cuotaId: string;
  creditoId: string;
  clienteId: string;
  nuevoEstado: 'PENDIENTE' | 'PAGADA' | 'PARCIAL';
}
```

---

### 5. `cliente-actualizado`
**Emitido por:** `ClienteForm.tsx` (al editar)  
**Escuchado por:** `ClienteDetail.tsx`, `ClientesList.tsx`

**Datos:**
```typescript
{
  clienteId: string;
  cambios: object;
}
```

---

### 6. `cliente-creado`
**Emitido por:** `ClienteForm.tsx` (al crear)  
**Escuchado por:** `ClientesList.tsx`

**Datos:**
```typescript
{
  clienteId: string;
  nombre: string;
  documento: string;
}
```

---

## 🔧 Implementación

### Emitir un evento (Componente que hace cambios)

```typescript
import { eventBus } from '../../lib/eventBus';

// Después de guardar cambios en IndexedDB
await db.pagos.add(nuevoPago);
await db.cuotas.update(cuotaId, { estado: 'PAGADA' });
await db.creditos.update(creditoId, { saldoPendiente: nuevoSaldo });

// Emitir evento
eventBus.emit('pago-registrado', {
  pagoId: nuevoPago.id,
  creditoId,
  cuotaId,
  clienteId,
  monto: nuevoPago.monto,
});
```

---

### Escuchar un evento (Componente que necesita actualizarse)

```typescript
import { eventBus } from '../../lib/eventBus';
import { useEffect } from 'react';

useEffect(() => {
  // Suscribirse al evento
  const unsubscribe = eventBus.on('pago-registrado', (data) => {
    // Verificar si el evento es relevante para este componente
    if (data.clienteId === clienteId) {
      console.log('💰 Pago registrado, recargando datos...');
      cargarDatos(); // Recargar datos del componente
    }
  });

  // Cleanup: desuscribirse al desmontar el componente
  return () => {
    unsubscribe();
  };
}, [clienteId]); // Dependencias del useEffect
```

---

## ✅ Componentes Actualizados

### 1. `CobrosList.tsx`
**Cambios:**
- Importa `eventBus`
- Emite `pago-registrado` después de registrar un pago

**Código:**
```typescript
// Después de actualizar cuota y crédito
eventBus.emit('pago-registrado', {
  pagoId,
  creditoId: cuotaSeleccionada.creditoId,
  cuotaId: cuotaSeleccionada.id,
  clienteId: cuotaSeleccionada.clienteId,
  monto: montoNum,
});
```

---

### 2. `ClienteDetail.tsx`
**Cambios:**
- Importa `eventBus`
- Se suscribe a 3 eventos: `pago-registrado`, `credito-creado`, `credito-actualizado`
- Recarga datos automáticamente cuando detecta cambios

**Código:**
```typescript
useEffect(() => {
  cargarCliente();

  // Suscribirse a eventos
  const unsubscribePago = eventBus.on('pago-registrado', (data) => {
    if (data.clienteId === clienteId) {
      cargarCliente();
    }
  });

  const unsubscribeCredito = eventBus.on('credito-creado', (data) => {
    if (data.clienteId === clienteId) {
      cargarCliente();
    }
  });

  const unsubscribeCreditoActualizado = eventBus.on('credito-actualizado', (data) => {
    if (data.clienteId === clienteId) {
      cargarCliente();
    }
  });

  // Cleanup
  return () => {
    unsubscribePago();
    unsubscribeCredito();
    unsubscribeCreditoActualizado();
  };
}, [clienteId]);
```

---

### 3. `CreditoForm.tsx`
**Cambios:**
- Importa `eventBus`
- Emite `credito-creado` después de otorgar un crédito

**Código:**
```typescript
// Después de crear crédito y cuotas
eventBus.emit('credito-creado', {
  creditoId,
  clienteId: clienteSeleccionado.id,
  monto: montoNum,
  totalAPagar: Math.round(totalAPagar),
});
```

---

## 🚀 Beneficios

### 1. Sincronización Automática
- Los cambios se reflejan inmediatamente en todos los componentes
- No necesitas recargar la página
- No necesitas volver a entrar a una vista

### 2. Desacoplamiento
- Los componentes no necesitan conocerse entre sí
- Fácil agregar nuevos listeners sin modificar emisores
- Fácil agregar nuevos emisores sin modificar listeners

### 3. Performance
- Solo se recargan los componentes que necesitan actualizarse
- Solo se recargan cuando hay cambios relevantes
- Cleanup automático al desmontar componentes

### 4. Debugging
- Logs en consola cuando se recargan datos
- Fácil rastrear qué evento causó qué actualización

---

## 🔮 Próximos Pasos

### Eventos adicionales a implementar:

1. **`cliente-editado`** en `ClienteForm.tsx`
   - Para actualizar `ClientesList` y `ClienteDetail`

2. **`cuota-actualizada`** en `RutaDelDia.tsx`
   - Para actualizar `CobrosList` cuando se marca visitada

3. **`cierre-caja-completado`** en `CierreCaja.tsx`
   - Para actualizar estadísticas globales

4. **`credito-cancelado`** cuando se paga completamente
   - Para actualizar listas y estadísticas

---

## 📊 Flujo Completo de Ejemplo

### Escenario: Usuario registra un pago

```
1. Usuario en vista "Cobros"
   ↓
2. Click "Registrar Pago" en una cuota
   ↓
3. CobrosList.tsx:
   - Guarda pago en IndexedDB
   - Actualiza cuota (estado → PAGADA)
   - Actualiza crédito (saldoPendiente, cuotasPagadas)
   - Emite evento: eventBus.emit('pago-registrado', {...})
   ↓
4. ClienteDetail.tsx (si está abierto):
   - Escucha evento
   - Verifica: ¿Es mi cliente? → SÍ
   - Ejecuta: cargarCliente()
   - Recarga: créditos activos, historial, validación
   - UI se actualiza automáticamente
   ↓
5. Usuario ve cambios inmediatamente:
   - Saldo pendiente actualizado
   - Cuotas pagadas incrementadas
   - Estado del cliente actualizado (si aplica)
```

---

## 🐛 Debugging

### Ver eventos en consola:

```typescript
// En eventBus.ts, agregar logs:
emit(event: EventType, data?: any): void {
  console.log(`📡 Evento emitido: ${event}`, data);
  // ... resto del código
}
```

### Ver suscripciones activas:

```typescript
// En eventBus.ts, agregar método:
getListeners(): Map<EventType, Set<EventCallback>> {
  return this.listeners;
}

// En consola del navegador:
import { eventBus } from './lib/eventBus';
console.log(eventBus.getListeners());
```

---

## ⚠️ Consideraciones

### 1. Memory Leaks
**Problema:** Si no te desuscribes, los listeners se acumulan  
**Solución:** Siempre retornar cleanup en useEffect

```typescript
useEffect(() => {
  const unsubscribe = eventBus.on('evento', callback);
  return () => unsubscribe(); // ✅ IMPORTANTE
}, []);
```

### 2. Loops Infinitos
**Problema:** Componente A emite → B recarga → B emite → A recarga → ...  
**Solución:** Solo emitir después de cambios reales, no en cargas

```typescript
// ❌ MAL
const cargarDatos = async () => {
  const datos = await db.tabla.toArray();
  eventBus.emit('datos-cargados'); // ¡Loop infinito!
};

// ✅ BIEN
const guardarDatos = async (datos) => {
  await db.tabla.add(datos);
  eventBus.emit('datos-guardados'); // Solo después de cambios
};
```

### 3. Verificar Relevancia
**Problema:** Todos los componentes recargan en cada evento  
**Solución:** Verificar si el evento es relevante antes de recargar

```typescript
eventBus.on('pago-registrado', (data) => {
  if (data.clienteId === clienteId) { // ✅ Verificar primero
    cargarCliente();
  }
});
```

---

**Fecha de creación:** 2025-12-05  
**Versión:** 1.0  
**Estado:** ✅ Implementado y funcionando
