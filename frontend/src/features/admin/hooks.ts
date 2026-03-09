"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "@/features/auth/use-auth";
import {
  deleteAdminUser,
  fetchAdminStats,
  fetchAdminUser,
  fetchAdminUsers,
  updateAdminUser,
} from "@/lib/api/endpoints";

export function useAdminStats() {
  const { token } = useAuth();
  return useQuery({
    queryKey: ["admin", "stats"],
    queryFn: () => fetchAdminStats(token as string),
    enabled: Boolean(token),
    refetchOnWindowFocus: true,
  });
}

export function useAdminUsers(params: { search?: string; skip?: number; limit?: number }) {
  const { token } = useAuth();
  return useQuery({
    queryKey: ["admin", "users", params.search ?? "", params.skip ?? 0, params.limit ?? 20],
    queryFn: () => fetchAdminUsers(token as string, params),
    enabled: Boolean(token),
    placeholderData: (previousData) => previousData,
  });
}

export function useAdminUser(userId: string) {
  const { token } = useAuth();
  return useQuery({
    queryKey: ["admin", "users", userId],
    queryFn: () => fetchAdminUser(token as string, userId),
    enabled: Boolean(token && userId),
  });
}

export function useUpdateAdminUser(userId: string) {
  const queryClient = useQueryClient();
  const { token } = useAuth();
  return useMutation({
    mutationFn: (payload: { name: string; email: string }) =>
      updateAdminUser(token as string, userId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "stats"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "users", userId] });
    },
  });
}

export function useDeleteAdminUser() {
  const queryClient = useQueryClient();
  const { token } = useAuth();
  return useMutation({
    mutationFn: (userId: string) => deleteAdminUser(token as string, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "stats"] });
    },
  });
}
