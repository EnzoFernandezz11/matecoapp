"use client";

import { useRouter } from "next/navigation";

import { BottomNav } from "@/components/ui/bottom-nav";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LoadingSkeleton } from "@/components/ui/loading-skeleton";
import { useAuth } from "@/features/auth/use-auth";
import { useRoundDetail, useRounds } from "@/features/rounds/hooks";

function NextTurnCard({ roundId, roundName }: { roundId: string; roundName: string }) {
  const router = useRouter();
  const { user } = useAuth();
  const detail = useRoundDetail(roundId);

  if (detail.isLoading) {
    return <LoadingSkeleton className="h-28 w-full rounded-2xl" />;
  }

  const current = detail.data?.current_turn;
  if (!current) {
    return null;
  }

  const isMyTurn = current.user_id === user?.id;

  return (
    <Card className={isMyTurn ? "border-mateco-primary bg-mateco-primary/5" : ""}>
      <p className="text-xs uppercase tracking-wide text-zinc-500">{roundName}</p>
      <p className="mt-1 text-base font-bold text-zinc-900">
        {isMyTurn ? "Te toca llevar el mate" : `Turno de ${current.user_name}`}
      </p>
      <div className="mt-3 flex gap-2">
        <Button className="flex-1" onClick={() => router.push(`/rondas/${roundId}/mesa`)}>
          Ir a mesa
        </Button>
      </div>
    </Card>
  );
}

export default function InicioPage() {
  const router = useRouter();
  const rounds = useRounds();

  return (
    <>
      <header className="mb-4">
        <h1 className="text-2xl font-extrabold text-zinc-900">Inicio</h1>
        <p className="text-sm text-zinc-600">Tu resumen rapido de rondas y turnos.</p>
      </header>

      <section className="space-y-3">
        {rounds.isLoading ? (
          <>
            <LoadingSkeleton className="h-28 w-full rounded-2xl" />
            <LoadingSkeleton className="h-28 w-full rounded-2xl" />
          </>
        ) : null}

        {!rounds.isLoading && rounds.data?.length === 0 ? (
          <Card>
            <p className="text-base font-semibold text-zinc-900">Todavia no estas en ninguna ronda</p>
            <p className="mt-1 text-sm text-zinc-600">Crea una nueva o unite con codigo para empezar.</p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Button onClick={() => router.push("/rondas/nueva")}>Crear ronda</Button>
              <Button variant="secondary" onClick={() => router.push("/rondas/unirse")}>
                Unirme
              </Button>
            </div>
          </Card>
        ) : null}

        {rounds.data?.map((round) => (
          <NextTurnCard key={round.id} roundId={round.id} roundName={round.name} />
        ))}
      </section>

      <BottomNav />
    </>
  );
}
