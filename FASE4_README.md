# FASE 4 - Timeline Visual

## ✅ Objetivo Completado
Transformar los estados de línea en un timeline gráfico que permite visualizar el estado de producción en tiempo real.

---

## 📋 Funcionalidades Implementadas

### Backend

#### Nuevo Endpoint: Timeline
- **URL**: `GET /api/estados-linea/timeline/{fecha}`
- **Parámetros de query opcionales**:
  - `sector_id`: Filtrar por sector específico
  - `linea_id`: Filtrar por línea específica
- **Respuesta**: Objeto JSON con:
  - `fecha`: La fecha consultada
  - `sectores`: Lista de sectores con sus líneas y estados
  - `estados`: Lista plana de todos los estados del día
  - `tipos_estado`: Lista de tipos de estado disponibles con sus labels

---

### Frontend

#### Componente Timeline (`/timeline`)
Componente visual completo con las siguientes características:

1. **Eje X - Horas del día**:
   - Muestra las 24 horas del día (00:00 a 23:00)
   - Cada hora ocupa 60 píxeles de ancho
   - Grilla visual con líneas punteadas

2. **Eje Y - Líneas agrupadas por sector**:
   - Los sectores se muestran como headers colapsados
   - Cada línea tiene su propia fila horizontal
   - Las líneas están agrupadas bajo su sector correspondiente

3. **Bloques de estado**:
   - Cada estado se muestra como un bloque coloreado
   - El color depende del tipo de estado:
     - 🟢 **Producción**: Verde
     - 🟠 **Parada Programada**: Naranja
     - 🔴 **Parada No Programada**: Rojo
     - 🔵 **Mantenimiento**: Azul
     - 🔷 **Limpieza**: Cyan
     - 🟣 **Cambio de Formato**: Púrpura
     - ⚫ **Sin Demanda**: Gris
     - ⬛ **Otro**: Gris oscuro
   - Los bloques muestran el tipo y hora de inicio
   - Al pasar el mouse, se muestra un tooltip con detalles completos

4. **Línea vertical de hora actual**:
   - Línea roja vertical que indica la hora actual
   - Solo visible cuando se visualiza el día de hoy
   - Se actualiza automáticamente cada minuto

5. **Filtros**:
   - **Filtro por Sector**: Dropdown para seleccionar un sector específico
   - **Filtro por Línea**: Dropdown que se filtra según el sector seleccionado
   - Botón de actualización manual

6. **Navegación de fechas**:
   - Botones "Anterior" y "Siguiente" para navegar entre días
   - Selector de fecha (date picker)
   - Botón "Hoy" para volver al día actual

7. **Leyenda de colores**:
   - Muestra todos los tipos de estado con su color correspondiente

---

## 🚀 Cómo Navegar el Timeline

### Acceso
1. Iniciar sesión en la aplicación
2. Desde el Dashboard, hacer clic en "**Timeline de Producción**"
3. O navegar directamente a `/timeline`

### Navegación de fechas
- **◀ Anterior**: Ver el día anterior
- **Siguiente ▶**: Ver el día siguiente
- **Selector de fecha**: Elegir una fecha específica
- **Hoy**: Volver rápidamente al día actual

### Filtros
1. **Por Sector**: Seleccionar un sector para ver solo sus líneas
2. **Por Línea**: Seleccionar una línea específica (se filtra según el sector)
3. **🔄 Actualizar**: Recargar los datos manualmente

### Interacción con estados
- **Hover**: Al pasar el mouse sobre un bloque, se muestra información detallada:
  - Tipo de estado
  - Línea
  - Hora de inicio
  - Hora de fin (si existe)
  - Duración en minutos
  - Observaciones (si existen)

### Scroll horizontal
- El timeline permite scroll horizontal para ver todas las horas del día
- Los nombres de sectores y líneas permanecen fijos al hacer scroll

---

## 🧪 Pruebas Recomendadas

### 1. Crear varios estados para probar el timeline

**Ir a**: Administración → Estados de Línea → Nuevo Estado

**Crear estados de ejemplo**:

```
Estado 1:
- Sector: [Seleccionar un sector]
- Línea: [Seleccionar una línea del sector]
- Tipo: Producción
- Fecha/Hora Inicio: Hoy 08:00
- Fecha/Hora Fin: Hoy 12:00
- Observaciones: Producción matutina

Estado 2:
- Sector: [Mismo sector]
- Línea: [Misma línea]
- Tipo: Parada Programada
- Fecha/Hora Inicio: Hoy 12:00
- Fecha/Hora Fin: Hoy 13:00
- Observaciones: Almuerzo

Estado 3:
- Sector: [Mismo sector]
- Línea: [Misma línea]
- Tipo: Producción
- Fecha/Hora Inicio: Hoy 13:00
- Fecha/Hora Fin: Hoy 17:00
- Observaciones: Producción vespertina

Estado 4:
- Sector: [Mismo sector]
- Línea: [Otra línea del mismo sector]
- Tipo: Mantenimiento
- Fecha/Hora Inicio: Hoy 09:00
- Fecha/Hora Fin: Hoy 11:00
- Observaciones: Mantenimiento preventivo
```

