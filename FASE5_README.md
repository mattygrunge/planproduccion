# FASE 5 – Gestión de Lotes con Validaciones Inteligentes

## Objetivo
Agregar gestión de lotes con las reglas especiales de negocio, incluyendo cálculos automáticos y validaciones inteligentes.

## Archivos Creados/Modificados

### Backend
- `backend/app/models/lote.py` - Modelo Lote
- `backend/app/models/producto.py` - Agregados campos `anos_vencimiento` y `litros_por_unidad`
- `backend/app/models/__init__.py` - Exportación del modelo Lote
- `backend/app/schemas/lote.py` - Schemas para Lote con advertencias
- `backend/app/schemas/producto.py` - Agregados campos de vencimiento y litros
- `backend/app/schemas/__init__.py` - Exportación de schemas de Lote
- `backend/app/api/lotes.py` - API de lotes con validaciones inteligentes
- `backend/main.py` - Registro del router de lotes

### Frontend
- `frontend/src/api/api.ts` - Interfaces y funciones para API de lotes
- `frontend/src/pages/admin/Lotes.tsx` - Componente de gestión de lotes
- `frontend/src/pages/admin/AdminPages.css` - Estilos para modal de advertencias
- `frontend/src/components/AdminLayout.tsx` - Enlace a Lotes en menú
- `frontend/src/App.tsx` - Ruta para página de lotes

---

## Modelo de Datos: Lote

```python
class Lote:
    id: int
    numero_lote: str           # Ej: "2024001", "L-001"
    producto_id: int           # FK a Producto
    estado_linea_id: int       # FK a EstadoLinea (solo tipo "produccion")
    pallets: int               # Cantidad de pallets
    parciales: int             # Unidades sueltas
    unidades_por_pallet: int   # Unidades por pallet
    litros_totales: float      # Calculado automáticamente
    fecha_produccion: date     # Fecha de producción
    fecha_vencimiento: date    # Calculada automáticamente
    link_senasa: str           # URL de trazabilidad
    observaciones: str
    usuario_id: int            # Usuario que registró
    activo: bool
```

### Campos agregados a Producto

```python
anos_vencimiento: int          # Años de vencimiento (default: 2)
litros_por_unidad: float       # Litros por unidad (default: 1.0)
```

---

## Cálculos Automáticos

### 1. Cálculo de Litros Totales

**Fórmula:**
```
litros_totales = (pallets × unidades_por_pallet + parciales) × litros_por_unidad
```

**Ejemplo:**
- Pallets: 10
- Unidades por pallet: 100
- Parciales: 25
- Litros por unidad (del producto): 0.5

```
litros_totales = (10 × 100 + 25) × 0.5 = 1025 × 0.5 = 512.5 litros
```

### 2. Cálculo de Fecha de Vencimiento

**Fórmula:**
```
fecha_vencimiento = fecha_produccion + (años_vencimiento × 365 días)
```

**Ejemplo:**
- Fecha producción: 2024-12-01
- Años vencimiento (del producto): 2

```
fecha_vencimiento = 2024-12-01 + 730 días = 2026-12-01
```

---

## Validaciones Inteligentes (Advertencias)

El sistema genera **advertencias** (no errores) que el usuario puede optar por ignorar. Esto permite flexibilidad mientras se alerta sobre posibles problemas.

### 1. Detección de Lote Duplicado

**Cómo se detecta:**
```python
def detectar_lote_duplicado(db, numero_lote, producto_id, lote_id_excluir=None):
    # Busca en la base de datos un lote con:
    # - Mismo numero_lote
    # - Mismo producto_id
    # - Que esté activo
    # - Excluye el lote actual si se está editando
    
    query = db.query(Lote).filter(
        Lote.numero_lote == numero_lote,
        Lote.producto_id == producto_id,
        Lote.activo == True
    )
    
    if lote_id_excluir:
        query = query.filter(Lote.id != lote_id_excluir)
    
    return query.first() is not None
```

**Mensaje de advertencia:**
> ⚠️ Ya existe un lote 'L-005' para este producto
> 
> *Se recomienda verificar si es un error o si el lote ya fue registrado*

---

### 2. Detección de Salto de Lote

**Cómo se detecta:**

1. **Extracción del número:** Se extrae el componente numérico del string de lote
   ```python
   def extraer_numero_de_lote(numero_lote):
       # "L-005" → 5
       # "2024001" → 2024001
       # "LOTE-2024-0005" → 5 (último grupo de dígitos)
       matches = re.findall(r'\d+', numero_lote)
       if matches:
           return int(matches[-1])
       return None
   ```

2. **Comparación con último lote:** Se busca el último lote del mismo producto
   ```python
   ultimo_lote = db.query(Lote).filter(
       Lote.producto_id == producto_id,
       Lote.activo == True
   ).order_by(desc(Lote.id)).first()
   ```

3. **Verificación de secuencia:**
   ```python
   # Si nuevo_numero > ultimo_numero + 1, hay salto
   if numero_nuevo > numero_anterior + 1:
       # HAY SALTO
       numero_esperado = numero_anterior + 1
   ```

**Ejemplo:**
- Último lote: "L-003"
- Lote ingresado: "L-006"
- Esperado: "L-004"
- **Advertencia:** Salto detectado

**Mensaje de advertencia:**
> 🔢 Se detectó un salto en la secuencia de lotes
> 
> *Último lote: L-003, Esperado: L-004, Ingresado: L-006*

---

### 3. Validación de Fecha de Producción

