"""
Script de migración para agregar códigos a registros existentes.

Este script actualiza todos los registros que no tienen código asignado.

Uso:
    cd backend
    python migrate_add_codes.py
"""
import sys
import os

# Agregar el directorio backend al path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.core.database import SessionLocal
from app.models.user import User, Role
from app.models.sector import Sector
from app.models.linea import Linea
from app.models.cliente import Cliente
from app.models.producto import Producto
from app.models.estado_linea import EstadoLinea
from app.models.lote import Lote
from app.core.id_generator import (
    generar_codigo_usuario,
    generar_codigo_rol,
    generar_codigo_sector,
    generar_codigo_linea,
    generar_codigo_cliente,
    generar_codigo_producto,
    generar_codigo_estado_linea,
    generar_codigo_lote
)


def migrate_codes():
    """Migra todos los registros existentes agregando códigos."""
    
    print("🔧 Iniciando migración de códigos...")
    
    db = SessionLocal()
    
    try:
        # Migrar Roles
        print("\n📋 Migrando Roles...")
        roles = db.query(Role).filter(
            (Role.codigo == None) | (Role.codigo == '')
        ).all()
        for role in roles:
            codigo = generar_codigo_rol(db)
            role.codigo = codigo
            db.commit()
            print(f"  ✅ Rol '{role.name}' → {codigo}")
        if not roles:
            print("  ⏭️ No hay roles sin código")
        
        # Migrar Usuarios
        print("\n👤 Migrando Usuarios...")
        users = db.query(User).filter(
            (User.codigo == None) | (User.codigo == '')
        ).all()
        for user in users:
            codigo = generar_codigo_usuario(db)
            user.codigo = codigo
            db.commit()
            print(f"  ✅ Usuario '{user.username}' → {codigo}")
        if not users:
            print("  ⏭️ No hay usuarios sin código")
        
        # Migrar Sectores
        print("\n🏭 Migrando Sectores...")
        sectores = db.query(Sector).filter(
            (Sector.codigo == None) | (Sector.codigo == '')
        ).all()
        for sector in sectores:
            codigo = generar_codigo_sector(db)
            sector.codigo = codigo
            db.commit()
            print(f"  ✅ Sector '{sector.nombre}' → {codigo}")
        if not sectores:
            print("  ⏭️ No hay sectores sin código")
        
        # Migrar Líneas
        print("\n📊 Migrando Líneas...")
        lineas = db.query(Linea).filter(
            (Linea.codigo == None) | (Linea.codigo == '')
        ).all()
        for linea in lineas:
            codigo = generar_codigo_linea(db)
            linea.codigo = codigo
            db.commit()
            print(f"  ✅ Línea '{linea.nombre}' → {codigo}")
        if not lineas:
            print("  ⏭️ No hay líneas sin código")
        
        # Migrar Clientes
        print("\n🧑‍💼 Migrando Clientes...")
        clientes = db.query(Cliente).all()
        for cliente in clientes:
            if not cliente.codigo or cliente.codigo == '':
                codigo = generar_codigo_cliente(db)
                cliente.codigo = codigo
                db.commit()
                print(f"  ✅ Cliente '{cliente.nombre}' → {codigo}")
        
        # Migrar Productos
        print("\n📦 Migrando Productos...")
        productos = db.query(Producto).all()
        for producto in productos:
            if not producto.codigo or producto.codigo == '':
                codigo = generar_codigo_producto(db)
                producto.codigo = codigo
                db.commit()
                print(f"  ✅ Producto '{producto.nombre}' → {codigo}")
        
        # Migrar Estados de Línea
        print("\n📈 Migrando Estados de Línea...")
        estados = db.query(EstadoLinea).filter(
            (EstadoLinea.codigo == None) | (EstadoLinea.codigo == '')
        ).all()
        for estado in estados:
            codigo = generar_codigo_estado_linea(db)
            estado.codigo = codigo
            db.commit()
            print(f"  ✅ Estado de Línea ID:{estado.id} → {codigo}")
        if not estados:
            print("  ⏭️ No hay estados sin código")
        
        # Migrar Lotes
        print("\n🏷️ Migrando Lotes...")
        lotes = db.query(Lote).filter(
            (Lote.codigo == None) | (Lote.codigo == '')
        ).all()
        for lote in lotes:
            codigo = generar_codigo_lote(db)
            lote.codigo = codigo
            db.commit()
            print(f"  ✅ Lote '{lote.numero_lote}' → {codigo}")
        if not lotes:
            print("  ⏭️ No hay lotes sin código")
        
        print("\n🎉 Migración completada exitosamente!")
        
    except Exception as e:
        print(f"\n❌ Error durante la migración: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    migrate_codes()
