#!/usr/bin/env python
#_*_ codig: utf8 _*_
from fastapi import FastAPI
from routers import status_api, profile_api
import uvicorn
import os
from fastapi import FastAPI
from dotenv import load_dotenv
from fastapi.middleware.cors import CORSMiddleware


app = FastAPI()

load_dotenv()
# Configuración de CORS permitiendo que 127.0.0.1:3000 hable con tu API
app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("FRONTEND_URI")],  # Origen de tu React app
    allow_credentials=True,
    allow_methods=["*"],  # Permite GET, POST, OPTIONS, etc.
    allow_headers=["*"],  # Permite headers como 'Authorization'
)

# Router de estado para health checks y monitoreo del servicio.
app.include_router(status_api.status_app)

# Router 
app.include_router(profile_api.profile_app)

# Ejecución local opcional para desarrollo.
# uvicorn main:app --port 5000 --ssl-keyfile=./key.pem --ssl-certfile=./cert.pem

# uvicorn.run(app, port=5000)

if __name__ == "__main__":
    uvicorn.run("apimain:app", host="0.0.0.0", port=8030, reload=True)
    