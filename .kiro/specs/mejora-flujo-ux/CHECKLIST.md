# Checklist de Implementación - Mejora de Flujo UX

## 📊 Progreso General

- [ ] **FASE 1:** Componentes Base (0/4 tareas)
- [ ] **FASE 2:** Navegación (0/5 tareas)
- [ ] **FASE 3:** Funcionalidades Avanzadas (0/6 tareas)
- [ ] **FASE 4:** Reorganización (0/2 tareas)
- [ ] **FASE 5:** Optimizaciones (0/4 tareas)

**Total:** 0/21 tareas completadas (0%)

---

## 🔴 FASE 1: Componentes Base (Prioridad CRÍTICA)

### Task 1.1: ClienteCard con información relevante
- [ ] Crear archivo `src/components/Clientes/ClienteCard.tsx`
- [ ] Implementar función `calcularEstadoCliente()`
- [ ] Mostrar badge de estado (AL DÍA, MORA, SIN CRÉDITOS)
- [ ] Mostrar saldo pendiente total
- [ ] Mostrar fecha último pago
- [ ] Agregar estilos responsive
- [ ] Agregar click handler
- [ ] ✅ **Task 1.1 COMPLETADA**

### Task 1.2: Validación de documento duplicado
- [ ] Agregar `validarDocumentoDuplicado()` en `src/lib/validators.ts`
- [ ] Crear hook `useDebounce()`
- [ ] Agregar estado `documentoDuplicado` en ClienteForm
- [ ] Agregar estado `validandoDocumento` en ClienteForm
- [ ] Implementar useEffect para validar onChange
- [ ] Mostrar advertencia cuando hay duplicado
- [ ] Deshabilitar botón "Guardar" cuando hay duplicado
- [ ] Agregar botón "Ver Cliente Existente"
- [ ] Agregar indicador de carga
- [ ] ✅ **Task 1.2 COMPLETADA**

### Task 1.3: Componente GPSCapture mejorado
- [ ] Crear archivo `src/components/Common/GPSCapture.tsx`
- [ ] Implementar `detectarPlataforma()`
- [ ] Implementar `obtenerInstruccionesGPS()`
- [ ] Agregar mensaje explicativo
- [ ] Manejar permisos denegados
- [ ] Mostrar instrucciones por plataforma
- [ ] Agregar indicador "⏳ Capturando..."
- [ ] Agregar botón "🔄 Reintentar"
- [ ] Mostrar coordenadas al capturar
- [ ] Diferenciar "Capturar" vs "Actualizar"
- [ ] ✅ **Task 1.3 COMPLETADA**

### Task 1.4: Integrar GPSCapture en ClienteForm
- [ ] Importar GPSCapture en ClienteForm
- [ ] Reemplazar botón antiguo con GPSCapture
- [ ] Pasar props correctas
- [ ] Eliminar código antiguo
- [ ] ✅ **Task 1.4 COMPLETADA**

---

## 🟡 FASE 2: Navegación (Prioridad CRÍTICA/ALTA)

### Task 2.1: ClientesView orquestador
- [ ] Crear archivo `src/components/Clientes/ClientesView.tsx`
- [ ] Definir tipo `VistaClientesEstado`
- [ ] Implementar estado `vistaEstado`
- [ ] Implementar `handleCrearNuevo()`
- [ ] Implementar `handleVerDetalle()`
- [ ] Implementar `handleEditarCliente()`
- [ ] Implementar `handleVerHistorial()`
- [ ] Implementar `handleOtorgarCredito()`
- [ ] Implementar `handleVolverLista()`
- [ ] Renderizar componente según estado
- [ ] ✅ **Task 2.1 COMPLETADA**

