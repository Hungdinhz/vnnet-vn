export type AdminRole = 'USER' | 'MODERATOR' | 'ADMIN' | 'SUPER_ADMIN';
export type AccountStatus = 'ACTIVE' | 'SUSPENDED' | 'BANNED';

export interface AdminProfile {
  id: number;
  username: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  role: AdminRole;
  account_status: AccountStatus;
}

export interface AdminUserSummary {
  id: number;
  username: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  role: AdminRole;
  account_status: AccountStatus;
  banned_until?: string | null;
  ban_reason?: string | null;
  is_verified: boolean;
  is_guest: boolean;
  is_private: boolean;
  created_at?: string;
  last_login_at?: string | null;
  posts_count: number;
}

export interface AdminAuditLogItem {
  id: number;
  actor_id: number;
  actor_email: string;
  actor_role: string;
  action: string;
  target_type: string;
  target_id?: number | null;
  reason?: string | null;
  metadata_json?: string | null;
  ip_address?: string | null;
  user_agent?: string | null;
  created_at: string;
}

export interface AdminReportItem {
  id: number;
  reporter_id: number;
  reporter_username: string;
  target_type: 'POST' | 'COMMENT' | 'USER' | 'GROUP' | 'MARKETPLACE_ITEM';
  target_id: number;
  target_preview: string;
  reason_category: string;
  description?: string | null;
  status: 'PENDING' | 'REVIEWING' | 'RESOLVED' | 'DISMISSED';
  handled_by?: number | null;
  resolution_note?: string | null;
  action_taken?: string | null;
  created_at: string;
  resolved_at?: string | null;
}

export interface AdminPostItem {
  id: number;
  title: string;
  content: string;
  image_url?: string | null;
  visibility?: string;
  owner_id: number;
  owner_username: string;
  group_id?: number | null;
  is_hidden: boolean;
  hidden_reason?: string | null;
  hidden_at?: string | null;
  created_at?: string;
}

export interface AdminGroupItem {
  id: number;
  name: string;
  description?: string | null;
  creator_id?: number | null;
  is_private: boolean;
  is_hidden: boolean;
  hidden_reason?: string | null;
  created_at?: string;
}

export interface AdminMarketplaceItem {
  id: number;
  title: string;
  description: string;
  price: number;
  category: string;
  status: string;
  seller_id: number;
  is_hidden: boolean;
  hidden_reason?: string | null;
  created_at?: string;
}

export interface DashboardOverview {
  total_users: number;
  active_users_24h: number;
  new_users_24h: number;
  new_users_7d: number;
  restricted_users: number;
  total_posts: number;
  new_posts_24h: number;
  total_groups: number;
  active_marketplace_items: number;
  pending_reports: number;
}

export interface DailyGrowthPoint {
  date: string;
  active_users: number;
  new_users: number;
  new_posts: number;
}

export interface DashboardGrowth {
  days: number;
  points: DailyGrowthPoint[];
}

export interface SpringPage<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}
