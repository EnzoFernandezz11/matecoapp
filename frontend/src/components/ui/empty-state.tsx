import { Button } from "@/components/ui/button";

export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
}: {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-6 text-center">
      <h3 className="text-base font-bold text-zinc-900">{title}</h3>
      <p className="mt-2 text-sm text-zinc-600">{description}</p>
      {actionLabel && onAction ? (
        <Button className="mx-auto mt-4 max-w-56" onClick={onAction}>
          {actionLabel}
        </Button>
      ) : null}
    </div>
  );
}