### Task 2.2: Refactorizar ClientesList
- [ ] Eliminar formulario de ClientesList
- [ ] Eliminar estado `mostrarFormulario`
- [ ] Usar ClienteCard en lugar de tarjetas inline
- [ ] Agregar prop `onCrearNuevo`
- [ ] Agregar prop `onVerDetalle`
- [ ] Eliminar botón "Otorgar Crédito" de tarjetas
- [ ] Simplificar lógica
- [ ] ✅ **Task 2.2 COMPLETADA**

### Task 2.3: Modificar ClienteForm
- [ ] Agregar prop `modo: 'crear' | 'editar'`
- [ ] Agregar prop `onSuccess(clienteId, accion)`
- [ ] Agregar prop `onCancel()`
- [ ] Eliminar lógica de mostrar/ocultar lista
- [ ] Emitir eventos en lugar de estado local
- [ ] ✅ **Task 2.3 COMPLETADA**

### Task 2.4: Navegación Cliente → Crédito
- [ ] Modificar botón en ClienteDetail
- [ ] Agregar prop `onOtorgarCredito`
- [ ] Emitir evento al hacer click
- [ ] Manejar evento en ClientesView
- [ ] Cambiar estado a OTORGAR_CREDITO
- [ ] Validar cliente antes de cambiar
- [ ] Mostrar mensaje si no puede
- [ ] ✅ **Task 2.4 COMPLETADA**

### Task 2.5: Actualizar App.tsx
- [ ] Importar ClientesView
- [ ] Reemplazar ClientesList con ClientesView
- [ ] Verificar navegación
- [ ] ✅ **Task 2.5 COMPLETADA**

---

## 🟢 FASE 3: Funcionalidades Avanzadas (Prioridad ALTA/MEDIA)

### Task 3.1: Botón "Guardar y Otorgar Crédito"
- [ ] Agregar botón en ClienteForm
- [ ] Implementar `handleGuardarYOtorgarCredito()`
- [ ] Validar cliente antes de guardar
- [ ] Guardar cliente
- [ ] Emitir evento con acción 'guardarYCredito'
- [ ] Mostrar mensaje si no puede
- [ ] ✅ **Task 3.1 COMPLETADA**

### Task 3.2: Crear CreditoFormInline
- [ ] Crear archivo `src/components/Creditos/CreditoFormInline.tsx`
- [ ] Copiar lógica de CreditoForm (pasos 2 y 3)
- [ ] Eliminar paso 1
- [ ] Recibir `clienteId` como prop
- [ ] Pre-cargar datos del cliente
- [ ] Implementar prop `onSuccess`
- [ ] Implementar prop `onCancel`
- [ ] Ajustar diseño compacto
- [ ] ✅ **Task 3.2 COMPLETADA**

### Task 3.3: Integrar CreditoFormInline
- [ ] Importar en ClientesView
- [ ] Renderizar cuando estado OTORGAR_CREDITO
- [ ] Pasar clienteId correcto
- [ ] Manejar onSuccess
- [ ] Manejar onCancel
- [ ] ✅ **Task 3.3 COMPLETADA**

### Task 3.4: Crear ClienteHistorial
- [ ] Crear archivo `src/components/Clientes/ClienteHistorial.tsx`
- [ ] Cargar todos los créditos del cliente
- [ ] Implementar filtros por estado
- [ ] Implementar ordenamiento por fecha
- [ ] Mostrar badges de estado
- [ ] Implementar detalle expandible
- [ ] Agregar botón "← Volver"
- [ ] Agregar estilos responsive
- [ ] ✅ **Task 3.4 COMPLETADA**

### Task 3.5: Integrar ClienteHistorial
- [ ] Modificar botón en ClienteDetail
- [ ] Agregar prop `onVerHistorial`
- [ ] Emitir evento al hacer click
- [ ] Manejar evento en ClientesView
- [ ] Cambiar estado a HISTORIAL
- [ ] Renderizar ClienteHistorial
- [ ] ✅ **Task 3.5 COMPLETADA**

