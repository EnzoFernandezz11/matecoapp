"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "@/features/auth/use-auth";
import {
  completeTurn,
  createRound,
  deleteRound,
  fetchCurrentTurn,
  fetchInvite,
  fetchRoundDetail,
  fetchRounds,
  joinRound,
  joinRoundByCode,
  leaveRound,
  missTurn,
} from "@/lib/api/endpoints";
import type { RoundCreateInput } from "@/lib/api/types";

const AUTO_REFRESH_MS = 15000;

export function useRounds() {
  const { token } = useAuth();
  return useQuery({
    queryKey: ["rounds"],
    queryFn: () => fetchRounds(token as string),
    enabled: Boolean(token),
    refetchInterval: AUTO_REFRESH_MS,
    refetchOnWindowFocus: false,
  });
}

export function useRoundDetail(roundId: string) {
  const { token } = useAuth();
  return useQuery({
    queryKey: ["rounds", roundId],
    queryFn: () => fetchRoundDetail(roundId, token as string),
    enabled: Boolean(token && roundId),
    refetchInterval: AUTO_REFRESH_MS,
    refetchOnWindowFocus: false,
  });
}

export function useCurrentTurn(roundId: string) {
  const { token } = useAuth();
  return useQuery({
    queryKey: ["rounds", roundId, "turn"],
    queryFn: () => fetchCurrentTurn(roundId, token as string),
    enabled: Boolean(token && roundId),
    refetchInterval: AUTO_REFRESH_MS,
    refetchOnWindowFocus: false,
  });
}

export function useCreateRound() {
  const queryClient = useQueryClient();
  const { token } = useAuth();
  return useMutation({
    mutationFn: (input: RoundCreateInput) => createRound(input, token as string),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rounds"] });
    },
  });
}

export function useJoinRound() {
  const queryClient = useQueryClient();
  const { token } = useAuth();
  return useMutation({
    mutationFn: (roundId: string) => joinRound(roundId, token as string),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rounds"] });
    },
  });
}

export function useJoinRoundByCode() {
  const queryClient = useQueryClient();
  const { token } = useAuth();
  return useMutation({
    mutationFn: (inviteCode: string) => joinRoundByCode(inviteCode, token as string),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rounds"] });
    },
  });
}

export function useLeaveRound() {
  const queryClient = useQueryClient();
  const { token } = useAuth();
  return useMutation({
    mutationFn: (roundId: string) => leaveRound(roundId, token as string),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rounds"] });
    },
  });
}

export function useDeleteRound() {
  const queryClient = useQueryClient();
  const { token } = useAuth();
  return useMutation({
    mutationFn: (roundId: string) => deleteRound(roundId, token as string),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rounds"] });
    },
  });
}

export function useInvite(roundId: string) {
  const { token } = useAuth();
  return useQuery({
    queryKey: ["rounds", roundId, "invite"],
    queryFn: () => fetchInvite(roundId, token as string),
    enabled: false,
  });
}

export function useCreateInvite() {
  const { token } = useAuth();
  return useMutation({
    mutationFn: (roundId: string) => fetchInvite(roundId, token as string),
  });
}

export function useCompleteTurn(roundId: string) {
  const queryClient = useQueryClient();
  const { token } = useAuth();
  return useMutation({
    mutationFn: (turnId: string) => completeTurn(turnId, token as string),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rounds", roundId] });
      queryClient.invalidateQueries({ queryKey: ["rounds", roundId, "turn"] });
      queryClient.invalidateQueries({ queryKey: ["rounds"] });
    },
  });
}

export function useMissTurn(roundId: string) {
  const queryClient = useQueryClient();
  const { token } = useAuth();
  return useMutation({
    mutationFn: ({ turnId, excuse }: { turnId: string; excuse?: string }) => missTurn(turnId, token as string, excuse),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rounds", roundId] });
      queryClient.invalidateQueries({ queryKey: ["rounds", roundId, "turn"] });
      queryClient.invalidateQueries({ queryKey: ["rounds"] });
    },
  });
}
