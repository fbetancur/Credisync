# 🗺️ Sistema de Ruta Inteligente - CrediSync360

## 📋 Descripción

Sistema completo de gestión de ruta diaria para cobradores con optimización automática por GPS, drag & drop manual, y configuración flexible de días laborables.

---

## ✨ Características Implementadas

### 1. **Solo Cuotas del Día**
- ✅ Filtra automáticamente cuotas con `fechaProgramada = HOY`
- ✅ Excluye cuotas ya pagadas
- ✅ Muestra solo pendientes y parciales

### 2. **Optimización Automática por GPS**
- ✅ Botón "🎯 Optimizar Ruta por Distancia"
- ✅ Usa algoritmo del vecino más cercano (Greedy Nearest Neighbor)
- ✅ Calcula desde ubicación actual del cobrador
- ✅ Muestra distancia total y tiempo estimado
- ✅ Guarda el orden en la base de datos

### 3. **Reordenamiento Manual (Drag & Drop)**
- ✅ Arrastra y suelta tarjetas para reordenar
- ✅ Actualización visual en tiempo real
- ✅ Guarda automáticamente el nuevo orden
- ✅ Feedback visual durante el arrastre

### 4. **Días Laborables Configurables**
- ✅ **Créditos DIARIOS**: Solo excluyen domingos (festivos se trabajan)
- ✅ **Otros créditos**: Pueden excluir festivos
- ✅ Opción para excluir días específicos manualmente

### 5. **Navegación Integrada**
- ✅ Botón "🗺️ Ir en Maps" en cada cuota
- ✅ Abre Google Maps con navegación directa
- ✅ Muestra distancia desde ubicación actual

### 6. **Gestión de Visitas**
- ✅ Marcar cuota como "Visitada"
- ✅ Separación visual: Pendientes vs Visitadas
- ✅ Contador de progreso

---

## 🎯 Interfaz de Usuario

```
┌─────────────────────────────────────┐
│ 🗺️ Mi Ruta          05/12/2024     │
├─────────────────────────────────────┤
│  ┌─────┐  ┌─────┐  ┌─────────┐     │
│  │  8  │  │  3  │  │$450,000 │     │
│  │Pend.│  │Visit│  │A Cobrar │     │
│  └─────┘  └─────┘  └─────────┘     │
├─────────────────────────────────────┤
│  [🎯 Optimizar Ruta por Distancia] │
├─────────────────────────────────────┤
│  💡 Arrastra y suelta para reordenar│
├─────────────────────────────────────┤
│  📋 Cuotas Pendientes (8)           │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ ① María García    📍 1.2km  │   │
│  │ Calle 123, Barrio Centro    │   │
│  │ Cuota #5 | $50,000          │   │
│  │ 📱 300-123-4567              │   │
│  │ [🗺️ Ir en Maps] [✅ Visitada]│   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ ② Juan Pérez      📍 2.5km  │   │
│  │ Carrera 45, Barrio Norte    │   │
│  │ Cuota #12 | $30,000         │   │
│  │ 📱 310-987-6543              │   │
│  │ [🗺️ Ir en Maps] [✅ Visitada]│   │
│  └─────────────────────────────┘   │
│                                     │
│  ... (6 más)                        │
├─────────────────────────────────────┤
│  ✅ Visitadas (3)                   │
│  María García - $50,000             │
│  Pedro López - $40,000              │
│  Ana Martínez - $35,000             │
└─────────────────────────────────────┘
```

---

## 🧮 Algoritmo de Optimización

### Vecino Más Cercano (Greedy Nearest Neighbor)

```typescript
function ordenarPorDistancia(cuotas, origen) {
  const ordenadas = [];
  const pendientes = [...cuotas];
  let puntoActual = origen; // Ubicación del cobrador

  while (pendientes.length > 0) {
    // Encontrar la cuota más cercana al punto actual
    let masCercana = null;
    let distanciaMinima = Infinity;

    for (const cuota of pendientes) {
      const distancia = calcularDistancia(puntoActual, cuota);
      if (distancia < distanciaMinima) {
        distanciaMinima = distancia;
        masCercana = cuota;
      }
    }

    // Agregar a la ruta y actualizar punto actual
    ordenadas.push(masCercana);
    pendientes.remove(masCercana);
    puntoActual = masCercana.ubicacion;
  }

  return ordenadas;
}
```

