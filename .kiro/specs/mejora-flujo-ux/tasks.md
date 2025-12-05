# Tasks Document - Mejora de Flujo UX y Navegación

## Resumen de Implementación

**Total de tareas:** 28  
**Estimación total:** 12-16 horas  
**Prioridad:** Implementar en 4 fases según requirements

---

## FASE 1: Componentes Base (Prioridad CRÍTICA)

### Task 1.1: Crear ClienteCard con información relevante
**Requirement:** Req 4 - Información Relevante en Tarjeta de Cliente  
**Estimación:** 1.5 horas  
**Archivo:** `src/components/Clientes/ClienteCard.tsx` (NUEVO)

**Subtareas:**
1. Crear componente ClienteCard.tsx
2. Implementar función `calcularEstadoCliente(clienteId)`
3. Mostrar badge de estado (AL DÍA, MORA, SIN CRÉDITOS)
4. Mostrar saldo pendiente total
5. Mostrar fecha último pago
6. Agregar estilos responsive
7. Agregar click handler para navegar a detalle

**Criterios de aceptación:**
- ✅ Tarjeta muestra nombre, documento, teléfono
- ✅ Badge de estado con colores correctos
- ✅ Saldo pendiente formateado como moneda
- ✅ Fecha último pago visible si existe
- ✅ Click en tarjeta navega a detalle

**Dependencias:** Ninguna

---

### Task 1.2: Implementar validación de documento duplicado
**Requirement:** Req 2 - Validación de Documento Duplicado  
**Estimación:** 2 horas  
**Archivos:** 
- `src/lib/validators.ts` (MODIFICAR)
- `src/components/Clientes/ClienteForm.tsx` (MODIFICAR)

**Subtareas:**
1. Agregar función `validarDocumentoDuplicado()` en validators.ts
2. Crear hook `useDebounce()` para validación en tiempo real
3. Agregar estado `documentoDuplicado` en ClienteForm
4. Agregar estado `validandoDocumento` en ClienteForm
5. Implementar useEffect para validar en onChange
6. Mostrar advertencia cuando hay duplicado
7. Deshabilitar botón "Guardar" cuando hay duplicado
8. Agregar botón "Ver Cliente Existente"
9. Agregar indicador de carga durante validación

**Criterios de aceptación:**
- ✅ Validación se ejecuta 500ms después de dejar de escribir
- ✅ Advertencia visible con nombre del cliente existente
- ✅ Botón "Guardar" deshabilitado cuando hay duplicado
- ✅ Botón "Ver Cliente Existente" navega al detalle
- ✅ Validación no se ejecuta en modo editar para el mismo cliente

**Dependencias:** Ninguna

---

### Task 1.3: Mejorar componente de captura GPS
**Requirement:** Req 10 - Mejora de Captura de GPS  
**Estimación:** 2 horas  
**Archivo:** `src/components/Common/GPSCapture.tsx` (NUEVO)

**Subtareas:**
1. Crear componente GPSCapture.tsx
2. Implementar función `detectarPlataforma()`
3. Implementar función `obtenerInstruccionesGPS()`
4. Agregar mensaje explicativo antes de solicitar permisos
5. Manejar error de permisos denegados
6. Mostrar instrucciones específicas por plataforma
7. Agregar indicador de carga "⏳ Capturando ubicación..."
8. Agregar botón "🔄 Reintentar" en caso de timeout
9. Mostrar coordenadas cuando se captura exitosamente
10. Diferenciar entre "Capturar" y "Actualizar" ubicación

**Criterios de aceptación:**
- ✅ Mensaje explicativo visible antes de solicitar permisos
- ✅ Instrucciones específicas para iOS/Android/Desktop
- ✅ Botón "Reintentar" funcional después de timeout
- ✅ Coordenadas visibles después de captura exitosa
- ✅ Modo "Actualizar" muestra ubicación anterior

**Dependencias:** Ninguna

---

### Task 1.4: Integrar GPSCapture en ClienteForm
**Requirement:** Req 10 - Mejora de Captura de GPS  
**Estimación:** 0.5 horas  
**Archivo:** `src/components/Clientes/ClienteForm.tsx` (MODIFICAR)

