# Design Document - Mejora de Flujo UX y Navegación

## 1. Arquitectura General

### 1.1 Cambio de Paradigma: "Clientes" como Hub Principal

**Antes:**
- Vista "Clientes": Lista + Formulario de creación
- Vista "Créditos": Formulario de otorgamiento
- Navegación fragmentada entre vistas

**Después:**
- Vista "Clientes": Hub principal con toda la funcionalidad
- Vista "Créditos": Solo resumen/análisis (sin formulario de creación)
- Navegación fluida dentro de "Clientes"

### 1.2 Estados de la Vista "Clientes"

```typescript
type VistaClientesEstado = 
  | { tipo: 'LISTA'; busqueda: string }
  | { tipo: 'CREAR_NUEVO'; mostrarLista: false }
  | { tipo: 'DETALLE'; clienteId: string }
  | { tipo: 'EDITAR'; clienteId: string }
  | { tipo: 'HISTORIAL'; clienteId: string }
  | { tipo: 'OTORGAR_CREDITO'; clienteId: string };
```

### 1.3 Flujo de Datos

```
App.tsx (estado global)
  ↓
ClientesView (estado local de vista)
  ↓
├─ ClientesList (lista + búsqueda)
├─ ClienteForm (crear/editar)
├─ ClienteDetail (detalle + acciones)
├─ ClienteHistorial (historial completo)
└─ CreditoFormInline (formulario integrado)
```

## 2. Componentes Nuevos y Modificados

### 2.1 ClientesView.tsx (NUEVO)

**Responsabilidad:** Orquestar todos los estados de la vista Clientes

**Props:**
```typescript
interface ClientesViewProps {
  // Ninguna, es vista principal
}
```

**Estado interno:**
```typescript
const [vistaEstado, setVistaEstado] = useState<VistaClientesEstado>({ tipo: 'LISTA', busqueda: '' });
const [mensaje, setMensaje] = useState('');
```

**Métodos:**
- `handleCrearNuevo()`: Cambia a estado CREAR_NUEVO
- `handleVerDetalle(clienteId)`: Cambia a estado DETALLE
- `handleEditarCliente(clienteId)`: Cambia a estado EDITAR
- `handleVerHistorial(clienteId)`: Cambia a estado HISTORIAL
- `handleOtorgarCredito(clienteId)`: Cambia a estado OTORGAR_CREDITO
- `handleVolverLista()`: Vuelve a estado LISTA

### 2.2 ClienteForm.tsx (MODIFICADO)

**Cambios principales:**
1. Agregar validación de documento duplicado en tiempo real
2. Agregar botón "Guardar y Otorgar Crédito"
3. Ocultar lista cuando está activo

**Props:**
```typescript
interface ClienteFormProps {
  modo: 'crear' | 'editar';
  clienteId?: string; // Solo para modo editar
  onSuccess: (clienteId: string, accion: 'guardar' | 'guardarYCredito') => void;
  onCancel: () => void;
}
```

**Estado interno:**
```typescript
const [formData, setFormData] = useState<ClienteFormData>({...});
const [documentoDuplicado, setDocumentoDuplicado] = useState<Cliente | null>(null);
const [validandoDocumento, setValidandoDocumento] = useState(false);
const [ubicacion, setUbicacion] = useState<{lat: number; lng: number} | null>(null);
```

**Métodos nuevos:**
- `validarDocumentoDuplicado(documento: string)`: Busca en IndexedDB
- `handleGuardarYOtorgarCredito()`: Guarda y emite evento con acción 'guardarYCredito'

### 2.3 ClienteDetail.tsx (MODIFICADO)

**Cambios principales:**
1. Botones "Ver Historial" y "Editar Datos" funcionales
2. Navegación a crédito integrada (no placeholder)

**Props:**
```typescript
interface ClienteDetailProps {
  clienteId: string;
  onBack: () => void;
  onEditarDatos: (clienteId: string) => void;
  onVerHistorial: (clienteId: string) => void;
  onOtorgarCredito: (clienteId: string) => void;
}
```

### 2.4 ClienteHistorial.tsx (NUEVO)

**Responsabilidad:** Mostrar historial completo de créditos del cliente

**Props:**
```typescript
interface ClienteHistorialProps {
  clienteId: string;
  onBack: () => void;
  onVerDetalleCredito: (creditoId: string) => void;
}
```