### Task 3.6: Edición de datos
- [ ] Modificar ClienteForm para modo 'editar'
- [ ] Pre-llenar formulario
- [ ] Deshabilitar campo documento
- [ ] Agregar botón "📍 Actualizar GPS"
- [ ] Modificar botón en ClienteDetail
- [ ] Agregar prop `onEditarDatos`
- [ ] Manejar evento en ClientesView
- [ ] Cambiar estado a EDITAR
- [ ] ✅ **Task 3.6 COMPLETADA**

---

## 🔵 FASE 4: Reorganización (Prioridad MEDIA)

### Task 4.1: Crear CreditosResumen
- [ ] Crear archivo `src/components/Creditos/CreditosResumen.tsx`
- [ ] Cargar todos los créditos
- [ ] Calcular estadísticas globales
- [ ] Mostrar estadísticas en cards
- [ ] Implementar lista de créditos
- [ ] Implementar filtros
- [ ] Implementar ordenamiento
- [ ] Agregar click handler
- [ ] Agregar estilos responsive
- [ ] ✅ **Task 4.1 COMPLETADA**

### Task 4.2: Actualizar App.tsx para CreditosResumen
- [ ] Importar CreditosResumen
- [ ] Reemplazar CreditoForm con CreditosResumen
- [ ] Verificar navegación
- [ ] Verificar click en crédito
- [ ] ✅ **Task 4.2 COMPLETADA**

---

## ⚪ FASE 5: Optimizaciones (Prioridad BAJA)

### Task 5.1: Cache de estados
- [ ] Crear archivo `src/lib/clienteUtils.ts`
- [ ] Implementar Map para cache
- [ ] Implementar `obtenerEstadoCliente()` con cache
- [ ] Implementar TTL de 1 minuto
- [ ] Implementar `invalidarCacheCliente()`
- [ ] Usar en ClienteCard
- [ ] ✅ **Task 5.1 COMPLETADA**

### Task 5.2: Loading states
- [ ] Agregar spinners durante carga
- [ ] Agregar skeleton screens
- [ ] Agregar estados en botones
- [ ] Agregar feedback visual
- [ ] ✅ **Task 5.2 COMPLETADA**

### Task 5.3: Animaciones
- [ ] Agregar transiciones entre estados
- [ ] Agregar animaciones en tarjetas
- [ ] Agregar animaciones en modales
- [ ] Agregar animaciones en mensajes
- [ ] ✅ **Task 5.3 COMPLETADA**

### Task 5.4: Testing manual
- [ ] Probar flujo Crear Cliente + Crédito
- [ ] Probar validación duplicados
- [ ] Probar navegación entre estados
- [ ] Probar edición de datos
- [ ] Probar historial completo
- [ ] Probar vista resumen créditos
- [ ] Probar en móvil iOS
- [ ] Probar en móvil Android
- [ ] Probar GPS en diferentes escenarios
- [ ] Documentar bugs
- [ ] ✅ **Task 5.4 COMPLETADA**

---

## 🎯 Validación de Requirements

### Requirement 1: Formulario Sin Distracciones
- [ ] Lista se oculta al crear nuevo cliente
- [ ] Solo formulario y botón "Cancelar" visibles
- [ ] Lista se muestra al cancelar
- [ ] Lista actualizada después de guardar
- [ ] ✅ **Req 1 VALIDADO**

### Requirement 2: Validación Documento Duplicado
- [ ] Verificación en tiempo real funciona
- [ ] Advertencia visible con nombre existente
- [ ] Botón "Guardar" deshabilitado cuando duplicado
- [ ] Botón "Ver Cliente Existente" funcional
- [ ] Advertencia se oculta cuando documento válido
- [ ] ✅ **Req 2 VALIDADO**

### Requirement 3: Botón "Guardar y Otorgar Crédito"
- [ ] Dos botones visibles cuando formulario válido
- [ ] Cliente se guarda correctamente
- [ ] Navega a formulario de crédito
- [ ] Cliente pre-seleccionado
- [ ] Validación antes de navegar
- [ ] ✅ **Req 3 VALIDADO**

