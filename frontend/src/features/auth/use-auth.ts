"use client";

import { useAuthStore } from "@/features/auth/auth-store";

export function useAuth() {
  const { token, user, hydrated, setAuth, clearAuth } = useAuthStore();
  return { token, user, hydrated, setAuth, clearAuth };
}
