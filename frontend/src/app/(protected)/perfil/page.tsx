"use client";

import { useRouter } from "next/navigation";

import { Avatar } from "@/components/ui/avatar";
import { BottomNav } from "@/components/ui/bottom-nav";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/features/auth/use-auth";
import { useRounds } from "@/features/rounds/hooks";

export default function ProfilePage() {
  const router = useRouter();
  const { user, clearAuth } = useAuth();
  const rounds = useRounds();

  const totalRounds = rounds.data?.length ?? 0;
  const universityName = user?.university_ref?.name ?? user?.university ?? "No definida";

  return (
    <>
      <header className="mb-4">
        <h1 className="text-2xl font-extrabold text-zinc-900">Perfil</h1>
      </header>

      <Card>
        <div className="flex items-center gap-3">
          <Avatar name={user?.name ?? "Usuario"} src={user?.avatar_url} className="h-16 w-16" />
          <div>
            <p className="text-lg font-bold text-zinc-900">{user?.name}</p>
            <p className="text-sm text-zinc-600">{user?.email}</p>
          </div>
        </div>
      </Card>

      <Card className="mt-3">
        <p className="text-sm text-zinc-700">Rondas activas: <span className="font-bold">{totalRounds}</span></p>
        <p className="mt-1 text-sm text-zinc-700">Universidad: <span className="font-bold">{universityName}</span></p>
        <p className="mt-1 text-sm text-zinc-700">Carrera: <span className="font-bold">{user?.career ?? "No definida"}</span></p>
      </Card>

      <Button
        className="mt-4"
        variant="secondary"
        onClick={() => {
          clearAuth();
          router.replace("/login");
        }}
      >
        Cerrar sesion
      </Button>

      <BottomNav />
    </>
  );
}
