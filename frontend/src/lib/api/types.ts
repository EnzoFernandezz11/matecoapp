export type PenaltyMode = "auto" | "vote";
export type TurnStatus = "pending" | "completed" | "missed";

export interface University {
  id: string;
  name: string;
  country?: string | null;
  city?: string | null;
  is_verified: boolean;
  created_at?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar_url: string;
  university_id?: string | null;
  university?: string | null;
  university_ref?: University | null;
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

export interface RoundDetail {
  round: Round;
  members: RoundMember[];
  current_turn: {
    id: string;
    user_id: string;
    user_name: string;
    turn_index: number;
    status: TurnStatus;
    excuse?: string | null;
    created_at: string;
  } | null;
  ranking: RankingEntry[];
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