**Subtareas:**
1. Importar GPSCapture
2. Reemplazar botón de captura GPS con componente GPSCapture
3. Pasar props correctas (ubicacion, onCapturar, modo)
4. Eliminar código antiguo de captura GPS

**Criterios de aceptación:**
- ✅ GPSCapture integrado correctamente
- ✅ Ubicación se guarda en formData
- ✅ Modo "capturar" en crear, "actualizar" en editar

**Dependencias:** Task 1.3

---

## FASE 2: Navegación y Orquestación (Prioridad CRÍTICA/ALTA)

### Task 2.1: Crear ClientesView orquestador
**Requirement:** Req 1, 5, 9 - Navegación y flujo  
**Estimación:** 2 horas  
**Archivo:** `src/components/Clientes/ClientesView.tsx` (NUEVO)

**Subtareas:**
1. Crear componente ClientesView.tsx
2. Definir tipo `VistaClientesEstado`
3. Implementar estado `vistaEstado`
4. Implementar handlers de navegación:
   - `handleCrearNuevo()`
   - `handleVerDetalle(clienteId)`
   - `handleEditarCliente(clienteId)`
   - `handleVerHistorial(clienteId)`
   - `handleOtorgarCredito(clienteId)`
   - `handleVolverLista()`
5. Renderizar componente correcto según estado
6. Pasar props correctas a cada componente hijo

**Criterios de aceptación:**
- ✅ Navegación entre estados funciona correctamente
- ✅ Estado se mantiene durante transiciones
- ✅ Props se pasan correctamente a componentes hijos

**Dependencias:** Ninguna

---

### Task 2.2: Refactorizar ClientesList para solo mostrar lista
**Requirement:** Req 1 - Formulario Sin Distracciones  
**Estimación:** 1 hora  
**Archivo:** `src/components/Clientes/ClientesList.tsx` (MODIFICAR)

**Subtareas:**
1. Eliminar formulario de creación de ClientesList
2. Eliminar estado `mostrarFormulario`
3. Cambiar a usar ClienteCard en lugar de tarjetas inline
4. Agregar prop `onCrearNuevo` para botón "➕ Nuevo Cliente"
5. Agregar prop `onVerDetalle` para click en tarjeta
6. Eliminar botón "Otorgar Crédito" de tarjetas
7. Simplificar lógica de renderizado

**Criterios de aceptación:**
- ✅ Lista solo muestra tarjetas, sin formulario
- ✅ Botón "➕ Nuevo Cliente" emite evento
- ✅ Click en tarjeta emite evento con clienteId
- ✅ No hay botón "Otorgar Crédito" en tarjetas

**Dependencias:** Task 1.1, Task 2.1

---

### Task 2.3: Modificar ClienteForm para ocultar lista
**Requirement:** Req 1 - Formulario Sin Distracciones  
**Estimación:** 0.5 horas  
**Archivo:** `src/components/Clientes/ClienteForm.tsx` (MODIFICAR)

**Subtareas:**
1. Agregar prop `modo: 'crear' | 'editar'`
2. Agregar prop `onSuccess(clienteId, accion)`
3. Agregar prop `onCancel()`
4. Eliminar lógica de mostrar/ocultar lista (ahora en ClientesView)
5. Emitir eventos en lugar de cambiar estado local

**Criterios de aceptación:**
- ✅ Formulario no controla visibilidad de lista
- ✅ Eventos se emiten correctamente
- ✅ Modo crear/editar funciona correctamente

**Dependencias:** Task 2.1

---

### Task 2.4: Implementar navegación Cliente → Crédito
**Requirement:** Req 5 - Navegación Directa Cliente → Crédito  
**Estimación:** 1.5 horas  
**Archivos:**
- `src/components/Clientes/ClienteDetail.tsx` (MODIFICAR)
- `src/components/Clientes/ClientesView.tsx` (MODIFICAR)

**Subtareas:**
1. Modificar botón "🎯 OTORGAR NUEVO CRÉDITO" en ClienteDetail
2. Agregar prop `onOtorgarCredito` en ClienteDetail
3. Emitir evento al hacer click
4. Manejar evento en ClientesView
5. Cambiar estado a OTORGAR_CREDITO
6. Validar cliente antes de cambiar estado
7. Mostrar mensaje si no puede recibir crédito

