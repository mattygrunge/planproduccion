from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.auth import router as auth_router
from app.api.users import router as users_router
from app.api.sectores import router as sectores_router
from app.api.lineas import router as lineas_router
from app.api.productos import router as productos_router
from app.api.clientes import router as clientes_router
from app.api.estados_linea import router as estados_linea_router
from app.api.lotes import router as lotes_router
from app.api.historial import router as historial_router
from app.api.auditoria import router as auditoria_router
from app.core.config import settings
from app.core.database import engine, SessionLocal, Base
from app.core.security import get_password_hash
from app.core.id_generator import generar_codigo_usuario, generar_codigo_rol
from app.models.user import User, Role


def init_database():
    """Inicializa la base de datos con tablas, roles y usuario admin."""
    print("🔧 Inicializando base de datos...")
    
    # Crear todas las tablas
    Base.metadata.create_all(bind=engine)
    print("✅ Tablas verificadas/creadas.")
    
    db = SessionLocal()
    
    try:
        # Crear roles por defecto si no existen
        roles_data = [
            {"name": "admin", "description": "Administrador del sistema con acceso total"},
            {"name": "supervisor", "description": "Supervisor con acceso a reportes y gestión"},
            {"name": "operador", "description": "Operador con acceso básico"},
        ]
        
        for role_data in roles_data:
            existing_role = db.query(Role).filter(Role.name == role_data["name"]).first()
            if not existing_role:
                codigo = generar_codigo_rol(db)
                role = Role(codigo=codigo, **role_data)
                db.add(role)
                db.commit()
                print(f"  ✅ Rol '{role_data['name']}' creado (id={role.id}, codigo={codigo})")
        
        # Crear usuario admin si no existe
        admin_role = db.query(Role).filter(Role.name == "admin").first()
        existing_admin = db.query(User).filter(User.username == "admin").first()
        
        if not existing_admin and admin_role:
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
            print(f"  ✅ Usuario admin creado (usuario: admin, contraseña: admin123)")
        
        print("🎉 Base de datos inicializada correctamente.")
        
    except Exception as e:
        print(f"❌ Error durante la inicialización: {e}")
        db.rollback()
    finally:
        db.close()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Inicialización al arrancar la aplicación."""
    init_database()
    yield


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    lifespan=lifespan
)

# Configuración de CORS para permitir llamadas desde el frontend
# Las URLs se configuran desde variables de entorno (CORS_ORIGINS)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Incluir routers
app.include_router(auth_router, prefix="/api")
app.include_router(users_router, prefix="/api")
app.include_router(sectores_router, prefix="/api")
app.include_router(lineas_router, prefix="/api")
app.include_router(productos_router, prefix="/api")
app.include_router(clientes_router, prefix="/api")
app.include_router(estados_linea_router, prefix="/api")
app.include_router(lotes_router, prefix="/api")
app.include_router(historial_router, prefix="/api")
app.include_router(auditoria_router, prefix="/api")


@app.get("/health")
def health_check():
    """Endpoint para verificar que el backend está funcionando."""
    return {"status": "ok"}


@app.get("/")
def root():
    """Endpoint raíz."""
    return {
        "message": "Plan Producción API",
        "version": settings.VERSION,
        "docs": "/docs"
    }
