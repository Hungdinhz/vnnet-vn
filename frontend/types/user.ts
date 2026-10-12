export interface User {
  id: number;
  username: string;
  email?: string;
  avatar_url?: string;
  cover_url?: string;
  full_name?: string;
  bio?: string;
  location?: string;
  workplace?: string;
  website?: string;
  phone?: string;
  is_verified?: boolean;
  created_at?: string;
}

export interface UserBrief {
  id: number;
  username: string;
  avatar_url?: string;
  full_name?: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
}
