# 🚂 Guía Completa de Despliegue en Railway - Paso a Paso

Esta guía te llevará paso a paso para desplegar tu proyecto Plan Producción en Railway.

---

## 📋 ANTES DE EMPEZAR

Asegúrate de tener:
- ✅ Una cuenta en [Railway](https://railway.app/) (puedes registrarte con GitHub)
- ✅ El código ya subido a GitHub (tu repo: `mattygrunge/planproduccion`)
- ✅ Los archivos de configuración que ya creamos (nixpacks.toml, Procfile, etc.)

---

## 🔵 PARTE 1: CREAR EL PROYECTO EN RAILWAY

### Paso 1.1: Ir a Railway
1. Abre tu navegador
2. Ve a: **https://railway.app/**
3. Click en **"Login"** (esquina superior derecha)
4. Inicia sesión con tu cuenta de GitHub

### Paso 1.2: Crear un Nuevo Proyecto
1. Una vez dentro del dashboard, click en el botón **"+ New Project"** 
2. Verás varias opciones, selecciona: **"Empty Project"**
   - ¡NO selecciones "Deploy from GitHub repo" todavía!
   - Es más fácil agregar los servicios uno por uno

3. Se creará un proyecto vacío. Le puedes cambiar el nombre:
   - Click en el nombre del proyecto (arriba)
   - Escribe: **"Plan Produccion"**

---

## 🔵 PARTE 2: AGREGAR LA BASE DE DATOS (PostgreSQL)

### Paso 2.1: Agregar PostgreSQL
1. Dentro de tu proyecto vacío, click en **"+ New"**
2. Selecciona **"Database"**
3. Selecciona **"Add PostgreSQL"**
4. Railway creará automáticamente la base de datos
5. Espera unos segundos hasta que aparezca el ícono de PostgreSQL en tu proyecto

### Paso 2.2: Verificar la Base de Datos
1. Click en el servicio de **PostgreSQL** que acabas de crear
2. Ve a la pestaña **"Variables"**
3. Verás varias variables, la importante es:
   - `DATABASE_URL` - Esta es la URL de conexión

**¡NO copies nada todavía!** Railway conectará esto automáticamente.

---

## 🔵 PARTE 3: AGREGAR EL BACKEND

### Paso 3.1: Crear el Servicio del Backend
1. Click en **"+ New"** (dentro de tu proyecto)
2. Selecciona **"GitHub Repo"**
3. Si es la primera vez, Railway te pedirá autorización para acceder a tus repos
   - Click en **"Configure GitHub App"**
   - Selecciona tu cuenta
   - Autoriza el acceso al repositorio `planproduccion`
4. Selecciona el repositorio **"planproduccion"**
5. Railway creará un nuevo servicio

### Paso 3.2: ⚠️ IMPORTANTE - Configurar Root Directory
Este es el paso crítico que hace que funcione:

1. Click en el servicio que acabas de crear (el nuevo, no PostgreSQL)
2. Ve a **"Settings"** (ícono de engranaje ⚙️ en la barra lateral)
3. Busca la sección **"Source"**
4. Encuentra el campo **"Root Directory"**
5. Escribe exactamente: **`backend`**
6. Presiona **Enter** o click en el ✓ para guardar
7. **El servicio se redesplegará automáticamente**

### Paso 3.3: Renombrar el Servicio (Opcional pero recomendado)
1. En Settings, busca **"Service Name"**
2. Cámbialo a: **"backend"**

### Paso 3.4: Conectar la Base de Datos
1. En el servicio del backend, ve a **"Variables"**
2. Click en **"+ New Variable"**
3. En el campo de nombre, escribe: **`DATABASE_URL`**
4. En el campo de valor, click en **"Add Reference"**
5. Selecciona **PostgreSQL** → **DATABASE_URL**
6. Click en **"Add"**

### Paso 3.5: Agregar Variables de Entorno
1. Sigue en la pestaña **"Variables"**
2. Click en **"+ New Variable"** y agrega estas variables:

| Variable | Valor |
|----------|-------|
| `SECRET_KEY` | `tu-clave-super-secreta-de-32-caracteres-1234567890` |
| `CORS_ORIGINS` | `*` (temporalmente, luego lo cambiaremos) |

**Nota:** Para SECRET_KEY, usa una cadena larga y aleatoria. Puedes generar una en: https://randomkeygen.com/

### Paso 3.6: Esperar el Despliegue
1. Ve a la pestaña **"Deployments"**
2. Deberías ver un despliegue en progreso
3. Espera a que termine (puede tardar 2-5 minutos)
4. Si falla, revisa los logs haciendo click en el despliegue

### Paso 3.7: Generar URL Pública
1. Ve a **"Settings"**
2. Busca la sección **"Networking"** o **"Public Networking"**
3. Click en **"Generate Domain"**
4. Railway te dará una URL como: `backend-production-xxxx.up.railway.app`
5. **¡COPIA ESTA URL!** La necesitarás para el frontend

### Paso 3.8: Verificar que Funciona
1. Abre la URL del backend en tu navegador
2. Deberías ver algo como:
   ```json
   {
     "message": "Plan Producción API",
     "version": "1.0.0",
     "docs": "/docs"
   }
   ```
3. Visita `tu-url/docs` para ver la documentación de la API
4. Visita `tu-url/health` para verificar el estado

---

## 🔵 PARTE 4: AGREGAR EL FRONTEND

### Paso 4.1: Crear el Servicio del Frontend
1. Vuelve a tu proyecto en Railway
2. Click en **"+ New"**
3. Selecciona **"GitHub Repo"**
4. Selecciona el mismo repositorio **"planproduccion"**

### Paso 4.2: ⚠️ IMPORTANTE - Configurar Root Directory
1. Click en el nuevo servicio
2. Ve a **"Settings"**
3. En **"Root Directory"**, escribe: **`frontend`**
4. Presiona Enter para guardar
5. El servicio se redesplegará

### Paso 4.3: Renombrar el Servicio
1. En Settings, cambia "Service Name" a: **"frontend"**

### Paso 4.4: Agregar Variables de Entorno
1. Ve a la pestaña **"Variables"**
2. Click en **"+ New Variable"**
3. Agrega esta variable:

| Variable | Valor |
|----------|-------|
| `VITE_API_URL` | `https://TU-URL-DEL-BACKEND/api` |

**⚠️ IMPORTANTE:** 
- Reemplaza `TU-URL-DEL-BACKEND` con la URL real del backend (paso 3.7)
- Ejemplo: `https://backend-production-abc123.up.railway.app/api`
- **NO olvides agregar `/api` al final**

### Paso 4.5: Esperar el Despliegue
1. Ve a **"Deployments"**
2. Espera a que termine el despliegue

### Paso 4.6: Generar URL Pública
1. Ve a **"Settings"** → **"Networking"**
2. Click en **"Generate Domain"**
3. Copia la URL del frontend

---

## 🔵 PARTE 5: CONFIGURAR CORS (Conexión Backend-Frontend)

### Paso 5.1: Actualizar CORS del Backend
1. Vuelve al servicio del **Backend**
2. Ve a **"Variables"**
3. Busca la variable `CORS_ORIGINS`
4. Cambia el valor de `*` a la URL exacta de tu frontend
   - Ejemplo: `https://frontend-production-xyz789.up.railway.app`
5. El backend se redesplegará automáticamente

---

## 🔵 PARTE 6: VERIFICACIÓN FINAL

### Paso 6.1: Probar el Backend
1. Abre la URL del backend
2. Ve a `/docs` para ver la documentación
3. Ve a `/health` - debe mostrar `{"status": "ok"}`

### Paso 6.2: Probar el Frontend
1. Abre la URL del frontend
2. Deberías ver la página de login
3. Intenta iniciar sesión con:
   - **Usuario:** `admin`
   - **Password:** `admin123`

### Paso 6.3: Si el Login No Funciona
Probablemente la base de datos está vacía. El backend debería inicializarla automáticamente, pero si no:
1. Verifica los logs del backend
2. Busca errores de conexión a la base de datos

---

## 🔴 SOLUCIÓN DE PROBLEMAS

### Error: "Railpack could not determine how to build the app"
**Causa:** No configuraste el Root Directory
**Solución:** Ve a Settings → Root Directory y escribe `backend` o `frontend`

### Error: "Cannot connect to database" o errores de PostgreSQL
**Causa:** La variable DATABASE_URL no está conectada
**Solución:** 
1. Ve a Variables del backend
2. Elimina DATABASE_URL si existe
3. Agrégala de nuevo usando "Add Reference" → PostgreSQL → DATABASE_URL

### Error: CORS policy
**Causa:** El backend no permite conexiones del frontend
**Solución:** 
1. Ve a Variables del backend
2. Asegúrate que CORS_ORIGINS tenga la URL exacta del frontend (sin / al final)

### El frontend muestra página en blanco
**Causa:** VITE_API_URL mal configurada
**Solución:**
1. Verifica que la variable sea exactamente `VITE_API_URL`
2. Verifica que termine en `/api`
3. Redespliega el frontend

### Error 500 en el backend
**Causa:** Problema con la base de datos o configuración
**Solución:**
1. Ve a Deployments → Click en el último despliegue
2. Revisa los logs para ver el error específico

---

## 📊 RESUMEN DE URLs Y VARIABLES

### Backend
- **Root Directory:** `backend`
- **Variables:**
  - `DATABASE_URL` → Referencia a PostgreSQL
  - `SECRET_KEY` → Tu clave secreta
  - `CORS_ORIGINS` → URL del frontend

### Frontend
- **Root Directory:** `frontend`
- **Variables:**
  - `VITE_API_URL` → URL del backend + `/api`

---

## 💰 SOBRE LOS COSTOS

- Railway da **$5 USD gratis al mes**
- Para este proyecto pequeño, debería ser suficiente para pruebas
- Si necesitas más, el plan Hobby cuesta $5 USD/mes

---

## 🎉 ¡LISTO!

Si seguiste todos los pasos, tu aplicación debería estar funcionando en:
- **Frontend:** https://frontend-xxxx.up.railway.app
- **Backend API:** https://backend-xxxx.up.railway.app/api
- **API Docs:** https://backend-xxxx.up.railway.app/docs

**Credenciales iniciales:**
- Usuario: `admin`
- Password: `admin123`

⚠️ **Cambia la contraseña del admin inmediatamente después del primer login**
