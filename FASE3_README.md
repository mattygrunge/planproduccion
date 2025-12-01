# FASE 3 – Estados de Línea

## Objetivo
Permitir registrar estados de línea (datos en la BD) sin timeline todavía.

## ¿Qué se implementó?

### Backend

#### 1. Modelo `EstadoLinea` (`backend/app/models/estado_linea.py`)
Campos del modelo:
- `id`: Identificador único
- `sector_id`: Relación con el sector (FK)
- `linea_id`: Relación con la línea (FK)
- `tipo_estado`: Tipo de estado de la línea
- `fecha_hora_inicio`: Fecha y hora de inicio del estado
- `fecha_hora_fin`: Fecha y hora de fin del estado (opcional)
- `duracion_minutos`: Duración en minutos (se calcula automáticamente si hay fecha_fin)
- `observaciones`: Observaciones adicionales
- `usuario_id`: Usuario que registró el estado (FK)
- `activo`: Estado activo/inactivo
- `created_at`: Fecha de creación
- `updated_at`: Fecha de última actualización

#### 2. Tipos de Estado disponibles:
| Valor | Etiqueta |
|-------|----------|
| `produccion` | Producción |
| `parada_programada` | Parada Programada |
| `parada_no_programada` | Parada No Programada |
| `mantenimiento` | Mantenimiento |
| `limpieza` | Limpieza |
| `cambio_formato` | Cambio de Formato |
| `sin_demanda` | Sin Demanda |
| `otro` | Otro |

#### 3. Endpoints CRUD (`backend/app/api/estados_linea.py`)

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/estados-linea/tipos-estado` | Lista todos los tipos de estado disponibles |
| GET | `/api/estados-linea` | Lista estados con paginación y filtros |
| GET | `/api/estados-linea/{id}` | Obtiene un estado por ID |
| POST | `/api/estados-linea` | Crea un nuevo estado |
| PUT | `/api/estados-linea/{id}` | Actualiza un estado |
| DELETE | `/api/estados-linea/{id}` | Elimina un estado (solo admin) |

**Filtros disponibles en el listado:**
- `sector_id`: Filtrar por sector
- `linea_id`: Filtrar por línea
- `tipo_estado`: Filtrar por tipo de estado
- `fecha_desde`: Filtrar desde fecha
- `fecha_hasta`: Filtrar hasta fecha
- `activo`: Filtrar por estado activo

### Frontend

#### 1. Página de Estados de Línea (`frontend/src/pages/admin/EstadosLinea.tsx`)
- **Listado**: Tabla con paginación mostrando todos los estados
- **Filtros**: Por sector, línea y tipo de estado
- **Formulario de creación/edición**: Modal con campos para:
  - Selector de sector
  - Selector de línea (filtrado por sector seleccionado)
  - Tipo de estado
  - Fecha/hora de inicio
  - Fecha/hora de fin (opcional)
  - Duración en minutos (se calcula automáticamente)
  - Observaciones

#### 2. Navegación
Se agregó una nueva sección "Operaciones" en el menú lateral con acceso a "Estados de Línea".

#### 3. Estilos
- Badges con colores para cada tipo de estado
- Soporte para inputs de fecha/hora
- Mejoras en filtros con múltiples selects

## Cómo crear un nuevo Estado de Línea

1. **Acceder a la sección**: Navega a `/admin/estados-linea` o haz clic en "Estados de Línea" en la sección "Operaciones" del menú lateral.

2. **Crear nuevo estado**: Haz clic en el botón "+ Nuevo Estado".

3. **Completar el formulario**:
   - Selecciona el **Sector**
   - Selecciona la **Línea** (solo muestra líneas del sector seleccionado)
   - Selecciona el **Tipo de Estado**
   - Indica la **Fecha/Hora de Inicio** (por defecto es la fecha/hora actual)
   - (Opcional) Indica la **Fecha/Hora de Fin**
   - (Opcional) La **Duración** se calcula automáticamente si hay fecha fin, o puedes ingresarla manualmente
   - (Opcional) Agrega **Observaciones**

4. **Guardar**: Haz clic en "Guardar" para crear el estado.

## Cómo ver los Estados de Línea

1. **Ver listado**: Navega a `/admin/estados-linea` para ver todos los estados registrados.

2. **Usar filtros**: Utiliza los selectores en la parte superior para filtrar por:
   - Sector
   - Línea (se filtra automáticamente según el sector seleccionado)
   - Tipo de estado

3. **Paginación**: Si hay muchos registros, usa los botones de paginación en la parte inferior.

4. **Editar**: Haz clic en "Editar" para modificar un estado existente.

5. **Eliminar**: Haz clic en "Eliminar" para borrar un estado (requiere confirmación, solo administradores).

## Pasos para probar

### 1. Reiniciar el backend (crear la tabla nueva)
```bash
cd backend
# Si usas Windows
python -c "from app.core.database import engine, Base; from app.models import *; Base.metadata.create_all(bind=engine)"
# Luego iniciar el servidor
uvicorn main:app --reload
```

### 2. Iniciar el frontend
```bash
cd frontend
npm run dev
```

### 3. Probar la funcionalidad
1. Iniciar sesión como administrador
2. Ir a "Estados de Línea" en el menú lateral (sección Operaciones)
3. Crear un nuevo estado seleccionando sector, línea, tipo de estado y fechas
4. Verificar que el estado aparece en el listado
5. Probar los filtros por sector, línea y tipo
6. Editar un estado existente
7. Eliminar un estado

## Archivos creados/modificados

### Nuevos archivos:
- `backend/app/models/estado_linea.py`
- `backend/app/schemas/estado_linea.py`
- `backend/app/api/estados_linea.py`
- `frontend/src/pages/admin/EstadosLinea.tsx`

### Archivos modificados:
- `backend/app/models/__init__.py`
- `backend/app/schemas/__init__.py`
- `backend/main.py`
- `frontend/src/api/api.ts`
- `frontend/src/components/AdminLayout.tsx`
- `frontend/src/App.tsx`
- `frontend/src/pages/admin/AdminPages.css`

## Próximos pasos (FASE 4)
- Implementar visualización Timeline de estados
- Agregar gráficos de estados por período
- Dashboard con resumen de estados

---

## ⚠️ IMPORTANTE: Verificación requerida

Por favor verifica:
1. ✅ Que puedes crear estados y se guardan correctamente en la BD
2. ✅ Que el listado muestra los estados creados
3. ✅ Que los filtros funcionan correctamente
4. ✅ Que puedes editar y eliminar estados

**Confirma que los datos se guardan y se muestran correctamente antes de continuar con la siguiente fase.**
