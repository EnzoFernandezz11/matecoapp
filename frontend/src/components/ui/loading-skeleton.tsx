export function LoadingSkeleton({ className = "h-5 w-full" }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-zinc-200 ${className}`} />;
}
