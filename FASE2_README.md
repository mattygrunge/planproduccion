# 🚀 FASE 2 - Maestros: Sectores, Líneas, Productos, Clientes

## ✅ Lo que se implementó

### Backend (FastAPI + PostgreSQL)

#### Nuevos Modelos
- **Sector**: Sectores de producción (id, nombre, descripcion, activo)
- **Linea**: Líneas de producción vinculadas a sectores (id, nombre, descripcion, sector_id, activo)
- **Producto**: Catálogo de productos (id, codigo, nombre, descripcion, unidad_medida, precio_unitario, activo)
- **Cliente**: Base de clientes (id, codigo, nombre, razon_social, cuit, direccion, telefono, email, contacto, activo)

#### Endpoints CRUD

| Entidad | Método | Endpoint | Descripción | Rol Requerido |
|---------|--------|----------|-------------|---------------|
| Sectores | GET | `/api/sectores` | Listar con paginación y filtros | Usuario autenticado |
| Sectores | GET | `/api/sectores/{id}` | Obtener por ID | Usuario autenticado |
| Sectores | POST | `/api/sectores` | Crear nuevo | **Admin** |
| Sectores | PUT | `/api/sectores/{id}` | Actualizar | **Admin** |
| Sectores | DELETE | `/api/sectores/{id}` | Eliminar | **Admin** |
| Líneas | GET | `/api/lineas` | Listar con paginación y filtros | Usuario autenticado |
| Líneas | GET | `/api/lineas/{id}` | Obtener por ID | Usuario autenticado |
| Líneas | POST | `/api/lineas` | Crear nueva | **Admin** |
| Líneas | PUT | `/api/lineas/{id}` | Actualizar | **Admin** |
| Líneas | DELETE | `/api/lineas/{id}` | Eliminar | **Admin** |
| Productos | GET | `/api/productos` | Listar con paginación y filtros | Usuario autenticado |
| Productos | GET | `/api/productos/{id}` | Obtener por ID | Usuario autenticado |
| Productos | POST | `/api/productos` | Crear nuevo | **Admin** |
| Productos | PUT | `/api/productos/{id}` | Actualizar | **Admin** |
| Productos | DELETE | `/api/productos/{id}` | Eliminar | **Admin** |
| Clientes | GET | `/api/clientes` | Listar con paginación y filtros | Usuario autenticado |
| Clientes | GET | `/api/clientes/{id}` | Obtener por ID | Usuario autenticado |
| Clientes | POST | `/api/clientes` | Crear nuevo | **Admin** |
| Clientes | PUT | `/api/clientes/{id}` | Actualizar | **Admin** |
| Clientes | DELETE | `/api/clientes/{id}` | Eliminar | **Admin** |

### Frontend (React + TypeScript + Vite)

- **Panel de Administración**: Acceso desde el Dashboard (solo visible para admin)
- **AdminLayout**: Layout con barra lateral para navegación
- **Pantallas CRUD**:
  - Sectores: Listado, crear, editar, eliminar
  - Líneas: Listado con filtro por sector, crear, editar, eliminar
  - Productos: Listado, crear, editar, eliminar
  - Clientes: Listado, crear, editar, eliminar
- **Protección de rutas**: Solo el rol `admin` puede acceder a `/admin/*`
- **Paginación y búsqueda** en todos los listados

---

## 📋 INSTRUCCIONES PARA PROBAR

### 1. Actualizar la base de datos

Si ya tenías la base de datos de la Fase 1, ejecutá el script de inicialización para crear las nuevas tablas:

```bash
cd backend
python -m app.scripts.init_db
```

Esto creará las tablas: `sectores`, `lineas`, `productos`, `clientes`

### 2. Iniciar el backend

```bash
cd backend
uvicorn main:app --reload
```

El backend estará disponible en: `http://localhost:8000`
Documentación API: `http://localhost:8000/docs`

### 3. Iniciar el frontend (en otra terminal)

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

### ✅ Prueba 1: Acceso al Panel de Administración
1. Iniciá sesión con el usuario `admin`
2. En el Dashboard deberías ver el "Panel de Administración"
3. Hacé clic en "Sectores" para ir a la pantalla de gestión

