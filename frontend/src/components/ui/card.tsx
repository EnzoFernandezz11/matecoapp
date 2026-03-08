import { cn } from "@/lib/utils/format";

export function Card({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-mateco-border bg-mateco-surface p-4 shadow-[0_1px_3px_rgba(16,24,40,0.06)]",
        className,
      )}
    >
      {children}
    </div>
  );
}