**Datos a mostrar:**
- Lista de todos los créditos (ACTIVO, CANCELADO, CASTIGADO)
- Filtros por estado
- Ordenamiento por fecha
- Detalle expandible de cada crédito

### 2.5 CreditoFormInline.tsx (NUEVO)

**Responsabilidad:** Formulario de crédito integrado en vista Clientes

**Props:**
```typescript
interface CreditoFormInlineProps {
  clienteId: string; // Cliente pre-seleccionado
  onSuccess: () => void;
  onCancel: () => void;
}
```

**Diferencias con CreditoForm.tsx:**
- No tiene paso 1 (selección de cliente)
- Cliente viene pre-seleccionado
- Diseño más compacto
- Vuelve a ClienteDetail al terminar

### 2.6 ClienteCard.tsx (NUEVO)

**Responsabilidad:** Tarjeta de cliente con información relevante

**Props:**
```typescript
interface ClienteCardProps {
  cliente: Cliente;
  onClick: (clienteId: string) => void;
}
```

**Información a mostrar:**
- Nombre, documento, teléfono
- Badge de estado: AL DÍA (verde) | MORA (rojo) | SIN CRÉDITOS (gris)
- Saldo pendiente total (si tiene créditos)
- Fecha último pago (si tiene créditos)

**Cálculo de estado:**
```typescript
async function calcularEstadoCliente(clienteId: string) {
  const creditosActivos = await db.creditos
    .filter(c => c.clienteId === clienteId && c.estado === 'ACTIVO')
    .toArray();
  
  if (creditosActivos.length === 0) {
    return { estado: 'SIN_CREDITOS', color: '#6c757d', icono: '💤' };
  }
  
  const tieneMora = creditosActivos.some(c => (c.diasAtraso || 0) > 0);
  if (tieneMora) {
    return { estado: 'MORA', color: '#dc3545', icono: '⚠️' };
  }
  
  return { estado: 'AL_DIA', color: '#28a745', icono: '✅' };
}
```

### 2.7 CreditosResumen.tsx (NUEVO)

**Responsabilidad:** Vista de resumen/análisis de créditos (reemplaza CreditoForm en vista principal)

**Props:**
```typescript
interface CreditosResumenProps {
  // Ninguna
}
```

**Información a mostrar:**
- Estadísticas globales:
  - Total prestado
  - Total por cobrar
  - Créditos activos
  - Créditos en mora
- Lista de todos los créditos con filtros
- Click en crédito → navega a ClienteDetail del cliente

## 3. Modificaciones a App.tsx

### 3.1 Cambio en Vista "Créditos"

**Antes:**
```typescript
{vistaActual === 'creditos' && <CreditoForm />}
```

**Después:**
```typescript
{vistaActual === 'creditos' && <CreditosResumen />}
```

### 3.2 Cambio en Vista "Clientes"

**Antes:**
```typescript
{vistaActual === 'clientes' && <ClientesList />}
```

**Después:**
```typescript
{vistaActual === 'clientes' && <ClientesView />}
```

## 4. Validación de Documento Duplicado

### 4.1 Función de Validación

**Ubicación:** `src/lib/validators.ts` (ya existe)

```typescript
export async function validarDocumentoDuplicado(
  documento: string,
  clienteIdActual?: string
): Promise<{ duplicado: boolean; cliente?: Cliente }> {
  const clienteExistente = await db.clientes
    .where('documento')
    .equals(documento)
    .first();
  
  if (!clienteExistente) {
    return { duplicado: false };
  }
  
  // Si estamos editando, permitir el mismo documento
  if (clienteIdActual && clienteExistente.id === clienteIdActual) {
    return { duplicado: false };
  }
  
  return { duplicado: true, cliente: clienteExistente };
}
```

### 4.2 Debounce para Validación en Tiempo Real

```typescript
import { useEffect, useRef } from 'react';

function useDebounce(callback: Function, delay: number) {
  const timeoutRef = useRef<NodeJS.Timeout>();
  
  return (...args: any[]) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => callback(...args), delay);
  };
}

// Uso en ClienteForm:
const validarDocumentoDebounced = useDebounce(async (doc: string) => {
  if (doc.length < 3) return;
  setValidandoDocumento(true);
  const resultado = await validarDocumentoDuplicado(doc, clienteId);
  setDocumentoDuplicado(resultado.duplicado ? resultado.cliente : null);
  setValidandoDocumento(false);
}, 500);

useEffect(() => {
  if (formData.documento) {
    validarDocumentoDebounced(formData.documento);
  }
}, [formData.documento]);
```

