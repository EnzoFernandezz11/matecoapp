"use client";

import { AuthGuard } from "@/features/auth/auth-guard";

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <main className="mx-auto min-h-screen w-full max-w-md bg-mateco-bgLight px-4 pb-24 pt-4">{children}</main>
    </AuthGuard>
  );
}
