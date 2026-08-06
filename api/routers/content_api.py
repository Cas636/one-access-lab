#!/usr/bin/env python
#_*_ codig: utf8 _*_

#  IMPORTACIONES 
from fastapi import APIRouter, Cookie, HTTPException, status  # Framework FastAPI para crear APIs REST
from modules.functions import get_public_key, logging_setup, local_content_movies, local_content_series
from jose import jwt, JWTError

#  CONFIGURACIÓN DEL ROUTER 
# Crear un router de FastAPI para agrupar las rutas
content_app=APIRouter()

#  ENDPOINTS DE LA API 

@content_app.get("/api/content")
def get_content(app_at: str | None = Cookie(default=None, alias="app.at")):
    logger = logging_setup()
    if not app_at:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No se encontró la cookie de sesión"
        )
    try:
        public_key = get_public_key(app_at)
        payload = jwt.decode(
            app_at,
            public_key,
            algorithms=["RS256"],
            options={"verify_aud": False}
        )
        return local_content_movies() | local_content_series()
    except JWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Token inválido o expirado: {str(e)}"
        )