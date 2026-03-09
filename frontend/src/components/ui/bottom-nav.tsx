"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils/format";

const items = [
  { href: "/rondas", label: "Rondas", icon: "groups" },
  { href: "/perfil", label: "Perfil", icon: "person" },
];

export function BottomNav(_props: { currentRoundId?: string }) {
  void _props.currentRoundId;
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-30 mx-auto w-full border-t border-zinc-200 bg-white/95 pb-[calc(env(safe-area-inset-bottom)+4px)] backdrop-blur"
      style={{ maxWidth: "var(--app-shell-max)" }}
    >
      <ul className="grid grid-cols-2 py-1">
        {items.map((item) => {
          const active =
            pathname === item.href || (item.href === "/rondas" && pathname.startsWith("/rondas/") && pathname !== "/rondas/unirse");
          return (
            <li key={item.label}>
              <Link
                href={item.href}
                className={cn(
                  "mx-2 flex min-h-[52px] flex-col items-center justify-center gap-1 rounded-2xl py-2 text-[11px] font-medium transition-colors active:bg-zinc-100/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mateco-primary/50",
                  active ? "bg-zinc-100 text-mateco-primary" : "text-zinc-500",
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
