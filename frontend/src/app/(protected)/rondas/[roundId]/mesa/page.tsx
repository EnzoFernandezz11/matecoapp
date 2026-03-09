"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import confetti from "canvas-confetti";

import { InviteCodeCard } from "@/components/rounds/invite-code-card";
import { MateTable } from "@/components/rounds/mate-table";
import { RoundSubnav } from "@/components/rounds/round-subnav";
import { ShareCard } from "@/components/rounds/share-card";
import { TurnStatusChip } from "@/components/rounds/turn-status-chip";
import { BottomNav } from "@/components/ui/bottom-nav";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LoadingSkeleton } from "@/components/ui/loading-skeleton";
import { useAuth } from "@/features/auth/use-auth";
import { useCompleteTurn, useCreateInvite, useCurrentTurn, useLeaveRound, useMissTurn, useResolvePenalty, useRoundDetail } from "@/features/rounds/hooks";
import { subscribePush } from "@/lib/api/endpoints";
import { createPushSubscription } from "@/lib/push";
import type { InviteLinkResponse } from "@/lib/api/types";

function toFriendlyError(error: unknown, fallback: string) {
  const message = error instanceof Error ? error.message : "";
  if (!message) return fallback;
  const lowered = message.toLowerCase();
  if (lowered.includes("failed to fetch") || lowered.includes("network")) {
    return "No pudimos conectar con el servidor. Revisa tu internet e intenta de nuevo.";
  }
  if (lowered.includes("today is not an active day")) {
    return "Esta ronda no esta activa hoy.";
  }
  if (lowered.includes("already resolved")) {
    return "Este turno ya fue resuelto.";
  }
  if (lowered.includes("not found")) {
    return "No encontramos ese turno. Actualiza la pantalla.";
  }
  return fallback;
}