**Criterios de aceptación:**
- ✅ Botón funcional (no placeholder)
- ✅ Validación se ejecuta antes de navegar
- ✅ Mensaje claro si no puede recibir crédito
- ✅ Navegación exitosa si puede recibir crédito

**Dependencias:** Task 2.1

---

### Task 2.5: Actualizar App.tsx para usar ClientesView
**Requirement:** Arquitectura general  
**Estimación:** 0.5 horas  
**Archivo:** `src/App.tsx` (MODIFICAR)

**Subtareas:**
1. Importar ClientesView
2. Reemplazar `<ClientesList />` con `<ClientesView />`
3. Verificar que navegación funciona

**Criterios de aceptación:**
- ✅ Vista "Clientes" usa ClientesView
- ✅ Navegación entre vistas funciona

**Dependencias:** Task 2.1, Task 2.2

---

## FASE 3: Funcionalidades Avanzadas (Prioridad ALTA/MEDIA)

### Task 3.1: Implementar botón "Guardar y Otorgar Crédito"
**Requirement:** Req 3 - Botón "Guardar y Otorgar Crédito"  
**Estimación:** 1 hora  
**Archivo:** `src/components/Clientes/ClienteForm.tsx` (MODIFICAR)

**Subtareas:**
1. Agregar botón "Guardar y Otorgar Crédito"
2. Implementar handler `handleGuardarYOtorgarCredito()`
3. Validar cliente antes de guardar
4. Guardar cliente
5. Emitir evento con acción 'guardarYCredito'
6. Mostrar mensaje si no puede recibir crédito

**Criterios de aceptación:**
- ✅ Botón visible solo cuando formulario válido
- ✅ Validación se ejecuta antes de guardar
- ✅ Cliente se guarda correctamente
- ✅ Evento emitido con acción correcta
- ✅ Mensaje claro si no puede recibir crédito

**Dependencias:** Task 2.3

---

### Task 3.2: Crear CreditoFormInline
**Requirement:** Req 5 - Navegación Directa Cliente → Crédito  
**Estimación:** 2 horas  
**Archivo:** `src/components/Creditos/CreditoFormInline.tsx` (NUEVO)

**Subtareas:**
1. Crear componente CreditoFormInline.tsx
2. Copiar lógica de CreditoForm (pasos 2 y 3)
3. Eliminar paso 1 (selección de cliente)
4. Recibir `clienteId` como prop
5. Pre-cargar datos del cliente
6. Implementar prop `onSuccess`
7. Implementar prop `onCancel`
8. Ajustar diseño para ser más compacto

**Criterios de aceptación:**
- ✅ Cliente pre-seleccionado visible
- ✅ Formulario funciona igual que CreditoForm
- ✅ Eventos se emiten correctamente
- ✅ Diseño compacto y responsive

**Dependencias:** Task 2.4

---

### Task 3.3: Integrar CreditoFormInline en ClientesView
**Requirement:** Req 5 - Navegación Directa Cliente → Crédito  
**Estimación:** 0.5 horas  
**Archivo:** `src/components/Clientes/ClientesView.tsx` (MODIFICAR)

**Subtareas:**
1. Importar CreditoFormInline
2. Renderizar cuando estado es OTORGAR_CREDITO
3. Pasar clienteId correcto
4. Manejar onSuccess (volver a DETALLE)
5. Manejar onCancel (volver a DETALLE)

**Criterios de aceptación:**
- ✅ CreditoFormInline se muestra correctamente
- ✅ Cliente pre-seleccionado es correcto
- ✅ Vuelve a detalle después de otorgar crédito
- ✅ Vuelve a detalle al cancelar

**Dependencias:** Task 3.2

---

### Task 3.4: Crear ClienteHistorial
**Requirement:** Req 6 - Funcionalidad "Ver Historial Completo"  
**Estimación:** 2.5 horas  
**Archivo:** `src/components/Clientes/ClienteHistorial.tsx` (NUEVO)

**Subtareas:**
1. Crear componente ClienteHistorial.tsx
2. Cargar todos los créditos del cliente
3. Implementar filtros por estado
4. Implementar ordenamiento por fecha
5. Mostrar badges de estado (PAGADO, ACTIVO, CASTIGADO)
6. Implementar detalle expandible de cada crédito
7. Agregar botón "← Volver"
8. Agregar estilos responsive

