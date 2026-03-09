"use client";

import { AuthGuard } from "@/features/auth/auth-guard";

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <main
        className="mx-auto min-h-screen w-full bg-mateco-bgLight"
        style={{
          maxWidth: "var(--app-shell-max)",
          paddingLeft: "max(var(--space-md), env(safe-area-inset-left))",
          paddingRight: "max(var(--space-md), env(safe-area-inset-right))",
          paddingTop: "max(var(--space-md), env(safe-area-inset-top))",
          paddingBottom: "calc(7.5rem + env(safe-area-inset-bottom))",
        }}
      >
        {children}
      </main>
    </AuthGuard>
  );
}
