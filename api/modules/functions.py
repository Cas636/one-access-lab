import logging, datetime, re
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from dotenv import load_dotenv
from jose import jwt, JWTError
import urllib.request
import json
import os

# Definimos dónde está nuestro esquema (solo informativo para FastAPI docs)
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")
load_dotenv()

# URL de FusionAuth donde publica sus llaves públicas (JWKS - JSON Web Key Set)

def get_public_key(token: str):
    logger = logging_setup()
    """
    Obtiene la llave pública de FusionAuth para verificar la firma del JWT.
    """
    try:
        unverified_header = jwt.get_unverified_header(token)
        with urllib.request.urlopen(os.getenv("FUSIONAUTH_JWKS_URL")) as response:
            jwks = json.loads(response.read().decode())
        # Buscar la llave que coincide con el 'kid' del token
        for key in jwks.get("keys", []):
            if key["kid"] == unverified_header.get("kid"):
                return key
        raise HTTPException(status_code=401, detail="No public key found for token.")
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Error validating token header: {str(e)}")

async def verify_jwt(token: str = Depends(oauth2_scheme)):
    logger = logging_setup()
    """
    Dependencia de FastAPI para validar el JWT en rutas protegidas.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        # Obtenemos la llave pública correspondiente
        public_key = get_public_key(token)
        
        # Decodificamos y validamos el JWT automáticamente (firma, expiración, etc.)
        payload = jwt.decode(
            token,
            public_key,
            algorithms=["RS256"], # FusionAuth por defecto firma con RS256
            options={"verify_aud": False} # Dependiendo si configuras Audience en FusionAuth
        )
        
        return payload # Retorna los datos del usuario (claims)
    except JWTError:
        logger.warning(credentials_exception)
        raise credentials_exception
    
    
def logging_setup():
    log_Path="./logs"
    log_filename = f'{log_Path}/%Y-%m-%d.log'
    logging.basicConfig(filename=datetime.datetime.now().strftime(log_filename), level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
    logger = logging.getLogger("profile_api")
    return logger


def local_content():
    logger = logging_setup()
    TOKEN = "eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI3MzBjNDEwYTNiNGVjNTAzYWQ5ZTZkZDU5MTc4NmFiMyIsIm5iZiI6MTc4NTk2Njg0MS4wNzIsInN1YiI6IjZhNzNiMGY5OWQ2MmY0YmQ4YjM5ZjNkZSIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.EYsy-13JdPBubtG2dyqjKGqH1na7H6xLtBlQuchKoC0"
    url = "https://api.themoviedb.org/3/trending/movie/day"
    BASE_IMAGE = "https://image.tmdb.org/t/p/w500"
    req = urllib.request.Request(
        url,
        headers={
            "Authorization": f"Bearer {TOKEN}",
            "accept": "application/json"
        }
    )
    with urllib.request.urlopen(req) as response:
        movies = json.loads(response.read().decode())
    logger.info("Hace la consulta")
    # Simulación de una base de datos o catálogo de videos
    VIDEOS_MOCK = {
        "1": {
            "id": "1",
            "title": "The Last of Us Part I - Cinematic Walkthrough",
            "category": "Videojuegos",
            "thumbnail": "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=500",
            "duration": "14:20",
            "description": "Una mirada cinemática a los momentos más épicos de la aventura de Joel y Ellie."
        },
        "2": {
            "id": "2",
            "title": "Cyberpunk 2077: Phantom Liberty - Official Trailer",
            "category": "Videojuegos",
            "thumbnail": "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=500",
            "duration": "3:45",
            "description": "Tráiler oficial de expansión de espionaje y suspenso en Dogtown."
        },
        "3": {
            "id": "3",
            "title": "Arcane Season 2 - Teaser Preview",
            "category": "Series",
            "thumbnail": "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=500",
            "duration": "2:10",
            "description": "El conflicto entre Piltover y Zaun llega a su punto de ebullición."
        },
        "4": {
            "id": "4",
            "title": "Elden Ring: Shadow of the Erdtree Gameplay",
            "category": "Videojuegos",
            "thumbnail": "https://images.unsplash.com/photo-1612287230202-1ff1d85d1bdf?w=500",
            "duration": "8:50",
            "description": "Explorando las nuevas y peligrosas zonas del Reino de las Sombras."
        }
        
    }
    
    catalog = {}

    for movie in movies["results"]:
        catalog[str(movie["id"])] = {
            "id": str(movie["id"]),
            "title": movie["title"],
            "category": movie["media_type"],
            "thumbnail": BASE_IMAGE + movie["poster_path"] if movie["poster_path"] else "",
            "duration": "",
            "description": movie["overview"],
        }
    return catalog