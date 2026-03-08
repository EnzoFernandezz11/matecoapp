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
    <div className="rounded-2xl border border-dashed border-mateco-border bg-mateco-surface p-6 text-center">
      <h3 className="text-base font-bold text-mateco-text">{title}</h3>
      <p className="mt-2 text-sm text-mateco-textMuted">{description}</p>
      {actionLabel && onAction ? (
        <Button className="mx-auto mt-4 max-w-56" onClick={onAction}>
          {actionLabel}
        </Button>
      ) : null}
    </div>
  );
}
