# FASE 7 – Roles, Seguridad y Auditoría

## ✅ Estado: COMPLETADA

## 🎯 Objetivo
Cerrar todo el circuito de seguridad con un sistema completo de auditoría.

---

## 📋 Tareas Completadas

### 1. Confirmación de Roles en Endpoints
Se verificó que cada endpoint respeta los roles correctamente:

| Endpoint | GET (Lectura) | POST/PUT (Escritura) | DELETE |
|----------|---------------|----------------------|--------|
| `/api/productos` | `get_current_user` | `get_current_active_admin` | `get_current_active_admin` |
| `/api/lotes` | `get_current_user` | `get_current_user` | `get_current_user` |
| `/api/estados-linea` | `get_current_user` | `get_current_user` | `get_current_active_admin` |
| `/api/sectores` | `get_current_user` | `get_current_active_admin` | `get_current_active_admin` |
| `/api/lineas` | `get_current_user` | `get_current_active_admin` | `get_current_active_admin` |
| `/api/clientes` | `get_current_user` | `get_current_active_admin` | `get_current_active_admin` |
| `/api/auditoria` | `get_current_active_admin` | N/A (solo lectura) | N/A |

### 2. Sistema de Logging de Auditoría

#### Modelo de Datos (`backend/app/models/audit_log.py`)
```python
class AuditLog:
    id: int
    usuario_id: int | None
    usuario_username: str | None
    accion: str              # crear, editar, eliminar
    entidad: str             # producto, lote, usuario, estado_linea, etc.
    entidad_id: int
    entidad_descripcion: str | None
    datos_anteriores: str    # JSON con valores anteriores
    datos_nuevos: str        # JSON con valores nuevos
    fecha_hora: datetime
    ip_address: str | None
    user_agent: str | None
```

#### Servicio de Auditoría (`backend/app/core/audit.py`)
Funciones disponibles:
- `audit_crear()` - Registra creación de registros
- `audit_editar()` - Registra ediciones con diff de cambios
- `audit_eliminar()` - Registra eliminaciones
- `get_client_info()` - Extrae IP y User-Agent del request

### 3. Eventos que se Loguean

Se registran automáticamente las siguientes acciones:

| Entidad | Crear | Editar | Eliminar |
|---------|-------|--------|----------|
| **Productos** | ✅ | ✅ | ✅ |
| **Lotes** | ✅ | ✅ | ✅ |
| **Estados de Línea** | ✅ | ✅ | ✅ |

Cada registro incluye:
- Usuario que realizó la acción
- Fecha y hora exacta (UTC)
- Descripción del registro afectado
- Valores anteriores (para edición/eliminación)
- Valores nuevos (para creación/edición)
- Dirección IP del cliente
- User-Agent del navegador

### 4. Endpoint de Auditoría (Solo Lectura)

#### `GET /api/auditoria`
Lista logs de auditoría con paginación y filtros:
- `page`: Número de página
- `size`: Tamaño de página (1-100)
- `accion`: Filtrar por tipo de acción
- `entidad`: Filtrar por tipo de entidad
- `usuario_id`: Filtrar por usuario
- `fecha_desde`: Filtrar desde fecha
- `fecha_hasta`: Filtrar hasta fecha
- `search`: Buscar en descripción o username

#### `GET /api/auditoria/estadisticas`
Estadísticas de auditoría:
- Total de registros
- Cantidad por acción (crear, editar, eliminar)
- Cantidad por entidad
- Top 10 usuarios más activos

#### `GET /api/auditoria/{log_id}`
Detalle de un log específico

### 5. Pantalla Frontend de Auditoría

Nueva pantalla en `/admin/auditoria` que incluye:
- **Dashboard de estadísticas** con contadores visuales
- **Filtros** por acción, entidad, fecha y búsqueda
- **Tabla de logs** con paginación
- **Modal de detalle** con JSON formateado de cambios
- **Solo lectura** - No se pueden modificar ni eliminar logs

---

## 📁 Archivos Creados/Modificados

### Backend
- `backend/app/models/audit_log.py` - Modelo de AuditLog
- `backend/app/models/__init__.py` - Exportar AuditLog
- `backend/app/core/audit.py` - Servicio de auditoría
- `backend/app/schemas/audit_log.py` - Schemas de auditoría
- `backend/app/api/auditoria.py` - Endpoint de auditoría
- `backend/main.py` - Registrar router de auditoría
- `backend/app/api/productos.py` - Agregar logging
- `backend/app/api/lotes.py` - Agregar logging
- `backend/app/api/estados_linea.py` - Agregar logging

### Frontend
- `frontend/src/pages/admin/Auditoria.tsx` - Componente de auditoría
- `frontend/src/pages/admin/Auditoria.css` - Estilos
- `frontend/src/App.tsx` - Agregar ruta
- `frontend/src/components/AdminLayout.tsx` - Agregar menú

---

## 🔧 Cómo Probar

### 1. Crear la tabla de auditoría
```bash
cd backend
python create_tables.py
```

### 2. Iniciar los servidores
```bash
# Terminal 1 - Backend
cd backend
uvicorn main:app --reload

# Terminal 2 - Frontend
cd frontend
npm run dev
```

### 3. Probar la auditoría
1. Iniciar sesión como **admin**
2. Crear, editar o eliminar un **producto** o **lote**
3. Ir a la sección **Seguridad → Auditoría**
4. Verificar que aparece el registro con:
   - Usuario que hizo el cambio
   - Tipo de acción (Creación, Edición, Eliminación)
   - Entidad afectada
   - Fecha y hora
   - Click en "Ver" para ver el detalle completo con los datos anteriores y nuevos

### 4. Verificar filtros
- Filtrar por acción (crear/editar/eliminar)
- Filtrar por entidad (producto/lote/estado_linea)
- Buscar por nombre de usuario
- Filtrar por rango de fechas

---

## 🔒 Seguridad

- El endpoint de auditoría es **solo lectura**
- Solo usuarios **admin** pueden acceder a la auditoría
- Los logs **no se pueden modificar ni eliminar** desde la API
- Se registra la IP y User-Agent para trazabilidad
- Las contraseñas nunca se guardan en los logs (excluidas automáticamente)

---

## 📊 Estadísticas Disponibles

La pantalla de auditoría muestra:
- **Total de registros** de auditoría
- **Cantidad de creaciones** (badge verde)
- **Cantidad de ediciones** (badge amarillo)
- **Cantidad de eliminaciones** (badge rojo)

---

## ⚠️ Importante

Para que la auditoría funcione correctamente, **debes ejecutar `create_tables.py`** después de actualizar el código para crear la tabla `audit_logs` en la base de datos.

```bash
cd backend
python create_tables.py
