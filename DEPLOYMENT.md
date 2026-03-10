# MatecoApp Deployment (Vercel + Supabase)

This repository is a monorepo with:

- `frontend/` -> Next.js app (deploy to Vercel)
- `backend/` -> FastAPI API (deploy separately)

## 1) Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com) and create a project.
2. In project settings, copy:
   - Project URL
   - Anon public key
3. Create a Storage bucket named `avatars` (public if you need direct public URLs).

## 2) Configure Environment Variables

### Local (`frontend/.env.local`)

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_GOOGLE_CLIENT_ID=...
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

### Vercel (Project Settings -> Environment Variables)

Add the same keys for `Production`, `Preview`, and `Development` as needed:

- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Optional generic aliases (if used by scripts):

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`

## 3) Connect Repository to Vercel

1. Import Git repository in Vercel.
2. Select the project.
3. Set **Root Directory** to `frontend`.

Important:
- This repo includes a root `vercel.json` configured to build from `frontend`.
- If you prefer Vercel UI defaults, keep Root Directory=`frontend` and let Next.js framework settings apply.

## 4) Deploy Frontend

After env vars are set:

1. Trigger deployment from Vercel dashboard, or push to the tracked branch.
2. Vercel will run:
   - install command
   - build command
   - Next.js output deployment

## 5) Backend Deployment (separate service)

Deploy `backend/` independently (Railway, Render, Fly.io, ECS, etc.).

Expose API URL publicly and set:

```env
NEXT_PUBLIC_API_URL=https://your-backend-domain
```

## 5.1) Keep Backend Awake on Render

If your Render backend sleeps after inactivity, use an external ping every 10 minutes.

This repository includes a GitHub Actions workflow at:

- `.github/workflows/render_keep_alive.yml`

Setup:

1. Go to GitHub repository settings -> Secrets and variables -> Actions.
2. Create a repository secret named `RENDER_HEALTHCHECK_URL`.
3. Set it to your backend health URL, for example:
   - `https://your-backend.onrender.com/health`
4. Ensure GitHub Actions are enabled for the repository.
5. Optionally trigger the workflow manually once from Actions -> Render Keep Alive -> Run workflow.

The workflow runs every 10 minutes and performs an HTTP call to your health endpoint.

## 6) Monorepo Root Directory Notes

For this repository, frontend deployment must use:

- Root directory: `frontend`

Do not point Vercel root to repository root unless you explicitly keep the root `vercel.json` commands that `cd frontend`.

## 7) Supabase Usage in Code

- Client: `frontend/src/lib/supabaseClient.ts`
- Auth helpers: `frontend/src/lib/supabaseAuth.ts`
- Storage helpers: `frontend/src/lib/supabaseStorage.ts`

### Available helper functions

- `signUpWithEmail(email, password)`
- `loginWithEmail(email, password)`
- `logout()`
- `getCurrentUser()`
- `uploadProfileImage(userId, file)`
- `getProfileImageUrl(path)`
