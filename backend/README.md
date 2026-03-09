# MatecoApp Backend

Backend de MatecoApp construido con FastAPI, SQLAlchemy, PostgreSQL y Alembic.

## Requisitos

- Python 3.11+
- Docker (opcional, recomendado para PostgreSQL local)

## Levantar PostgreSQL con Docker

Desde `backend/`:

```bash
docker compose up -d
```

La base queda en `localhost:5432` con:
- DB: `matecoapp`
- User: `postgres`
- Password: `postgres`

Para detenerla:

```bash
docker compose down
```

## Configuracion

1. Crear `.env` a partir de `.env.example` (ya apunta al Postgres de Docker):

```env
DATABASE_URL=postgresql+psycopg://postgres:postgres@localhost:5432/matecoapp
```
2. Instalar dependencias:

```bash
pip install -r requirements.txt
```

3. Ejecutar migraciones:

```bash
alembic upgrade head
```

4. Levantar servidor:

```bash
uvicorn app.main:app --reload
```

## Endpoints principales

- `POST /auth/google`
- `POST /auth/register`
- `POST /auth/login`
- `GET /auth/me`
- `POST /rounds`
- `GET /rounds`
- `GET /rounds/{round_id}`
- `POST /rounds/{round_id}/join`
- `POST /rounds/{round_id}/invite`
- `GET /rounds/{round_id}/turn`
- `POST /turns/{turn_id}/complete`
- `POST /turns/{turn_id}/miss`
