"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils/format";

export function RoundSubnav({ roundId }: { roundId: string }) {
  const pathname = usePathname();
  const items = [
    { href: `/rondas/${roundId}/mesa`, label: "Mesa" },
    { href: `/rondas/${roundId}/ranking`, label: "Ranking" },
  ];

  return (
    <div className="mb-4 grid grid-cols-2 gap-2 rounded-xl border border-zinc-200 bg-white p-1">
      {items.map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "inline-flex min-h-[44px] items-center justify-center rounded-lg px-3 text-sm font-semibold transition-colors",
              active ? "bg-zinc-900 text-white" : "text-zinc-600 hover:bg-zinc-100",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}
