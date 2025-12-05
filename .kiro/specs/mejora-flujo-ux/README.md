# Spec: Mejora de Flujo UX y Navegación

## 📋 Resumen Ejecutivo

Este spec define las mejoras de experiencia de usuario (UX) y flujo de navegación para CrediSync360, basado en feedback de uso real en dispositivos móviles iPhone 13 Pro Max.

**Objetivo:** Hacer la app más intuitiva, eficiente y reducir pasos innecesarios en los flujos principales.

---

## 🎯 Cambio Principal

### De:
- Vista "Clientes": Lista + Formulario
- Vista "Créditos": Formulario de otorgamiento
- Navegación fragmentada

### A:
- Vista "Clientes": **Hub principal** con toda la funcionalidad
- Vista "Créditos": Solo resumen/análisis (sin formulario)
- Navegación fluida dentro de "Clientes"

---

## 📊 Impacto Esperado

| Métrica | Antes | Después | Mejora |
|---------|-------|---------|--------|
| Crear cliente + crédito | 8 clicks, 3 pantallas | 5 clicks, 2 pantallas | **-37% clicks** |
| Ver estado de cliente | Entrar al detalle | Visible en tarjeta | **Instantáneo** |
| Evitar duplicados | Manual | Automático | **100% prevención** |
| Otorgar crédito | Buscar cliente | Pre-seleccionado | **-3 pasos** |

---

## 🔴 10 Requirements Principales

### Prioridad CRÍTICA (Implementar primero):
1. **Req 2:** Validación de documento duplicado en tiempo real
2. **Req 5:** Navegación directa Cliente → Crédito funcional
3. **Req 4:** Información relevante en tarjetas (estado, saldo, último pago)

### Prioridad ALTA:
4. **Req 1:** Formulario sin distracciones (ocultar lista al crear)
5. **Req 3:** Botón "Guardar y Otorgar Crédito"
6. **Req 8:** Reorganización vista Créditos como resumen/análisis

### Prioridad MEDIA:
7. **Req 6:** Ver Historial Completo funcional
8. **Req 7:** Editar Datos funcional
9. **Req 9:** Eliminar botón "Otorgar Crédito" de tarjetas
10. **Req 10:** Mejora captura GPS con instrucciones por plataforma

---

## 🏗️ Arquitectura Propuesta

### Componentes Nuevos:
- `ClientesView.tsx` - Orquestador principal de estados
- `ClienteCard.tsx` - Tarjeta con información relevante
- `ClienteHistorial.tsx` - Historial completo de créditos
- `CreditoFormInline.tsx` - Formulario integrado en Clientes
- `CreditosResumen.tsx` - Vista de análisis de créditos
- `GPSCapture.tsx` - Captura GPS mejorada

### Componentes Modificados:
- `ClientesList.tsx` - Solo lista, sin formulario
- `ClienteForm.tsx` - Validación duplicados + botón "Guardar y Otorgar"
- `ClienteDetail.tsx` - Botones funcionales (no placeholders)
- `App.tsx` - Cambiar vistas principales

---

## 📅 Plan de Implementación

### FASE 1: Componentes Base (6h)
- ClienteCard con info relevante
- Validación documento duplicado
- GPSCapture mejorado

### FASE 2: Navegación (5.5h)
- ClientesView orquestador
- Ocultar lista al crear
- Navegación Cliente → Crédito funcional

### FASE 3: Funcionalidades Avanzadas (8.5h)
- Botón "Guardar y Otorgar Crédito"
- ClienteHistorial completo
- Edición de datos

### FASE 4: Reorganización (3.5h)
- CreditosResumen
- Cambiar vista principal "Créditos"

### FASE 5: Optimizaciones (5h)
- Cache de estados
- Loading states
- Animaciones
- Testing completo

**Total:** 28.5 horas (~4-6 días)

---

## 📁 Documentos del Spec

