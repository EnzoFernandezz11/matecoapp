import { cn } from "@/lib/utils/format";

type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export function Input({ className, ...props }: InputProps) {
  return (
    <input
      className={cn(
        "h-11 w-full rounded-xl border border-mateco-border bg-mateco-surface px-4 text-base text-mateco-text outline-none transition focus:border-mateco-primary focus:ring-2 focus:ring-mateco-primary/15",
        className,
      )}
      {...props}
    />
  );
}
