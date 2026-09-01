#!/usr/bin/env python
#_*_ codig: utf8 _*_

#  IMPORTACIONES 
from fastapi import APIRouter, Cookie, HTTPException, status  # Framework FastAPI para crear APIs REST
from modules.functions import get_public_key, logging_setup
from jose import jwt, JWTError

#  CONFIGURACIÓN DEL ROUTER 
# Crear un router de FastAPI para agrupar las rutas
profile_app=APIRouter()

#  ENDPOINTS DE LA API 


@profile_app.get("/api/account/profile")
def get_user_profile(app_at: str | None = Cookie(default=None, alias="app.at")):
    logger = logging_setup()
    """
    Lee la cookie de autenticación (ej. 'app_at' o el nombre que asigne FusionAuth)
    enviada automáticamente por el navegador.
    """
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
        
        # 3. Extraer la información que el frontend está esperando mostrar
        # (Asegúrate de incluir los scopes 'email profile' en la configuración de FusionAuth)
        return {
            "email": payload.get("email"),
            "given_name": payload.get("given_name"),
            "family_name": payload.get("family_name"),
            "birthDate": payload.get("birthDate", ""), # Si no existe, devuelve vacío
            "roles": payload.get("roles", []),  # Roles del usuario (user, admin)
        }
    except JWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Token inválido o expirado: {str(e)}"
        )