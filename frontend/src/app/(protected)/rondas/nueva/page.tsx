"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { InviteCodeCard } from "@/components/rounds/invite-code-card";
import { BottomNav } from "@/components/ui/bottom-nav";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useCreateInvite, useCreateRound } from "@/features/rounds/hooks";
import type { InviteLinkResponse } from "@/lib/api/types";

const WEEKDAYS = [
  { value: 0, label: "Lun" },
  { value: 1, label: "Mar" },
  { value: 2, label: "Mie" },
  { value: 3, label: "Jue" },
  { value: 4, label: "Vie" },
  { value: 5, label: "Sab" },
  { value: 6, label: "Dom" },
] as const;

export default function CreateRoundPage() {
  const router = useRouter();
  const createRound = useCreateRound();
  const [name, setName] = useState("");
  const [penaltyMode, setPenaltyMode] = useState<"auto" | "vote">("auto");
  const [activeDays, setActiveDays] = useState<number[]>([0, 1, 2, 3, 4]);
  const [createdRoundId, setCreatedRoundId] = useState<string | null>(null);
  const [inviteData, setInviteData] = useState<InviteLinkResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inviteMutation = useCreateInvite();

  const toggleDay = (day: number) => {
    setActiveDays((prev) => {
      const next = prev.includes(day) ? prev.filter((item) => item !== day) : [...prev, day];
      return next.sort((a, b) => a - b);
    });
  };

  const submit = async () => {
    if (!name.trim()) {
      setError("Ingresa un nombre para la ronda.");
      return;
    }
    if (activeDays.length === 0) {
      setError("Selecciona al menos un dia de la semana.");
      return;
    }
    setError(null);
    const created = await createRound.mutateAsync({
      name: name.trim(),
      penalty_mode: penaltyMode,
      active_days: activeDays,
    });
    setCreatedRoundId(created.id);
    const invite = await inviteMutation.mutateAsync(created.id);
    setInviteData(invite);
  };

  return (
    <>
      <header className="mb-4">
        <h1 className="text-2xl font-extrabold text-zinc-900">Crear ronda</h1>
        <p className="text-sm text-zinc-600">Defini nombre y modo de penalizacion</p>
      </header>

      <Card>
        <label className="mb-2 block text-sm font-medium text-zinc-700">Nombre de la ronda</label>
        <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Ej: Digital 2" />

        <p className="mb-2 mt-4 text-sm font-medium text-zinc-700">Modo de penalizacion</p>
        <div className="grid grid-cols-2 gap-2">
          <Button variant={penaltyMode === "auto" ? "primary" : "secondary"} onClick={() => setPenaltyMode("auto")}>
            Auto
          </Button>
          <Button variant={penaltyMode === "vote" ? "primary" : "secondary"} onClick={() => setPenaltyMode("vote")}>
            Votacion
          </Button>
        </div>

        <p className="mb-2 mt-4 text-sm font-medium text-zinc-700">Dias activos de la ronda</p>
        <div className="grid grid-cols-4 gap-2">
          {WEEKDAYS.map((day) => (
            <Button
              key={day.value}
              type="button"
              variant={activeDays.includes(day.value) ? "primary" : "secondary"}
              onClick={() => toggleDay(day.value)}
            >
              {day.label}
            </Button>
          ))}
        </div>
        <p className="mt-2 text-xs text-zinc-500">
          Solo en estos dias se podra marcar Traje el mate y avanzar turnos.
        </p>
        {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}

        <Button className="mt-4" onClick={submit} disabled={createRound.isPending}>
          {createRound.isPending ? "Creando..." : "Crear nueva ronda"}
        </Button>
      </Card>

      {inviteData ? <div className="mt-4"><InviteCodeCard code={inviteData.invite_code} link={inviteData.invite_link} /></div> : null}

      {createdRoundId ? (
        <Button className="mt-4" variant="secondary" onClick={() => router.push(`/rondas/${createdRoundId}/mesa`)}>
          Ir a la mesa
        </Button>
      ) : null}

      <BottomNav currentRoundId={createdRoundId ?? undefined} />
    </>
  );
}