**Criterios de aceptación:**
- ✅ Todos los créditos se muestran
- ✅ Filtros funcionan correctamente
- ✅ Ordenamiento funciona correctamente
- ✅ Badges con colores correctos
- ✅ Detalle expandible muestra info completa
- ✅ Botón volver funciona

**Dependencias:** Task 2.1

---

### Task 3.5: Integrar ClienteHistorial en ClientesView
**Requirement:** Req 6 - Funcionalidad "Ver Historial Completo"  
**Estimación:** 0.5 horas  
**Archivos:**
- `src/components/Clientes/ClienteDetail.tsx` (MODIFICAR)
- `src/components/Clientes/ClientesView.tsx` (MODIFICAR)

**Subtareas:**
1. Modificar botón "📋 Ver Historial Completo" en ClienteDetail
2. Agregar prop `onVerHistorial` en ClienteDetail
3. Emitir evento al hacer click
4. Manejar evento en ClientesView
5. Cambiar estado a HISTORIAL
6. Renderizar ClienteHistorial

**Criterios de aceptación:**
- ✅ Botón funcional (no placeholder)
- ✅ Navegación a historial funciona
- ✅ Volver a detalle funciona

**Dependencias:** Task 3.4

---

### Task 3.6: Implementar edición de datos de cliente
**Requirement:** Req 7 - Funcionalidad "Editar Datos"  
**Estimación:** 1.5 horas  
**Archivos:**
- `src/components/Clientes/ClienteForm.tsx` (MODIFICAR)
- `src/components/Clientes/ClienteDetail.tsx` (MODIFICAR)
- `src/components/Clientes/ClientesView.tsx` (MODIFICAR)

**Subtareas:**
1. Modificar ClienteForm para soportar modo 'editar'
2. Pre-llenar formulario con datos actuales
3. Deshabilitar campo documento en modo editar
4. Agregar botón "📍 Actualizar Ubicación GPS"
5. Modificar botón "✏️ Editar Datos" en ClienteDetail
6. Agregar prop `onEditarDatos` en ClienteDetail
7. Manejar evento en ClientesView
8. Cambiar estado a EDITAR

**Criterios de aceptación:**
- ✅ Formulario pre-llenado correctamente
- ✅ Documento no editable
- ✅ Botón "Actualizar GPS" funcional
- ✅ Cambios se guardan correctamente
- ✅ Vuelve a detalle después de guardar

**Dependencias:** Task 2.3

---

## FASE 4: Reorganización Vista Créditos (Prioridad MEDIA)

### Task 4.1: Crear CreditosResumen
**Requirement:** Req 8 - Reorganización de Vista "Créditos"  
**Estimación:** 3 horas  
**Archivo:** `src/components/Creditos/CreditosResumen.tsx` (NUEVO)

**Subtareas:**
1. Crear componente CreditosResumen.tsx
2. Cargar todos los créditos del sistema
3. Calcular estadísticas globales:
   - Total prestado
   - Total por cobrar
   - Créditos activos
   - Créditos en mora
4. Mostrar estadísticas en cards
5. Implementar lista de créditos
6. Implementar filtros (estado, cliente, rango fechas)
7. Implementar ordenamiento (fecha, monto, saldo, atraso)
8. Agregar click handler para navegar a ClienteDetail
9. Agregar estilos responsive

**Criterios de aceptación:**
- ✅ Estadísticas calculadas correctamente
- ✅ Lista de créditos completa
- ✅ Filtros funcionan correctamente
- ✅ Ordenamiento funciona correctamente
- ✅ Click navega a ClienteDetail del cliente

**Dependencias:** Ninguna

---

### Task 4.2: Actualizar App.tsx para usar CreditosResumen
**Requirement:** Req 8 - Reorganización de Vista "Créditos"  
**Estimación:** 0.5 horas  
**Archivo:** `src/App.tsx` (MODIFICAR)

**Subtareas:**
1. Importar CreditosResumen
2. Reemplazar `<CreditoForm />` con `<CreditosResumen />`
3. Verificar que navegación funciona
4. Verificar que click en crédito navega a cliente

