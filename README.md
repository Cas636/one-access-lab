
# ONE ACCESS LAB

## Descripción

Este proyecto es una solución de demostración que integra:
- Frontend en React + Vite (`frontend/`)
- Backend en FastAPI (`api/`)
- FusionAuth como proveedor de autenticación
- PostgreSQL como base de datos
- MailHog para capturar correos en desarrollo

La aplicación permite iniciar sesión con FusionAuth, explorar un catálogo de películas y series (obtenido de TheMovieDB), y reproducir el trailer de cada título en una página de detalle estilo Netflix. El acceso al contenido está protegido por roles (`user` / `admin`) y cada reproducción queda registrada en la base de datos.

## Arquitectura

- `docker-compose.yaml`: levanta los servicios principales.
- `frontend/`: aplicación React que usa `@fusionauth/react-sdk`.
- `api/`: backend FastAPI que valida el JWT de FusionAuth, sirve el catálogo y el detalle de contenido, y registra las vistas.
- `api/database.py`: configuración de la conexión a PostgreSQL con SQLModel.
- `api/models/watch_history.py`: modelo SQLModel de la tabla `watch_history`.
- `api/routers/profile_api.py`: endpoint `/api/account/profile`.
- `api/routers/content_api.py`: endpoints de catálogo, detalle de contenido y registro de vistas.
- `api/routers/administration_api.py`: control de acceso por roles y endpoint de historial (solo `admin`).
- `api/routers/status_api.py`: endpoint `/status` para health checks.

## Requisitos previos

- Docker y Docker Compose instalados.
- Node.js y npm (opcional, solo si quieres ejecutar el frontend en modo desarrollo fuera de Docker).
- Python 3.11 (opcional, si quieres ejecutar el backend en modo desarrollo fuera de Docker).

## Configuración de variables de entorno

El proyecto usa tres archivos de configuración:

- `./.env` → variables de entorno para Docker Compose.
- `api/.env` → configuración del backend (CORS, FusionAuth, etc.).
- `frontend/.env` → configuración de Vite para FusionAuth y backend.

### Variables principales

#### `./.env`

```env
POSTGRES_DB=fusionauth_db
POSTGRES_USER=fusionauth
POSTGRES_PASSWORD=fusionauth123
```

#### `api/.env`

```env
FRONTEND_URI=http://127.0.0.1:3000
API_KEY_FusionAuth=<tu_api_key>

# Conexión a PostgreSQL (SQLModel). Dentro de Docker el host es el nombre
# del servicio de postgres: "database".
DATABASE_URL=postgresql+psycopg2://fusionauth:fusionauth123@database:5432/fusionauth_db

# TheMovieDB
TOKEN=<tu_token_tmdb>
urlTrendingMovies=https://api.themoviedb.org/3/trending/movie/day
urlTrendingTV=https://api.themoviedb.org/3/trending/tv/day
BASE_IMAGE=https://image.tmdb.org/t/p/w500
```

> `FRONTEND_URI` debe coincidir con la URL desde la que se sirve el frontend.
> Para ejecutar el backend fuera de Docker, cambia el host de `DATABASE_URL` de `database` a `127.0.0.1`.

#### `frontend/.env`

```env
VITE_CLIENT_ID=<client-id-de-fusionauth>
VITE_FUSIONAUTH_URL=http://127.0.0.1:9011
VITE_BACKEND_URL=http://127.0.0.1:8030
VITE_REDIRECT_URI=http://127.0.0.1:3000/account
VITE_REDIRECT_URI_POST_LOGOUT=http://127.0.0.1:3000
```

> Asegúrate de que los valores en `frontend/.env` coincidan con la configuración del cliente en FusionAuth.

## Instalación y ejecución con Docker

1. Copia las variables de ejemplo y ajusta los valores si es necesario:
   - `cp .env.example .env`
   - `cp api/.env.example api/.env`
   - `cp frontend/.env.example frontend/.env`

2. Construye y levanta los servicios:

```bash
docker compose up --build
```

3. Accede a los servicios:

- Frontend: `http://localhost:3000`
- FusionAuth: `http://localhost:9011`
- Backend: `http://localhost:8030`
- Health check: `http://localhost:8030/status`
- MailHog: `http://localhost:8025`

4. Para ejecutar en segundo plano:

```bash
docker compose up -d --build
```

5. Para detener y limpiar:

```bash
docker compose down
```

## Ejecución en desarrollo sin Docker

### Backend

