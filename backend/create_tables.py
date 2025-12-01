"""Script para crear las tablas en la base de datos."""
from app.core.database import engine, Base
from app.models import *

if __name__ == "__main__":
    print("Creando tablas en la base de datos...")
    Base.metadata.create_all(bind=engine)
    print("Tablas creadas exitosamente!")
