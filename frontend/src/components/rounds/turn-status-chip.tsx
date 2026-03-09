import type { TurnStatus } from "@/lib/api/types";

export function TurnStatusChip({ status }: { status: TurnStatus }) {
  const textByStatus: Record<TurnStatus, string> = {
    pending: "Pendiente",
    confirmed: "Confirmado",
    skipped: "Saltado",
    reassigned: "Reasignado",
  };

  const classByStatus: Record<TurnStatus, string> = {
    pending: "bg-amber-100 text-amber-800",
    confirmed: "bg-emerald-100 text-emerald-800",
    skipped: "bg-red-100 text-red-800",
    reassigned: "bg-blue-100 text-blue-800",
  };

  return <span className={`rounded-full px-2 py-1 text-xs font-semibold ${classByStatus[status]}`}>{textByStatus[status]}</span>;
}
