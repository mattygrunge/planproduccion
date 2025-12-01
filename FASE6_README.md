# FASE 6 – Historial de Producción

## Objetivo
Crear una pantalla para visualizar la producción histórica tipo Excel, con filtros avanzados y exportación a CSV.

## Archivos Creados/Modificados

### Backend
- `backend/app/api/historial.py` - API de historial con filtros y exportación
- `backend/main.py` - Registro del router de historial

### Frontend
- `frontend/src/pages/Historial.tsx` - Componente de historial
- `frontend/src/pages/Historial.css` - Estilos de la página
- `frontend/src/api/api.ts` - Interfaces y funciones de API
- `frontend/src/pages/Dashboard.tsx` - Enlace al historial
- `frontend/src/App.tsx` - Ruta `/historial`

---

## Cómo usar los Filtros

### 1. Filtro por Fecha
- **Fecha Desde**: Selecciona la fecha de inicio del rango a consultar
- **Fecha Hasta**: Selecciona la fecha de fin del rango a consultar
- Los filtros de fecha son inclusivos (incluyen las fechas seleccionadas)

**Ejemplos de uso:**
- Ver producción de este mes: Desde el 1° del mes hasta hoy
- Ver producción de un día específico: Misma fecha en ambos campos
- Ver todo el histórico: Dejar ambos campos vacíos

### 2. Filtro por Producto
- Selecciona un producto específico del dropdown
- Muestra solo los lotes de ese producto
- Selecciona "Todos los productos" para ver todos

### 3. Búsqueda por Nº de Lote
- Escribe parte del número de lote
- La búsqueda es parcial (busca coincidencias)
- Ejemplo: "001" encontrará "L-001", "2024001", etc.

### 4. Ordenamiento
- Haz clic en las columnas con flechas (↕️) para ordenar
- **Nº Lote**: Ordena alfabéticamente por número de lote
- **Litros**: Ordena por litros totales (de mayor a menor o viceversa)
- **F. Producción**: Ordena por fecha de producción (más reciente primero por defecto)

**Indicadores:**
- ⬆️ = Orden ascendente (menor a mayor)
- ⬇️ = Orden descendente (mayor a menor)
- ↕️ = Columna no ordenada actualmente

---

## Cómo Exportar a CSV

### Pasos para exportar:
1. **Aplica los filtros** que desees (opcional)
2. Haz clic en el botón **"📥 Exportar CSV"**
3. El archivo se descargará automáticamente
4. El archivo incluye TODOS los lotes que coincidan con los filtros (no solo la página actual)

### Formato del CSV:
- **Separador**: Punto y coma (;)
- **Codificación**: UTF-8
- **Nombre del archivo**: `historial_produccion_YYYYMMDD.csv`

### Columnas del CSV:
| Columna | Descripción |
|---------|-------------|
| Nº Lote | Número identificador del lote |
| Producto Código | Código del producto |
| Producto Nombre | Nombre del producto |
| Pallets | Cantidad de pallets |
| Parciales | Unidades sueltas |
| Unid/Pallet | Unidades por pallet |
| Litros Totales | Total de litros producidos |
| Fecha Producción | Fecha de producción (YYYY-MM-DD) |
| Fecha Vencimiento | Fecha de vencimiento (YYYY-MM-DD) |
| Link SENASA | URL de trazabilidad |
| Observaciones | Notas adicionales |

### Abrir en Excel:
1. Abre Excel
2. Ve a **Datos > Desde texto/CSV**
3. Selecciona el archivo descargado
4. En la ventana de importación:
   - Origen del archivo: **UTF-8**
   - Delimitador: **Punto y coma**
5. Haz clic en **Cargar**

---

## Panel de Estadísticas

El panel de estadísticas muestra un resumen de los datos filtrados:

| Tarjeta | Descripción |
|---------|-------------|
| 📦 **Lotes** | Total de lotes en el resultado |
| 💧 **Litros Totales** | Suma de todos los litros |
| 📋 **Pallets** | Suma de todos los pallets |
| 🏷️ **Productos** | Cantidad de productos diferentes |

