# MatecoApp Frontend Specification (MVP)

## 1) Descripción del producto

MatecoApp es una app mobile-first para organizar rondas de mate entre estudiantes.  
El objetivo del MVP es resolver una necesidad puntual: saber quién lleva el mate en cada encuentro, mantener el orden de turnos y generar un ranking simple por participación.

Unidad principal del producto: **Ronda Matera**.  
No se usa el concepto de “grupo” en UI ni en lógica de negocio.

---

## 2) Conceptos principales

### Ronda
Espacio donde participan miembros que se turnan para llevar mate.

Campos clave:
- `id`
- `name`
- `members`
- `penalty_mode` (`auto` | `vote`)
- `invite_code`

### Turno
Representa quién debe llevar mate actualmente.

Campos clave:
- `id`
- `round_id`
- `user_id`
- `turn_index`
- `status` (`pending` | `completed` | `missed`)

### Ranking
Orden de miembros por cantidad de turnos `completed` (mates cebados).

Regla MVP:
- Mayor cantidad de `completed` = mejor posición.
- En empate, priorizar el que llegó antes a la ronda (`joined_at`).

---

## 3) Arquitectura del frontend

## Stack recomendado
- **Framework**: Next.js 14+ (App Router) con React 18+
- **Estilos**: TailwindCSS
- **Íconos**: Material Symbols
- **Fuente**: Plus Jakarta Sans
- **State management**: React Query (server state) + Zustand o Context (UI state liviano)
- **Forms**: React Hook Form + Zod

## Principios de arquitectura
- Mobile-first desde diseño base (`sm` hacia arriba para desktop).
- Server state centralizado en hooks (`useRounds`, `useRoundDetail`, `useCurrentTurn`).
- UI desacoplada de transporte HTTP (usar `apiClient`).
- Componentes atómicos reutilizables para tarjetas, botones, avatars, estados.
- Manejo explícito de estados: loading, empty, error, success.

## Ruteo sugerido (Next.js App Router)
- `/login`
- `/rondas` (dashboard)
- `/rondas/nueva`
- `/rondas/unirse`
- `/rondas/[roundId]/mesa`
- `/rondas/[roundId]/ranking`
- `/perfil`

---

## 4) Estructura de carpetas

```txt
src/
  app/
    (auth)/
      login/page.tsx
    (protected)/
      rondas/page.tsx
      rondas/nueva/page.tsx
      rondas/unirse/page.tsx
      rondas/[roundId]/mesa/page.tsx
      rondas/[roundId]/ranking/page.tsx
      perfil/page.tsx
    layout.tsx
    globals.css
  components/
    ui/
      button.tsx
      card.tsx
      input.tsx
      avatar.tsx
      badge.tsx
      bottom-nav.tsx
      loading-skeleton.tsx
      empty-state.tsx
    rounds/
      round-card.tsx
      invite-code-card.tsx
      mate-table.tsx
      turn-status-chip.tsx
      ranking-list.tsx
  features/
    auth/
      auth-context.tsx
      auth-guard.tsx
      use-auth.ts
    rounds/
      hooks.ts
      mapper.ts
      types.ts
  lib/
    api/
      client.ts
      endpoints.ts
    constants/
      theme.ts
    utils/
      format.ts
      avatar.ts
  styles/
    tokens.css
```

---

## 5) Componentes reutilizables

## UI base
- `Button`: variantes `primary`, `secondary`, `ghost`, `danger`.
- `Card`: contenedor estándar para rondas, ranking y perfil.
- `Avatar`: fallback automático si no hay imagen.
- `Badge`: para estado de turno y etiquetas.
- `BottomNav`: navegación principal mobile.
- `LoadingSkeleton`: placeholders homogéneos.
- `EmptyState`: “sin rondas”, “sin ranking”, etc.

## Componentes de dominio
- `RoundCard`
  - Props: `name`, `membersCount`, `turnStatusText`, `onEnter`.
- `MateTable`
  - Render circular de miembros y mate en centro.
  - Resalta al usuario de turno actual.
- `RankingList`
  - Top 3 destacado.
  - Último con etiqueta visual de “rata”.
- `InviteCodeCard`
  - Muestra código y botón copiar/compartir.

---

## 6) Descripción de cada pantalla

## 6.1 Login (`/login`)

Objetivo:
- Iniciar sesión con Google y obtener JWT propio del backend.

Elementos:
- Logo MatecoApp.
- Título y subtítulo.
- Botón “Iniciar sesión con Google”.
- Mensaje de fallback o error.

Comportamiento:
1. Frontend obtiene `id_token` de Google.
2. Llama `POST /auth/google`.
3. Guarda `token` JWT + `user`.
4. Redirige a `/rondas`.

## 6.2 Dashboard de rondas (`/rondas`)

Objetivo:
- Ver rondas donde participa el usuario.

Elementos:
- Header con saludo breve.
- Lista de `RoundCard`.
- CTA flotante: crear nueva ronda.
- Acceso a unirse por código.

Comportamiento:
- `GET /rounds` al entrar.
- Pull to refresh en mobile.
- Cada tarjeta navega a `/rondas/[roundId]/mesa`.