### ✅ Prueba 2: Crear un Sector
1. En la pantalla de Sectores, hacé clic en "+ Nuevo Sector"
2. Completá:
   - Nombre: `Sector A`
   - Descripción: `Primer sector de producción`
   - Activo: ✓
3. Hacé clic en "Guardar"
4. Deberías ver el sector en la lista

### ✅ Prueba 3: Crear una Línea
1. Andá a la pantalla de Líneas
2. Hacé clic en "+ Nueva Línea"
3. Completá:
   - Nombre: `Línea 1`
   - Sector: `Sector A` (el que creaste)
   - Descripción: `Primera línea`
   - Activo: ✓
4. Hacé clic en "Guardar"

### ✅ Prueba 4: Crear un Producto
1. Andá a la pantalla de Productos
2. Hacé clic en "+ Nuevo Producto"
3. Completá:
   - Código: `PROD-001`
   - Nombre: `Producto de prueba`
   - Unidad: `Unidad`
   - Precio: `100.50`
   - Activo: ✓
4. Hacé clic en "Guardar"

### ✅ Prueba 5: Editar un registro
1. En cualquier listado, hacé clic en "Editar" en un registro
2. Modificá algún campo
3. Hacé clic en "Guardar"
4. Verificá que los cambios se guardaron

### ✅ Prueba 6: Eliminar un registro
1. Hacé clic en "Eliminar" en un registro
2. Confirmá la eliminación
3. El registro debería desaparecer de la lista

### ❌ Prueba 7: Usuario sin rol Admin
1. Cerrá sesión
2. Creá un usuario con rol `operador` (usando la API directamente o la DB)
3. Iniciá sesión con ese usuario
4. El Dashboard NO debería mostrar el Panel de Administración
5. Si intentás acceder directamente a `/admin/sectores`, serás redirigido al Dashboard

### 🔍 Prueba 8: Búsqueda y filtros
1. En Sectores, escribí parte del nombre y hacé clic en "Buscar"
2. En Líneas, usá el filtro de sector para ver solo líneas de un sector
3. En Productos, buscá por código o nombre

---

## 📁 Nuevos archivos creados

```
backend/
├── app/
│   ├── api/
│   │   ├── sectores.py          # CRUD endpoints sectores
│   │   ├── lineas.py            # CRUD endpoints líneas
│   │   ├── productos.py         # CRUD endpoints productos
│   │   └── clientes.py          # CRUD endpoints clientes
│   ├── models/
│   │   ├── sector.py            # Modelo Sector
│   │   ├── linea.py             # Modelo Linea
│   │   ├── producto.py          # Modelo Producto
│   │   └── cliente.py           # Modelo Cliente
│   └── schemas/
│       ├── sector.py            # Schemas Sector
│       ├── linea.py             # Schemas Linea
│       ├── producto.py          # Schemas Producto
│       └── cliente.py           # Schemas Cliente

frontend/
├── src/
│   ├── components/
│   │   ├── AdminLayout.tsx      # Layout de administración
│   │   ├── AdminLayout.css
│   │   └── AdminRoute.tsx       # Protección de rutas admin
│   └── pages/
│       └── admin/
│           ├── AdminPages.css   # Estilos compartidos
│           ├── Sectores.tsx     # Pantalla CRUD Sectores
│           ├── Lineas.tsx       # Pantalla CRUD Líneas
│           ├── Productos.tsx    # Pantalla CRUD Productos
│           └── Clientes.tsx     # Pantalla CRUD Clientes
```

---

## 📊 Resumen de Validaciones

- **Sectores**: Nombre único requerido, no se puede eliminar si tiene líneas asociadas
- **Líneas**: Nombre requerido, sector obligatorio
- **Productos**: Código único requerido, nombre requerido
- **Clientes**: Código único requerido, CUIT único opcional

---

## ⏸️ FASE 2 COMPLETADA

**Cuando hayas verificado que todo funciona correctamente, respondé:**

> "OK, Fase 2 aprobada"

Y continuaremos con la **Fase 3**.
