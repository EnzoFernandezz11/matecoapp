# MatecoApp Monorepo

Estructura separada por aplicaciones:

```txt
matecoApp/
  frontend/   # Next.js
  backend/    # FastAPI + Alembic
```

## Frontend

```bash
cd frontend
cp .env.local.example .env.local
npm install
npm run dev
```

## Backend

```bash
cd backend
docker compose up -d
cp .env.example .env
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload
```

Ver detalles adicionales en:
- `frontend/README.md`
- `backend/README.md`
