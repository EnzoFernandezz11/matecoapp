import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type RoundCardProps = {
  name: string;
  membersCount: number;
  turnStatus: React.ReactNode;
  onEnter: () => void;
};

export function RoundCard({ name, membersCount, turnStatus, onEnter }: RoundCardProps) {
  return (
    <Card className="flex flex-col gap-3 p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <h3 className="line-clamp-1 text-[17px] font-bold tracking-tight text-zinc-900">{name}</h3>
          <p className="mt-0.5 text-sm font-medium text-zinc-500">{membersCount} integrantes</p>
        </div>
        <Badge className="shrink-0 bg-zinc-100 text-zinc-700">Ronda</Badge>
      </div>
      <div className="flex items-center gap-2 rounded-xl bg-zinc-50 px-3 py-2.5">
        <span className="material-symbols-outlined shrink-0 text-[18px] text-zinc-500">info</span>
        <p className="line-clamp-1 text-sm font-medium text-zinc-700">{turnStatus}</p>
      </div>
      <Button className="mt-1 bg-zinc-900" onClick={onEnter}>
        Entrar a la ronda
      </Button>
    </Card>
  );
}