**Nota:** Las estadísticas se actualizan automáticamente cuando aplicas filtros.

---

## Endpoints de API

### GET `/api/historial`
Obtener historial con filtros y paginación.

**Parámetros:**
| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| page | int | Número de página (default: 1) |
| size | int | Registros por página (default: 20, max: 100) |
| fecha_desde | date | Fecha de producción desde |
| fecha_hasta | date | Fecha de producción hasta |
| producto_id | int | ID del producto |
| numero_lote | string | Búsqueda parcial de lote |
| orden_campo | string | Campo para ordenar (fecha_produccion, numero_lote, litros_totales) |
| orden_direccion | string | Dirección (asc, desc) |

**Respuesta:**
```json
{
  "items": [...],
  "estadisticas": {
    "total_lotes": 150,
    "total_litros": 75000.50,
    "total_pallets": 500,
    "total_parciales": 125,
    "productos_unicos": 8,
    "fecha_primer_lote": "2024-01-15",
    "fecha_ultimo_lote": "2024-12-01"
  },
  "filtros_aplicados": {
    "fecha_desde": "2024-01-01",
    "producto_id": 5
  },
  "total": 150,
  "page": 1,
  "size": 20,
  "pages": 8
}
```

### GET `/api/historial/exportar/csv`
Exportar historial a CSV.

**Parámetros:** Los mismos que `/api/historial` (excepto page y size)

**Respuesta:** Archivo CSV para descarga

### GET `/api/historial/estadisticas`
Obtener estadísticas agregadas por producto.

**Parámetros:**
| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| fecha_desde | date | Fecha de producción desde |
| fecha_hasta | date | Fecha de producción hasta |

**Respuesta:**
```json
{
  "general": {
    "total_lotes": 150,
    "total_litros": 75000.50,
    "total_pallets": 500,
    "total_parciales": 125
  },
  "por_producto": [
    {
      "producto_id": 1,
      "producto_codigo": "PROD001",
      "producto_nombre": "Aceite Premium",
      "total_lotes": 50,
      "total_litros": 25000.00,
      "total_pallets": 180
    },
    ...
  ],
  "filtros": {
    "fecha_desde": "2024-01-01",
    "fecha_hasta": null
  }
}
```

---

## Comparación con Excel

La pantalla de Historial fue diseñada para reemplazar el seguimiento en Excel. Aquí hay una comparación:

| Característica | Excel Tradicional | Historial Web |
|---------------|-------------------|---------------|
| **Acceso** | Solo en la PC donde está el archivo | Desde cualquier lugar con internet |
| **Filtros** | Manualmente | Con un clic |
| **Actualización** | Manual | Automática en tiempo real |
| **Exportación** | Guardar como | Un botón, siempre el mismo formato |
| **Estadísticas** | Fórmulas manuales | Automáticas |
| **Ordenamiento** | Manualmente | Con un clic en la columna |
| **Búsqueda** | Ctrl+F | Filtro integrado |
| **Múltiples usuarios** | Problemas de versiones | Todos ven lo mismo |
| **Historial de cambios** | Difícil de rastrear | Registrado automáticamente |

---

## Acceso a la Pantalla

Hay dos formas de acceder al Historial:

1. **Desde el Dashboard**: Clic en el botón "Historial de Producción"
2. **URL directa**: `http://localhost:5174/historial`

---

## Próximos pasos

Te pido que compares mentalmente esta pantalla con tu Excel actual y me comentes:

1. ¿Los filtros cubren las búsquedas que hacés habitualmente?
2. ¿Falta alguna columna en la tabla?
3. ¿El formato del CSV exportado es compatible con tu flujo de trabajo?
4. ¿Necesitás algún filtro adicional (por ejemplo, por cliente)?
5. ¿Las estadísticas mostradas son útiles?
