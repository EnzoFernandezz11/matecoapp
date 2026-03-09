"use client";

import { Card } from "@/components/ui/card";
import type { AdminUserDetail } from "@/lib/api/types";

function formatDate(value: string) {
  return new Date(value).toLocaleString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function UserDetail({ user }: { user: AdminUserDetail }) {
  return (
    <div className="space-y-3">
      <Card>
        <h2 className="text-base font-bold text-zinc-900">{user.name}</h2>
        <p className="text-sm text-zinc-600">{user.email}</p>
        <p className="mt-2 text-xs text-zinc-500">Registrado: {formatDate(user.created_at)}</p>
      </Card>

      <Card>
        <h3 className="text-sm font-bold text-zinc-900">Actividad</h3>
        <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
          <p className="rounded-lg bg-zinc-50 p-2">Mesas: <span className="font-bold">{user.mesas_joined}</span></p>
          <p className="rounded-lg bg-zinc-50 p-2">Turnos: <span className="font-bold">{user.turns_total}</span></p>
          <p className="rounded-lg bg-zinc-50 p-2">Cumplidos: <span className="font-bold">{user.turns_completed}</span></p>
          <p className="rounded-lg bg-zinc-50 p-2">Fallados: <span className="font-bold">{user.turns_missed}</span></p>
        </div>
      </Card>

      <Card>
        <h3 className="text-sm font-bold text-zinc-900">Mesas del usuario</h3>
        {user.rounds.length === 0 ? (
          <p className="mt-2 text-sm text-zinc-500">No participa en mesas por ahora.</p>
        ) : (
          <ul className="mt-2 space-y-2">
            {user.rounds.map((round) => (
              <li key={round.id} className="rounded-lg border border-zinc-200 p-2">
                <p className="text-sm font-semibold text-zinc-900">{round.name}</p>
                <p className="text-xs text-zinc-500">
                  Se unio: {formatDate(round.joined_at)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
