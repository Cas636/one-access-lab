#!/usr/bin/env python
# _*_ coding: utf-8 _*_

from collections import Counter
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Cookie, Depends, HTTPException, status
from sqlmodel import Session, func, select

from modules.functions import get_public_key, logging_setup
from database import engine
from models.watch_history import WatchHistory
from jose import jwt, JWTError

administration_app = APIRouter()


def get_jwt_payload(app_at: str | None = Cookie(default=None, alias="app.at")) -> dict:
    """
    Extrae y valida el JWT desde la cookie app.at.
    Retorna el payload completo del token si es válido.
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
        return payload
    except JWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Token inválido o expirado: {str(e)}"
        )


def role_required(required_role: str):
    """
    Dependencia de FastAPI para verificar que el usuario tiene el rol requerido.
    Los roles vienen en el claim 'roles' del JWT de FusionAuth.

    Uso en un endpoint:
        @router.get("/ruta")
        def endpoint(claims: dict = Depends(role_required("admin"))):
            ...
    """
    def dependency(payload: dict = Depends(get_jwt_payload)) -> dict:
        logger = logging_setup()
        roles: list = payload.get("roles", [])
        if required_role not in roles:
            logger.warning(
                f"Acceso denegado: usuario {payload.get('sub')} "
                f"no tiene el rol '{required_role}'. Roles actuales: {roles}"
            )
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Se requiere el rol '{required_role}' para acceder a este recurso"
            )
        return payload
    return dependency


def require_authenticated(payload: dict = Depends(get_jwt_payload)) -> dict:
    """
    Dependencia más permisiva: solo verifica que el usuario esté autenticado
    (tenga cookie válida), sin importar el rol.
    Útil para endpoints accesibles por 'user' y 'admin'.
    """
    return payload


# ---------------------------------------------------------------------------
# Endpoints de administración
# ---------------------------------------------------------------------------

@administration_app.get("/api/admin/watch-history")
def get_watch_history(
    claims: dict = Depends(role_required("admin")),
    limit: int = 50,
    offset: int = 0
):
    """
    Retorna el historial de vistas de todos los usuarios.
    Solo accesible por administradores (rol 'admin').
    El tablero de estadísticas se construirá sobre este endpoint.
    """
    logger = logging_setup()

    with Session(engine) as session:
        # Total de registros (para paginación en el frontend)
        total = session.exec(
            select(func.count()).select_from(WatchHistory)
        ).one()

        statement = (
            select(WatchHistory)
            .order_by(WatchHistory.watched_at.desc())
            .offset(offset)
            .limit(limit)
        )
        records = session.exec(statement).all()
        logger.info(
            f"Admin {claims.get('sub')} consultó historial de vistas "
            f"(limit={limit}, offset={offset})"
        )
        return {
            "total": total,
            "offset": offset,
            "limit": limit,
            "data": [
                {
                    "id": r.id,
                    "user_id": r.user_id,
                    "content_id": r.content_id,
                    "content_type": r.content_type,
                    "title": r.title,
                    "watched_at": r.watched_at.isoformat()
                }
                for r in records
            ]
        }


@administration_app.get("/api/admin/stats")
def get_stats(
    claims: dict = Depends(role_required("admin")),
    days: int = 7
):
    """
    Retorna estadísticas agregadas del historial de vistas para el tablero:
    - Totales (vistas, usuarios únicos, títulos únicos)
    - Split por tipo de contenido (movie vs tv)
    - Top 10 títulos más vistos
    - Vistas por día de los últimos N días

    Solo accesible por administradores (rol 'admin').
    """
    logger = logging_setup()

    with Session(engine) as session:
        records = session.exec(select(WatchHistory)).all()

    total_views = len(records)
    unique_users = len({r.user_id for r in records})
    unique_titles = len({(r.content_type, r.content_id) for r in records})

    # Split por tipo de contenido
    type_counter = Counter(r.content_type for r in records)
    by_type = {
        "movie": type_counter.get("movie", 0),
        "tv": type_counter.get("tv", 0),
    }

    # Top 10 títulos más vistos (agrupados por título)
    title_counter = Counter(r.title for r in records)
    top_titles = [
        {"title": title, "views": count}
        for title, count in title_counter.most_common(10)
    ]

    # Vistas por día de los últimos N días (incluyendo días con 0 vistas)
    today = datetime.now(timezone.utc).date()
    day_labels = [
        (today - timedelta(days=i)) for i in range(days - 1, -1, -1)
    ]
    day_counter: Counter = Counter()
    for r in records:
        # watched_at puede venir naive o aware; normalizamos a date
        watched_date = r.watched_at.date() if r.watched_at else None
        if watched_date is not None:
            day_counter[watched_date] += 1

    views_by_day = [
        {"date": d.isoformat(), "views": day_counter.get(d, 0)}
        for d in day_labels
    ]

    logger.info(f"Admin {claims.get('sub')} consultó estadísticas (days={days})")

    return {
        "totals": {
            "total_views": total_views,
            "unique_users": unique_users,
            "unique_titles": unique_titles,
        },
        "by_type": by_type,
        "top_titles": top_titles,
        "views_by_day": views_by_day,
    }
