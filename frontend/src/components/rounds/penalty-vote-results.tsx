"use client";

import { Card } from "@/components/ui/card";
import type { PenaltyVoteResponse } from "@/lib/api/types";

const PENALTY_EMOJI: Record<string, string> = {
  "Llevar facturas": "🥐",
  "Llevar bizcochos": "🥐",
  "Doble mate": "🧉",
  "Llevar algo dulce": "🍬",
  "Llevar algo salado": "🧂",
};

interface PenaltyVoteResultsProps {
  vote: PenaltyVoteResponse;
}

export function PenaltyVoteResults({ vote }: PenaltyVoteResultsProps) {
  const totalVotes = vote.options.reduce((sum, o) => sum + o.vote_count, 0);
  const winnerEmoji = PENALTY_EMOJI[vote.winning_penalty ?? ""] ?? "📦";
  const sortedOptions = [...vote.options].sort((a, b) => b.vote_count - a.vote_count);

  return (
    <Card className="mt-4 border-2 border-emerald-200 bg-emerald-50/50">
      <div className="mb-3 text-center">
        <p className="text-[var(--text-xs-fluid)] font-medium uppercase tracking-wide text-emerald-700">
          Por decisión democrática de la ronda...
        </p>
        <p className="mt-1 text-[var(--text-lg-fluid)] font-black text-zinc-900">
          {winnerEmoji} {vote.winning_penalty}
        </p>
        <p className="text-[var(--text-sm-fluid)] text-zinc-600">
          {vote.failed_user_name} tiene que cumplir esta prenda
        </p>
      </div>

      {totalVotes > 0 && (
        <div className="space-y-1.5">
          {sortedOptions.map((option) => {
            const isWinner = option.penalty_name === vote.winning_penalty;
            const pct = totalVotes > 0 ? Math.round((option.vote_count / totalVotes) * 100) : 0;
            const emoji = PENALTY_EMOJI[option.penalty_name] ?? "📦";

            return (
              <div
                key={option.id}
                className={`relative overflow-hidden rounded-lg p-2 ${
                  isWinner ? "bg-emerald-100 ring-1 ring-emerald-300" : "bg-white/60"
                }`}
              >
                <div
                  className={`absolute inset-y-0 left-0 transition-all duration-500 ${
                    isWinner ? "bg-emerald-200/50" : "bg-zinc-100/50"
                  }`}
                  style={{ width: `${pct}%` }}
                />
                <div className="relative flex items-center justify-between">
                  <span className={`text-[var(--text-xs-fluid)] ${isWinner ? "font-bold text-emerald-800" : "text-zinc-600"}`}>
                    {emoji} {option.penalty_name}
                  </span>
                  <span className={`text-[var(--text-xs-fluid)] font-semibold ${isWinner ? "text-emerald-700" : "text-zinc-500"}`}>
                    {option.vote_count} {option.vote_count === 1 ? "voto" : "votos"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {totalVotes === 0 && (
        <p className="text-center text-[var(--text-xs-fluid)] text-zinc-500">
          Nadie votó. Se asignó la prenda por defecto.
        </p>
      )}
    </Card>
  );
}
