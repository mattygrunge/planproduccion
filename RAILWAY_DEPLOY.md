# 🚂 Guía de Despliegue en Railway

Esta guía te ayudará a desplegar el proyecto Plan Producción en Railway paso a paso.

## 📋 Requisitos Previos

1. Cuenta en [Railway](https://railway.app/)
2. El código subido a un repositorio de GitHub
3. Una base de datos PostgreSQL (Railway la proporciona)

## 🏗️ Arquitectura del Despliegue

El proyecto se despliega como **dos servicios separados**:

```
┌─────────────────────────────────────────────────────────┐
│                    Railway Project                       │
├─────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   Backend    │  │   Frontend   │  │  PostgreSQL  │  │
│  │   (FastAPI)  │──│    (React)   │──│   Database   │  │
│  │   /backend   │  │   /frontend  │  │  (Add-on)    │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
```

## 📝 Pasos para el Despliegue

### Paso 1: Crear un Nuevo Proyecto en Railway

1. Ve a [Railway](https://railway.app/) e inicia sesión
2. Click en **"New Project"**
3. Selecciona **"Deploy from GitHub repo"**
4. Conecta tu cuenta de GitHub si no lo has hecho
5. Selecciona el repositorio `planproduccion`

### Paso 2: Agregar Base de Datos PostgreSQL

1. En tu proyecto de Railway, click en **"+ New"**
2. Selecciona **"Database"** → **"Add PostgreSQL"**
3. Railway creará automáticamente la base de datos
4. La variable `DATABASE_URL` se configurará automáticamente

### Paso 3: Desplegar el Backend

1. En tu proyecto, click en **"+ New"** → **"GitHub Repo"**
2. Selecciona el mismo repositorio
3. **⚠️ MUY IMPORTANTE: Configurar Root Directory**
   - Ve a **Settings** del servicio
   - En la sección **"Source"**, busca **"Root Directory"**
   - Escribe: `backend`
   - Click en el checkmark para guardar
   - Espera a que se redesplegue automáticamente
4. Ve a **Settings** → **Variables** y agrega:

   ```
   SECRET_KEY=tu-clave-secreta-muy-segura-de-32-caracteres-minimo
   CORS_ORIGINS=https://tu-frontend.up.railway.app
   ```

5. En **Settings** → **Networking**, genera un dominio público
6. Anota la URL del backend (ej: `https://backend-production-xxxx.up.railway.app`)

### Paso 4: Desplegar el Frontend

1. En tu proyecto, click en **"+ New"** → **"GitHub Repo"**
2. Selecciona el mismo repositorio
3. Configura la carpeta raíz como **`frontend`**
   - Settings → Source → Root Directory: `frontend`
4. Ve a **Settings** → **Variables** y agrega:

   ```
   VITE_API_URL=https://tu-backend.up.railway.app/api
   ```
   
   > ⚠️ **IMPORTANTE**: Reemplaza la URL con la URL real del backend del paso anterior

5. En **Settings** → **Networking**, genera un dominio público
6. Anota la URL del frontend

### Paso 5: Actualizar CORS del Backend

1. Vuelve al servicio del **Backend**
2. Ve a **Settings** → **Variables**
3. Actualiza `CORS_ORIGINS` con la URL real del frontend:

   ```
   CORS_ORIGINS=https://tu-frontend.up.railway.app
   ```

4. El servicio se reiniciará automáticamente

### Paso 6: Inicializar la Base de Datos

La base de datos se inicializa automáticamente cuando el backend inicia. Incluye:
- Tablas del sistema
- Roles predefinidos (admin, supervisor, operador)
- Usuario admin inicial

**Usuario Admin por Defecto:**
- Username: `admin`
- Password: `admin123`

> ⚠️ **IMPORTANTE**: Cambia la contraseña del admin inmediatamente después del primer login

## 🔧 Variables de Entorno

### Backend (Requeridas)

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `DATABASE_URL` | URL de PostgreSQL (automática) | `postgresql://...` |
| `SECRET_KEY` | Clave para JWT (32+ caracteres) | `mi-clave-super-secreta-123` |
| `CORS_ORIGINS` | URLs permitidas (separadas por coma) | `https://frontend.railway.app` |

### Backend (Opcionales)

| Variable | Descripción | Default |
|----------|-------------|---------|
| `PORT` | Puerto del servidor | `8000` (Railway asigna) |

### Frontend (Requeridas)

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `VITE_API_URL` | URL de la API del backend | `https://backend.railway.app/api` |

## ✅ Verificación del Despliegue

### Verificar Backend

1. Abre la URL del backend en el navegador
2. Deberías ver:
   ```json
   {
     "message": "Plan Producción API",
     "version": "1.0.0",
     "docs": "/docs"
   }
   ```
3. Visita `/docs` para ver la documentación de la API
4. Visita `/health` para verificar el estado

### Verificar Frontend

1. Abre la URL del frontend en el navegador
2. Deberías ver la página de login
3. Intenta iniciar sesión con `admin` / `admin123`

## 🐛 Solución de Problemas

### Error: "CORS policy"

- Verifica que `CORS_ORIGINS` en el backend incluya la URL exacta del frontend
- Asegúrate de no incluir "/" al final de la URL
- Reinicia el servicio del backend después de cambiar la variable

### Error: "Cannot connect to database"

- Verifica que el servicio de PostgreSQL esté activo
- Railway debería conectar automáticamente `DATABASE_URL`
- Ve a la base de datos → Connect → Internal y verifica la conexión

### Error de Build en Frontend

- Verifica que `VITE_API_URL` esté configurado correctamente
- Las variables de Vite deben empezar con `VITE_`

### Error de Build en Backend

- Verifica que `requirements.txt` tenga todas las dependencias
- Revisa los logs de build en Railway

## 📊 Monitoreo

Railway proporciona:
- **Logs**: Vista en tiempo real de los logs de cada servicio
- **Metrics**: CPU, memoria y uso de red
- **Alerts**: Configurables para errores y uso de recursos

## 💰 Costos

Railway ofrece:
- **Plan Gratuito**: $5 USD de crédito mensual (suficiente para pruebas)
- **Plan Hobby**: $5 USD/mes por proyecto
- **Plan Pro**: Desde $20 USD/mes

Para este proyecto, el plan Hobby debería ser suficiente para producción básica.

## 🔄 Actualizaciones

Cada vez que hagas push a la rama principal de GitHub:
1. Railway detectará los cambios automáticamente
2. Ejecutará el build de cada servicio modificado
3. Desplegará la nueva versión sin downtime

## 📁 Estructura de Archivos de Configuración

```
├── backend/
│   ├── railway.json      # Configuración de Railway para backend
│   ├── Procfile          # Comando de inicio
│   ├── requirements.txt  # Dependencias Python
│   └── .env.example      # Variables de entorno ejemplo
├── frontend/
│   ├── railway.json      # Configuración de Railway para frontend
│   ├── package.json      # Dependencias Node.js
│   └── .env.example      # Variables de entorno ejemplo
└── RAILWAY_DEPLOY.md     # Esta guía
```

## 🎉 ¡Listo!

Tu aplicación debería estar funcionando en Railway. 

URLs de ejemplo:
- Frontend: `https://frontend-production-xxxx.up.railway.app`
- Backend API: `https://backend-production-xxxx.up.railway.app/api`
- API Docs: `https://backend-production-xxxx.up.railway.app/docs`
