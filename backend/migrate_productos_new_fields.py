"""
Script de migración para agregar nuevos campos a la tabla productos.
Ejecutar con: python migrate_productos_new_fields.py
"""
import os
import sys

# Agregar el directorio backend al path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import create_engine, text
from app.core.config import settings


def migrate():
    """Ejecuta la migración para agregar nuevos campos a productos."""
    engine = create_engine(settings.DATABASE_URL)
    
    # Lista de columnas nuevas a agregar
    new_columns = [
        # Formato de Lote
        ("formato_lote", "VARCHAR(50)"),
        # Cliente asociado
        ("cliente_id", "INTEGER REFERENCES clientes(id)"),
        # Tipo de producto
        ("tipo_producto", "VARCHAR(100)"),
        # Color de banda
        ("color_banda", "VARCHAR(50)"),
        # Código de producto externo
        ("codigo_producto", "VARCHAR(50)"),
        # Densidad
        ("densidad", "DOUBLE PRECISION"),
        # Envases - Bidón
        ("bidon_proveedor", "VARCHAR(100)"),
        ("bidon_descripcion", "VARCHAR(200)"),
        # Envases - Tapa
        ("tapa_proveedor", "VARCHAR(100)"),
        ("tapa_descripcion", "VARCHAR(200)"),
        # Envases - Pallet
        ("pallet_proveedor", "VARCHAR(100)"),
        ("pallet_descripcion", "VARCHAR(200)"),
        # Envases - Cobertor
        ("cobertor_proveedor", "VARCHAR(100)"),
        ("cobertor_descripcion", "VARCHAR(200)"),
        # Envases - Funda/Etiqueta
        ("funda_etiqueta_proveedor", "VARCHAR(100)"),
        ("funda_etiqueta_descripcion", "VARCHAR(200)"),
        # Envases - Esquinero
        ("esquinero_proveedor", "VARCHAR(100)"),
        ("esquinero_descripcion", "VARCHAR(200)"),
        # Palletizado
        ("litros_por_pallet", "INTEGER"),
        ("bidones_por_pallet", "INTEGER"),
        ("bidones_por_piso", "VARCHAR(50)"),
    ]
    
    with engine.connect() as conn:
        for column_name, column_type in new_columns:
            try:
                # Verificar si la columna ya existe
                result = conn.execute(text(f"""
                    SELECT column_name 
                    FROM information_schema.columns 
                    WHERE table_name = 'productos' AND column_name = '{column_name}'
                """))
                
                if result.fetchone() is None:
                    # La columna no existe, agregarla
                    conn.execute(text(f"ALTER TABLE productos ADD COLUMN {column_name} {column_type}"))
                    conn.commit()
                    print(f"✓ Columna '{column_name}' agregada exitosamente")
                else:
                    print(f"- Columna '{column_name}' ya existe, omitiendo...")
                    
            except Exception as e:
                print(f"✗ Error al agregar columna '{column_name}': {e}")
                conn.rollback()
        
        # Crear índice para codigo_producto si no existe
        try:
            conn.execute(text("""
                CREATE INDEX IF NOT EXISTS ix_productos_codigo_producto 
                ON productos (codigo_producto)
            """))
            conn.commit()
            print("✓ Índice 'ix_productos_codigo_producto' creado/verificado")
        except Exception as e:
            print(f"✗ Error al crear índice: {e}")
            conn.rollback()
            
        # Crear índice para formato_lote si no existe
        try:
            conn.execute(text("""
                CREATE INDEX IF NOT EXISTS ix_productos_formato_lote 
                ON productos (formato_lote)
            """))
            conn.commit()
            print("✓ Índice 'ix_productos_formato_lote' creado/verificado")
        except Exception as e:
            print(f"✗ Error al crear índice: {e}")
            conn.rollback()
    
    print("\n✓ Migración completada exitosamente")


if __name__ == "__main__":
    print("=" * 50)
    print("Migración: Nuevos campos para productos")
    print("=" * 50)
    print()
    migrate()
