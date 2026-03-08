import { create } from "zustand";

import type { User } from "@/lib/api/types";

interface AuthState {
  token: string | null;
  user: User | null;
  hydrated: boolean;
  setAuth: (token: string, user: User) => void;
  clearAuth: () => void;
  hydrate: () => void;
}

const AUTH_STORAGE_KEY = "mateco_auth";

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  hydrated: false,
  setAuth: (token, user) => {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ token, user }));
    set({ token, user });
  },
  clearAuth: () => {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    set({ token: null, user: null });
  },
  hydrate: () => {
    if (typeof window === "undefined") {
      set({ hydrated: true });
      return;
    }
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) {
      set({ hydrated: true });
      return;
    }
    try {
      const parsed = JSON.parse(raw) as { token: string; user: User };
      set({ token: parsed.token, user: parsed.user, hydrated: true });
    } catch {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      set({ hydrated: true });
    }
  },
}));
