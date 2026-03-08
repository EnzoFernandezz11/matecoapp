import { ApiError } from "@/lib/api/client";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

function authHeader(basicToken: string) {
  return { Authorization: `Basic ${basicToken}` };
}

async function adminFetch<T>(path: string, basicToken: string): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...authHeader(basicToken),
    },
    cache: "no-store",
  });

  if (!response.ok) {
    let message = "Admin request failed";
    try {
      const payload = (await response.json()) as { detail?: string };
      message = payload.detail ?? message;
    } catch {
      const text = await response.text();
      if (text) {
        message = text;
      }
    }
    throw new ApiError(response.status, message);
  }
  return (await response.json()) as T;
}

export interface AdminMetrics {
  total_users: number;
  total_rounds: number;
  total_turns: number;
  completed_turns: number;
  skipped_turns: number;
}

export interface AdminPaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
}

export interface AdminUserRow {
  id: string;
  name: string;
  email: string;
  avatar_url: string;
  google_id: string | null;
  created_at: string;
  university: string | null;
  rounds_joined: number;
  turns_completed: number;
  turns_skipped: number;
}

export interface AdminRoundRow {
  id: string;
  name: string;
  invite_code: string;
  created_at: string;
  creator_name: string | null;
  member_count: number;
  current_turn_user: string | null;
}

export interface AdminTurnRow {
  id: string;
  round_id: string;
  round_name: string | null;
  user_id: string;
  user_name: string | null;
  turn_index: number;
  status: "pending" | "completed" | "missed";
  excuse: string | null;
  created_at: string;
}

export function adminHealth(basicToken: string) {
  return adminFetch<{ status: string; admin: string }>("/admin/health", basicToken);
}

export function adminMetrics(basicToken: string) {
  return adminFetch<AdminMetrics>("/admin/metrics", basicToken);
}

export function adminUsers(basicToken: string, q = "", page = 1, pageSize = 20) {
  const params = new URLSearchParams({
    q,
    page: String(page),
    page_size: String(pageSize),
  });
  return adminFetch<AdminPaginatedResponse<AdminUserRow>>(`/admin/users?${params.toString()}`, basicToken);
}

export function adminRounds(basicToken: string, q = "", page = 1, pageSize = 20) {
  const params = new URLSearchParams({
    q,
    page: String(page),
    page_size: String(pageSize),
  });
  return adminFetch<AdminPaginatedResponse<AdminRoundRow>>(`/admin/rounds?${params.toString()}`, basicToken);
}

export function adminTurns(
  basicToken: string,
  q = "",
  status: "" | "pending" | "completed" | "missed" = "",
  page = 1,
  pageSize = 20,
) {
  const params = new URLSearchParams({
    q,
    page: String(page),
    page_size: String(pageSize),
  });
  if (status) {
    params.set("status", status);
  }
  return adminFetch<AdminPaginatedResponse<AdminTurnRow>>(`/admin/turns?${params.toString()}`, basicToken);
}
