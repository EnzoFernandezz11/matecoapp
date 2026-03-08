import { cn } from "@/lib/utils/format";

export function Badge({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <span className={cn("inline-flex rounded-full px-2.5 py-1 text-xs font-medium", className)}>{children}</span>;
}
