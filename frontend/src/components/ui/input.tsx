import { cn } from "@/lib/utils/format";

type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export function Input({ className, ...props }: InputProps) {
  return (
    <input
      className={cn(
        "h-12 w-full rounded-xl border border-zinc-300 bg-white px-4 text-base text-zinc-900 outline-none transition focus:border-mateco-primary focus:ring-2 focus:ring-mateco-primary/20",
        className,
      )}
      {...props}
    />
  );
}