## 6.3 Vista de ronda / mesa matera (`/rondas/[roundId]/mesa`)

Objetivo:
- Entender de forma visual quién trae el mate ahora.

Elementos:
- Nombre de ronda.
- Mesa circular con avatares (`MateTable`).
- Estado actual de turno.
- Botones:
  - `Traje el mate`
  - `No traje mate`

Comportamiento:
- `GET /rounds/{round_id}` para miembros + contexto.
- `GET /rounds/{round_id}/turn` para turno actual.
- Acciones:
  - `POST /turns/{turn_id}/complete`
  - `POST /turns/{turn_id}/miss`

## 6.4 Ranking de la ronda (`/rondas/[roundId]/ranking`)

Objetivo:
- Mostrar participación histórica simple.

Elementos:
- Top 3 destacado visualmente.
- Lista completa ordenada.
- Último con icono de rata.

Comportamiento:
- Consumir ranking incluido en `GET /rounds/{round_id}`.
- Render reactivo tras completar/miss turno.

## 6.5 Perfil de usuario (`/perfil`)

Objetivo:
- Mostrar identidad y resumen de actividad.

Elementos:
- Avatar.
- Nombre, email, universidad/carrera.
- Cantidad de rondas.
- Estadísticas simples:
  - Mates cebados totales.
  - Turnos perdidos.

Comportamiento:
- `GET /auth/me` + agregados locales de rondas.

## 6.6 Crear nueva ronda (`/rondas/nueva`)

Objetivo:
- Alta de ronda y obtención de código de invitación.

Formulario:
- `name`
- `penalty_mode` (`auto` | `vote`)

Comportamiento:
1. `POST /rounds`
2. `POST /rounds/{round_id}/invite`
3. Mostrar código y acción de compartir.

## 6.7 Unirse por código (`/rondas/unirse`)

Objetivo:
- Entrar a una ronda existente con `invite_code`.

MVP viable:
- Input de código.
- Resolver `round_id` con endpoint dedicado o metadata precargada.

Recomendación backend:
- Agregar `POST /rounds/join-by-code` para evitar lookup cliente.

---

## 7) Estados de UI

Todas las pantallas deben contemplar:
- `loading`: skeletons consistentes.
- `empty`: mensajes accionables.
- `error`: alerta + botón reintentar.
- `success`: feedback breve (toast).

Estados clave por pantalla:
- Login:
  - `idle`, `signing_in`, `auth_error`.
- Dashboard:
  - `loading_rounds`, `empty_rounds`.
- Mesa:
  - `submitting_complete`, `submitting_miss`, `turn_locked`.
- Crear ronda:
  - `submitting`, `created_with_invite`.

---

## 8) Manejo de autenticación

## Flujo
1. Google Sign-In devuelve `id_token`.
2. Frontend llama `POST /auth/google`.
3. Backend responde `{ token, user }`.
4. Guardar JWT en cookie segura o storage.
5. Incluir `Authorization: Bearer <token>` en requests protegidas.

## Recomendación técnica
- Web app pura: `httpOnly` cookie emitida por backend es la opción más segura.
- Si el backend no emite cookie, usar `localStorage` (MVP) + hardening:
  - limpiar token en logout y on 401.
  - no persistir datos sensibles adicionales.

## Guard de rutas
- Rutas públicas: `/login`.
- Rutas protegidas: todas las demás.
- Si `401`: redirigir a `/login`.

---

## 9) Integración con backend

Base URL:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Endpoints usados
- `POST /auth/google`
- `GET /auth/me`
- `POST /rounds`
- `GET /rounds`
- `GET /rounds/{round_id}`
- `POST /rounds/{round_id}/join`
- `POST /rounds/{round_id}/invite`
- `GET /rounds/{round_id}/turn`
- `POST /turns/{turn_id}/complete`
- `POST /turns/{turn_id}/miss`

## Contratos TypeScript sugeridos

```ts
export type PenaltyMode = "auto" | "vote";
export type TurnStatus = "pending" | "completed" | "missed";

export interface User {
  id: string;
  name: string;
  email: string;
  avatar_url: string;
  university?: string | null;
  career?: string | null;
}

export interface Round {
  id: string;
  name: string;
  invite_code: string;
  penalty_mode: PenaltyMode;
  created_by: string;
  created_at: string;
}

export interface Turn {
  id: string;
  round_id: string;
  user_id: string;
  turn_index: number;
  status: TurnStatus;
  created_at: string;
}

export interface RankingEntry {
  user: string;
  mates: number;
}
```

## API client base

```ts
// src/lib/api/client.ts
const API_URL = process.env.NEXT_PUBLIC_API_URL!;

export async function apiFetch<T>(
  path: string,
  init: RequestInit = {},
  token?: string
): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init.headers || {}),
    },
  });

  if (!res.ok) {
    const message = await res.text();
    throw new Error(message || "Request failed");
  }
  return res.json() as Promise<T>;
}
```

---

## 10) Ejemplos de componentes en React + Tailwind

## 10.1 Theme tokens + fuente

