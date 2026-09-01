#!/usr/bin/env python
# _*_ coding: utf-8 _*_

import logging
import datetime
import urllib.request
import json
import os

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from dotenv import load_dotenv
from jose import jwt, JWTError

# Definimos dónde está nuestro esquema (solo informativo para FastAPI docs)
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")
load_dotenv()


# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------

def logging_setup():
    log_path = "./logs"
    log_filename = f"{log_path}/%Y-%m-%d.log"
    logging.basicConfig(
        filename=datetime.datetime.now().strftime(log_filename),
        level=logging.INFO,
        format="%(asctime)s - %(levelname)s - %(message)s"
    )
    return logging.getLogger("api")


# ---------------------------------------------------------------------------
# JWT / FusionAuth
# ---------------------------------------------------------------------------

def get_public_key(token: str):
    """
    Obtiene la llave pública de FusionAuth para verificar la firma del JWT.
    Consulta el JWKS endpoint y busca la llave que coincide con el 'kid' del token.
    """
    try:
        unverified_header = jwt.get_unverified_header(token)
        with urllib.request.urlopen(os.getenv("FUSIONAUTH_JWKS_URL")) as response:
            jwks = json.loads(response.read().decode())
        for key in jwks.get("keys", []):
            if key["kid"] == unverified_header.get("kid"):
                return key
        raise HTTPException(status_code=401, detail="No public key found for token.")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Error validating token header: {str(e)}")


async def verify_jwt(token: str = Depends(oauth2_scheme)):
    """
    Dependencia de FastAPI para validar el JWT en rutas protegidas via Bearer.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        public_key = get_public_key(token)
        payload = jwt.decode(
            token,
            public_key,
            algorithms=["RS256"],
            options={"verify_aud": False}
        )
        return payload
    except JWTError:
        raise credentials_exception


# ---------------------------------------------------------------------------
# TMDB — helpers internos
# ---------------------------------------------------------------------------

def _tmdb_request(url: str) -> dict:
    """
    Realiza una petición autenticada a la API de TMDB.
    """
    req = urllib.request.Request(
        url,
        headers={
            "Authorization": f"Bearer {os.getenv('TOKEN')}",
            "accept": "application/json"
        }
    )
    with urllib.request.urlopen(req) as response:
        return json.loads(response.read().decode())


# ---------------------------------------------------------------------------
# TMDB — catálogos trending
# ---------------------------------------------------------------------------

def local_content_movies() -> dict:
    """
    Retorna el catálogo de películas trending del día desde TMDB.
    """
    data = _tmdb_request(os.getenv("urlTrendingMovies"))
    catalog = {}
    for video in data.get("results", []):
        catalog[str(video["id"])] = {
            "id": str(video["id"]),
            "title": video["title"],
            "category": video["media_type"],
            "thumbnail": os.getenv("BASE_IMAGE") + video["poster_path"] if video.get("poster_path") else "",
            "duration": "",
            "description": video.get("overview", ""),
        }
    return catalog


def local_content_series() -> dict:
    """
    Retorna el catálogo de series trending del día desde TMDB.
    """
    data = _tmdb_request(os.getenv("urlTrendingTV"))
    catalog = {}
    for video in data.get("results", []):
        catalog[str(video["id"])] = {
            "id": str(video["id"]),
            "title": video["name"],
            "category": video["media_type"],
            "thumbnail": os.getenv("BASE_IMAGE") + video["poster_path"] if video.get("poster_path") else "",
            "duration": "",
            "description": video.get("overview", ""),
        }
    return catalog


# ---------------------------------------------------------------------------
# TMDB — detalle de un ítem (para el reproductor)
# ---------------------------------------------------------------------------

TMDB_BASE_URL = "https://api.themoviedb.org/3"
BASE_IMAGE_W500 = "https://image.tmdb.org/t/p/w500"
BASE_IMAGE_ORIGINAL = "https://image.tmdb.org/t/p/original"


def get_content_detail(content_type: str, content_id: str) -> dict:
    """
    Retorna el detalle completo de una película o serie, incluyendo:
    - Información básica (título, descripción, géneros, rating, duración)
    - URL del backdrop en alta resolución para el fondo de la página
    - Clave del trailer oficial de YouTube (si existe)

    content_type: "movie" o "tv"
    content_id: ID numérico del contenido en TMDB
    """
    if content_type not in ("movie", "tv"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="content_type debe ser 'movie' o 'tv'"
        )

    # Detalle principal
    detail_url = f"{TMDB_BASE_URL}/{content_type}/{content_id}?language=es-ES"
    detail = _tmdb_request(detail_url)

    # Videos (trailers)
    videos_url = f"{TMDB_BASE_URL}/{content_type}/{content_id}/videos?language=es-ES"
    videos_data = _tmdb_request(videos_url)

    # Intentar primero trailer oficial en español, luego en inglés
    trailer_key = _find_trailer_key(videos_data.get("results", []))
    if not trailer_key:
        videos_url_en = f"{TMDB_BASE_URL}/{content_type}/{content_id}/videos?language=en-US"
        videos_data_en = _tmdb_request(videos_url_en)
        trailer_key = _find_trailer_key(videos_data_en.get("results", []))

    # Normalizar campos según si es movie o tv
    if content_type == "movie":
        title = detail.get("title", "")
        # runtime en minutos
        runtime = detail.get("runtime")
        duration = f"{runtime} min" if runtime else ""
    else:
        title = detail.get("name", "")
        # Para series: número de temporadas
        seasons = detail.get("number_of_seasons")
        duration = f"{seasons} temporada{'s' if seasons and seasons > 1 else ''}" if seasons else ""

    genres = [g["name"] for g in detail.get("genres", [])]
    rating = round(detail.get("vote_average", 0), 1)

    poster_path = detail.get("poster_path")
    backdrop_path = detail.get("backdrop_path")

    return {
        "id": str(detail.get("id")),
        "title": title,
        "description": detail.get("overview", ""),
        "thumbnail": BASE_IMAGE_W500 + poster_path if poster_path else "",
        "backdrop": BASE_IMAGE_ORIGINAL + backdrop_path if backdrop_path else "",
        "trailer_key": trailer_key,
        "duration": duration,
        "genres": genres,
        "rating": rating,
        "content_type": content_type,
    }


def _find_trailer_key(videos: list) -> str | None:
    """
    Busca el trailer oficial de YouTube en la lista de videos de TMDB.
    Prioridad: Official Trailer > Trailer > Teaser.
    """
    priority = ["Official Trailer", "Trailer", "Teaser"]

    for label in priority:
        for v in videos:
            if (
                v.get("site") == "YouTube"
                and v.get("type") in ("Trailer", "Teaser")
                and label.lower() in v.get("name", "").lower()
            ):
                return v["key"]

    # Fallback: cualquier video de YouTube tipo Trailer o Teaser
    for v in videos:
        if v.get("site") == "YouTube" and v.get("type") in ("Trailer", "Teaser"):
            return v["key"]

    return None
