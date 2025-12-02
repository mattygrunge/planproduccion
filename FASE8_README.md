# FASE 8: Sistema de IDs Automáticos

## Descripción

Esta fase implementa un sistema de generación automática de códigos/IDs únicos para todas las entidades del sistema.

## Formato de los Códigos

Los códigos siguen el formato: **PREFIJO + AÑO (2 dígitos) + SECUENCIA (4 dígitos)**

### Ejemplos:
- **PD250001** - Producto, año 2025, secuencia 0001
- **SC250001** - Sector, año 2025, secuencia 0001
- **LN250001** - Línea, año 2025, secuencia 0001
- **CL250001** - Cliente, año 2025, secuencia 0001
- **EL250001** - Estado de Línea, año 2025, secuencia 0001
- **LT250001** - Lote, año 2025, secuencia 0001
- **US250001** - Usuario, año 2025, secuencia 0001
- **RL250001** - Rol, año 2025, secuencia 0001

## Prefijos por Entidad

| Entidad | Prefijo | Ejemplo |
|---------|---------|---------|
| Producto | PD | PD250001 |
| Sector | SC | SC250001 |
| Línea | LN | LN250001 |
| Cliente | CL | CL250001 |
| Estado de Línea | EL | EL250001 |
| Lote | LT | LT250001 |
| Usuario | US | US250001 |
| Rol | RL | RL250001 |

## Archivos Modificados/Creados

### Nuevo Archivo:
- `backend/app/core/id_generator.py` - Utilidad para generación de códigos

### Modelos Actualizados (campo `codigo` agregado):
- `backend/app/models/sector.py`
- `backend/app/models/linea.py`
- `backend/app/models/estado_linea.py`
- `backend/app/models/lote.py`
- `backend/app/models/user.py` (User y Role)

### Schemas Actualizados (campo `codigo` en respuestas):
- `backend/app/schemas/sector.py`
- `backend/app/schemas/linea.py`
- `backend/app/schemas/estado_linea.py`
- `backend/app/schemas/lote.py`
- `backend/app/schemas/producto.py`
- `backend/app/schemas/cliente.py`
- `backend/app/schemas/user.py`
- `backend/app/schemas/role.py`

### APIs Actualizadas (generación automática de código):
- `backend/app/api/sectores.py`
- `backend/app/api/lineas.py`
- `backend/app/api/clientes.py`
- `backend/app/api/productos.py`
- `backend/app/api/estados_linea.py`
- `backend/app/api/lotes.py`
- `backend/app/api/users.py`
- `backend/app/api/auth.py`

### Script de Inicialización:
- `backend/app/scripts/init_db.py` - Actualizado para generar códigos en roles y usuario admin

## Características del Sistema

1. **Generación Automática**: Los códigos se generan automáticamente al crear cualquier registro.
2. **Año Incorporado**: El año se incorpora en el código (2 dígitos), permitiendo reiniciar la secuencia cada año.
3. **Secuencia Única por Tipo**: Cada tipo de entidad tiene su propia secuencia independiente.
4. **No Editable**: Los códigos no pueden ser modificados una vez asignados.
5. **Búsqueda**: Los códigos son indexados y se pueden usar para buscar registros.

## Uso

Los códigos se generan automáticamente al crear registros. No es necesario proporcionarlos en la creación.

### Ejemplo de creación de producto:
```json
POST /api/productos
{
  "nombre": "Producto ABC",
  "descripcion": "Descripción del producto",
  "unidad_medida": "unidad",
  "precio_unitario": 100.0
}
```

Respuesta:
```json
{
  "id": 1,
  "codigo": "PD250001",
  "nombre": "Producto ABC",
  "descripcion": "Descripción del producto",
  ...
}
```

## Migración de Base de Datos

**IMPORTANTE**: Si ya tienes datos en la base de datos, necesitarás:

1. Eliminar la base de datos existente (o hacer backup)
2. Recrear las tablas con las nuevas columnas
3. Ejecutar el script de inicialización:

```bash
cd backend
python -m app.scripts.init_db
```

O simplemente eliminar el archivo `planproduccion.db` y reiniciar el servidor.

## Notas Técnicas

- La función `generar_codigo()` en `id_generator.py` es la base para todas las generaciones de código.
- Cada entidad tiene su propia función wrapper (ej: `generar_codigo_producto()`, `generar_codigo_sector()`, etc.)
- La secuencia se reinicia automáticamente cada año cuando cambia el año del sistema.
- Los códigos son case-sensitive y siempre en mayúsculas.