```css
/* src/styles/tokens.css */
:root {
  --mateco-primary: #253c0b;
  --mateco-bg-light: #f7f8f6;
  --mateco-bg-dark: #192012;
}
```

```tsx
// src/app/layout.tsx
import "./globals.css";
import "@/styles/tokens.css";
import { Plus_Jakarta_Sans } from "next/font/google";

const plusJakarta = Plus_Jakarta_Sans({ subsets: ["latin"] });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className={`${plusJakarta.className} bg-[var(--mateco-bg-light)] text-zinc-900`}>
        {children}
      </body>
    </html>
  );
}
```

## 10.2 Botón base reutilizable

```tsx
// src/components/ui/button.tsx
type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "danger";
};

export function Button({ variant = "primary", className = "", ...props }: ButtonProps) {
  const variants = {
    primary: "bg-[var(--mateco-primary)] text-white",
    secondary: "bg-white border border-zinc-200 text-zinc-900",
    danger: "bg-red-600 text-white",
  };

  return (
    <button
      className={`h-12 w-full rounded-xl px-4 font-semibold shadow-sm transition active:scale-[0.99] ${variants[variant]} ${className}`}
      {...props}
    />
  );
}
```

## 10.3 Tarjeta de ronda

```tsx
// src/components/rounds/round-card.tsx
import { Button } from "@/components/ui/button";

type RoundCardProps = {
  name: string;
  membersCount: number;
  turnStatusText: string;
  onEnter: () => void;
};

export function RoundCard({ name, membersCount, turnStatusText, onEnter }: RoundCardProps) {
  return (
    <article className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-zinc-100">
      <h3 className="text-lg font-bold">{name}</h3>
      <p className="text-sm text-zinc-600">{membersCount} integrantes</p>
      <p className="mt-2 rounded-lg bg-zinc-50 px-3 py-2 text-sm text-zinc-700">{turnStatusText}</p>
      <Button className="mt-3" onClick={onEnter}>
        Entrar a la ronda
      </Button>
    </article>
  );
}
```

## 10.4 Mesa circular de ronda

```tsx
// src/components/rounds/mate-table.tsx
type Member = { id: string; name: string; avatar: string };

type MateTableProps = {
  members: Member[];
  currentUserId: string;
};

export function MateTable({ members, currentUserId }: MateTableProps) {
  const radius = 120;
  const center = 160;

  return (
    <div className="relative mx-auto h-80 w-80">
      <div className="absolute left-1/2 top-1/2 flex h-24 w-24 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-zinc-100 text-3xl">
        🧉
      </div>

      {members.map((m, i) => {
        const angle = (2 * Math.PI * i) / members.length;
        const x = center + radius * Math.cos(angle) - 24;
        const y = center + radius * Math.sin(angle) - 24;
        const isCurrent = m.id === currentUserId;

        return (
          <div
            key={m.id}
            className={`absolute h-12 w-12 overflow-hidden rounded-full ring-2 ${isCurrent ? "ring-[var(--mateco-primary)]" : "ring-zinc-200"}`}
            style={{ left: x, top: y }}
            title={m.name}
          >
            <img src={m.avatar} alt={m.name} className="h-full w-full object-cover" />
          </div>
        );
      })}
    </div>
  );
}
```

## 10.5 Acción de turno (traje/no traje)

```tsx
// Ejemplo de uso en page de mesa
import { Button } from "@/components/ui/button";

export function TurnActions({
  onComplete,
  onMiss,
  disabled,
}: {
  onComplete: () => void;
  onMiss: () => void;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-3">
      <Button disabled={disabled} onClick={onComplete}>
        Traje el mate
      </Button>
      <Button variant="secondary" disabled={disabled} onClick={onMiss}>
        No traje mate
      </Button>
    </div>
  );
}
```

---

## Diseño visual (guía rápida)

- **Look & feel**: limpio, cálido, universitario, con foco en acción rápida.
- **Primary color**: `#253c0b` para CTAs y elementos de estado activo.
- **Background light**: `#f7f8f6` para pantallas principales.
- **Background dark**: `#192012` para headers destacados o banners.
- **Topografía de UI**: cards suaves, bordes redondeados `xl/2xl`, sombras leves.
- **Iconografía**: Material Symbols Outlined.
- **Tipografía**: Plus Jakarta Sans con pesos `500/700`.

---

## Criterios de calidad del MVP

- Tiempo de carga inicial en mobile aceptable (< 3s en 4G promedio).
- Navegación principal operable con una mano.
- Flujos críticos completos sin fricción:
  1. Login
  2. Ver rondas
  3. Entrar a mesa
  4. Marcar turno
- Estados vacíos y de error visibles y accionables.
- Accesibilidad básica:
  - contraste suficiente en botones primarios,
  - `aria-label` en acciones sin texto,
  - tamaño táctil mínimo de 44px.

---

## Roadmap frontend posterior al MVP

1. Notificaciones push de turno próximo.
2. Modo offline parcial para última ronda vista.
3. Compartir invite link nativo (Web Share API).
4. Estadísticas personales y por facultad.
5. Microanimaciones de avance de turno.

