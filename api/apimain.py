#!/usr/bin/env python
# _*_ coding: utf-8 _*_

import os
from contextlib import asynccontextmanager

import uvicorn
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import create_db_and_tables
from routers import status_api, profile_api, content_api
from routers.administration_api import administration_app

load_dotenv()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifespan context manager: se ejecuta al arrancar y al detener el servidor.
    Crea las tablas de la base de datos si no existen.
    """
    create_db_and_tables()
    yield
    # Aquí iría cleanup si fuera necesario


app = FastAPI(
    title="OneVGames API",
    description="Backend para la plataforma de streaming de videojuegos ONEVGAMES",
    version="1.0.0",
    lifespan=lifespan
)

# ---------------------------------------------------------------------------
# CORS
# ---------------------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("FRONTEND_URI")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Routers
# ---------------------------------------------------------------------------

# Health check
app.include_router(status_api.status_app)

# Perfil de usuario
app.include_router(profile_api.profile_app)

# Contenido (catálogo, detalle, registro de vistas)
app.include_router(content_api.content_app)

# Administración (historial de vistas, tableros futuros)
app.include_router(administration_app)

# ---------------------------------------------------------------------------
# Ejecución local
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    uvicorn.run("apimain:app", host="0.0.0.0", port=8030, reload=True)
