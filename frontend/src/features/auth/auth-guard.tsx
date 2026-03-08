"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { usePathname } from "next/navigation";

import { useAuth } from "@/features/auth/use-auth";
import { UNIVERSITY_ONBOARDING_SKIP_KEY } from "@/features/university/constants";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { token, user, hydrated } = useAuth();

  useEffect(() => {
    if (hydrated && !token) {
      router.replace("/login");
    }
  }, [hydrated, token, router]);

  useEffect(() => {
    if (!hydrated || !token || !user) {
      return;
    }
    const skipped = typeof window !== "undefined" && localStorage.getItem(UNIVERSITY_ONBOARDING_SKIP_KEY) === "1";
    const isOnboardingRoute = pathname.startsWith("/onboarding/university");
    if (!user.university_id && !skipped && !isOnboardingRoute) {
      router.replace("/onboarding/university");
    }
  }, [hydrated, token, user, pathname, router]);

  if (!hydrated) {
    return <div className="p-6 text-sm text-zinc-500">Cargando sesion...</div>;
  }

  if (!token) {
    return null;
  }

  return <>{children}</>;
}
