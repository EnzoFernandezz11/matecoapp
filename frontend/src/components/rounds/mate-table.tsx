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

  const radiusPercent = members.length <= 3 ? 41 : members.length <= 5 ? 39 : 37;

  const getAngleDeg = (index: number, total: number): number => {
    if (total === 1) return -90;
    if (total === 2) return index === 0 ? 180 : 0; // left / right
    if (total === 3) return [-90, 30, 150][index] ?? -90; // top + two bottom corners
    if (total === 4) return [-90, 0, 90, 180][index] ?? -90; // cross
    return (360 * index) / total - 90;
  };

  return (
    <div className="relative mx-auto h-[clamp(15rem,60vw,21.25rem)] w-[clamp(15rem,60vw,21.25rem)]">
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[clamp(8.4rem,28vw,10.3rem)] w-[clamp(8.4rem,28vw,10.3rem)] -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-100/60 blur-2xl" />
      <div className="absolute left-1/2 top-1/2 flex h-[clamp(7.2rem,24vw,8.8rem)] w-[clamp(7.2rem,24vw,8.8rem)] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-emerald-200 bg-white shadow-lg animate-mate-float">
        <div className="h-[clamp(3.3rem,10.5vw,4.6rem)] w-[clamp(3.3rem,10.5vw,4.6rem)]">
          <MateIcon size={90} className="h-full w-full object-contain" />
        </div>
      </div>
      {members.map((member, index) => {
        const angleDeg = getAngleDeg(index, members.length);
        const angle = (angleDeg * Math.PI) / 180;
        const x = 50 + radiusPercent * Math.cos(angle);
        const y = 50 + radiusPercent * Math.sin(angle);
        const isCurrent = member.id === currentTurnUserId;
        return (
          <div
            key={member.id}
            className="absolute flex w-[clamp(4.9rem,17vw,5.8rem)] -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-[var(--space-xs)] transition-all duration-500 ease-out"
            style={{ left: `${x}%`, top: `${y}%` }}
          >
            <div
              className={cn(
                "relative rounded-full p-[3px] transition-all duration-300",
                isCurrent ? "bg-emerald-500 shadow-[0_0_0_6px_rgba(16,185,129,0.18)] animate-current-turn-pulse" : "bg-transparent",
              )}
            >
              <Avatar name={member.name} src={member.avatarUrl} className="h-[clamp(2.75rem,10vw,3.75rem)] w-[clamp(2.75rem,10vw,3.75rem)] ring-0" />
            </div>
            <span className="w-full truncate text-center text-[var(--text-xs-fluid)] font-medium text-zinc-700">{member.name}</span>
            {isCurrent ? (
              <span className="rounded-full bg-emerald-500 px-2 py-0.5 text-[0.6rem] font-bold text-white shadow">
                Turno actual
              </span>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
