"use client";

import { useEffect } from "react";

import { fetchMe } from "@/lib/api/endpoints";
import { useAuthStore } from "@/features/auth/auth-store";

export function AuthBootstrap() {
  const { hydrate, hydrated, token, clearAuth, setAuth } = useAuthStore();

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (!hydrated || !token) {
      return;
    }
    fetchMe(token)
      .then((user) => setAuth(token, user))
      .catch(() => clearAuth());
  }, [hydrated, token, clearAuth, setAuth]);

  return null;
}
