"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { MateIcon } from "@/components/ui/mate-icon";
import { cn } from "@/lib/utils/format";

const items = [
  { href: "/rondas", label: "Rondas", icon: "groups" },
  { href: "/rondas", label: "Mesa", icon: "mate", roundRoute: "mesa" },
  { href: "/rondas", label: "Ranking", icon: "emoji_events", roundRoute: "ranking" },
  { href: "/perfil", label: "Perfil", icon: "person" },
];

export function BottomNav({ currentRoundId }: { currentRoundId?: string }) {
  const pathname = usePathname();
  const pathRoundId = pathname.match(/^\/rondas\/([^/]+)/)?.[1];
  const effectiveRoundId = currentRoundId ?? pathRoundId;

  const resolvedItems = items.map((item) => {
    if (item.roundRoute && effectiveRoundId) {
      return { ...item, href: `/rondas/${effectiveRoundId}/${item.roundRoute}`, disabled: false };
    }
    if (item.roundRoute && !effectiveRoundId) {
      return { ...item, href: "/rondas", disabled: true };
    }
    return { ...item, disabled: false };
  });

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 mx-auto w-full max-w-md border-t border-zinc-200 bg-white/95 backdrop-blur">
      <ul className="grid grid-cols-4 py-1">
        {resolvedItems.map((item) => {
          const active = pathname === item.href;
          return (
            <li key={item.label}>
              {item.disabled ? (
                <span
                  className={cn(
                    "mx-2 flex min-h-[48px] cursor-not-allowed flex-col items-center justify-center gap-1 rounded-2xl py-2 text-[11px] font-medium text-zinc-400",
                  )}
                >
                  {item.icon === "mate" ? (
                    <MateIcon size={18} className="opacity-60" />
                  ) : (
                    <span className="material-symbols-outlined text-base">{item.icon}</span>
                  )}
                  {item.label}
                </span>
              ) : (
                <Link
                  href={item.href}
                  className={cn(
                    "mx-2 flex min-h-[48px] flex-col items-center justify-center gap-1 rounded-2xl py-2 text-[11px] font-medium transition-colors active:bg-zinc-100/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mateco-primary/50",
                    active ? "text-mateco-primary" : "text-zinc-500",
                  )}
                >
                  {item.icon === "mate" ? (
                    <MateIcon size={18} className={cn(active ? "opacity-100" : "opacity-80")} />
                  ) : (
                    <span className="material-symbols-outlined text-base">{item.icon}</span>
                  )}
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
