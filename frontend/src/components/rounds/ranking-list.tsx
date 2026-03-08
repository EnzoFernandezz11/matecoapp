import { Avatar } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { ShareCard } from "@/components/rounds/share-card";
import { useState } from "react";

type RankingMember = {
  id: string;
  name: string;
  avatarUrl: string;
  turnosCumplidos: number;
  missed: number;
  role: string | null;
};

export function RankingList({ members }: { members: RankingMember[] }) {
  const [selectedShare, setSelectedShare] = useState<RankingMember | null>(null);

  if (!members.length) {
    return <p className="text-sm text-zinc-500">Todavia no hay datos de ranking.</p>;
  }

  return (
    <>
      <div className="space-y-3">
        {members.map((member, index) => {
          const isMVP = member.role === "MVP";
          const isRata = member.role === "RATA";
          const isFantasma = member.role === "FANTASMA";

          let cardClass = "";
          if (isMVP) cardClass = "border border-amber-400 bg-amber-50/60 shadow-sm shadow-amber-200";
          if (isRata) cardClass = "border-red-200 bg-red-50/40 opacity-90 grayscale-[50%]";
          if (isFantasma) cardClass = "opacity-50";

          return (
            <Card key={member.id} className={cardClass}>
              <div className="flex items-center justify-between gap-3 p-3">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Avatar name={member.name} src={member.avatarUrl} />
                    {isMVP && <span className="absolute -top-2 -right-2 text-xl filter drop-shadow">👑</span>}
                    {isRata && <span className="absolute -top-2 -right-2 text-lg filter drop-shadow">🐀</span>}
                    {isFantasma && <span className="absolute -top-2 -right-2 text-lg filter drop-shadow">👻</span>}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-zinc-900 flex items-center gap-1">
                      {member.name}
                    </p>
                    <p className="text-xs text-zinc-600">
                      {member.turnosCumplidos} mates / {member.missed} fallados
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <p className="text-sm font-bold text-zinc-500">#{index + 1}</p>
                  {(isMVP || isRata) && (
                    <button
                      onClick={() => setSelectedShare(member)}
                      className="text-[10px] uppercase font-bold tracking-wider rounded-full bg-zinc-900 text-white px-2 py-1 shadow"
                    >
                      {isMVP ? "CELEBRAR" : "ESCRACHAR"}
                    </button>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {selectedShare && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="relative w-full max-w-sm">
            <button
              onClick={() => setSelectedShare(null)}
              className="absolute -top-12 right-0 text-white p-2"
            >
              <span className="material-symbols-outlined text-3xl">close</span>
            </button>
            <ShareCard
              userName={selectedShare.name}
              avatarUrl={selectedShare.avatarUrl}
              role={selectedShare.role as "MVP" | "RATA" | "TURN" | null}
              statsText={selectedShare.role === "MVP" ? `${selectedShare.turnosCumplidos} turnos cebados. El alma de la ronda.` : `Faltó ${selectedShare.missed} veces. Un peligro para el ecosistema.`}
            />
          </div>
        </div>
      )}
    </>
  );
}
