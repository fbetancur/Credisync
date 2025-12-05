# ✅ Checklist de Pruebas - CrediSync360

## 🎯 Objetivo
Verificar que todas las correcciones funcionan correctamente en la aplicación.

---

## 1️⃣ Prueba de Ancho Completo

### Pasos:
1. Abrir la aplicación en el navegador
2. Navegar por todas las vistas:
   - 🗺️ Mi Ruta
   - 💵 Cobros
   - 💰 Caja
   - 📦 Productos
   - 🗺️ Rutas
   - 👥 Clientes
   - 💳 Créditos

### Verificar:
- [ ] Todas las vistas ocupan el 100% del ancho
- [ ] No hay espacios blancos a los lados
- [ ] El contenido llega hasta los bordes (con padding de 12px)
- [ ] No hay scroll horizontal

### Resultado Esperado:
✅ Ancho consistente en todas las pantallas

---

## 2️⃣ Prueba de Header Sticky

### Pasos:
1. Ir a cualquier vista con contenido largo (ej: Clientes, Caja)
2. Hacer scroll hacia abajo
3. Hacer scroll hacia arriba

### Verificar:
- [ ] El header morado siempre está visible
- [ ] Los botones de navegación siempre accesibles
- [ ] El botón "Salir" siempre visible
- [ ] El contenido NO queda oculto debajo del header

### Resultado Esperado:
✅ Header siempre visible, contenido nunca oculto

---

## 3️⃣ Prueba de Vista "Caja"

### Pasos:
1. Click en "💰 Caja"
2. Observar la parte superior

### Verificar:
- [ ] El título "💰 BALANCE" es visible inmediatamente
- [ ] El botón "🔄 Recargar" es visible
- [ ] NO hay contenido oculto debajo del header
- [ ] El estado "CAJA ABIERTA" o "CAJA CERRADA" es visible

### Resultado Esperado:
✅ Todo el contenido visible sin necesidad de scroll

---

## 4️⃣ Prueba de Botones en Cliente Detail

### Pasos:
1. Ir a "👥 Clientes"
2. Click en cualquier cliente de la lista
3. Scroll hasta el final
4. Click en "📋 Ver Historial Completo"
5. Click en "✏️ Editar Datos"

### Verificar:
- [ ] Botón "Ver Historial Completo" muestra alert
- [ ] Botón "Editar Datos" muestra alert
- [ ] Botón "🎯 OTORGAR NUEVO CRÉDITO" funciona (si está habilitado)

### Resultado Esperado:
✅ Todos los botones responden al click

---

## 5️⃣ Prueba de GPS

### Pasos:
1. Ir a "👥 Clientes"
2. Click en "➕ Nuevo Cliente"
3. Llenar nombre y documento
4. Click en "📍 Capturar Ubicación"
5. Permitir acceso a ubicación si el navegador lo solicita
6. Esperar hasta 30 segundos

### Verificar:
- [ ] El botón cambia a "⏳ Capturando..."
- [ ] Después de unos segundos muestra "✅ Lat: X, Lng: Y"
- [ ] NO hay error en la consola de "Timeout expired"
- [ ] Si hay error, es por permisos denegados, no por timeout

### Resultado Esperado:
✅ GPS captura ubicación sin errores de timeout

---

## 6️⃣ Prueba de Consola (DevTools)

### Pasos:
1. Abrir DevTools (F12)
2. Ir a la pestaña "Console"
3. Recargar la página (F5)
4. Navegar por todas las vistas

### Verificar:
- [ ] NO hay warning sobre "apple-mobile-web-app-capable is deprecated"
- [ ] NO hay errores de GPS timeout (a menos que se denieguen permisos)
- [ ] Pueden haber logs informativos (eso está bien)

### Resultado Esperado:
✅ Sin warnings de meta tags deprecated

---

## 7️⃣ Prueba de Responsividad Mobile

### Pasos:
1. Abrir DevTools (F12)
2. Click en el icono de dispositivo móvil (Toggle device toolbar)
3. Seleccionar diferentes dispositivos:
   - iPhone SE (375px)
   - iPhone 12 Pro (390px)
   - Samsung Galaxy S20 (360px)
   - iPad Mini (768px)
4. Navegar por todas las vistas

