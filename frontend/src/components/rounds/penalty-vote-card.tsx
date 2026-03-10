"use client";

import { useState } from "react";

import { Avatar } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import type { PenaltyVoteResponse, RoundMember } from "@/lib/api/types";

const PENALTY_EMOJI: Record<string, string> = {
  "Llevar facturas": "🥐",
  "Llevar bizcochos": "🥐",
  "Doble mate": "🧉",
  "Llevar algo dulce": "🍬",
  "Llevar algo salado": "🧂",
};

function getTimeRemaining(expiresAt: string): string {
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) return "Votación cerrada";
  const hours = Math.floor(diff / 3_600_000);
  const minutes = Math.floor((diff % 3_600_000) / 60_000);
  if (hours > 0) return `${hours}h ${minutes}m restantes`;
  return `${minutes}m restantes`;
}

interface PenaltyVoteCardProps {
  vote: PenaltyVoteResponse;
  members: RoundMember[];
  currentUserId: string;
  onVote: (optionId: string) => void;
  isSubmitting: boolean;
}

export function PenaltyVoteCard({ vote, members, currentUserId, onVote, isSubmitting }: PenaltyVoteCardProps) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const failedMember = members.find((m) => m.user.id === vote.failed_user_id);
  const isFailedUser = currentUserId === vote.failed_user_id;
  const totalVotes = vote.options.reduce((sum, o) => sum + o.vote_count, 0);
  const maxVotes = Math.max(...vote.options.map((o) => o.vote_count), 0);

  const handleVote = (optionId: string) => {
    setSelectedOption(optionId);
    onVote(optionId);
  };

  return (
    <Card className="mt-4 overflow-hidden border-2 border-amber-200 bg-amber-50/50">
      <div className="mb-4 flex items-center gap-3">
        <div className="relative">
          <Avatar
            name={failedMember?.user.name ?? vote.failed_user_name}
            src={failedMember?.user.avatar_url}
            className="h-12 w-12"
          />
          <span className="absolute -bottom-1 -right-1 text-lg">😬</span>
        </div>
        <div className="flex-1">
          <p className="text-[var(--text-sm-fluid)] font-bold text-zinc-900">
            Elegí la prenda para {vote.failed_user_name}
          </p>
          <p className="text-[var(--text-xs-fluid)] text-amber-700 font-medium">
            {getTimeRemaining(vote.expires_at)}
          </p>
        </div>
      </div>

      <div className="space-y-2">
        {vote.options.map((option) => {
          const emoji = PENALTY_EMOJI[option.penalty_name] ?? "📦";
          const isLeading = option.vote_count > 0 && option.vote_count === maxVotes;
          const pct = totalVotes > 0 ? (option.vote_count / totalVotes) * 100 : 0;

          return (
            <button
              key={option.id}
              onClick={() => handleVote(option.id)}
              disabled={vote.user_has_voted || isFailedUser || isSubmitting}
              className={`relative w-full overflow-hidden rounded-xl border-2 p-3 text-left transition-all ${
                isLeading
                  ? "border-amber-400 bg-amber-50"
                  : "border-zinc-200 bg-white"
              } ${
                vote.user_has_voted || isFailedUser
                  ? "cursor-default"
                  : "hover:border-amber-300 hover:bg-amber-50/50 active:scale-[0.98]"
              } ${
                selectedOption === option.id && isSubmitting
                  ? "animate-pulse border-amber-500"
                  : ""
              }`}
            >
              {/* Vote bar background */}
              {totalVotes > 0 && (
                <div
                  className="absolute inset-y-0 left-0 bg-amber-100/60 transition-all duration-500"
                  style={{ width: `${pct}%` }}
                />
              )}
              <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{emoji}</span>
                  <span className="text-[var(--text-sm-fluid)] font-semibold text-zinc-800">
                    {option.penalty_name}
                  </span>
                </div>
                <span className={`text-[var(--text-xs-fluid)] font-bold ${isLeading ? "text-amber-700" : "text-zinc-500"}`}>
                  {option.vote_count} {option.vote_count === 1 ? "voto" : "votos"}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {vote.user_has_voted && (
        <p className="mt-3 text-center text-[var(--text-xs-fluid)] font-medium text-emerald-700">
          ✅ Ya votaste
        </p>
      )}
      {isFailedUser && (
        <p className="mt-3 text-center text-[var(--text-xs-fluid)] font-medium text-zinc-500">
          No podés votar tu propia prenda 😅
        </p>
      )}
    </Card>
  );
}
