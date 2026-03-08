"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils/format";

const items = [
  { href: "/inicio", label: "Inicio", icon: "home" },
  { href: "/rondas", label: "Rondas", icon: "groups" },
  { href: "/perfil", label: "Perfil", icon: "person" },
];

export function BottomNav({ currentRoundId }: { currentRoundId?: string }) {
  const pathname = usePathname();
  void currentRoundId;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 mx-auto w-full max-w-md border-t border-mateco-border bg-mateco-surface/95 shadow-[0_-1px_8px_rgba(16,24,40,0.05)] backdrop-blur">
      <ul className="grid grid-cols-3 py-1">
        {items.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <li key={item.label}>
              <Link
                href={item.href}
                className={cn(
                  "mx-2 flex min-h-[48px] flex-col items-center justify-center gap-1 rounded-xl py-2 text-[11px] font-medium transition-colors active:bg-mateco-surfaceAlt focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mateco-primary/40",
                  active ? "bg-mateco-primaryLight text-mateco-primary" : "text-mateco-textMuted",
                )}
              >
                <span className="material-symbols-outlined text-base">{item.icon}</span>
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
