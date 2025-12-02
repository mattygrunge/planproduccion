"""
Script para inicializar la base de datos.
Crea las tablas, roles por defecto y usuario admin inicial.

Uso:
    cd backend
    python -m app.scripts.init_db
"""
import sys
import os

# Agregar el directorio backend al path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from app.core.database import engine, SessionLocal, Base
from app.core.security import get_password_hash
from app.core.id_generator import generar_codigo_usuario, generar_codigo_rol
from app.models.user import User, Role
from app.models.sector import Sector
from app.models.linea import Linea
from app.models.producto import Producto
from app.models.cliente import Cliente


def init_database():
    """Inicializa la base de datos con tablas, roles y usuario admin."""
    
    print("🔧 Creando tablas en la base de datos...")
    Base.metadata.create_all(bind=engine)
    print("✅ Tablas creadas correctamente.")
    
    db = SessionLocal()
    
    try:
        # Crear roles por defecto
        print("\n🔧 Creando roles por defecto...")
        
        roles_data = [
            {"name": "admin", "description": "Administrador del sistema con acceso total"},
            {"name": "supervisor", "description": "Supervisor con acceso a reportes y gestión"},
            {"name": "operador", "description": "Operador con acceso básico"},
        ]
        
        for role_data in roles_data:
            existing_role = db.query(Role).filter(Role.name == role_data["name"]).first()
            if not existing_role:
                # Generar código automático para el rol
                codigo = generar_codigo_rol(db)
                role = Role(codigo=codigo, **role_data)
                db.add(role)
                db.commit()  # Commit after each role to get the next code correctly
                print(f"  ✅ Rol '{role_data['name']}' creado con código {codigo}.")
            else:
                print(f"  ⏭️  Rol '{role_data['name']}' ya existe.")
        
        db.commit()
        
        # Crear usuario admin
        print("\n🔧 Creando usuario administrador...")
        
        admin_role = db.query(Role).filter(Role.name == "admin").first()
        existing_admin = db.query(User).filter(User.username == "admin").first()
        
        if not existing_admin:
            # Generar código automático para el usuario
            codigo = generar_codigo_usuario(db)
            admin_user = User(
                codigo=codigo,
                email="admin@planproduccion.local",
                username="admin",
                hashed_password=get_password_hash("admin123"),
                full_name="Administrador del Sistema",
                is_active=True,
                role_id=admin_role.id
            )
            db.add(admin_user)
            db.commit()
            print(f"  ✅ Usuario admin creado con código {codigo}.")
            print("\n" + "="*50)
            print("  📋 CREDENCIALES DEL ADMIN:")
            print("     Usuario: admin")
            print("     Contraseña: admin123")
            print("="*50)
        else:
            print("  ⏭️  Usuario admin ya existe.")
        
        print("\n🎉 Inicialización completada exitosamente!")
        
    except Exception as e:
        print(f"\n❌ Error durante la inicialización: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    init_database()
