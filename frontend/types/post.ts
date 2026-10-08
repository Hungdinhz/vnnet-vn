import { UserBrief } from './user';

export interface PostReaction {
  id: number;
  user_id: number;
  post_id: number;
  reaction_type: string;
  created_at: string;
}

export interface PostComment {
  id: number;
  content: string;
  post_id: number;
  owner_id: number;
  owner?: UserBrief;
  created_at: string;
}

export interface Post {
  id: number;
  title: string;
  content: string;
  image_url?: string;
  owner_id: number;
  owner?: UserBrief;
  likes_count: number;
  comments_count: number;
  is_liked: boolean;
  my_reaction?: string;
  reactions_summary?: Record<string, number>;
  visibility?: 'public' | 'friends' | 'private';
  group_id?: number;
  group_name?: string;
  shared_post?: Post;
  mentioned_users?: UserBrief[];
  created_at: string;
}
