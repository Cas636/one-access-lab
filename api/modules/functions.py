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
# Cambia '127.0.0.1:9011' por tu dominio de FusionAuth

def get_public_key(token: str):
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
        #logger.warning(credentials_exception)
        raise credentials_exception
    
    
def logging_setup():
    log_Path="./logs"
    log_filename = f'{log_Path}/%Y-%m-%d.log'
    logging.basicConfig(filename=datetime.datetime.now().strftime(log_filename), level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
    logger = logging.getLogger("profile_api")
    return logger