## 5. Mejora de Captura GPS

### 5.1 Componente GPSCapture (NUEVO)

**Ubicación:** `src/components/Common/GPSCapture.tsx`

**Props:**
```typescript
interface GPSCaptureProps {
  ubicacion: { lat: number; lng: number } | null;
  onCapturar: (ubicacion: { lat: number; lng: number }) => void;
  modo: 'capturar' | 'actualizar';
}
```

**Estados:**
```typescript
const [capturando, setCapturando] = useState(false);
const [error, setError] = useState<string | null>(null);
const [permisoDenegado, setPermisoDenegado] = useState(false);
```

**Flujo mejorado:**
1. Click en botón → Mostrar mensaje explicativo
2. Solicitar permisos
3. Si deniega → Mostrar instrucciones específicas por plataforma
4. Si timeout → Ofrecer botón "Reintentar"
5. Si éxito → Mostrar coordenadas y mapa pequeño (opcional)

### 5.2 Detección de Plataforma

```typescript
function detectarPlataforma(): 'ios' | 'android' | 'desktop' {
  const ua = navigator.userAgent;
  if (/iPad|iPhone|iPod/.test(ua)) return 'ios';
  if (/Android/.test(ua)) return 'android';
  return 'desktop';
}

function obtenerInstruccionesGPS(plataforma: string): string {
  switch (plataforma) {
    case 'ios':
      return 'Ve a Ajustes > Safari > Ubicación y permite el acceso';
    case 'android':
      return 'Ve a Configuración > Aplicaciones > Navegador > Permisos > Ubicación';
    default:
      return 'Verifica los permisos de ubicación en tu navegador';
  }
}
```

## 6. Estructura de Archivos

```
src/
├── components/
│   ├── Clientes/
│   │   ├── ClientesView.tsx          (NUEVO - Orquestador principal)
│   │   ├── ClientesList.tsx          (MODIFICADO - Solo lista)
│   │   ├── ClienteForm.tsx           (MODIFICADO - Validación duplicados)
│   │   ├── ClienteDetail.tsx         (MODIFICADO - Botones funcionales)
│   │   ├── ClienteCard.tsx           (NUEVO - Tarjeta con info)
│   │   └── ClienteHistorial.tsx      (NUEVO - Historial completo)
│   ├── Creditos/
│   │   ├── CreditoForm.tsx           (EXISTENTE - Sin cambios)
│   │   ├── CreditoFormInline.tsx     (NUEVO - Versión integrada)
│   │   └── CreditosResumen.tsx       (NUEVO - Vista análisis)
│   └── Common/
│       └── GPSCapture.tsx            (NUEVO - Captura GPS mejorada)
├── lib/
│   ├── validators.ts                 (MODIFICADO - Agregar validación duplicados)
│   └── clienteUtils.ts               (NUEVO - Utilidades de cliente)
└── App.tsx                           (MODIFICADO - Cambiar vistas)
```

## 7. Flujos de Usuario

### 7.1 Flujo: Crear Cliente + Otorgar Crédito

```
1. Usuario en vista "Clientes" (LISTA)
2. Click "➕ Nuevo Cliente"
   → Estado: CREAR_NUEVO
   → Se oculta lista y buscador
3. Completa formulario
   → Validación documento en tiempo real
   → Si duplicado: Mostrar advertencia + botón "Ver Cliente Existente"
4. Click "Guardar y Otorgar Crédito"
   → Guarda cliente
   → Estado: OTORGAR_CREDITO
   → Muestra CreditoFormInline con cliente pre-seleccionado
5. Completa formulario de crédito
6. Click "Confirmar y Otorgar Crédito"
   → Guarda crédito
   → Estado: DETALLE (del cliente recién creado)
   → Muestra ClienteDetail actualizado
```

### 7.2 Flujo: Ver Historial de Cliente

```
1. Usuario en vista "Clientes" (LISTA)
2. Click en tarjeta de cliente
   → Estado: DETALLE
3. Click "📋 Ver Historial Completo"
   → Estado: HISTORIAL
   → Muestra ClienteHistorial
4. Click en un crédito del historial
   → Expande detalles del crédito
5. Click "← Volver"
   → Estado: DETALLE
```