```bash
cd api
python -m venv env
env\Scripts\activate
pip install -r requirements.txt
uvicorn apimain:app --reload --host 0.0.0.0 --port 8030
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Configuración de FusionAuth

1. Abre `http://localhost:9011`.
2. Inicia sesión en el panel de administrador.
3. Crea una aplicación o cliente OpenID Connect con:
   - `Client Id`: el mismo valor de `VITE_CLIENT_ID`.
   - `Server URL`: `http://127.0.0.1:9011`.
   - `Redirect URI`: `http://127.0.0.1:3000/account`.
   - `Post Logout Redirect URI`: `http://127.0.0.1:3000`.
   - Origin/Allowed Origins: `http://127.0.0.1:3000`.
   - Scopes: `openid email profile offline_access`.
4. Verifica que la aplicación esté habilitada y asigna el `Client Id` al frontend.

### Roles y control de acceso (RBAC)

La aplicación usa dos roles definidos en FusionAuth. El backend los lee del claim `roles` del JWT.

1. En la aplicación OpenID Connect, ve a la pestaña **Roles** y crea:
   - `user` — puede explorar el catálogo, ver el detalle de un contenido y reproducir trailers.
   - `admin` — todo lo anterior, más acceso al historial de vistas y a tableros de estadísticas (en construcción).
2. Asigna el rol correspondiente a cada usuario desde **Users → (usuario) → Manage → Roles**.

> Si un usuario autenticado no tiene el rol `user` ni `admin`, el backend responde `403` y la página del reproductor muestra un mensaje de acceso denegado.

## Flujo de la aplicación

1. El usuario ingresa a `http://localhost:3000`.
2. El frontend muestra la pantalla de bienvenida y el botón `REGÍSTRATE O INICIA SESIÓN`.
3. Al hacer clic, FusionAuth maneja el login.
4. Después del login, el usuario es redirigido a `/account`.
5. El backend consulta la cookie `app.at` y decodifica el token JWT,
   devolviendo el perfil con email, nombre y fecha de nacimiento.
6. Desde `/content`, el usuario ve dos carruseles: **Videos Populares** (películas) y **Series del Momento** (series).
7. Al hacer clic en una card, navega a `/content/:id?type=movie|tv`, donde se muestra la página del reproductor:
   fondo (backdrop) del título, información (rating, géneros, duración, sinopsis) y el trailer de YouTube embebido.
8. Al abrir el reproductor, el backend registra la vista en la tabla `watch_history` (usuario, contenido, título, fecha).

## Endpoints importantes

- `GET /status` → estado del backend.
- `GET /api/account/profile` → devuelve los datos del usuario autenticado.
- `GET /api/content` → catálogo combinado de películas y series trending (requiere sesión).
- `GET /api/content/{content_type}/{id}` → detalle de un título con backdrop, géneros, rating y clave del trailer de YouTube (`content_type`: `movie` o `tv`; requiere rol `user` o `admin`).
- `POST /api/content/watch` → registra una vista. Body: `{ content_id, content_type, title }`. El `user_id` se extrae del JWT (requiere rol `user` o `admin`).
- `GET /api/admin/watch-history` → historial de vistas de todos los usuarios, paginado con `limit` y `offset` (solo rol `admin`).

## Estructura del frontend

- `frontend/src/main.tsx`: configuración de `FusionAuthProvider` y rutas.
- `frontend/src/pages/Home.tsx`: página de login y redirección.
- `frontend/src/pages/Account.tsx`: muestra datos del usuario y permite logout.
- `frontend/src/pages/Content.tsx`: catálogo con los carruseles de películas y series.
- `frontend/src/pages/Watch.tsx`: página del reproductor estilo Netflix (backdrop, info y trailer de YouTube).
- `frontend/src/components/Carousel.tsx`: carrusel de cards clickeables (Embla). Al hacer clic navega a `/content/:id`.
- `frontend/src/context/UserContext.tsx`: estado global del perfil de usuario.

## Estructura del backend

- `api/apimain.py`: configuración de FastAPI, CORS y `lifespan` (crea las tablas al arrancar).
- `api/database.py`: engine SQLModel y sesión de base de datos.
- `api/models/watch_history.py`: modelo de la tabla `watch_history`.
- `api/modules/functions.py`: validación de JWT y consumo de TMDB (catálogo y detalle).
- `api/routers/profile_api.py`: endpoint de perfil y validación JWT.
- `api/routers/content_api.py`: catálogo, detalle de contenido y registro de vistas.
- `api/routers/administration_api.py`: dependencias de roles (`role_required`) y endpoint de historial.
- `api/routers/status_api.py`: endpoint de estado.

## Detalles técnicos (documentación extendida)

He creado un documento técnico con descripción completa de la arquitectura, flujos, variables de entorno, diagramas y recomendaciones de despliegue.