export default function RoundTablePage() {
  const params = useParams<{ roundId: string }>();
  const roundId = params.roundId;
  const router = useRouter();
  const { user, token } = useAuth();
  const detail = useRoundDetail(roundId);
  const currentTurn = useCurrentTurn(roundId);
  const complete = useCompleteTurn(roundId);
  const miss = useMissTurn(roundId);
  const resolvePenalty = useResolvePenalty(roundId);
  const leave = useLeaveRound();
  const inviteMutation = useCreateInvite();
  const [inviteData, setInviteData] = useState<InviteLinkResponse | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [turnAdvanced, setTurnAdvanced] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showExcuseModal, setShowExcuseModal] = useState(false);
  const [pushStatus, setPushStatus] = useState<string | null>(null);
  const previousTurnUserRef = useRef<string | undefined>(undefined);

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
  const weekdays = ["Domingo", "Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sabado"];

  const handleActivateReminders = async () => {
    setActionError(null);
    setPushStatus(null);
    const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!vapidPublicKey) {
      setActionError("Falta configurar notificaciones en el servidor.");
      return;
    }
    try {
      if (typeof window === "undefined" || !("Notification" in window)) {
        setActionError("Tu navegador no soporta notificaciones.");
        return;
      }
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setActionError("Necesitamos permiso para enviarte recordatorios.");
        return;
      }
      const subscription = await createPushSubscription(vapidPublicKey);
      const json = subscription.toJSON();
      if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) {
        setActionError("No se pudo crear la suscripcion de notificaciones.");
        return;
      }
      await subscribePush(token as string, {
        endpoint: json.endpoint,
        keys: { p256dh: json.keys.p256dh, auth: json.keys.auth },
      });
      setPushStatus("Recordatorios activados.");
    } catch (error) {
      setActionError(toFriendlyError(error, "No pudimos activar recordatorios ahora."));
    }
  };

  useEffect(() => {
    const previous = previousTurnUserRef.current;
    const next = current?.user_id;
    if (previous && next && previous !== next) {
      setTurnAdvanced(true);
      const timeout = setTimeout(() => setTurnAdvanced(false), 1200);
      previousTurnUserRef.current = next;
      return () => clearTimeout(timeout);
    }
    previousTurnUserRef.current = next;
  }, [current?.user_id]);

  const handleComplete = async () => {
    if (!current) {
      return;
    }
    setActionError(null);
    setActionSuccess(null);
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
      setActionSuccess("Listo. Confirmamos que trajiste el mate.");
    } catch (error) {
      setActionError(toFriendlyError(error, "No pudimos confirmar tu turno. Intenta de nuevo."));
    }
  };

  const handleMiss = async (excuse: string) => {
    if (!current) {
      return;
    }
    setActionError(null);
    setActionSuccess(null);
    try {
      await miss.mutateAsync({ turnId: current.id, excuse });
      setShowExcuseModal(false);
      setActionSuccess("Se marco la falta y el turno paso al siguiente integrante.");
    } catch (error) {
      console.error("Failed to mark missed turn", error);
      setActionError(toFriendlyError(error, "No pudimos registrar la falta. Intenta de nuevo."));
    }
  };

  const handleInvite = async () => {
    setActionError(null);
    setActionSuccess(null);
    try {
      const invite = await inviteMutation.mutateAsync(roundId);
      setInviteData(invite);
    } catch (error) {
      setActionError(toFriendlyError(error, "No pudimos generar la invitacion."));
    }
  };

  const handleLeave = async () => {
    if (!confirm("Seguro que queres salir de esta ronda?")) {
      return;
    }
    setActionError(null);
    setActionSuccess(null);
    try {
      await leave.mutateAsync(roundId);
      router.push("/rondas");
    } catch (error) {
      setActionError(toFriendlyError(error, "No pudimos sacarte de la ronda. Intenta de nuevo."));
    }
  };

  const handleResolvePenalty = async (penaltyId: string) => {
    setActionError(null);
    setActionSuccess(null);
    try {
      await resolvePenalty.mutateAsync(penaltyId);
      setActionSuccess("Prenda marcada como resuelta.");
    } catch (error) {
      console.error("Failed to resolve penalty", error);
      setActionError(toFriendlyError(error, "No pudimos resolver la prenda."));
    }
  };

  const penalties = detail.data?.penalties ?? [];

  return (
    <>
      <header className="mb-3 flex items-center justify-between">
        <div>
          <h1 className="text-[var(--text-lg-fluid)] font-extrabold text-zinc-900">{detail.data?.round.name ?? "Mesa matera"}</h1>
          <p className="text-[var(--text-xs-fluid)] uppercase tracking-wide text-zinc-500">Mesa matera</p>
        </div>
      </header>
      <RoundSubnav roundId={roundId} />

      <Card>
        {loading ? (
          <LoadingSkeleton className="h-[clamp(18rem,58vw,24rem)] w-full rounded-2xl" />
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
          <div className={`flex items-center justify-between ${turnAdvanced ? "animate-subtle-pop" : ""}`}>
            <div>
              <p className="text-[var(--text-xs-fluid)] font-semibold uppercase tracking-wide text-emerald-700">Turno actual</p>
              <p className="text-[var(--text-sm-fluid)] text-zinc-700">Hoy lleva mate: <span className="font-bold">{detail.data?.current_turn?.user_name ?? "Sin definir"}</span></p>
            </div>
            <div className="flex items-center gap-2">
              <TurnStatusChip status={current.status} />
              {(current.status === "pending" || current.status === "reassigned") && (
                <button
                  onClick={() => setShowShare(true)}
                  className="flex items-center justify-center rounded-full bg-zinc-100 p-2 text-zinc-600 hover:bg-zinc-200"
                  title="Anunciar turno"
                >
                  <span className="material-symbols-outlined text-[18px]">ios_share</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          <p className="text-[var(--text-sm-fluid)] text-zinc-600">No hay un turno activo en este momento.</p>
        )}

        <Button
          className={`mt-4 ${complete.isPending ? "animate-subtle-pop" : ""}`}
          onClick={handleComplete}
          disabled={!canResolveTurn || complete.isPending || miss.isPending}
        >
          {complete.isPending ? "Guardando..." : "🧉 Llevo el mate"}
        </Button>
        <Button
          className="mt-2"
          variant="secondary"
          onClick={() => setShowExcuseModal(true)}
          disabled={!canResolveTurn || complete.isPending || miss.isPending}
        >
          {miss.isPending ? "Guardando..." : "❌ No puedo llevar"}
        </Button>
        {!canResolveTurn && current ? <p className="mt-2 text-[var(--text-xs-fluid)] text-zinc-500">Solo {detail.data?.current_turn?.user_name} (o quien administre la ronda) puede confirmar este turno.</p> : null}
        {isAdmin ? <p className="mt-2 text-[var(--text-xs-fluid)] text-zinc-500">Sos admin: podes gestionar turnos y compartir invitacion.</p> : null}
        {actionError ? <p className="mt-2 text-[var(--text-xs-fluid)] text-red-600">{actionError}</p> : null}
        {actionSuccess ? <p className="mt-2 text-[var(--text-xs-fluid)] text-emerald-700">{actionSuccess}</p> : null}
        <Button className="mt-3" variant="secondary" onClick={handleActivateReminders}>
          🔔 Activar recordatorios de mate
        </Button>
        {pushStatus ? <p className="mt-2 text-[var(--text-xs-fluid)] text-emerald-700">{pushStatus}</p> : null}
      </Card>

      <Card className="mt-4">
        <p className="text-[var(--text-sm-fluid)] font-semibold text-zinc-900">Proximos mates</p>
        {detail.data?.upcoming_turns?.length ? (
          <ul className="mt-2 space-y-2">
            {detail.data.upcoming_turns.map((turn) => {
              const d = new Date(`${turn.date}T00:00:00`);
              return (
                <li key={turn.id} className="flex items-center justify-between rounded-lg bg-zinc-50 px-3 py-2">
                  <p className="text-[var(--text-sm-fluid)] text-zinc-700">
                    <span className="font-semibold">{weekdays[d.getDay()]}</span> {"->"} {turn.user_name}
                  </p>
                  <TurnStatusChip status={turn.status} />
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="mt-2 text-[var(--text-sm-fluid)] text-zinc-500">No hay turnos programados.</p>
        )}
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

      <Card className="mt-4">
        <p className="text-sm font-semibold text-zinc-900">Prendas</p>
        {penalties.length === 0 ? (
          <p className="mt-2 text-sm text-zinc-500">Todavia no hay prendas en esta ronda.</p>
        ) : (
          <div className="mt-3 space-y-2">
            {penalties.map((penalty) => (
              <div key={penalty.id} className="rounded-xl border border-zinc-200 bg-zinc-50 p-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-zinc-900">
                      {penalty.user_name} - {penalty.type}
                    </p>
                    {penalty.description ? (
                      <p className="text-xs text-zinc-600">Excusa: {penalty.description}</p>
                    ) : null}
                  </div>
                  <span
                    className={`rounded-full px-2 py-1 text-[11px] font-semibold uppercase ${
                      penalty.resolved ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {penalty.resolved ? "Resuelta" : "Pendiente"}
                  </span>
                </div>
                {isAdmin && !penalty.resolved ? (
                  <Button
                    className="mt-2"
                    variant="secondary"
                    onClick={() => handleResolvePenalty(penalty.id)}
                    disabled={resolvePenalty.isPending}
                  >
                    Marcar como resuelta
                  </Button>
                ) : null}
              </div>
            ))}
          </div>
        )}
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
