import { UserBrief } from './user';

export interface AppEvent {
  id: number;
  title: string;
  description?: string;
  location?: string;
  start_time: string;
  end_time?: string;
  cover_url?: string;
  creator_id: number;
  creator?: UserBrief;
  interested_count: number;
  going_count: number;
  user_status?: 'INTERESTED' | 'GOING' | null;
  created_at: string;
}
