"""
Script para agregar columnas 'codigo' a las tablas existentes.

Uso:
    cd backend
    python add_codigo_columns.py
"""
import sys
import os

# Agregar el directorio backend al path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import text
from app.core.database import engine


def add_codigo_columns():
    """Agrega las columnas 'codigo' a las tablas que no las tienen."""
    
    print("🔧 Agregando columnas 'codigo' a las tablas...")
    
    # Lista de tablas que necesitan la columna codigo
    tables_to_update = [
        'roles',
        'users', 
        'sectores',
        'lineas',
        'estados_linea',
        'lotes'
    ]
    
    with engine.connect() as conn:
        for table in tables_to_update:
            try:
                # Intentar agregar la columna
                sql = text(f"ALTER TABLE {table} ADD COLUMN IF NOT EXISTS codigo VARCHAR(20) UNIQUE")
                conn.execute(sql)
                conn.commit()
                print(f"  ✅ Columna 'codigo' agregada a tabla '{table}'")
            except Exception as e:
                # Si ya existe, ignorar el error
                if "already exists" in str(e).lower() or "ya existe" in str(e).lower():
                    print(f"  ⏭️ Columna 'codigo' ya existe en tabla '{table}'")
                else:
                    print(f"  ⚠️ Advertencia en tabla '{table}': {e}")
                conn.rollback()
    
    print("\n🎉 Proceso completado!")


if __name__ == "__main__":
    add_codigo_columns()
