"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

import { UserDetail } from "@/components/admin/user-detail";
import { UserEditForm } from "@/components/admin/user-edit-form";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LoadingSkeleton } from "@/components/ui/loading-skeleton";
import { useAdminUser, useDeleteAdminUser, useUpdateAdminUser } from "@/features/admin/hooks";

export default function AdminUserDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const userId = params.id;
  const userQuery = useAdminUser(userId);
  const updateMutation = useUpdateAdminUser(userId);
  const deleteMutation = useDeleteAdminUser();

  const handleDelete = async () => {
    if (!userQuery.data) return;
    if (!confirm(`Seguro que queres eliminar a ${userQuery.data.email}?`)) {
      return;
    }
    await deleteMutation.mutateAsync(userId);
    router.replace("/admin/users");
  };

  if (userQuery.isLoading) {
    return <LoadingSkeleton className="h-48 w-full rounded-2xl" />;
  }

  if (userQuery.error || !userQuery.data) {
    return (
      <Card>
        <p className="text-sm text-red-600">No se pudo cargar el usuario.</p>
        <Link href="/admin/users" className="mt-3 inline-flex text-sm font-semibold text-zinc-700 underline">
          Volver a usuarios
        </Link>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <Card>
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-base font-bold text-zinc-900">Editar usuario</h2>
          <Link href="/admin/users" className="text-xs font-semibold text-zinc-600 underline">
            Volver
          </Link>
        </div>
        <div className="mt-3">
          <UserEditForm
            user={userQuery.data}
            isSaving={updateMutation.isPending}
            onSubmit={async (payload) => {
              await updateMutation.mutateAsync(payload);
            }}
          />
        </div>
        <Button
          className="mt-3"
          variant="danger"
          disabled={deleteMutation.isPending}
          onClick={handleDelete}
        >
          {deleteMutation.isPending ? "Eliminando..." : "Eliminar usuario"}
        </Button>
      </Card>

      <UserDetail user={userQuery.data} />
    </div>
  );
}
