"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { AdminUserListItem } from "@/lib/api/types";

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function UsersTable({
  users,
  onDelete,
  deletingId,
}: {
  users: AdminUserListItem[];
  onDelete: (id: string, email: string) => void;
  deletingId?: string | null;
}) {
  if (!users.length) {
    return <Card><p className="text-sm text-zinc-500">No hay usuarios para mostrar.</p></Card>;
  }

  return (
    <Card className="overflow-hidden p-0">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left">
          <thead className="bg-zinc-50">
            <tr className="text-xs uppercase text-zinc-500">
              <th className="px-4 py-3">Nombre</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Registro</th>
              <th className="px-4 py-3">Mesas</th>
              <th className="px-4 py-3">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-t border-zinc-100 text-sm text-zinc-800">
                <td className="px-4 py-3 font-semibold">{user.name}</td>
                <td className="px-4 py-3">{user.email}</td>
                <td className="px-4 py-3">{formatDate(user.created_at)}</td>
                <td className="px-4 py-3">{user.mesas_joined}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <Link
                      href={`/admin/users/${user.id}`}
                      className="inline-flex h-9 items-center rounded-lg border border-zinc-300 px-3 text-xs font-semibold text-zinc-700"
                    >
                      Ver
                    </Link>
                    <Button
                      variant="danger"
                      className="h-9 w-auto px-3 text-xs"
                      disabled={deletingId === user.id}
                      onClick={() => onDelete(user.id, user.email)}
                    >
                      {deletingId === user.id ? "Eliminando..." : "Eliminar"}
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
