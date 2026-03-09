import { cn } from "@/lib/utils/format";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
};

export function Button({ variant = "primary", className, ...props }: ButtonProps) {
  const styles: Record<NonNullable<ButtonProps["variant"]>, string> = {
    primary: "bg-mateco-primary text-white shadow-sm hover:opacity-95",
    secondary: "border border-zinc-300 bg-white text-zinc-900 hover:bg-zinc-50",
    ghost: "bg-transparent text-zinc-700 hover:bg-zinc-100",
    danger: "bg-red-600 text-white hover:bg-red-500",
  };

  return (
    <button
      className={cn(
        "inline-flex min-h-[3rem] w-full items-center justify-center rounded-xl px-[var(--space-md)] text-[var(--text-md-fluid)] font-semibold transition active:scale-[0.98] active:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mateco-primary/50 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60",
        styles[variant],
        className,
      )}
      {...props}
    />
  );
}