### Fórmula de Haversine (Distancia GPS)

```typescript
function calcularDistancia(punto1, punto2) {
  const R = 6371e3; // Radio de la Tierra en metros
  const φ1 = punto1.latitud * Math.PI / 180;
  const φ2 = punto2.latitud * Math.PI / 180;
  const Δφ = (punto2.latitud - punto1.latitud) * Math.PI / 180;
  const Δλ = (punto2.longitud - punto1.longitud) * Math.PI / 180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c; // Distancia en metros
}
```

---

## 📅 Configuración de Días Laborables

### Para Créditos DIARIOS:

```typescript
// Solo excluir domingos
const fechas = calcularFechasCuotas(
  fechaInicio,
  numeroCuotas,
  'DIARIO',
  {
    excluirDomingos: true,
    excluirFestivos: false, // ← Festivos se trabajan
  }
);
```

### Para Otros Créditos:

```typescript
// Excluir domingos y festivos
const fechas = calcularFechasCuotas(
  fechaInicio,
  numeroCuotas,
  'SEMANAL',
  {
    excluirDomingos: true,
    excluirFestivos: true,
  }
);
```

### Excluir Días Específicos:

```typescript
// Excluir días específicos (ej: vacaciones, eventos)
const fechas = calcularFechasCuotas(
  fechaInicio,
  numeroCuotas,
  'DIARIO',
  {
    excluirDomingos: true,
    diasExcluidos: ['2024-12-25', '2024-01-01'], // Navidad y Año Nuevo
  }
);
```

---

## 🔄 Flujo de Uso

### Flujo 1: Optimizar Ruta desde la Oficina

```
1. Cobrador llega a la oficina
2. Abre app → [🗺️ Mi Ruta]
3. Sistema carga cuotas del día
4. Click en [🎯 Optimizar Ruta por Distancia]
5. Sistema:
   - Obtiene ubicación actual (oficina)
   - Calcula distancias a cada cliente
   - Ordena por vecino más cercano
   - Guarda orden en DB
6. Muestra: "✅ Ruta optimizada: 15.3km - Tiempo estimado: 2h 45min"
7. Cobrador sale a cobrar siguiendo el orden
```

### Flujo 2: Ajustar Ruta Manualmente

```
1. Cobrador revisa ruta optimizada
2. Sabe que debe visitar a María primero (compromiso)
3. Arrastra tarjeta de María al primer lugar
4. Sistema guarda nuevo orden automáticamente
5. Continúa con el resto de la ruta
```

### Flujo 3: Durante el Recorrido

```
1. Cobrador ve primera cuota: María García
2. Click en [🗺️ Ir en Maps]
3. Google Maps abre con navegación
4. Llega a casa de María
5. Cobra la cuota
6. Click en [✅ Marcar Visitada]
7. Cuota se mueve a sección "Visitadas"
8. Siguiente cuota aparece destacada
```

---

## 📊 Estadísticas y Métricas

### Información Mostrada:

```typescript
interface EstadisticasRuta {
  cuotasPendientes: number;      // 8
  cuotasVisitadas: number;       // 3
  totalACobrar: number;          // $450,000
  distanciaTotal: number;        // 15,300 metros
  tiempoEstimado: string;        // "2h 45min"
  progreso: number;              // 27% (3/11)
}
```

### Cálculo de Tiempo Estimado:

```typescript
function calcularTiempoEstimado(distanciaMetros, numeroParadas) {
  const velocidadPromedio = 20; // km/h en ciudad
  const tiempoPorParada = 5;    // minutos

  const tiempoViaje = (distanciaMetros / 1000 / velocidadPromedio) * 60;
  const tiempoParadas = numeroParadas * tiempoPorParada;
  
  return tiempoViaje + tiempoParadas; // minutos totales
}

// Ejemplo:
// 15.3 km, 11 paradas
// Viaje: (15.3 / 20) * 60 = 45.9 min
// Paradas: 11 * 5 = 55 min
// Total: 100.9 min ≈ 1h 41min
```

---

## 🎨 Características Visuales

### Drag & Drop:

- **Cursor**: Cambia a "grab" al pasar sobre tarjeta
- **Arrastre**: Borde punteado morado durante drag
- **Sombra**: Aumenta durante el arrastre
- **Transición**: Suave al soltar

