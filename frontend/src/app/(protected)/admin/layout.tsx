"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { AdminLayout as AdminShell } from "@/components/admin/admin-layout";
import { LoadingSkeleton } from "@/components/ui/loading-skeleton";
import { useAdminStats } from "@/features/admin/hooks";
import { ApiError } from "@/lib/api/client";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const stats = useAdminStats();

  useEffect(() => {
    if (stats.error instanceof ApiError && stats.error.status === 403) {
      router.replace("/rondas");
    }
  }, [stats.error, router]);

  if (stats.isLoading) {
    return <LoadingSkeleton className="h-40 w-full rounded-2xl" />;
  }

  if (stats.error instanceof ApiError && stats.error.status === 403) {
    return null;
  }

  if (stats.error) {
    return <p className="text-sm text-red-600">No se pudo cargar el panel admin.</p>;
  }

  return <AdminShell>{children}</AdminShell>;
}
