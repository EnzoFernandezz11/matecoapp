import type { TurnStatus } from "@/lib/api/types";

export function TurnStatusChip({ status }: { status: TurnStatus }) {
  const textByStatus: Record<TurnStatus, string> = {
    pending: "Pendiente",
    completed: "Completado",
    missed: "Perdido",
  };

  const classByStatus: Record<TurnStatus, string> = {
    pending: "bg-amber-100 text-amber-800",
    completed: "bg-emerald-100 text-emerald-800",
    missed: "bg-red-100 text-red-800",
  };

  return <span className={`rounded-full px-2 py-1 text-xs font-semibold ${classByStatus[status]}`}>{textByStatus[status]}</span>;
}
