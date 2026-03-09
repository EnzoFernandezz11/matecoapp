"use client";

import { Card } from "@/components/ui/card";
import { LoadingSkeleton } from "@/components/ui/loading-skeleton";
import { useAdminStats } from "@/features/admin/hooks";

function formatDate(value: string) {
  return new Date(value).toLocaleString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AdminDashboardPage() {
  const stats = useAdminStats();

  if (stats.isLoading) {
    return (
      <div className="space-y-3">
        <LoadingSkeleton className="h-24 w-full rounded-2xl" />
        <LoadingSkeleton className="h-24 w-full rounded-2xl" />
      </div>
    );
  }

  if (stats.error || !stats.data) {
    return <p className="text-sm text-red-600">No se pudo cargar el dashboard admin.</p>;
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Card>
          <p className="text-xs uppercase text-zinc-500">Usuarios totales</p>
          <p className="mt-1 text-2xl font-black text-zinc-900">{stats.data.total_users}</p>
        </Card>
        <Card>
          <p className="text-xs uppercase text-zinc-500">Nuevos (7 dias)</p>
          <p className="mt-1 text-2xl font-black text-zinc-900">{stats.data.new_users_last_7_days}</p>
        </Card>
        <Card>
          <p className="text-xs uppercase text-zinc-500">Mesas creadas</p>
          <p className="mt-1 text-2xl font-black text-zinc-900">{stats.data.total_rounds}</p>
        </Card>
      </div>

      <Card>
        <h2 className="text-sm font-bold text-zinc-900">Ultimos registros</h2>
        {stats.data.recent_users.length === 0 ? (
          <p className="mt-2 text-sm text-zinc-500">No hay registros recientes.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {stats.data.recent_users.map((user) => (
              <li key={user.id} className="rounded-lg border border-zinc-200 p-3">
                <p className="text-sm font-semibold text-zinc-900">{user.name}</p>
                <p className="text-xs text-zinc-600">{user.email}</p>
                <p className="text-xs text-zinc-500">{formatDate(user.created_at)}</p>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