1. **requirements.md** - 10 requirements en formato EARS con acceptance criteria
2. **design.md** - Arquitectura técnica detallada
3. **tasks.md** - 28 tareas con estimaciones y dependencias
4. **README.md** - Este documento (resumen ejecutivo)

---

## 🚀 Próximos Pasos

1. ✅ **Aprobación del spec** (COMPLETADO)
2. ⏳ **Implementar FASE 1** (Prioridad CRÍTICA)
3. ⏳ **Implementar FASE 2** (Prioridad CRÍTICA/ALTA)
4. ⏳ **Implementar FASE 3** (Prioridad ALTA/MEDIA)
5. ⏳ **Implementar FASE 4** (Prioridad MEDIA)
6. ⏳ **Implementar FASE 5** (Optimizaciones)

---

## 🎨 Flujo de Usuario Mejorado

```
Vista "Clientes" (Hub Principal)
│
├─ [LISTA] Ver todos los clientes
│   ├─ Tarjetas con info relevante (estado, saldo, último pago)
│   ├─ Click en tarjeta → DETALLE
│   └─ Botón "➕ Nuevo Cliente" → CREAR_NUEVO
│
├─ [CREAR_NUEVO] Formulario sin distracciones
│   ├─ Lista y buscador ocultos
│   ├─ Validación documento duplicado en tiempo real
│   ├─ GPS opcional con advertencia
│   ├─ Botón "Guardar Cliente"
│   └─ Botón "Guardar y Otorgar Crédito" → OTORGAR_CREDITO
│
├─ [DETALLE] Información completa del cliente
│   ├─ Datos personales
│   ├─ Estado (AL DÍA, MORA, SIN CRÉDITOS)
│   ├─ Créditos activos
│   ├─ Botón "🎯 OTORGAR NUEVO CRÉDITO" → OTORGAR_CREDITO
│   ├─ Botón "📋 Ver Historial Completo" → HISTORIAL
│   └─ Botón "✏️ Editar Datos" → EDITAR
│
├─ [OTORGAR_CREDITO] Formulario de crédito integrado
│   ├─ Cliente pre-seleccionado
│   ├─ Selección de producto
│   ├─ Configuración de monto y fecha
│   ├─ Tabla de cuotas
│   └─ Confirmar → Vuelve a DETALLE
│
├─ [HISTORIAL] Historial completo de créditos
│   ├─ Todos los créditos (ACTIVO, CANCELADO, CASTIGADO)
│   ├─ Filtros por estado
│   ├─ Ordenamiento por fecha
│   └─ Detalle expandible
│
└─ [EDITAR] Editar datos del cliente
    ├─ Formulario pre-llenado
    ├─ Documento NO editable
    ├─ Botón "📍 Actualizar Ubicación GPS"
    └─ Guardar → Vuelve a DETALLE
```

---

## 🔍 Validaciones Clave

### Property 1: Unicidad de Documentos
*For any* intento de crear un cliente, si el documento ya existe, entonces el sistema debe prevenir la creación.

### Property 2: Navegación Cliente-Crédito Consistente
*For any* cliente válido, cuando se hace click en "Otorgar Crédito", entonces el sistema debe navegar al formulario con ese cliente pre-seleccionado.

### Property 3: Visibilidad de Información Relevante
*For any* cliente con créditos activos, la tarjeta debe mostrar estado, saldo y último pago.

---

## 📱 Consideraciones Mobile-First

- Diseño responsive desde 320px
- Teclado numérico para valores (`inputMode="decimal"`)
- GPS opcional con advertencia clara
- Instrucciones específicas por plataforma (iOS/Android)
- Botones grandes y táctiles
- Navegación fluida sin recargas

---

**Fecha de Creación:** 2025-12-05  
**Versión:** 1.0  
**Estado:** ✅ Aprobado - Listo para Implementación  
**Autor:** Usuario + Kiro AI