**Criterios de aceptación:**
- ✅ Vista "Créditos" usa CreditosResumen
- ✅ Navegación a cliente funciona

**Dependencias:** Task 4.1

---

## FASE 5: Optimizaciones y Pulido

### Task 5.1: Implementar cache de estados de cliente
**Requirement:** Performance  
**Estimación:** 1 hora  
**Archivo:** `src/lib/clienteUtils.ts` (NUEVO)

**Subtareas:**
1. Crear archivo clienteUtils.ts
2. Implementar Map para cache
3. Implementar función `obtenerEstadoCliente()` con cache
4. Implementar TTL de 1 minuto
5. Implementar función `invalidarCacheCliente()`
6. Usar en ClienteCard

**Criterios de aceptación:**
- ✅ Cache funciona correctamente
- ✅ TTL se respeta
- ✅ Invalidación funciona
- ✅ Performance mejorada en listas grandes

**Dependencias:** Task 1.1

---

### Task 5.2: Agregar loading states
**Requirement:** UX  
**Estimación:** 1 hora  
**Archivos:** Todos los componentes

**Subtareas:**
1. Agregar spinners durante carga de datos
2. Agregar skeleton screens en listas
3. Agregar estados de carga en botones
4. Agregar feedback visual en acciones

**Criterios de aceptación:**
- ✅ Loading states visibles
- ✅ UX fluida durante cargas
- ✅ Feedback claro en acciones

**Dependencias:** Todas las anteriores

---

### Task 5.3: Agregar animaciones de transición
**Requirement:** UX  
**Estimación:** 1 hora  
**Archivos:** Componentes principales

**Subtareas:**
1. Agregar transiciones entre estados
2. Agregar animaciones en tarjetas
3. Agregar animaciones en modales
4. Agregar animaciones en mensajes

**Criterios de aceptación:**
- ✅ Transiciones suaves
- ✅ Animaciones no invasivas
- ✅ Performance no afectada

**Dependencias:** Todas las anteriores

---

### Task 5.4: Testing manual completo
**Requirement:** QA  
**Estimación:** 2 horas  
**Archivos:** Todos

**Subtareas:**
1. Probar flujo completo Crear Cliente + Crédito
2. Probar validación de duplicados
3. Probar navegación entre estados
4. Probar edición de datos
5. Probar historial completo
6. Probar vista resumen de créditos
7. Probar en móvil real (iOS y Android)
8. Probar GPS en diferentes escenarios
9. Documentar bugs encontrados

**Criterios de aceptación:**
- ✅ Todos los flujos funcionan
- ✅ No hay errores en consola
- ✅ UX fluida en móvil
- ✅ GPS funciona correctamente

**Dependencias:** Todas las anteriores

---

## Resumen por Fase

### FASE 1: Componentes Base
- **Tareas:** 4
- **Estimación:** 6 horas
- **Prioridad:** CRÍTICA

### FASE 2: Navegación
- **Tareas:** 5
- **Estimación:** 5.5 horas
- **Prioridad:** CRÍTICA/ALTA

### FASE 3: Funcionalidades Avanzadas
- **Tareas:** 6
- **Estimación:** 8.5 horas
- **Prioridad:** ALTA/MEDIA

### FASE 4: Reorganización
- **Tareas:** 2
- **Estimación:** 3.5 horas
- **Prioridad:** MEDIA

### FASE 5: Optimizaciones
- **Tareas:** 4
- **Estimación:** 5 horas
- **Prioridad:** BAJA

---

## Orden de Implementación Recomendado

1. **Día 1 (6h):** FASE 1 completa
2. **Día 2 (5.5h):** FASE 2 completa
3. **Día 3 (4h):** FASE 3 parcial (Tasks 3.1, 3.2, 3.3)
4. **Día 4 (4.5h):** FASE 3 resto (Tasks 3.4, 3.5, 3.6)
5. **Día 5 (3.5h):** FASE 4 completa
6. **Día 6 (5h):** FASE 5 completa

**Total:** 28.5 horas (~4-6 días de trabajo)

---

**Fecha de Creación**: 2025-12-05  
**Versión**: 1.0  
**Estado**: Listo para Implementación
