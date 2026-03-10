import { Avatar } from "@/components/ui/avatar";
import { MateIcon } from "@/components/ui/mate-icon";
import { cn } from "@/lib/utils/format";

type Member = {
  id: string;
  name: string;
  avatarUrl: string;
};

export function MateTable({
  members,
  currentTurnUserId,
}: {
  members: Member[];
  currentTurnUserId?: string;
}) {
  if (!members.length) {
    return <div className="rounded-2xl border border-dashed border-zinc-300 p-6 text-center text-sm text-zinc-500">Sin miembros</div>;
  }

  const radiusPct = members.length <= 3 ? 38 : members.length <= 5 ? 36 : 34;

  const getAngleDeg = (index: number, total: number): number => {
    if (total === 1) return -90;
    if (total === 2) return index === 0 ? 180 : 0;
    if (total === 3) return [-90, 30, 150][index] ?? -90;
    if (total === 4) return [-90, 0, 90, 180][index] ?? -90;
    return (360 * index) / total - 90;
  };

  return (
    <div className="mx-auto w-full max-w-[360px]">
      <div className="relative mx-auto aspect-square w-full overflow-hidden">
        {/* Glow */}
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-[30%] w-[30%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-100/60 blur-2xl" />

        {/* Mate center */}
        <div className="absolute left-1/2 top-1/2 flex h-[28%] w-[28%] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-emerald-200 bg-white shadow-lg animate-mate-float">
          <div className="h-[45%] w-[45%]">
            <MateIcon size={90} className="h-full w-full object-contain" />
          </div>
        </div>

        {/* Members */}
        {members.map((member, index) => {
          const angleDeg = getAngleDeg(index, members.length);
          const angle = (angleDeg * Math.PI) / 180;
          const x = 50 + radiusPct * Math.cos(angle);
          const y = 50 + radiusPct * Math.sin(angle);
          const isCurrent = member.id === currentTurnUserId;
          return (
            <div
              key={member.id}
              className="absolute flex w-[22%] -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1 transition-all duration-500 ease-out"
              style={{ left: `${x}%`, top: `${y}%` }}
            >
              <div
                className={cn(
                  "relative rounded-full p-[2px] transition-all duration-300",
                  isCurrent ? "bg-emerald-500 shadow-[0_0_0_5px_rgba(16,185,129,0.18)] animate-current-turn-pulse" : "bg-transparent",
                )}
              >
                <Avatar name={member.name} src={member.avatarUrl} className="h-[clamp(2.5rem,9vw,3.25rem)] w-[clamp(2.5rem,9vw,3.25rem)] ring-0" />
              </div>
              <span className="max-w-[5rem] truncate text-center text-[clamp(0.6rem,2vw,0.75rem)] font-medium text-zinc-700">{member.name}</span>
              {isCurrent ? (
                <span className="whitespace-nowrap rounded-full bg-emerald-500 px-1.5 py-0.5 text-[0.55rem] font-bold leading-tight text-white shadow">
                  Turno actual
                </span>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
