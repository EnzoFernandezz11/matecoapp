"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Card } from "@/components/ui/card";
import { useJoinRoundByCode } from "@/features/rounds/hooks";

export default function JoinByLinkPage() {
  const { code } = useParams<{ code: string }>();
  const router = useRouter();
  const joinByCode = useJoinRoundByCode();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!code) return;

    joinByCode
      .mutateAsync(code.toUpperCase())
      .then((round) => {
        router.replace(`/rondas/${round.id}/mesa`);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "No se pudo unir a la ronda");
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card>
          <p className="text-sm text-red-600">{error}</p>
          <button
            className="mt-3 text-sm font-medium text-emerald-700 underline"
            onClick={() => router.push("/rondas")}
          >
            Ir a mis rondas
          </button>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-sm text-zinc-500">Uniendote a la ronda...</p>
    </div>
  );
}
