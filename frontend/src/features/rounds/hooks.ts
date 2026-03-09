"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "@/features/auth/use-auth";
import {
  completeTurn,
  confirmTurn,
  createRound,
  fetchCurrentTurn,
  fetchInvite,
  fetchRoundDetail,
  fetchRounds,
  joinRound,
  joinRoundByCode,
  leaveRound,
  missTurn,
  resolvePenalty,
  skipTurn,
} from "@/lib/api/endpoints";
import type { RoundCreateInput } from "@/lib/api/types";

const AUTO_REFRESH_MS = 5000;

export function useRounds() {
  const { token } = useAuth();
  return useQuery({
    queryKey: ["rounds"],
    queryFn: () => fetchRounds(token as string),
    enabled: Boolean(token),
    refetchInterval: AUTO_REFRESH_MS,
    refetchOnWindowFocus: true,
  });
}

export function useRoundDetail(roundId: string) {
  const { token } = useAuth();
  return useQuery({
    queryKey: ["rounds", roundId],
    queryFn: () => fetchRoundDetail(roundId, token as string),
    enabled: Boolean(token && roundId),
    refetchInterval: AUTO_REFRESH_MS,
    refetchOnWindowFocus: true,
  });
}

export function useCurrentTurn(roundId: string) {
  const { token } = useAuth();
  return useQuery({
    queryKey: ["rounds", roundId, "turn"],
    queryFn: () => fetchCurrentTurn(roundId, token as string),
    enabled: Boolean(token && roundId),
    refetchInterval: AUTO_REFRESH_MS,
    refetchOnWindowFocus: true,
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
    mutationFn: (turnId: string) => confirmTurn(turnId, token as string).catch(() => completeTurn(turnId, token as string)),
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
    mutationFn: ({ turnId, excuse }: { turnId: string; excuse?: string }) =>
      skipTurn(turnId, token as string, excuse).catch(() => missTurn(turnId, token as string, excuse)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rounds", roundId] });
      queryClient.invalidateQueries({ queryKey: ["rounds", roundId, "turn"] });
      queryClient.invalidateQueries({ queryKey: ["rounds"] });
    },
  });
}

export function useResolvePenalty(roundId: string) {
  const queryClient = useQueryClient();
  const { token } = useAuth();
  return useMutation({
    mutationFn: (penaltyId: string) => resolvePenalty(roundId, penaltyId, token as string),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rounds", roundId] });
      queryClient.invalidateQueries({ queryKey: ["rounds"] });
    },
  });
}
