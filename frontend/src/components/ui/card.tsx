import { cn } from "@/lib/utils/format";

export function Card({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn("rounded-2xl bg-white p-4 shadow-sm ring-1 ring-zinc-100", className)}>{children}</div>;
}
