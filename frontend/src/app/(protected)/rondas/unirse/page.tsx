"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { BottomNav } from "@/components/ui/bottom-nav";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useJoinRoundByCode } from "@/features/rounds/hooks";

export default function JoinRoundPage() {
  const router = useRouter();
  const [inviteCode, setInviteCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const joinByCode = useJoinRoundByCode();

  const handleJoin = async () => {
    if (!inviteCode.trim()) {
      setError("Ingresa un codigo");
      return;
    }
    setError(null);
    try {
      const round = await joinByCode.mutateAsync(inviteCode.trim().toUpperCase());
      router.push(`/rondas/${round.id}/mesa`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo unir a la ronda");
    }
  };

  return (
    <>
      <header className="mb-4">
        <h1 className="text-2xl font-extrabold text-zinc-900">Unirse a una ronda</h1>
        <p className="text-sm text-zinc-600">Ingresa el codigo de invitacion</p>
      </header>

      <Card>
        <label className="mb-2 block text-sm font-medium text-zinc-700">Codigo</label>
        <Input
          placeholder="ABC123"
          value={inviteCode}
          onChange={(event) => setInviteCode(event.target.value)}
          maxLength={12}
        />
        {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
        <Button className="mt-4" onClick={handleJoin} disabled={joinByCode.isPending}>
          {joinByCode.isPending ? "Uniendote..." : "Unirme a la ronda"}
        </Button>
      </Card>

      <BottomNav />
    </>
  );
}
