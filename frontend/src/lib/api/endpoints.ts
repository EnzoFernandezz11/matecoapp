import { apiFetch } from "@/lib/api/client";
import type {
  AuthResponse,
  AdminStats,
  AdminUserDetail,
  AdminUsersListResponse,
  InviteLinkResponse,
  Penalty,
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

export function confirmTurn(turnId: string, token: string): Promise<TurnActionResponse> {
  return apiFetch<TurnActionResponse>(
    `/turns/${turnId}/confirm`,
    {
      method: "POST",
    },
    token,
  );
}

export function skipTurn(turnId: string, token: string, excuse?: string): Promise<TurnActionResponse> {
  return apiFetch<TurnActionResponse>(
    `/turns/${turnId}/skip`,
    {
      method: "POST",
      body: JSON.stringify({ excuse: excuse || null }),
    },
    token,
  );
}

export function resolvePenalty(roundId: string, penaltyId: string, token: string): Promise<Penalty> {
  return apiFetch<Penalty>(
    `/rounds/${roundId}/penalties/${penaltyId}/resolve`,
    {
      method: "POST",
    },
    token,
  );
}

export function fetchAdminStats(token: string): Promise<AdminStats> {
  return apiFetch<AdminStats>("/api/admin/stats", {}, token);
}

export function fetchAdminUsers(
  token: string,
  params: { search?: string; skip?: number; limit?: number } = {},
): Promise<AdminUsersListResponse> {
  const query = new URLSearchParams();
  if (params.search) query.set("search", params.search);
  if (typeof params.skip === "number") query.set("skip", String(params.skip));
  if (typeof params.limit === "number") query.set("limit", String(params.limit));
  const qs = query.toString();
  return apiFetch<AdminUsersListResponse>(`/api/admin/users${qs ? `?${qs}` : ""}`, {}, token);
}

export function fetchAdminUser(token: string, userId: string): Promise<AdminUserDetail> {
  return apiFetch<AdminUserDetail>(`/api/admin/users/${userId}`, {}, token);
}

export function updateAdminUser(
  token: string,
  userId: string,
  payload: { name: string; email: string },
): Promise<AdminUserDetail> {
  return apiFetch<AdminUserDetail>(
    `/api/admin/users/${userId}`,
    {
      method: "PUT",
      body: JSON.stringify(payload),
    },
    token,
  );
}

export function deleteAdminUser(token: string, userId: string): Promise<void> {
  return apiFetch<void>(
    `/api/admin/users/${userId}`,
    {
      method: "DELETE",
    },
    token,
  );
}

export function subscribePush(
  token: string,
  payload: { endpoint: string; keys: { p256dh: string; auth: string } },
): Promise<{ subscribed: boolean }> {
  return apiFetch<{ subscribed: boolean }>(
    "/api/push-subscribe",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    token,
  );
}
