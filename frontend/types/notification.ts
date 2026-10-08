import { UserBrief } from './user';

export interface AppNotification {
  id: number;
  user_id: number;
  actor_id?: number;
  actor?: UserBrief;
  type: string;
  content: string;
  reference_id?: number;
  is_read: boolean;
  created_at: string;
}