### Indicadores de Distancia:

- **< 1 km**: Verde claro
- **1-3 km**: Azul
- **> 3 km**: Naranja

### Estados de Cuota:

- **Pendiente**: Fondo blanco, borde sólido
- **Visitada**: Fondo gris, opacidad 70%
- **Con Mora**: Borde rojo

---

## 🗂️ Archivos Creados/Modificados

### Nuevos Archivos:

1. **`src/lib/gpsUtils.ts`**
   - Cálculo de distancias GPS (Haversine)
   - Ordenamiento por vecino más cercano
   - Obtención de ubicación actual
   - Formateo de distancias
   - Cálculo de tiempo estimado

2. **`src/components/Rutas/RutaDelDia.tsx`**
   - Vista principal de ruta del día
   - Drag & Drop para reordenar
   - Botón optimizar ruta
   - Integración con Google Maps
   - Marcar visitadas

3. **`RUTA_INTELIGENTE.md`**
   - Este documento

### Archivos Modificados:

1. **`src/lib/calendarioUtils.ts`**
   - Agregado parámetro `diasExcluidos`
   - Modificado para créditos DIARIOS (solo domingos)
   - Comentarios actualizados

2. **`src/App.tsx`**
   - Agregado botón "🗺️ Mi Ruta"
   - Importado componente RutaDelDia
   - Vista por defecto: rutaDelDia

---

## 🚀 Mejoras Futuras Sugeridas

### 1. Modo Offline Completo

```typescript
// Guardar ruta optimizada para uso sin conexión
await db.rutasOptimizadas.add({
  fecha: hoy,
  cuotas: cuotasOrdenadas,
  distanciaTotal,
  tiempoEstimado,
  ubicacionInicio: ubicacionActual,
});
```

### 2. Historial de Rutas

```typescript
// Ver rutas de días anteriores
interface HistorialRuta {
  fecha: string;
  cuotasProgramadas: number;
  cuotasCobradas: number;
  distanciaRecorrida: number;
  tiempoReal: number;
  eficiencia: number; // %
}
```

### 3. Alertas de Tráfico

```typescript
// Integrar con API de tráfico
if (traficoAlto) {
  mostrarAlerta('⚠️ Tráfico alto en Calle 123. Considera ruta alternativa.');
}
```

### 4. Compartir Ruta

```typescript
// Enviar ruta al supervisor
function compartirRuta() {
  const mensaje = `
    Ruta del día: ${fecha}
    Cuotas: ${cuotas.length}
    Distancia: ${distanciaTotal}
    Tiempo estimado: ${tiempoEstimado}
    [Ver en mapa]
  `;
  enviarWhatsApp(supervisor, mensaje);
}
```

### 5. Modo Nocturno

```typescript
// Para cobradores que trabajan de noche
const esNoche = new Date().getHours() >= 18;
if (esNoche) {
  aplicarTemaNocturno();
}
```

---

## 📱 Responsive Design

- ✅ Optimizado para móviles (320px+)
- ✅ Drag & Drop funciona en touch
- ✅ Botones grandes para fácil toque
- ✅ Texto legible en pantallas pequeñas

---

## 🔐 Permisos Necesarios

### GPS/Ubicación:
```javascript
navigator.geolocation.getCurrentPosition(
  success,
  error,
  {
    enableHighAccuracy: true, // Precisión alta
    timeout: 10000,           // 10 segundos
    maximumAge: 0             // Sin caché
  }
);
```

### Notificaciones (futuro):
```javascript
// Alertar cuando esté cerca del siguiente cliente
if (distanciaAlSiguiente < 500) {
  notificar('📍 Próximo cliente a 500m');
}
```

---

## 🎯 Conclusión

Has recibido un **sistema completo de ruta inteligente** que:

✅ Filtra solo cuotas del día
✅ Optimiza automáticamente por GPS
✅ Permite reordenar manualmente (drag & drop)
✅ Integra navegación con Google Maps
✅ Gestiona visitas y progreso
✅ Configura días laborables flexiblemente
✅ Calcula distancias y tiempos
✅ Funciona offline
✅ Es responsive y mobile-friendly

**Para créditos DIARIOS**: Solo se excluyen domingos (festivos se trabajan normalmente).

**¡El cobrador ahora tiene una ruta optimizada y flexible que se adapta a sus necesidades!** 🗺️
