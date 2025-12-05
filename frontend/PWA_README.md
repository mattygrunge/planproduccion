# NexxaPlus PWA - Documentación

## 📱 ¿Qué es una PWA?

Una Progressive Web App (PWA) permite que tu aplicación web se instale y funcione como una app nativa en:
- **PC**: Windows, Mac, Linux (Chrome, Edge)
- **Tablets**: Android, iPad
- **Celulares**: Android, iPhone

## 🎯 Características Implementadas

### ✅ Completado
- **manifest.json**: Configuración completa para instalación
- **Service Worker**: Cache de archivos estáticos y soporte offline básico
- **Botón de instalación**: En Login y en el Sidebar (AdminLayout)
- **Soporte iOS**: Modal con instrucciones para Safari
- **Meta tags PWA**: Compatibilidad con todos los navegadores

---

## 📋 Archivos Creados/Modificados

### Archivos Nuevos
```
frontend/
├── public/
│   ├── manifest.json          # Configuración PWA
│   ├── sw.js                  # Service Worker
│   └── icons/
│       └── README.md          # Instrucciones para iconos
├── src/
│   ├── hooks/
│   │   └── usePWAInstall.ts   # Hook para instalación PWA
│   └── components/
│       ├── InstallPWA.tsx     # Componentes de instalación
│       └── InstallPWA.css     # Estilos del botón/modal
└── PWA_README.md              # Esta documentación
```

### Archivos Modificados
- `frontend/index.html` - Meta tags PWA
- `frontend/src/main.tsx` - Registro del Service Worker
- `frontend/src/components/AdminLayout.tsx` - Botón en sidebar
- `frontend/src/pages/Login.tsx` - Botón en login
- `frontend/src/pages/Login.css` - Estilos del botón

---

## 🖼️ Iconos Requeridos (ACCIÓN NECESARIA)

### ⚠️ Debes crear los siguientes iconos:

Colócalos en `frontend/public/icons/`:

| Archivo | Tamaño | Prioridad |
|---------|--------|-----------|
| `icon-192.png` | 192x192 px | ⭐ **Obligatorio** |
| `icon-512.png` | 512x512 px | ⭐ **Obligatorio** |
| `icon-72.png` | 72x72 px | Recomendado |
| `icon-96.png` | 96x96 px | Recomendado |
| `icon-128.png` | 128x128 px | Recomendado |
| `icon-144.png` | 144x144 px | Recomendado |
| `icon-152.png` | 152x152 px | Recomendado |
| `icon-384.png` | 384x384 px | Recomendado |
| `icon-maskable-192.png` | 192x192 px | Para Android |
| `icon-maskable-512.png` | 512x512 px | Para Android |
| `apple-touch-icon.png` | 180x180 px | Para iOS |

