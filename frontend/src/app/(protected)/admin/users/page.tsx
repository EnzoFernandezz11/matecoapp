"use client";

import { useMemo, useState } from "react";

import { UsersTable } from "@/components/admin/users-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoadingSkeleton } from "@/components/ui/loading-skeleton";
import { useAdminUsers, useDeleteAdminUser } from "@/features/admin/hooks";

const PAGE_SIZE = 20;

export default function AdminUsersPage() {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);

  const skip = useMemo(() => page * PAGE_SIZE, [page]);
  const usersQuery = useAdminUsers({ search, skip, limit: PAGE_SIZE });
  const deleteMutation = useDeleteAdminUser();

  const totalPages = usersQuery.data ? Math.max(1, Math.ceil(usersQuery.data.total / PAGE_SIZE)) : 1;

  const handleDelete = async (id: string, email: string) => {
    if (!confirm(`Seguro que queres eliminar a ${email}? Esta accion no se puede deshacer.`)) {
      return;
    }
    await deleteMutation.mutateAsync(id);
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Input
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
          placeholder="Buscar por nombre o email"
        />
        <Button
          className="w-auto px-4"
          onClick={() => {
            setPage(0);
            setSearch(searchInput.trim());
          }}
        >
          Buscar
        </Button>
      </div>

      {usersQuery.isLoading ? (
        <LoadingSkeleton className="h-40 w-full rounded-2xl" />
      ) : usersQuery.error ? (
        <p className="text-sm text-red-600">No se pudieron cargar los usuarios.</p>
      ) : (
        <UsersTable
          users={usersQuery.data?.items ?? []}
          deletingId={deleteMutation.isPending ? deleteMutation.variables : null}
          onDelete={handleDelete}
        />
      )}

      <div className="flex items-center justify-between">
        <p className="text-xs text-zinc-500">Pagina {page + 1} de {totalPages}</p>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            className="h-10 w-auto px-3 text-sm"
            onClick={() => setPage((prev) => Math.max(0, prev - 1))}
            disabled={page === 0}
          >
            Anterior
          </Button>
          <Button
            variant="secondary"
            className="h-10 w-auto px-3 text-sm"
            onClick={() => setPage((prev) => prev + 1)}
            disabled={page + 1 >= totalPages}
          >
            Siguiente
          </Button>
        </div>
      </div>
    </div>
  );
}
