from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.auth import router as auth_router
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
