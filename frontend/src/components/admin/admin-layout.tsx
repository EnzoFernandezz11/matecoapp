"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils/format";

const tabs = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/users", label: "Usuarios" },
];

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="space-y-4">
      <Card className="p-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-bold text-zinc-900">Panel Admin</h1>
            <p className="text-xs text-zinc-500">Monitoreo y gestion de usuarios</p>
          </div>
          <Link
            href="/rondas"
            className="inline-flex h-9 items-center rounded-lg border border-zinc-300 px-3 text-xs font-semibold text-zinc-700"
          >
            Volver
          </Link>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {tabs.map((tab) => {
            const active = pathname === tab.href;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={cn(
                  "inline-flex min-h-[40px] items-center justify-center rounded-lg px-3 text-sm font-semibold",
                  active ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-700",
                )}
              >
                {tab.label}
              </Link>
            );
          })}
        </div>
      </Card>
      {children}
    </div>
  );
}
