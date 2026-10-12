import { UserBrief } from './user';

export interface FriendRequest {
  id: number;
  sender_id: number;
  receiver_id: number;
  sender?: UserBrief;
  receiver?: UserBrief;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  created_at: string;
}

export interface Friendship {
  id: number;
  user_id: number;
  friend_id: number;
  friend?: UserBrief;
  status: string;
  created_at: string;
}
