# Requirements Document - Mejora de Flujo UX y Navegación

## Introduction

Este documento define las mejoras de experiencia de usuario (UX) y flujo de navegación para CrediSync360, basado en feedback de uso real en dispositivos móviles. El objetivo es hacer la app más intuitiva, eficiente y reducir pasos innecesarios en los flujos principales.

## Glossary

- **Sistema**: CrediSync360, la aplicación de gestión de microcréditos
- **Usuario**: Cobrador/prestamista que usa la aplicación
- **Cliente**: Persona que recibe créditos
- **Tarjeta de Cliente**: Elemento visual en la lista que muestra información resumida del cliente
- **Vista de Detalle**: Pantalla completa con información detallada de un cliente
- **Flujo Principal**: Secuencia de acciones más común (Crear Cliente → Otorgar Crédito)
- **Documento**: Número de identificación único del cliente (cédula, DNI, etc.)

## Requirements

### Requirement 1: Formulario de Cliente Sin Distracciones

**User Story:** Como usuario, cuando estoy creando un nuevo cliente, quiero enfocarme solo en el formulario sin distracciones, para completar el registro más rápido y sin errores.

#### Acceptance Criteria

1. WHEN el usuario hace click en "➕ Nuevo Cliente" THEN el Sistema SHALL ocultar la lista de clientes y el buscador
2. WHEN el formulario de nuevo cliente está visible THEN el Sistema SHALL mostrar solo el formulario y el botón "❌ Cancelar"
3. WHEN el usuario hace click en "❌ Cancelar" THEN el Sistema SHALL mostrar nuevamente la lista de clientes y el buscador
4. WHEN el usuario guarda el cliente exitosamente THEN el Sistema SHALL mostrar la lista actualizada con el nuevo cliente

---

### Requirement 2: Validación de Documento Duplicado

**User Story:** Como usuario, cuando ingreso el documento de un cliente, quiero que el sistema me avise si ya existe, para evitar crear clientes duplicados.

#### Acceptance Criteria

1. WHEN el usuario ingresa un documento en el campo "Documento" THEN el Sistema SHALL verificar en tiempo real si ya existe un cliente con ese documento
2. WHEN existe un cliente con el mismo documento THEN el Sistema SHALL mostrar una advertencia visible con el nombre del cliente existente
3. WHEN existe un cliente duplicado THEN el Sistema SHALL deshabilitar el botón "Guardar Cliente"
4. WHEN existe un cliente duplicado THEN el Sistema SHALL ofrecer un botón "Ver Cliente Existente" que navegue al detalle de ese cliente
5. WHEN el usuario modifica el documento a uno no duplicado THEN el Sistema SHALL ocultar la advertencia y habilitar el botón "Guardar Cliente"

---

### Requirement 3: Botón "Guardar y Otorgar Crédito"

**User Story:** Como usuario, cuando creo un nuevo cliente, quiero poder otorgarle un crédito inmediatamente sin pasos adicionales, para agilizar el proceso de atención.

#### Acceptance Criteria

1. WHEN el formulario de nuevo cliente está completo y válido THEN el Sistema SHALL mostrar dos botones: "Guardar Cliente" y "Guardar y Otorgar Crédito"
2. WHEN el usuario hace click en "Guardar y Otorgar Crédito" THEN el Sistema SHALL guardar el cliente y navegar automáticamente al formulario de crédito
3. WHEN navega al formulario de crédito THEN el Sistema SHALL pre-seleccionar el cliente recién creado
4. WHEN el cliente se guarda con el botón "Guardar y Otorgar Crédito" THEN el Sistema SHALL validar que el cliente puede recibir crédito antes de navegar
5. WHEN el cliente no puede recibir crédito THEN el Sistema SHALL guardar el cliente pero mostrar un mensaje explicando por qué no puede recibir crédito

---

### Requirement 4: Información Relevante en Tarjeta de Cliente

**User Story:** Como usuario, cuando veo la lista de clientes, quiero ver información relevante de un vistazo (estado, saldo, último pago), para tomar decisiones rápidas sin entrar al detalle.

#### Acceptance Criteria

1. WHEN el Sistema muestra una tarjeta de cliente THEN el Sistema SHALL mostrar el nombre, documento y teléfono del cliente
2. WHEN el cliente tiene créditos activos THEN el Sistema SHALL mostrar un badge con el estado: "AL DÍA" (verde), "MORA" (rojo), o "SIN CRÉDITOS" (gris)
3. WHEN el cliente tiene créditos activos THEN el Sistema SHALL mostrar el saldo pendiente total en formato monetario
4. WHEN el cliente tiene créditos activos THEN el Sistema SHALL mostrar la fecha del último pago realizado
5. WHEN el cliente NO tiene créditos activos THEN el Sistema SHALL mostrar "Sin créditos activos" en lugar del saldo
6. WHEN el usuario hace click en cualquier parte de la tarjeta THEN el Sistema SHALL navegar a la vista de detalle del cliente

---

### Requirement 5: Navegación Directa Cliente → Crédito

