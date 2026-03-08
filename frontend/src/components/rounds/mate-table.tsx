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
  const size = 300;
  const radius = 110;
  const avatarSize = 48;
  const center = size / 2;

  if (!members.length) {
    return <div className="rounded-2xl border border-dashed border-zinc-300 p-6 text-center text-sm text-zinc-500">Sin miembros</div>;
  }

  return (
    <div className="relative mx-auto" style={{ height: size, width: size }}>
      <div className="absolute left-1/2 top-1/2 flex h-28 w-28 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-dashed border-zinc-300 bg-white text-4xl">
        <MateIcon size={46} />
      </div>
      {members.map((member, index) => {
        const angle = (2 * Math.PI * index) / members.length - Math.PI / 2;
        const x = center + radius * Math.cos(angle) - avatarSize / 2;
        const y = center + radius * Math.sin(angle) - avatarSize / 2;
        const isCurrent = member.id === currentTurnUserId;
        return (
          <div
            key={member.id}
            className="absolute flex flex-col items-center gap-1"
            style={{ left: x, top: y, width: avatarSize }}
          >
            <div className={cn("rounded-full p-0.5", isCurrent ? "bg-mateco-primary" : "bg-transparent")}>
              <Avatar name={member.name} src={member.avatarUrl} className="h-12 w-12 ring-0" />
            </div>
            <span className="w-16 truncate text-center text-[11px] font-medium text-zinc-700">{member.name}</span>
          </div>
        );
      })}
    </div>
  );
}
