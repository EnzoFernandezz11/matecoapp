"use client";

import { useEffect } from "react";

import { fetchMe } from "@/lib/api/endpoints";
import { useAuthStore } from "@/features/auth/auth-store";
import { ApiError } from "@/lib/api/client";

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
      .catch((error) => {
        // Keep session on transient/network errors; clear only when token is truly invalid.
        if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
          clearAuth();
        }
      });
  }, [hydrated, token, clearAuth, setAuth]);

  return null;
}