**User Story:** Como usuario, cuando estoy viendo el detalle de un cliente y quiero otorgarle un crédito, quiero que el botón me lleve directamente al formulario con el cliente pre-seleccionado, para no tener que buscarlo nuevamente.

#### Acceptance Criteria

1. WHEN el usuario está en la vista de detalle de un cliente THEN el Sistema SHALL mostrar el botón "🎯 OTORGAR NUEVO CRÉDITO" de forma prominente
2. WHEN el usuario hace click en "🎯 OTORGAR NUEVO CRÉDITO" THEN el Sistema SHALL validar si el cliente puede recibir crédito
3. WHEN el cliente puede recibir crédito THEN el Sistema SHALL cambiar la vista activa a "Créditos" y pre-seleccionar el cliente
4. WHEN el cliente NO puede recibir crédito THEN el Sistema SHALL mostrar un mensaje explicando el motivo sin cambiar de vista
5. WHEN el usuario otorga el crédito exitosamente THEN el Sistema SHALL regresar automáticamente a la vista de detalle del cliente actualizada

---

### Requirement 6: Funcionalidad "Ver Historial Completo"

**User Story:** Como usuario, cuando estoy viendo el detalle de un cliente, quiero ver el historial completo de todos sus créditos (activos, pagados, castigados), para evaluar su comportamiento de pago.

#### Acceptance Criteria

1. WHEN el usuario hace click en "📋 Ver Historial Completo" THEN el Sistema SHALL mostrar una vista modal o nueva pantalla con el historial
2. WHEN se muestra el historial THEN el Sistema SHALL listar todos los créditos del cliente ordenados por fecha (más reciente primero)
3. WHEN se muestra cada crédito en el historial THEN el Sistema SHALL mostrar: monto original, total a pagar, fecha de desembolso, estado, cuotas pagadas/pendientes
4. WHEN el crédito está CANCELADO THEN el Sistema SHALL mostrar un badge verde con "✅ PAGADO"
5. WHEN el crédito está ACTIVO THEN el Sistema SHALL mostrar el saldo pendiente y días de atraso si aplica
6. WHEN el crédito está CASTIGADO THEN el Sistema SHALL mostrar un badge rojo con "⚠️ CASTIGADO"
7. WHEN el usuario hace click en un crédito del historial THEN el Sistema SHALL mostrar los detalles completos de ese crédito

---

### Requirement 7: Funcionalidad "Editar Datos"

**User Story:** Como usuario, cuando necesito actualizar la información de un cliente (teléfono, dirección, GPS), quiero poder editarla fácilmente, para mantener los datos actualizados.

#### Acceptance Criteria

1. WHEN el usuario hace click en "✏️ Editar Datos" THEN el Sistema SHALL mostrar un formulario pre-llenado con los datos actuales del cliente
2. WHEN el formulario de edición está visible THEN el Sistema SHALL permitir modificar: nombre, teléfono, dirección, barrio, referencia
3. WHEN el formulario de edición está visible THEN el Sistema SHALL mostrar un botón "📍 Actualizar Ubicación GPS"
4. WHEN el usuario hace click en "Actualizar Ubicación GPS" THEN el Sistema SHALL capturar la nueva ubicación y actualizar las coordenadas
5. WHEN el usuario guarda los cambios THEN el Sistema SHALL validar que el documento no se haya modificado (no es editable)
6. WHEN los cambios se guardan exitosamente THEN el Sistema SHALL actualizar la vista de detalle con los nuevos datos
7. WHEN el usuario hace click en "Cancelar" THEN el Sistema SHALL descartar los cambios y volver a la vista de detalle

---

### Requirement 8: Reorganización de Vista "Créditos"

**User Story:** Como usuario, cuando voy a la vista "Créditos" en el menú principal, quiero ver un resumen de todos los créditos del sistema (no crear uno nuevo), para tener una visión general del negocio.

#### Acceptance Criteria

1. WHEN el usuario navega a la vista "💳 Créditos" desde el menú THEN el Sistema SHALL mostrar una lista de todos los créditos del sistema
2. WHEN se muestra la lista de créditos THEN el Sistema SHALL mostrar estadísticas en la parte superior: Total prestado, Total por cobrar, Créditos activos, Créditos en mora
3. WHEN se muestra cada crédito THEN el Sistema SHALL mostrar: nombre del cliente, monto, saldo pendiente, estado, días de atraso
4. WHEN el usuario hace click en un crédito THEN el Sistema SHALL navegar al detalle del cliente propietario de ese crédito
5. WHEN el usuario busca un crédito THEN el Sistema SHALL permitir filtrar por: estado (ACTIVO, CANCELADO, CASTIGADO), cliente, rango de fechas
6. WHEN el usuario ordena los créditos THEN el Sistema SHALL permitir ordenar por: fecha, monto, saldo pendiente, días de atraso

---

### Requirement 9: Eliminación de Botón "Otorgar Crédito" de Tarjetas

**User Story:** Como usuario, cuando veo la lista de clientes, quiero que las tarjetas muestren información útil en lugar de un botón, para tomar decisiones informadas antes de entrar al detalle.

