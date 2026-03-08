"use client";

import { useMutation, useQuery } from "@tanstack/react-query";

import { useAuth } from "@/features/auth/use-auth";
import { createUniversity, searchUniversities, updateMeUniversity } from "@/lib/api/endpoints";

export function useUniversitySearch(query: string) {
  const { token } = useAuth();
  return useQuery({
    queryKey: ["universities", "search", query],
    queryFn: () => searchUniversities(query, token as string),
    enabled: Boolean(token && query.trim().length >= 2),
    staleTime: 60_000,
  });
}

export function useCreateUniversity() {
  const { token } = useAuth();
  return useMutation({
    mutationFn: (name: string) => createUniversity(name, token as string),
  });
}

export function useUpdateMyUniversity() {
  const { token } = useAuth();
  return useMutation({
    mutationFn: (universityId: string | null) => updateMeUniversity(universityId, token as string),
  });
}