- **Archivo técnico**: [docs/TECHNICAL.md](docs/TECHNICAL.md)

Revisa ese archivo para ver diagramas de secuencia, flujo de tokens, diseño de redes y recomendaciones operacionales.

## Integración con TheMovieDB (TMDB)

El proyecto consume datos de TheMovieDB (TMDB) desde el backend. Las variables relacionadas se encuentran en `api/.env`.

- Variables y valores en `api/.env`:
   - `TOKEN` — token/API key usado para autenticar las peticiones a TMDB (puede ser un API Key v3 o un Bearer v4 según cómo lo configures).
   - `urlTrendingMovies` — endpoint para películas trending: `https://api.themoviedb.org/3/trending/movie/day`.
   - `urlTrendingTV` — endpoint para series trending: `https://api.themoviedb.org/3/trending/tv/day`.
   - `BASE_IMAGE` — base URL para imágenes: `https://image.tmdb.org/t/p/w500`.

- Comportamiento:
   - El backend realiza llamadas a TMDB para obtener listados (trending, búsquedas, etc.) y devuelve datos al frontend.
   - El frontend consume los datos del backend; las imágenes se construyen usando `BASE_IMAGE + poster_path`.
    ![Content](docs/screenshots/content.png)
    
- Recomendaciones:
   - Guarda el token/API key en `api/.env` y **no** en repositorios públicos.
   - Para producción, usa el método de autenticación que prefieras (v3 API Key para server-side, v4 Bearer para acceso más amplio).
   - Considera cachear respuestas de TMDB en el backend (Redis o memoria) para reducir latencia y límites de tasa.


## Pantallazos del aplicativo

A continuación se describe qué pantallas debería mostrar la aplicación.

1. **Pantalla de bienvenida / login**
    ![Home](docs/screenshots/home.png)
    
   - Título: `ONEVGAMES`
   - Texto: `¡Todo el streaming de videojuegos en un sólo lugar!`
   - Botón: `REGÍSTRATE O INICIA SESIÓN`
   ![login](docs/screenshots/login.png)

2. **Pantalla de cuenta**
    ![Account](docs/screenshots/account.png)
   - Muestra el email del usuario.
   - Muestra datos como nombre, apellido y fecha de nacimiento.
   - Botón `Logout`.
   ![logout](docs/screenshots/logout.png)

3. **Catálogo de contenido**
    ![Content](docs/screenshots/content.png)
   - Carrusel `Videos Populares` (películas trending).
   - Carrusel `Series del Momento` (series trending).
   - Cada card es clickeable y lleva a la página del reproductor.

4. **Reproductor de contenido** (`/content/:id`)
   - Fondo (backdrop) del título en alta resolución con degradado.
   - Información estilo Netflix: título, rating, géneros, duración y sinopsis.
   - Trailer de YouTube embebido.
   - Botón `← Volver` para regresar al catálogo conservando la navegación.
   - Registra automáticamente la vista en `watch_history`.

   > Nota: si el título no tiene trailer disponible en TMDB, se muestra un aviso "Trailer no disponible".

5. **Panel de FusionAuth**
    
   - Configuración de la aplicación OpenID Connect.
   - Redirecciones configuradas.
   - Roles `user` y `admin` definidos y asignados.
   - Usuario autenticado.

6. **Estado de Docker Compose**
   - Servicios `mailhog`, `database`, `fusionauth`, `frontend`, `backend` funcionando.

## Notas adicionales

- El backend usa `api/.env` para leer `FRONTEND_URI`.
- El frontend usa `frontend/.env` para construir las URLs de FusionAuth.
- Si el login falla, revisa que `VITE_REDIRECT_URI` y `VITE_REDIRECT_URI_POST_LOGOUT` estén correctamente configurados en FusionAuth.
- Si la API responde error 401, comprueba que la cookie `app.at` exista y sea valida.
- Si la API responde error 403 al abrir un contenido, verifica que el usuario tenga el rol `user` o `admin` asignado en FusionAuth.
- Si el backend falla al arrancar con `connection refused` en el puerto 5432, revisa que `DATABASE_URL` use el host `database` (dentro de Docker) y que el servicio de PostgreSQL esté saludable.
- La tabla `watch_history` se crea automáticamente al arrancar el backend (via `lifespan` en `apimain.py`).

## Comandos útiles

```bash
# Levantar todo con Docker Compose
docker compose up --build

# Detener todo
docker compose down

# Iniciar frontend en desarrollo
cd frontend
npm install
npm run dev

# Iniciar backend en desarrollo
cd api
pip install -r requirements.txt
uvicorn apimain:app --reload --host 0.0.0.0 --port 8030
```
