"use client";

import { useParams } from "next/navigation";

import { RankingList } from "@/components/rounds/ranking-list";
import { RoundSubNav } from "@/components/rounds/round-subnav";
import { BottomNav } from "@/components/ui/bottom-nav";
import { Card } from "@/components/ui/card";
import { LoadingSkeleton } from "@/components/ui/loading-skeleton";
import { useRoundDetail } from "@/features/rounds/hooks";

export default function RoundRankingPage() {
  const params = useParams<{ roundId: string }>();
  const roundId = params.roundId;
  const detail = useRoundDetail(roundId);

  const sortedMembers =
    detail.data?.members
      .map((member) => {
        const rankingEntry = detail.data?.ranking.find((entry) => entry.user === member.user.name);
        return {
          id: member.user.id,
          name: member.user.name,
          avatarUrl: member.user.avatar_url,
          turnosCumplidos: rankingEntry?.mates ?? 0,
          missed: rankingEntry?.missed ?? 0,
          role: rankingEntry?.role ?? null,
        };
      })
      .sort((a, b) => b.turnosCumplidos - a.turnosCumplidos) ?? [];

  return (
    <>
      <header className="mb-4">
        <h1 className="text-xl font-extrabold text-zinc-900">Ranking de quien llevo el mate</h1>
        <p className="text-sm text-zinc-600">{detail.data?.round.name ?? "Ronda"}</p>
      </header>

      <RoundSubNav roundId={roundId} />

      <Card className="mb-4 bg-mateco-primary text-white">
        <p className="text-sm">Mas turnos cumplidos</p>
      </Card>

      {detail.isLoading ? (
        <>
          <LoadingSkeleton className="mb-3 h-20 rounded-2xl" />
          <LoadingSkeleton className="mb-3 h-20 rounded-2xl" />
        </>
      ) : (
        <RankingList members={sortedMembers} />
      )}

      <BottomNav currentRoundId={roundId} />
    </>
  );
}
