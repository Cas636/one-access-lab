#!/usr/bin/env python
# _*_ coding: utf-8 _*_

from fastapi import APIRouter, Cookie, Depends, HTTPException, status
from sqlmodel import Session, select

from modules.functions import (
    get_public_key,
    get_content_detail,
    local_content_movies,
    local_content_series,
    logging_setup,
)
from models.watch_history import WatchHistory, WatchHistoryCreate
from database import get_session
from routers.administration_api import require_authenticated
from jose import jwt, JWTError

content_app = APIRouter()


# ---------------------------------------------------------------------------
# Helper interno: valida cookie y retorna payload del JWT
# Se usa en los endpoints que no van por Depends para mayor claridad
# ---------------------------------------------------------------------------

def _validate_cookie(app_at: str | None) -> dict:
    logger = logging_setup()
    if not app_at:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No se encontró la cookie de sesión"
        )
    try:
        public_key = get_public_key(app_at)
        return jwt.decode(
            app_at,
            public_key,
            algorithms=["RS256"],
            options={"verify_aud": False}
        )
    except JWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Token inválido o expirado: {str(e)}"
        )


# ---------------------------------------------------------------------------
# GET /api/content — Catálogo trending (películas + series)
# ---------------------------------------------------------------------------

@content_app.get("/api/content")
def get_content(app_at: str | None = Cookie(default=None, alias="app.at")):
    logger = logging_setup()
    _validate_cookie(app_at)
    catalog = local_content_movies() | local_content_series()
    logger.info(f"Catálogo retornado: {len(catalog)} ítems")
    return catalog


# ---------------------------------------------------------------------------
# GET /api/content/{content_type}/{content_id} — Detalle para el reproductor
# ---------------------------------------------------------------------------

@content_app.get("/api/content/{content_type}/{content_id}")
def get_content_item(
    content_type: str,
    content_id: str,
    app_at: str | None = Cookie(default=None, alias="app.at")
):
    """
    Retorna el detalle completo de un ítem de contenido:
    título, descripción, géneros, rating, duración, backdrop, trailer_key.

    Requiere sesión activa (cualquier usuario autenticado).
    content_type: "movie" o "tv"
    content_id: ID numérico de TMDB
    """
    logger = logging_setup()
    payload = _validate_cookie(app_at)

    # Verificar que el usuario tiene al menos el rol 'user' o 'admin'
    roles: list = payload.get("roles", [])
    if not any(r in roles for r in ("user", "admin")):
        logger.warning(
            f"Acceso denegado a detalle de contenido: usuario {payload.get('sub')} "
            f"sin rol válido. Roles: {roles}"
        )
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Se requiere el rol 'user' o 'admin' para ver el contenido"
        )

    logger.info(
        f"Usuario {payload.get('sub')} solicitó detalle: "
        f"{content_type}/{content_id}"
    )

    detail = get_content_detail(content_type, content_id)
    return detail


# ---------------------------------------------------------------------------
# POST /api/content/watch — Registrar vista
# ---------------------------------------------------------------------------

@content_app.post("/api/content/watch", status_code=status.HTTP_201_CREATED)
def register_watch(
    watch_data: WatchHistoryCreate,
    app_at: str | None = Cookie(default=None, alias="app.at"),
    session: Session = Depends(get_session)
):
    """
    Registra que el usuario autenticado inició la reproducción de un contenido.
    El user_id se extrae del JWT (claim 'sub') para evitar spoofing.

    Requiere rol 'user' o 'admin'.
    """
    logger = logging_setup()
    payload = _validate_cookie(app_at)

    roles: list = payload.get("roles", [])
    if not any(r in roles for r in ("user", "admin")):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Se requiere el rol 'user' o 'admin' para registrar vistas"
        )

    user_id: str = payload.get("sub", "")

    record = WatchHistory(
        user_id=user_id,
        content_id=watch_data.content_id,
        content_type=watch_data.content_type,
        title=watch_data.title,
    )

    session.add(record)
    session.commit()
    session.refresh(record)

    logger.info(
        f"Vista registrada: usuario={user_id} "
        f"contenido={watch_data.content_type}/{watch_data.content_id} "
        f"título='{watch_data.title}'"
    )

    return {
        "id": record.id,
        "user_id": record.user_id,
        "content_id": record.content_id,
        "content_type": record.content_type,
        "title": record.title,
        "watched_at": record.watched_at.isoformat()
    }