**Reglas:**
- **Fecha futura:** Si es mayor a hoy → Advertencia
- **Fecha muy antigua:** Si es más de 30 días en el pasado → Advertencia

**Implementación:**
```python
def validar_fecha_produccion(fecha_produccion):
    advertencias = []
    hoy = date.today()
    
    if fecha_produccion > hoy:
        dias_futuro = (fecha_produccion - hoy).days
        advertencias.append(LoteWarning(
            tipo=WarningType.FECHA_FUTURA,
            mensaje=f"La fecha de producción es {dias_futuro} día(s) en el futuro"
        ))
    elif (hoy - fecha_produccion).days > 30:
        dias_pasados = (hoy - fecha_produccion).days
        advertencias.append(LoteWarning(
            tipo=WarningType.FECHA_MUY_ANTIGUA,
            mensaje=f"La fecha de producción tiene {dias_pasados} días de antigüedad"
        ))
    
    return advertencias
```

**Mensajes de advertencia:**
> 🔮 La fecha de producción es 5 día(s) en el futuro
> 
> *Fecha ingresada: 2024-12-06, Fecha actual: 2024-12-01*

> 📅 La fecha de producción tiene 45 días de antigüedad
> 
> *Fecha ingresada: 2024-10-17, Fecha actual: 2024-12-01*

---

## Flujo de Creación de Lote

```
1. Usuario selecciona producto
   │
   ├─> Sistema sugiere siguiente número de lote
   ├─> Sistema calcula fecha de vencimiento automáticamente
   │
2. Usuario ingresa datos (número lote, pallets, fecha, etc.)
   │
   ├─> Sistema calcula litros totales automáticamente
   │
3. Usuario hace clic en "Crear"
   │
   ├─> Sistema ejecuta validaciones
   │
   ├─ Si hay advertencias y ignorar_advertencias=False:
   │    │
   │    └─> Mostrar modal de advertencias
   │         │
   │         ├─ Usuario cancela → No se crea
   │         │
   │         └─ Usuario confirma → Se reenvía con ignorar_advertencias=True
   │
   └─ Si no hay advertencias o ignorar_advertencias=True:
        │
        └─> Lote creado exitosamente
```

---

## Endpoints de API

### POST `/api/lotes/validar`
Valida un lote sin crearlo. Útil para pre-validación en frontend.

**Request:**
```json
{
  "numero_lote": "L-005",
  "producto_id": 1,
  "fecha_produccion": "2024-12-01"
}
```

**Response:**
```json
{
  "valido": false,
  "advertencias": [
    {
      "tipo": "salto_lote",
      "mensaje": "Se detectó un salto en la secuencia de lotes",
      "detalle": "Último lote: L-003, Esperado: L-004, Ingresado: L-005"
    }
  ],
  "lote_anterior": "L-003",
  "lote_esperado": "L-004"
}
```

### POST `/api/lotes`
Crear un nuevo lote.

**Request:**
```json
{
  "numero_lote": "L-005",
  "producto_id": 1,
  "fecha_produccion": "2024-12-01",
  "pallets": 10,
  "parciales": 25,
  "unidades_por_pallet": 100,
  "ignorar_advertencias": false
}
```

**Response con advertencias (no creado):**
```json
{
  "lote": null,
  "advertencias": [...],
  "creado": false,
  "mensaje": "Se encontraron advertencias. Confirme para continuar."
}
```

**Response exitoso:**
```json
{
  "lote": {
    "id": 1,
    "numero_lote": "L-005",
    "litros_totales": 512.5,
    "fecha_vencimiento": "2026-12-01",
    ...
  },
  "advertencias": [],
  "creado": true,
  "mensaje": "Lote creado exitosamente"
}
```

### GET `/api/lotes/producto/{producto_id}/sugerir-numero`
Sugiere el siguiente número de lote basándose en el último lote.

**Response:**
```json
{
  "sugerencia": "L-004",
  "ultimo_lote": "L-003",
  "mensaje": "Basado en el último lote 'L-003'"
}
```

---

## Casos de Prueba Sugeridos

### 1. Cargar un lote normal
- Seleccionar producto
- Usar el número sugerido
- Fecha de producción: hoy
- Crear → Debería crearse sin advertencias

### 2. Cargar un lote duplicado
- Crear un lote con número "L-001"
- Intentar crear otro lote con el mismo número "L-001" y mismo producto
- Debería mostrar advertencia de "lote duplicado"

### 3. Cargar un lote "saltado"
- Crear lote "L-001"
- Crear lote "L-002"
- Intentar crear lote "L-005"
- Debería mostrar advertencia de "salto de lote" (esperaba L-003)

### 4. Cargar un lote del año pasado
- Fecha de producción: hace más de 30 días
- Debería mostrar advertencia de "fecha muy antigua"

### 5. Cargar un lote con fecha futura
- Fecha de producción: fecha en el futuro
- Debería mostrar advertencia de "fecha futura"

---

## Ejecutar las migraciones

Después de implementar esta fase, ejecutar el script de creación de tablas:

```bash
cd backend
python create_tables.py
```

Esto creará la nueva tabla `lotes` y agregará las columnas `anos_vencimiento` y `litros_por_unidad` a la tabla `productos`.

---

## Próximos pasos

Con esta fase completada, el sistema ahora tiene:
- ✅ Gestión de lotes con validaciones inteligentes
- ✅ Cálculos automáticos de litros y vencimiento
- ✅ Advertencias configurables (no bloquean, solo alertan)
- ✅ Sugerencia automática de número de lote
- ✅ Asociación opcional con estados de producción