### Requirement 4: Información en Tarjeta
- [ ] Nombre, documento, teléfono visibles
- [ ] Badge de estado correcto
- [ ] Saldo pendiente visible
- [ ] Fecha último pago visible
- [ ] "Sin créditos activos" cuando aplica
- [ ] Click navega a detalle
- [ ] ✅ **Req 4 VALIDADO**

### Requirement 5: Navegación Cliente → Crédito
- [ ] Botón prominente en detalle
- [ ] Validación antes de navegar
- [ ] Navega con cliente pre-seleccionado
- [ ] Mensaje claro si no puede
- [ ] Regresa a detalle después de otorgar
- [ ] ✅ **Req 5 VALIDADO**

### Requirement 6: Ver Historial Completo
- [ ] Vista modal/pantalla con historial
- [ ] Todos los créditos listados
- [ ] Información completa de cada crédito
- [ ] Badges correctos por estado
- [ ] Saldo y días atraso visibles
- [ ] Click muestra detalles completos
- [ ] ✅ **Req 6 VALIDADO**

### Requirement 7: Editar Datos
- [ ] Formulario pre-llenado
- [ ] Campos editables (excepto documento)
- [ ] Botón "Actualizar GPS" funcional
- [ ] Documento NO editable
- [ ] Cambios se guardan correctamente
- [ ] Vista actualizada después de guardar
- [ ] ✅ **Req 7 VALIDADO**

### Requirement 8: Reorganización Vista Créditos
- [ ] Lista de todos los créditos
- [ ] Estadísticas en parte superior
- [ ] Información completa por crédito
- [ ] Click navega a detalle del cliente
- [ ] Filtros funcionan correctamente
- [ ] Ordenamiento funciona correctamente
- [ ] ✅ **Req 8 VALIDADO**

### Requirement 9: Eliminar Botón de Tarjetas
- [ ] Tarjetas NO muestran botón "Otorgar Crédito"
- [ ] Usuario debe entrar a detalle primero
- [ ] Espacio usado para info adicional
- [ ] Click en tarjeta navega a detalle
- [ ] ✅ **Req 9 VALIDADO**

### Requirement 10: Mejora GPS
- [ ] Solicita permisos correctamente
- [ ] Mensaje explicativo visible
- [ ] Instrucciones por plataforma
- [ ] Indicador de carga visible
- [ ] Coordenadas visibles al capturar
- [ ] Botón "Reintentar" funcional
- [ ] Diferencia "Capturar" vs "Actualizar"
- [ ] ✅ **Req 10 VALIDADO**

---

## 📝 Notas de Implementación

### Archivos Creados:
- [ ] `src/components/Clientes/ClientesView.tsx`
- [ ] `src/components/Clientes/ClienteCard.tsx`
- [ ] `src/components/Clientes/ClienteHistorial.tsx`
- [ ] `src/components/Creditos/CreditoFormInline.tsx`
- [ ] `src/components/Creditos/CreditosResumen.tsx`
- [ ] `src/components/Common/GPSCapture.tsx`
- [ ] `src/lib/clienteUtils.ts`

### Archivos Modificados:
- [ ] `src/components/Clientes/ClientesList.tsx`
- [ ] `src/components/Clientes/ClienteForm.tsx`
- [ ] `src/components/Clientes/ClienteDetail.tsx`
- [ ] `src/lib/validators.ts`
- [ ] `src/App.tsx`

### Bugs Encontrados:
*(Documentar aquí cualquier bug encontrado durante implementación)*

---

## ✅ Criterios de Finalización

- [ ] Todas las tareas completadas
- [ ] Todos los requirements validados
- [ ] Testing manual completo en móvil
- [ ] No hay errores en consola
- [ ] Performance aceptable
- [ ] UX fluida y sin bugs
- [ ] Documentación actualizada

---

**Última actualización:** 2025-12-05  
**Estado:** ⏳ Pendiente de Implementación
