import { apiFetch } from "@/lib/api/client";
import type {
  AuthResponse,
  InviteLinkResponse,
  Round,
  RoundCreateInput,
  RoundDetail,
  Turn,
  TurnActionResponse,
  User,
} from "@/lib/api/types";

export function authWithGoogle(idToken: string): Promise<AuthResponse> {
  return apiFetch<AuthResponse>("/auth/google", {
    method: "POST",
    body: JSON.stringify({ id_token: idToken }),
  });
}

export function registerWithEmail(name: string, email: string, password: string): Promise<AuthResponse> {
  return apiFetch<AuthResponse>("/auth/register", {
    method: "POST",
    body: JSON.stringify({ name, email, password }),
  });
}

export function loginWithEmail(email: string, password: string): Promise<AuthResponse> {
  return apiFetch<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function fetchMe(token: string): Promise<User> {
  return apiFetch<User>("/auth/me", {}, token);
}

export function fetchRounds(token: string): Promise<Round[]> {
  return apiFetch<Round[]>("/rounds", {}, token);
}

export function createRound(input: RoundCreateInput, token: string): Promise<Round> {
  return apiFetch<Round>(
    "/rounds",
    {
      method: "POST",
      body: JSON.stringify(input),
    },
    token,
  );
}

export function fetchRoundDetail(roundId: string, token: string): Promise<RoundDetail> {
  return apiFetch<RoundDetail>(`/rounds/${roundId}`, {}, token);
}

export function joinRound(roundId: string, token: string): Promise<Round> {
  return apiFetch<Round>(
    `/rounds/${roundId}/join`,
    {
      method: "POST",
    },
    token,
  );
}

export function joinRoundByCode(inviteCode: string, token: string): Promise<Round> {
  return apiFetch<Round>(
    "/rounds/join-by-code",
    {
      method: "POST",
      body: JSON.stringify({ invite_code: inviteCode }),
    },
    token,
  );
}

export function leaveRound(roundId: string, token: string): Promise<void> {
  return apiFetch<void>(
    `/rounds/${roundId}/leave`,
    {
      method: "DELETE",
    },
    token,
  );
}

export function fetchInvite(roundId: string, token: string): Promise<InviteLinkResponse> {
  return apiFetch<InviteLinkResponse>(
    `/rounds/${roundId}/invite`,
    {
      method: "POST",
    },
    token,
  );
}

export function fetchCurrentTurn(roundId: string, token: string): Promise<Turn> {
  return apiFetch<Turn>(`/rounds/${roundId}/turn`, {}, token);
}

export function completeTurn(turnId: string, token: string): Promise<TurnActionResponse> {
  return apiFetch<TurnActionResponse>(
    `/turns/${turnId}/complete`,
    {
      method: "POST",
    },
    token,
  );
}

export function missTurn(turnId: string, token: string, excuse?: string): Promise<TurnActionResponse> {
  return apiFetch<TurnActionResponse>(
    `/turns/${turnId}/miss`,
    {
      method: "POST",
      body: JSON.stringify({ excuse: excuse || null }),
    },
    token,
  );
}
