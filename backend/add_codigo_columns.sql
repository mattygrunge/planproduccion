-- Script SQL para agregar columnas 'codigo' a las tablas existentes
-- Ejecutar este script en PostgreSQL antes de correr la migración

-- Agregar columna codigo a la tabla roles
ALTER TABLE roles ADD COLUMN IF NOT EXISTS codigo VARCHAR(20) UNIQUE;

-- Agregar columna codigo a la tabla users
ALTER TABLE users ADD COLUMN IF NOT EXISTS codigo VARCHAR(20) UNIQUE;

-- Agregar columna codigo a la tabla sectores
ALTER TABLE sectores ADD COLUMN IF NOT EXISTS codigo VARCHAR(20) UNIQUE;

-- Agregar columna codigo a la tabla lineas
ALTER TABLE lineas ADD COLUMN IF NOT EXISTS codigo VARCHAR(20) UNIQUE;

-- Agregar columna codigo a la tabla estados_linea
ALTER TABLE estados_linea ADD COLUMN IF NOT EXISTS codigo VARCHAR(20) UNIQUE;

-- Agregar columna codigo a la tabla lotes
ALTER TABLE lotes ADD COLUMN IF NOT EXISTS codigo VARCHAR(20) UNIQUE;

-- Nota: Las tablas 'productos' y 'clientes' ya tienen columna 'codigo'
