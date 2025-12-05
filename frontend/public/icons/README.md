# Iconos PWA para NexxaPlus

## 📋 Iconos Requeridos

Debes crear y colocar los siguientes iconos PNG en esta carpeta:

### Iconos Estándar (purpose: "any")
| Archivo | Tamaño | Descripción |
|---------|--------|-------------|
| `icon-72.png` | 72x72 px | Android antiguo |
| `icon-96.png` | 96x96 px | Android |
| `icon-128.png` | 128x128 px | Extensiones Chrome |
| `icon-144.png` | 144x144 px | iPad retina |
| `icon-152.png` | 152x152 px | iPad retina |
| `icon-192.png` | 192x192 px | **Android (obligatorio)** |
| `icon-384.png` | 384x384 px | Android splash |
| `icon-512.png` | 512x512 px | **Android/Chrome (obligatorio)** |

### Iconos Maskable (para Android adaptativo)
| Archivo | Tamaño | Descripción |
|---------|--------|-------------|
| `icon-maskable-192.png` | 192x192 px | Android adaptativo |
| `icon-maskable-512.png` | 512x512 px | Android adaptativo |

**Nota sobre iconos maskable:** El contenido importante debe estar en el centro (zona segura del 80%). Android puede recortar los bordes dependiendo de la forma del icono del launcher.

### Screenshots (opcionales pero recomendados)
| Archivo | Tamaño | Descripción |
|---------|--------|-------------|
| `screenshot-wide.png` | 1280x720 px | Screenshot horizontal (PC/tablet) |
| `screenshot-narrow.png` | 720x1280 px | Screenshot vertical (móvil) |

### Iconos Apple (iOS)
| Archivo | Tamaño | Descripción |
|---------|--------|-------------|
| `apple-touch-icon.png` | 180x180 px | iPhone/iPad home screen |

---

## 🎨 Recomendaciones de Diseño

1. **Color de fondo:** Usa el verde de tu marca (#4FAE4E) o fondo transparente
2. **Logo:** Usa el logo de NexxaPlus centrado
3. **Padding:** Deja un 10-15% de padding en los bordes
4. **Formato:** PNG con transparencia (o fondo sólido)
5. **Sin texto pequeño:** El texto no será legible en tamaños pequeños

---

## 🛠 Herramientas para Generar Iconos

### Opción 1: Generadores Online (Recomendado)
- [PWA Image Generator](https://www.pwabuilder.com/imagegenerator)
- [Favicon Generator](https://realfavicongenerator.net/)
- [App Icon Generator](https://appicon.co/)

### Opción 2: Manual en Figma/Photoshop
1. Crea un archivo de 512x512 px
2. Diseña tu icono
3. Exporta en todos los tamaños

---

## ✅ Checklist

- [ ] `icon-72.png` (72x72)
- [ ] `icon-96.png` (96x96)
- [ ] `icon-128.png` (128x128)
- [ ] `icon-144.png` (144x144)
- [ ] `icon-152.png` (152x152)
- [ ] `icon-192.png` (192x192) ⭐ Obligatorio
- [ ] `icon-384.png` (384x384)
- [ ] `icon-512.png` (512x512) ⭐ Obligatorio
- [ ] `icon-maskable-192.png` (192x192)
- [ ] `icon-maskable-512.png` (512x512)
- [ ] `apple-touch-icon.png` (180x180)
- [ ] `screenshot-wide.png` (1280x720) - Opcional
- [ ] `screenshot-narrow.png` (720x1280) - Opcional

---

## 📱 Pruebas

Una vez que agregues los iconos, puedes probar:

1. **Chrome DevTools:** F12 → Application → Manifest
2. **Lighthouse:** F12 → Lighthouse → PWA audit
3. **Instalación:** El botón "Instalar NexxaPlus" debería aparecer
