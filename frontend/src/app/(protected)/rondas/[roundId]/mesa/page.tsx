"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import confetti from "canvas-confetti";

import { InviteCodeCard } from "@/components/rounds/invite-code-card";
import { MateTable } from "@/components/rounds/mate-table";
import { ShareCard } from "@/components/rounds/share-card";
import { TurnStatusChip } from "@/components/rounds/turn-status-chip";
import { BottomNav } from "@/components/ui/bottom-nav";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LoadingSkeleton } from "@/components/ui/loading-skeleton";
import { useAuth } from "@/features/auth/use-auth";
import { useCompleteTurn, useCreateInvite, useCurrentTurn, useLeaveRound, useMissTurn, useRoundDetail } from "@/features/rounds/hooks";
import type { InviteLinkResponse } from "@/lib/api/types";

export default function RoundTablePage() {
  const params = useParams<{ roundId: string }>();
  const roundId = params.roundId;
  const router = useRouter();
  const { user } = useAuth();
  const detail = useRoundDetail(roundId);
  const currentTurn = useCurrentTurn(roundId);
  const complete = useCompleteTurn(roundId);
  const miss = useMissTurn(roundId);
  const leave = useLeaveRound();
  const inviteMutation = useCreateInvite();
  const [inviteData, setInviteData] = useState<InviteLinkResponse | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [showShare, setShowShare] = useState(false);
  const [showExcuseModal, setShowExcuseModal] = useState(false);

  const EXCUSES = [
    "Me abdujeron los aliens 👽",
    "El perro se tomó el agua del termo 🐕",
    "Se me pinchó la yerba 🌿",
    "Me quedé dormido 😴",
    "Me robaron el mate 🏃‍♂️",
    "Hoy soy team café ☕",
  ];

  const loading = detail.isLoading || currentTurn.isLoading;
  const current = currentTurn.data;
  const isMyTurn = current?.user_id === user?.id;
  const isAdmin = detail.data?.round.created_by === user?.id;
  const canResolveTurn = Boolean(current && (isMyTurn || isAdmin));

  const handleComplete = async () => {
    if (!current) {
      return;
    }
    setActionError(null);
    try {
      await complete.mutateAsync(current.id);

      // Micro-interactions: Confetti & Haptic Feedback
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 },
        colors: ["#3b82f6", "#22c55e", "#f59e0b", "#6366f1"],
      });
      if (typeof window !== "undefined" && window.navigator && window.navigator.vibrate) {
        window.navigator.vibrate([30, 50, 30]);
      }
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "No se pudo completar el turno");
    }
  };

  const handleMiss = async (excuse: string) => {
    if (!current) {
      return;
    }
    setActionError(null);
    try {
      await miss.mutateAsync({ turnId: current.id, excuse });
      setShowExcuseModal(false);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "No se pudo marcar la falta");
    }
  };

  const handleInvite = async () => {
    setActionError(null);
    try {
      const invite = await inviteMutation.mutateAsync(roundId);
      setInviteData(invite);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "No se pudo crear la invitacion");
    }
  };

  const handleLeave = async () => {
    if (!confirm("Seguro que queres salir de esta ronda?")) {
      return;
    }
    setActionError(null);
    try {
      await leave.mutateAsync(roundId);
      router.push("/rondas");
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "No se pudo salir de la ronda");
    }
  };

  return (
    <>
      <header className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-zinc-900">{detail.data?.round.name ?? "Mesa matera"}</h1>
          <p className="text-xs uppercase tracking-wide text-zinc-500">Mesa matera</p>
        </div>
        <button
          onClick={() => router.push(`/rondas/${roundId}/ranking`)}
          className="rounded-full bg-white p-2 ring-1 ring-zinc-200"
          aria-label="Ir al ranking"
        >
          <span className="material-symbols-outlined text-zinc-700">emoji_events</span>
        </button>
      </header>

      <Card>
        {loading ? (
          <LoadingSkeleton className="h-72 w-full rounded-2xl" />
        ) : (
          <MateTable
            members={
              detail.data?.members.map((member) => ({
                id: member.user.id,
                name: member.user.name,
                avatarUrl: member.user.avatar_url,
              })) ?? []
            }
            currentTurnUserId={current?.user_id}
          />
        )}
      </Card>

      <Card className="mt-4">
        {current ? (
          <div className="flex items-center justify-between">
            <p className="text-sm text-zinc-700">
              Turno actual: <span className="font-bold">{detail.data?.current_turn?.user_name ?? "Sin definir"}</span>
            </p>
            <div className="flex items-center gap-2">
              <TurnStatusChip status={current.status} />
              {current.status === "pending" && (
                <button
                  onClick={() => setShowShare(true)}
                  className="flex items-center justify-center rounded-full bg-zinc-100 p-1 text-zinc-600 hover:bg-zinc-200"
                  title="Anunciar turno"
                >
                  <span className="material-symbols-outlined text-[18px]">ios_share</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          <p className="text-sm text-zinc-600">No hay turno activo.</p>
        )}

        <Button className="mt-4" onClick={handleComplete} disabled={!canResolveTurn || complete.isPending || miss.isPending}>
          {complete.isPending ? "Guardando..." : "Traje el mate"}
        </Button>
        <Button
          className="mt-2"
          variant="secondary"
          onClick={() => setShowExcuseModal(true)}
          disabled={!canResolveTurn || complete.isPending || miss.isPending}
        >
          {miss.isPending ? "Guardando..." : "No traje mate"}
        </Button>
        {!canResolveTurn && current ? <p className="mt-2 text-xs text-zinc-500">Solo {detail.data?.current_turn?.user_name} o el admin pueden marcar este turno.</p> : null}
        {isAdmin ? <p className="mt-2 text-xs text-zinc-500">Sos admin: podes gestionar turnos y compartir invitacion.</p> : null}
        {actionError ? <p className="mt-2 text-xs text-red-600">{actionError}</p> : null}
      </Card>

      {isAdmin ? (
        <Card className="mt-4">
          <p className="text-sm font-semibold text-zinc-900">Administrar ronda</p>
          <Button className="mt-3" variant="secondary" onClick={handleInvite} disabled={inviteMutation.isPending}>
            {inviteMutation.isPending ? "Generando invitacion..." : "Compartir ronda"}
          </Button>
          {inviteData ? <div className="mt-3"><InviteCodeCard title="Invitacion de la ronda" code={inviteData.invite_code} link={inviteData.invite_link} /></div> : null}
        </Card>
      ) : null}

      <Card className="mt-4">
        <p className="text-sm font-semibold text-zinc-900">Participacion</p>
        <Button className="mt-3" variant="secondary" onClick={handleLeave} disabled={leave.isPending || isAdmin}>
          {leave.isPending ? "Saliendo..." : "Salir de esta ronda"}
        </Button>
        {isAdmin ? (
          <p className="mt-2 text-xs text-zinc-500">Como creador no podes salir de la ronda.</p>
        ) : null}
      </Card>

      <BottomNav currentRoundId={roundId} />

      {showShare && current && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="relative w-full max-w-sm">
            <button
              onClick={() => setShowShare(false)}
              className="absolute -top-12 right-0 text-white p-2"
            >
              <span className="material-symbols-outlined text-3xl">close</span>
            </button>
            <ShareCard
              userName={detail.data?.current_turn?.user_name || "Desconocido"}
              avatarUrl={detail.data?.members.find(m => m.user.id === current.user_id)?.user.avatar_url || ""}
              role="TURN"
              statsText="Prepará el agua, que la ronda te espera."
            />
          </div>
        </div>
      )}

      {showExcuseModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center p-0 sm:p-4">
          <div className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-xl overflow-hidden animate-in slide-in-from-bottom-10 sm:zoom-in-95 duration-200">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-xl font-black text-zinc-900 leading-tight">¿Qué pasó con el mate?</h3>
                  <p className="text-sm text-zinc-500 font-medium mt-1">Elegí tu excusa (pública para la ronda).</p>
                </div>
                <button
                  onClick={() => setShowExcuseModal(false)}
                  className="rounded-full bg-zinc-100 p-2 text-zinc-500 hover:bg-zinc-200 transition-colors"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <div className="space-y-2 max-h-[60vh] overflow-y-auto pb-4 custom-scrollbar pr-1">
                {EXCUSES.map((exc) => (
                  <button
                    key={exc}
                    onClick={() => handleMiss(exc)}
                    className="w-full text-left p-4 rounded-2xl border-2 border-zinc-100 bg-white hover:border-zinc-300 hover:bg-zinc-50 active:bg-zinc-100 transition-all font-medium text-zinc-800 text-sm group flex justify-between items-center"
                    disabled={miss.isPending}
                  >
                    {exc}
                    <span className="material-symbols-outlined text-zinc-300 group-hover:text-zinc-500 text-sm transition-colors">
                      arrow_forward_ios
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
