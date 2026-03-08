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