#### Acceptance Criteria

1. WHEN el Sistema muestra una tarjeta de cliente THEN el Sistema SHALL NO mostrar el botón "💰 Otorgar Crédito"
2. WHEN el usuario quiere otorgar un crédito THEN el Sistema SHALL requerir que el usuario entre al detalle del cliente primero
3. WHEN la tarjeta no tiene el botón THEN el Sistema SHALL usar ese espacio para mostrar información adicional del cliente
4. WHEN el usuario hace click en la tarjeta THEN el Sistema SHALL navegar al detalle donde SÍ está el botón de otorgar crédito

---

### Requirement 10: Mejora de Captura de GPS

**User Story:** Como usuario, cuando capturo la ubicación GPS de un cliente, quiero que el proceso sea claro y funcione consistentemente, para no perder tiempo intentando múltiples veces.

#### Acceptance Criteria

1. WHEN el usuario hace click en "📍 Capturar Ubicación" THEN el Sistema SHALL solicitar permisos de ubicación al navegador
2. WHEN el navegador solicita permisos THEN el Sistema SHALL mostrar un mensaje explicando por qué se necesita la ubicación
3. WHEN el usuario deniega los permisos THEN el Sistema SHALL mostrar instrucciones de cómo habilitar los permisos en la configuración del dispositivo
4. WHEN la captura está en progreso THEN el Sistema SHALL mostrar un indicador de carga con el texto "⏳ Capturando ubicación..."
5. WHEN la ubicación se captura exitosamente THEN el Sistema SHALL mostrar las coordenadas y un mapa pequeño (opcional)
6. WHEN la captura falla por timeout THEN el Sistema SHALL ofrecer un botón "🔄 Reintentar"
7. WHEN el usuario ya capturó GPS anteriormente THEN el Sistema SHALL mostrar un botón "📍 Actualizar Ubicación" en lugar de "Capturar"

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Unicidad de Documentos
*For any* intento de crear un cliente, si el documento ya existe en el sistema, entonces el sistema debe prevenir la creación y mostrar el cliente existente.
**Validates: Requirements 2.1, 2.2, 2.3**

### Property 2: Navegación Cliente-Crédito Consistente
*For any* cliente válido para crédito, cuando se hace click en "Otorgar Crédito", entonces el sistema debe navegar al formulario de crédito con ese cliente pre-seleccionado.
**Validates: Requirements 5.2, 5.3**

### Property 3: Visibilidad de Información Relevante
*For any* cliente con créditos activos, la tarjeta debe mostrar estado, saldo y último pago de forma visible.
**Validates: Requirements 4.2, 4.3, 4.4**

### Property 4: Historial Completo
*For any* cliente, el historial debe incluir todos los créditos (ACTIVO, CANCELADO, CASTIGADO) sin excepción.
**Validates: Requirements 6.2**

### Property 5: Edición Sin Duplicados
*For any* edición de cliente, el documento no debe ser modificable para prevenir duplicados.
**Validates: Requirements 7.5**

### Property 6: Vista Créditos es Solo Lectura
*For any* navegación a la vista "Créditos", no debe mostrar formulario de creación, solo lista de créditos existentes.
**Validates: Requirements 8.1**

---

## Priorización de Implementación

### 🔴 Prioridad CRÍTICA (Implementar primero):
1. Requirement 2: Validación de documento duplicado
2. Requirement 5: Navegación directa Cliente → Crédito
3. Requirement 4: Información relevante en tarjetas

### 🟡 Prioridad ALTA (Implementar después):
4. Requirement 1: Formulario sin distracciones
5. Requirement 3: Botón "Guardar y Otorgar Crédito"
6. Requirement 8: Reorganización vista Créditos

### 🟢 Prioridad MEDIA (Implementar al final):
7. Requirement 6: Ver Historial Completo
8. Requirement 7: Editar Datos
9. Requirement 9: Eliminar botón de tarjetas
10. Requirement 10: Mejora GPS

---

## Impacto Esperado

### Métricas de Éxito:

1. **Reducción de Tiempo**: Crear cliente + otorgar crédito debe tomar < 2 minutos
2. **Reducción de Errores**: 0 clientes duplicados
3. **Satisfacción**: Usuario puede completar flujo principal sin confusión
4. **Eficiencia**: 80% de los créditos se otorgan usando el flujo Cliente → Crédito

### Antes vs Después:

| Flujo | Antes | Después | Mejora |
|-------|-------|---------|--------|
| Crear cliente + crédito | 8 clicks, 3 pantallas | 5 clicks, 2 pantallas | -37% clicks |
| Ver estado de cliente | Entrar al detalle | Visible en tarjeta | Instantáneo |
| Evitar duplicados | Manual | Automático | 100% prevención |
| Otorgar crédito | Buscar cliente | Pre-seleccionado | -3 pasos |

---

**Fecha de Creación**: 2025-12-05
**Versión**: 1.0
**Estado**: Aprobado para Diseño

