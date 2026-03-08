"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils/format";

const tabs = [
  { key: "mesa", label: "Mesa" },
  { key: "ranking", label: "Ranking" },
];

export function RoundSubNav({ roundId }: { roundId: string }) {
  const pathname = usePathname();

  return (
    <div className="mb-4 rounded-2xl border border-zinc-200 bg-white p-1">
      <div className="grid grid-cols-2 gap-1">
        {tabs.map((tab) => {
          const href = `/rondas/${roundId}/${tab.key}`;
          const active = pathname === href;
          return (
            <Link
              key={tab.key}
              href={href}
              className={cn(
                "rounded-xl px-3 py-2 text-center text-sm font-semibold transition-colors",
                active ? "bg-zinc-900 text-white" : "text-zinc-600 hover:bg-zinc-100",
              )}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
