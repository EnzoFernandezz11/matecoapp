import { cn } from "@/lib/utils/format";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger" | "icon";
  size?: "sm" | "md" | "lg";
};

export function Button({ variant = "primary", size = "md", className, ...props }: ButtonProps) {
  const styles: Record<NonNullable<ButtonProps["variant"]>, string> = {
    primary:
      "bg-mateco-primary text-white shadow-sm hover:bg-mateco-primaryHover active:bg-mateco-primaryHover",
    secondary:
      "bg-mateco-surface text-mateco-primary border border-mateco-border hover:bg-mateco-surfaceAlt active:bg-mateco-surfaceAlt",
    outline:
      "border border-mateco-border bg-transparent text-mateco-text hover:bg-mateco-surfaceAlt active:bg-mateco-surfaceAlt",
    ghost: "bg-transparent text-mateco-textMuted hover:bg-mateco-surfaceAlt active:bg-mateco-surfaceAlt",
    danger: "bg-mateco-error text-white hover:brightness-95 active:brightness-90",
    icon: "h-11 w-11 rounded-full bg-mateco-surfaceAlt text-mateco-text hover:brightness-95",
  };
  const sizes: Record<NonNullable<ButtonProps["size"]>, string> = {
    sm: "h-9 px-3 text-sm",
    md: "h-11 px-4 text-base",
    lg: "h-[52px] px-5 text-base",
  };

  return (
    <button
      className={cn(
        "inline-flex w-full items-center justify-center rounded-xl font-semibold transition active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mateco-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-mateco-bg disabled:cursor-not-allowed disabled:opacity-45",
        variant !== "icon" && sizes[size],
        styles[variant],
        className,
      )}
      {...props}
    />
  );
}
