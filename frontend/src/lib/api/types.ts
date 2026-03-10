export type PenaltyMode = "auto" | "vote";
export type TurnStatus = "pending" | "confirmed" | "skipped" | "reassigned";

export interface User {
  id: string;
  name: string;
  email: string;
  avatar_url: string;
  university?: string | null;
  career?: string | null;
  created_at: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface Round {
  id: string;
  name: string;
  created_by: string;
  invite_code: string;
  penalty_mode: PenaltyMode;
  active_days: number[];
  created_at: string;
}

export interface RoundCreateInput {
  name: string;
  penalty_mode: PenaltyMode;
  active_days: number[];
}

export interface RoundMember {
  id: string;
  user: User;
  joined_at: string;
}

export interface Turn {
  id: string;
  round_id: string;
  user_id: string;
  turn_date: string;
  turn_index: number;
  status: TurnStatus;
  excuse?: string | null;
  created_at: string;
}

export interface RankingEntry {
  user: string;
  mates: number;
  missed: number;
  role: string | null;
}

export interface Penalty {
  id: string;
  round_id: string;
  user_id: string;
  user_name: string;
  turn_id: string | null;
  type: "double_turn" | "bring_facturas" | "bring_bizcochos";
  description: string | null;
  resolved: boolean;
  created_at: string;
}

export interface InviteLinkResponse {
  invite_code: string;
  invite_link: string;
}

export interface TurnActionResponse {
  turn: Turn;
  next_turn: Turn | null;
  penalty: "double_turn" | "bring_facturas" | "bring_bizcochos" | null;
}

export interface AdminRecentUser {
  id: string;
  name: string;
  email: string;
  created_at: string;
}

export interface AdminStats {
  total_users: number;
  new_users_last_7_days: number;
  total_rounds: number;
  recent_users: AdminRecentUser[];
}

export interface AdminUserListItem {
  id: string;
  name: string;
  email: string;
  created_at: string;
  mesas_joined: number;
}

export interface AdminUsersListResponse {
  items: AdminUserListItem[];
  total: number;
  skip: number;
  limit: number;
}

export interface AdminUserRound {
  id: string;
  name: string;
  joined_at: string;
}

export interface AdminUserDetail {
  id: string;
  name: string;
  email: string;
  created_at: string;
  mesas_joined: number;
  rounds: AdminUserRound[];
  turns_total: number;
  turns_completed: number;
  turns_missed: number;
}

/* ---- Penalty Voting ---- */

export interface PenaltyVoteOption {
  id: string;
  penalty_name: string;
  vote_count: number;
}

export interface PenaltyVoteResponse {
  id: string;
  round_id: string;
  failed_user_id: string;
  failed_user_name: string;
  turn_id: string | null;
  created_at: string;
  expires_at: string;
  status: "active" | "closed";
  winning_penalty: string | null;
  options: PenaltyVoteOption[];
  user_has_voted: boolean;
}

export interface RoundDetail {
  round: Round;
  members: RoundMember[];
  current_turn: {
    id: string;
    user_id: string;
    user_name: string;
    turn_date?: string | null;
    turn_index: number;
    status: TurnStatus;
    excuse?: string | null;
    created_at: string;
  } | null;
  upcoming_turns: Array<{
    id: string;
    date: string;
    user_id: string;
    user_name: string;
    status: TurnStatus;
  }>;
  penalties: Penalty[];
  ranking: RankingEntry[];
  active_vote: PenaltyVoteResponse | null;
  latest_vote_result: PenaltyVoteResponse | null;
}