### 2. Verificar visualización en el Timeline

1. Ir al Timeline (`/timeline` o desde Dashboard)
2. Verificar que la fecha sea la de hoy
3. **Comprobar**:
   - ✅ Los estados se muestran en la posición correcta según la hora
   - ✅ Los colores corresponden al tipo de estado
   - ✅ El tooltip muestra información correcta al hacer hover
   - ✅ La línea roja indica la hora actual
   - ✅ Los estados están agrupados por sector/línea

### 3. Probar filtros

1. Seleccionar un sector específico
2. **Comprobar**: Solo se muestran líneas de ese sector
3. Seleccionar una línea específica
4. **Comprobar**: Solo se muestra esa línea
5. Volver a "Todos los sectores"
6. **Comprobar**: Se muestran todas las líneas nuevamente

### 4. Probar navegación de fechas

1. Hacer clic en "◀ Anterior"
2. **Comprobar**: Se muestra el día anterior (posiblemente sin estados)
3. Hacer clic en "Hoy"
4. **Comprobar**: Vuelve al día actual con los estados creados
5. Seleccionar una fecha específica en el selector
6. **Comprobar**: Se muestra esa fecha

---

## 📁 Archivos Creados/Modificados

### Backend
- `backend/app/api/estados_linea.py` - Nuevo endpoint `/timeline/{fecha}`

### Frontend
- `frontend/src/pages/Timeline.tsx` - Componente principal del timeline
- `frontend/src/pages/Timeline.css` - Estilos del timeline
- `frontend/src/api/api.ts` - Nuevas interfaces y función `getTimeline`
- `frontend/src/App.tsx` - Nueva ruta `/timeline`
- `frontend/src/pages/Dashboard.tsx` - Enlace al timeline
- `frontend/src/pages/Dashboard.css` - Estilos para el panel del timeline

### Documentación
- `FASE4_README.md` - Este archivo

---

## 🔧 Requisitos técnicos

### Dependencias
No se requieren nuevas dependencias. El timeline está implementado con React puro y CSS.

### Configuración
No se requiere configuración adicional.

---

## 📊 Estructura de datos del Timeline

### Request
```
GET /api/estados-linea/timeline/2025-01-12?sector_id=1&linea_id=2
```

### Response
```json
{
  "fecha": "2025-01-12",
  "sectores": [
    {
      "id": 1,
      "nombre": "Sector A",
      "lineas": [
        {
          "id": 2,
          "nombre": "Línea 1",
          "estados": [
            {
              "id": 1,
              "sector_id": 1,
              "linea_id": 2,
              "tipo_estado": "produccion",
              "tipo_estado_label": "Producción",
              "fecha_hora_inicio": "2025-01-12T08:00:00",
              "fecha_hora_fin": "2025-01-12T12:00:00",
              "duracion_minutos": 240,
              "observaciones": "Producción normal",
              "sector": { "id": 1, "nombre": "Sector A" },
              "linea": { "id": 2, "nombre": "Línea 1" },
              "usuario": { "id": 1, "username": "admin", "full_name": "Administrador" }
            }
          ]
        }
      ]
    }
  ],
  "estados": [...],
  "tipos_estado": [
    { "value": "produccion", "label": "Producción" },
    { "value": "parada_programada", "label": "Parada Programada" },
    ...
  ]
}
```

---

## ⏭️ Próximos pasos sugeridos

1. **Agregar interacción de edición**: Hacer clic en un bloque para editar el estado
2. **Agregar creación desde timeline**: Hacer clic en un espacio vacío para crear un nuevo estado
3. **Agregar zoom**: Permitir hacer zoom para ver más/menos detalle
4. **Agregar vista de semana/mes**: Cambiar la escala temporal
5. **Agregar exportación**: Exportar el timeline como imagen o PDF
6. **Agregar notificaciones en tiempo real**: WebSockets para actualización automática

---

## ✅ Estado de la Fase 4

**COMPLETADA** ✓

El timeline visual está funcionando con todas las características solicitadas:
- ✅ Endpoint backend para estados filtrados por fecha/sector/línea
- ✅ Componente Timeline con día actual por defecto
- ✅ Eje X con horas del día
- ✅ Eje Y con líneas agrupadas por sector
- ✅ Estados como bloques con colores según tipo
- ✅ Línea vertical para hora actual
- ✅ Filtros por sector/línea