### 7.3 Flujo: Editar Datos de Cliente

```
1. Usuario en ClienteDetail
2. Click "✏️ Editar Datos"
   → Estado: EDITAR
   → Muestra ClienteForm en modo editar
3. Modifica datos (documento NO editable)
4. Click "📍 Actualizar Ubicación GPS"
   → Captura nueva ubicación
5. Click "Guardar Cambios"
   → Actualiza cliente
   → Estado: DETALLE
```

## 8. Consideraciones de Performance

### 8.1 Cálculo de Estado de Cliente

**Problema:** Calcular estado (AL DÍA, MORA, SIN CRÉDITOS) para cada tarjeta puede ser costoso

**Solución:** Cache en memoria con invalidación

```typescript
const estadosClienteCache = new Map<string, {
  estado: EstadoCliente;
  timestamp: number;
}>();

const CACHE_TTL = 60000; // 1 minuto

async function obtenerEstadoCliente(clienteId: string): Promise<EstadoCliente> {
  const cached = estadosClienteCache.get(clienteId);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.estado;
  }
  
  const estado = await calcularEstadoCliente(clienteId);
  estadosClienteCache.set(clienteId, { estado, timestamp: Date.now() });
  return estado;
}
```

### 8.2 Virtualización de Lista

Si hay muchos clientes (>100), considerar virtualización con `react-window`

```typescript
import { FixedSizeList } from 'react-window';

<FixedSizeList
  height={600}
  itemCount={clientesFiltrados.length}
  itemSize={120}
  width="100%"
>
  {({ index, style }) => (
    <div style={style}>
      <ClienteCard cliente={clientesFiltrados[index]} onClick={handleVerDetalle} />
    </div>
  )}
</FixedSizeList>
```

## 9. Testing

### 9.1 Tests Unitarios

**ClienteForm:**
- Validación de documento duplicado
- Debounce funciona correctamente
- Botón "Guardar y Otorgar Crédito" solo visible cuando formulario válido

**ClienteCard:**
- Cálculo correcto de estado (AL DÍA, MORA, SIN CRÉDITOS)
- Formato correcto de saldo pendiente
- Click navega a detalle

**GPSCapture:**
- Manejo de permisos denegados
- Timeout y reintentos
- Instrucciones específicas por plataforma

### 9.2 Tests de Integración

**Flujo completo Crear Cliente + Crédito:**
1. Crear cliente
2. Validar que no hay duplicados
3. Guardar y otorgar crédito
4. Verificar que cliente tiene crédito activo
5. Verificar que estado es "AL DÍA"

## 10. Migración y Rollout

### 10.1 Fase 1: Componentes Base (Req 2, 4, 10)
- Crear ClienteCard con info relevante
- Implementar validación duplicados
- Mejorar GPSCapture

### 10.2 Fase 2: Navegación (Req 1, 5, 9)
- Crear ClientesView orquestador
- Ocultar lista al crear
- Navegación Cliente → Crédito funcional
- Eliminar botón de tarjetas

### 10.3 Fase 3: Funcionalidades Avanzadas (Req 3, 6, 7)
- Botón "Guardar y Otorgar Crédito"
- ClienteHistorial completo
- Edición de datos

### 10.4 Fase 4: Reorganización (Req 8)
- CreditosResumen
- Cambiar vista principal "Créditos"

## 11. Decisiones de Diseño

### 11.1 ¿Por qué ClientesView en lugar de modificar ClientesList?

**Razón:** Separación de responsabilidades
- ClientesList: Solo renderizar lista
- ClientesView: Orquestar estados y navegación
- Más fácil de testear y mantener

### 11.2 ¿Por qué CreditoFormInline en lugar de reutilizar CreditoForm?

**Razón:** Contextos diferentes
- CreditoForm: Vista independiente, selección de cliente
- CreditoFormInline: Integrado en Clientes, cliente pre-seleccionado
- Evita props condicionales complejos

### 11.3 ¿Por qué cache de estados en lugar de calcular siempre?

**Razón:** Performance
- Calcular estado requiere queries a IndexedDB
- Con 50+ clientes, puede causar lag
- Cache de 1 minuto es suficiente para UX fluida

---

**Fecha de Creación**: 2025-12-05  
**Versión**: 1.0  
**Estado**: Listo para Implementación
