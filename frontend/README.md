# MatecoApp Frontend

Frontend de MatecoApp construido con Next.js 14, React y TailwindCSS.

## Requisitos

- Node.js 20+
- npm

## Configuracion

1. Crear `.env.local` a partir de `.env.local.example`.
2. Instalar dependencias:

```bash
npm install
```

3. Levantar servidor de desarrollo:

```bash
npm run dev
```

Por defecto la app espera backend en `http://localhost:8000` usando `NEXT_PUBLIC_API_URL`.
Para login con Google, configura tambien `NEXT_PUBLIC_GOOGLE_CLIENT_ID`.
