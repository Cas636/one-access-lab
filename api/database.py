#!/usr/bin/env python
# _*_ coding: utf-8 _*_

import os
from sqlmodel import SQLModel, create_engine, Session
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "")

# El engine es la conexión central a PostgreSQL
engine = create_engine(DATABASE_URL, echo=False)


def create_db_and_tables():
    """
    Crea todas las tablas definidas con SQLModel si no existen.
    Se llama una vez al arrancar el servidor via el lifespan de FastAPI.
    """
    SQLModel.metadata.create_all(engine)


def get_session():
    """
    Dependencia de FastAPI para inyectar una sesión de DB en los endpoints.
    """
    with Session(engine) as session:
        yield session