### Herramientas para generar iconos:
1. **[PWA Builder Image Generator](https://www.pwabuilder.com/imageGenerator)** - Sube una imagen de 512x512 y genera todos los tamaños
2. **[Favicon Generator](https://realfavicongenerator.net/)** - Genera iconos para todas las plataformas
3. **[App Icon Generator](https://appicon.co/)** - Fácil de usar

---

## 🚀 Cómo Probar la PWA

### En Desarrollo Local

El Service Worker solo se registra en producción. Para probarlo localmente:

1. Añade a tu `.env`:
   ```
   VITE_ENABLE_SW=true
   ```

2. O haz un build de producción:
   ```bash
   cd frontend
   npm run build
   npm run preview
   ```

### Verificación en Chrome DevTools

1. Abre Chrome DevTools (F12)
2. Ve a **Application** → **Manifest**
   - Verifica que se carga correctamente
   - Revisa los iconos
3. Ve a **Application** → **Service Workers**
   - Verifica que está registrado
4. Ve a **Lighthouse** → **PWA**
   - Ejecuta una auditoría PWA

---

## 📲 Cómo Instalar la App

### En PC (Chrome/Edge)

**Opción 1 - Botón en la página:**
1. Abre la app en Chrome/Edge
2. Haz clic en el botón "Instalar NexxaPlus" (en Login o Sidebar)
3. Confirma la instalación

**Opción 2 - Desde el navegador:**
1. Abre la app
2. Busca el ícono de instalación en la barra de direcciones (⊕)
3. O ve a Menú (⋮) → "Instalar NexxaPlus"

### En Android (Chrome/Edge)

1. Abre la app en Chrome
2. Toca el botón "Instalar NexxaPlus"
3. O toca el banner que aparece "Añadir a pantalla de inicio"
4. Confirma la instalación

### En iPhone/iPad (Safari)

⚠️ **iOS no soporta instalación automática**. Los usuarios deben:

1. Abrir la app en **Safari** (no Chrome)
2. Tocar el botón **Compartir** (cuadrado con flecha ↑)
3. Desplazarse y seleccionar **"Añadir a pantalla de inicio"**
4. Tocar **"Añadir"**

La app mostrará un modal con estas instrucciones automáticamente para usuarios de iOS.

---

## 🔧 Configuración Adicional

### Colores de Marca

Los colores están configurados en `manifest.json`:
```json
{
  "theme_color": "#4FAE4E",
  "background_color": "#ffffff"
}
```

Para cambiarlos, modifica también en `index.html`:
```html
<meta name="theme-color" content="#4FAE4E" />
```

### Orientación de Pantalla

Actualmente configurado como `"any"` (cualquier orientación).

Opciones disponibles en `manifest.json`:
- `"any"` - Cualquier orientación
- `"portrait"` - Solo vertical
- `"landscape"` - Solo horizontal
- `"portrait-primary"` - Vertical preferido

### Nombre de la App

Modificar en `manifest.json`:
```json
{
  "name": "NexxaPlus - Gestión de Producción",
  "short_name": "Nexxa+"
}
```

---

## 🛠️ Service Worker - Estrategia de Cache

El Service Worker implementa **Network First**:

1. Intenta obtener recursos de la red
2. Si falla, usa la versión cacheada
3. Ideal para apps que necesitan datos actualizados

**Archivos cacheados:**
- `/` (index.html)
- `/index.html`
- `/manifest.json`
- Assets estáticos (JS, CSS, imágenes)

**No se cachean:**
- Llamadas a la API (`/api/*`)
- Esto garantiza datos frescos del backend

### Actualizar el Cache

Cuando despliegues cambios, actualiza la versión en `sw.js`:
```javascript
const STATIC_CACHE = "nexxaplus-static-v2";  // Incrementar versión
const DYNAMIC_CACHE = "nexxaplus-dynamic-v2";
```

---

## ⚠️ Limitaciones Conocidas

### iOS/Safari
- No hay evento `beforeinstallprompt`
- Los usuarios deben instalar manualmente
- Push notifications no funcionan en iOS Safari (solo iOS 16.4+)
- El cache de Safari puede comportarse diferente

### Firefox
- Soporte PWA limitado en desktop
- En Android funciona correctamente

### Modo Standalone
- La navegación hacia atrás puede comportarse diferente
- Links externos abren en el navegador

---

## 📊 Checklist de Producción

Antes de desplegar:

- [ ] Iconos creados y colocados en `/public/icons/`
- [ ] HTTPS configurado (requerido para PWA)
- [ ] Probar instalación en Chrome PC
- [ ] Probar instalación en Chrome Android
- [ ] Probar instrucciones iOS en Safari
- [ ] Ejecutar Lighthouse PWA audit
- [ ] Verificar Service Worker en DevTools

---

## 🐛 Solución de Problemas

### El botón de instalación no aparece

1. Verifica que estés en HTTPS (o localhost)
2. Verifica que `manifest.json` se carga (DevTools → Network)
3. Asegúrate de tener los iconos 192x192 y 512x512
4. El Service Worker debe estar registrado
5. La app no debe estar ya instalada

### Service Worker no se registra

1. Verifica que estés en producción o que `VITE_ENABLE_SW=true`
2. Revisa la consola por errores
3. Verifica que `sw.js` esté en `/public/`

### Cache desactualizado

1. Incrementa la versión del cache en `sw.js`
2. En DevTools → Application → Storage → Clear site data
3. O usa "Update on reload" en Service Workers

---

## 📚 Recursos Adicionales

- [Web.dev PWA](https://web.dev/progressive-web-apps/)
- [PWA Builder](https://www.pwabuilder.com/)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Web App Manifest](https://developer.mozilla.org/en-US/docs/Web/Manifest)
