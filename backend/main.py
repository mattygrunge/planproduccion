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

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION
)

# Configuración de CORS para permitir llamadas desde el frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
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
