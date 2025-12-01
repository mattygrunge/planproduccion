# 🚀 FASE 1 - Sistema de Usuarios, Login y Roles

## ✅ Lo que se implementó

### Backend (FastAPI + PostgreSQL)
- **Modelos**: Usuario y Rol con SQLAlchemy
- **Autenticación**: Login con JWT (JSON Web Tokens)
- **Endpoints**:
  - `POST /api/auth/login` - Iniciar sesión
  - `GET /api/auth/me` - Obtener usuario actual (requiere token)
  - `GET /health` - Verificar estado del backend
- **Roles por defecto**: admin, supervisor, operador
- **Usuario admin inicial**: creado automáticamente

### Frontend (React + TypeScript + Vite)
- **Pantalla de Login**: Formulario con validación
- **Dashboard**: Página protegida que muestra info del usuario
- **Protección de rutas**: Redirige al login si no hay sesión
- **Manejo de token**: Guardado en localStorage

---

## 📋 INSTRUCCIONES PARA PROBAR

### 1. Configurar PostgreSQL

Asegurate de tener PostgreSQL instalado y corriendo. Luego creá la base de datos:

```sql
CREATE DATABASE planproduccion;
```

### 2. Configurar variables de entorno del backend

Creá el archivo `backend/.env` con tu configuración:

```bash
cd backend
copy .env.example .env
```

Editá `.env` con tus credenciales de PostgreSQL:
```
POSTGRES_USER=postgres
POSTGRES_PASSWORD=tu_password_aquí
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=planproduccion
SECRET_KEY=una-clave-secreta-larga-y-segura
```

### 3. Instalar dependencias del backend

```bash
cd backend
pip install -r requirements.txt
```

### 4. Inicializar la base de datos y crear usuario admin

```bash
cd backend
python -m app.scripts.init_db
```

Esto creará:
- Las tablas en la base de datos
- Los roles (admin, supervisor, operador)
- El usuario administrador inicial

### 5. Iniciar el backend

```bash
cd backend
uvicorn main:app --reload
```

El backend estará disponible en: `http://localhost:8000`
Documentación API: `http://localhost:8000/docs`

### 6. Iniciar el frontend (en otra terminal)

```bash
cd frontend
npm run dev
```

El frontend estará disponible en: `http://localhost:5173`

---

## 🔐 CREDENCIALES DEL ADMIN

```
Usuario: admin
Contraseña: admin123
```

---

## 🧪 PRUEBAS SUGERIDAS

### ✅ Prueba 1: Login correcto
1. Abrí `http://localhost:5173`
2. Ingresá usuario: `admin` y contraseña: `admin123`
3. Deberías ver el Dashboard con tu información

### ❌ Prueba 2: Login incorrecto
1. Ingresá usuario: `admin` y contraseña: `incorrecta`
2. Deberías ver el mensaje: "Usuario o contraseña incorrectos"

### 🚫 Prueba 3: Acceso sin token
1. Cerrá sesión (botón "Cerrar Sesión")
2. Intentá acceder directamente a `http://localhost:5173/dashboard`
3. Deberías ser redirigido al Login

### 🔍 Prueba 4: Token inválido
1. Abrí las DevTools del navegador (F12)
2. Andá a Application > Local Storage
3. Modificá el valor del token por cualquier texto
4. Recargá la página
5. Deberías ser redirigido al Login

### 📡 Prueba 5: API directa
Probá el endpoint de login con curl o desde la documentación:

```bash
curl -X POST "http://localhost:8000/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin123"}'
```

---

## 📁 Estructura de archivos creados

```
backend/
├── app/
│   ├── api/
│   │   ├── __init__.py
│   │   └── auth.py              # Endpoints de autenticación
│   ├── core/
│   │   ├── __init__.py
│   │   ├── config.py            # Configuración
│   │   ├── database.py          # Conexión a PostgreSQL
│   │   ├── deps.py              # Dependencias (get_current_user)
│   │   └── security.py          # JWT y hashing
│   ├── models/
│   │   ├── __init__.py
│   │   └── user.py              # Modelos User y Role
│   ├── schemas/
│   │   ├── __init__.py
│   │   ├── role.py              # Schemas de Role
│   │   └── user.py              # Schemas de User
│   └── scripts/
│       ├── __init__.py
│       └── init_db.py           # Script inicialización
├── .env.example
├── main.py
└── requirements.txt

frontend/
├── src/
│   ├── api/
│   │   └── api.ts               # Cliente API con axios
│   ├── components/
│   │   └── ProtectedRoute.tsx   # Componente protección rutas
│   ├── context/
│   │   ├── authContext.ts       # Contexto de auth
│   │   ├── AuthProvider.tsx     # Provider de auth
│   │   └── authTypes.ts         # Tipos de auth
│   ├── hooks/
│   │   └── useAuth.ts           # Hook de autenticación
│   ├── pages/
│   │   ├── Dashboard.css
│   │   ├── Dashboard.tsx        # Página Dashboard
│   │   ├── Login.css
│   │   └── Login.tsx            # Página Login
│   ├── App.css
│   ├── App.tsx                  # Configuración de rutas
│   └── main.tsx
└── package.json
```

---

## ⏸️ FASE 1 COMPLETADA

**Cuando hayas verificado que todo funciona correctamente, respondé:**

> "OK, Fase 1 aprobada"

Y continuaremos con la **Fase 2**.