### Verificar:
- [ ] Todas las vistas se ven bien en móvil
- [ ] Los botones de navegación se adaptan (grid responsive)
- [ ] No hay scroll horizontal
- [ ] El contenido es legible
- [ ] Los botones son clickeables (no muy pequeños)

### Resultado Esperado:
✅ Perfecta responsividad en todos los tamaños

---

## 8️⃣ Prueba de PWA (Instalación)

### Pasos en Android (Chrome):
1. Abrir la app en Chrome móvil
2. Menú (⋮) → "Agregar a pantalla de inicio"
3. Confirmar instalación
4. Abrir la app desde el launcher

### Pasos en iOS (Safari):
1. Abrir la app en Safari
2. Botón "Compartir" (□↑)
3. "Agregar a pantalla de inicio"
4. Confirmar
5. Abrir desde la pantalla de inicio

### Verificar:
- [ ] La opción "Agregar a pantalla de inicio" está disponible
- [ ] El icono aparece en el launcher/pantalla de inicio
- [ ] Al abrir, se ve como app nativa (sin barra de navegador)
- [ ] El header morado es visible
- [ ] Funciona correctamente

### Resultado Esperado:
✅ App instalable y funciona como PWA

---

## 9️⃣ Prueba de Flujo Completo: Cliente → Crédito

### Pasos:
1. Ir a "👥 Clientes"
2. Click en un cliente existente
3. Verificar estado (AL DÍA, CON MORA, etc.)
4. Click en "🎯 OTORGAR NUEVO CRÉDITO"
5. Verificar que se muestre el formulario o mensaje de validación

### Verificar:
- [ ] Si el cliente está al día, permite otorgar crédito
- [ ] Si el cliente tiene mora, muestra mensaje de error
- [ ] El botón responde correctamente
- [ ] La validación funciona

### Resultado Esperado:
✅ Flujo Cliente → Crédito funciona correctamente

---

## 🔟 Prueba de Ruta del Día

### Pasos:
1. Ir a "🗺️ Mi Ruta" (vista por defecto)
2. Verificar que se muestren las cuotas del día
3. Click en "🎯 Optimizar Ruta por Distancia"
4. Permitir acceso a ubicación

### Verificar:
- [ ] Se muestran solo las cuotas del día actual
- [ ] El botón de optimizar funciona
- [ ] Si hay GPS, ordena por distancia
- [ ] Si no hay GPS, muestra mensaje de error
- [ ] Se puede arrastrar y soltar para reordenar

### Resultado Esperado:
✅ Ruta del día funciona con GPS y drag & drop

---

## 📊 Resumen de Resultados

### Pruebas Pasadas: __ / 10

| # | Prueba | Estado | Notas |
|---|--------|--------|-------|
| 1 | Ancho Completo | ⬜ | |
| 2 | Header Sticky | ⬜ | |
| 3 | Vista Caja | ⬜ | |
| 4 | Botones Cliente | ⬜ | |
| 5 | GPS | ⬜ | |
| 6 | Consola | ⬜ | |
| 7 | Responsividad | ⬜ | |
| 8 | PWA | ⬜ | |
| 9 | Flujo Cliente→Crédito | ⬜ | |
| 10 | Ruta del Día | ⬜ | |

---

## 🐛 Reporte de Bugs

Si encuentras algún problema, documéntalo aquí:

### Bug #1:
- **Descripción**: 
- **Pasos para reproducir**: 
- **Resultado esperado**: 
- **Resultado actual**: 
- **Captura de pantalla**: 

### Bug #2:
- **Descripción**: 
- **Pasos para reproducir**: 
- **Resultado esperado**: 
- **Resultado actual**: 
- **Captura de pantalla**: 

---

## ✅ Aprobación Final

- [ ] Todas las pruebas pasadas
- [ ] Sin bugs críticos
- [ ] Funciona en móvil real
- [ ] PWA instalable
- [ ] Lista para producción

**Aprobado por**: _______________
**Fecha**: _______________

---

## 🚀 Comandos para Deploy

Una vez aprobado, ejecutar:

```bash
# Build de producción
npm run build

# Deploy a Amplify
amplify publish

# O si usas Git
git add .
git commit -m "fix: correcciones finales - app lista para producción"
git push
```

---

**Nota**: Esta checklist debe completarse antes de hacer deploy a producción.

