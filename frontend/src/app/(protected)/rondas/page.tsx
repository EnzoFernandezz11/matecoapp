"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { RoundCard } from "@/components/rounds/round-card";
import { BottomNav } from "@/components/ui/bottom-nav";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingSkeleton } from "@/components/ui/loading-skeleton";
import { useRoundDetail, useRounds } from "@/features/rounds/hooks";

function DashboardRoundCard({
  roundId,
  name,
  onEnter,
}: {
  roundId: string;
  name: string;
  onEnter: () => void;
}) {
  const { data, isLoading } = useRoundDetail(roundId);
  if (isLoading) {
    return <LoadingSkeleton className="h-32 w-full rounded-2xl" />;
  }
  const current = data?.current_turn ? `Turno de ${data.current_turn.user_name}` : "Sin turno activo";
  const membersCount = data?.members.length ?? 0;
  return <RoundCard name={name} membersCount={membersCount} turnStatus={current} onEnter={onEnter} />;
}

export default function RoundsPage() {
  const router = useRouter();
  const rounds = useRounds();

  return (
    <>
      <header className="mb-6 flex flex-col gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-zinc-900">Mis rondas</h1>
          <p className="text-sm text-zinc-600">Organiza los turnos de mate de tu cursada</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Link
            href="/rondas/nueva"
            className="flex h-12 items-center justify-center rounded-xl bg-mateco-primary text-base font-semibold text-white transition active:scale-[0.98] active:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mateco-primary/50 focus-visible:ring-offset-2"
          >
            + Nueva ronda
          </Link>
          <Link
            href="/rondas/unirse"
            className="flex h-12 items-center justify-center rounded-xl bg-white text-base font-semibold text-zinc-700 ring-1 ring-zinc-200 transition active:scale-[0.98] active:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2"
          >
            Unirse
          </Link>
        </div>
      </header>

      <section className="space-y-3">
        {rounds.isLoading ? (
          <>
            <LoadingSkeleton className="h-32 w-full rounded-2xl" />
            <LoadingSkeleton className="h-32 w-full rounded-2xl" />
          </>
        ) : null}

        {!rounds.isLoading && rounds.data?.length === 0 ? (
          <EmptyState
            title="No tenes rondas todavia"
            description="Crea una nueva ronda o unite con codigo de invitacion."
            actionLabel="Crear ronda"
            onAction={() => router.push("/rondas/nueva")}
          />
        ) : null}

        {rounds.data?.map((round) => (
          <DashboardRoundCard
            key={round.id}
            roundId={round.id}
            name={round.name}
            onEnter={() => router.push(`/rondas/${round.id}/mesa`)}
          />
        ))}
      </section>

      <Card className="mt-8 flex flex-col items-start gap-1 bg-mateco-primary p-5 text-white">
        <p className="text-base font-bold">Crear nueva ronda</p>
        <p className="text-sm text-zinc-100">Te genera codigo, link y QR para invitar al toque.</p>
        <Button
          className="mt-3 bg-white text-mateco-primary transition active:scale-[0.98] active:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-mateco-primary"
          onClick={() => router.push("/rondas/nueva")}
        >
          Ir a crear nueva ronda
        </Button>
      </Card>

      <BottomNav currentRoundId={rounds.data?.[0]?.id} />
    </>
  );
}
