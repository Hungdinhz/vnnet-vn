import { UserBrief } from './user';

export interface Group {
  id: number;
  name: string;
  description?: string;
  avatar_url?: string;
  cover_url?: string;
  privacy: 'PUBLIC' | 'PRIVATE';
  creator_id: number;
  members_count: number;
  is_member?: boolean;
  user_role?: 'OWNER' | 'ADMIN' | 'MEMBER';
  created_at: string;
}

export interface GroupMember {
  id: number;
  group_id: number;
  user_id: number;
  user?: UserBrief;
  role: 'OWNER' | 'ADMIN' | 'MEMBER';
  joined_at: string;
}
