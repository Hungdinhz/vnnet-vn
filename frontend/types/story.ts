import { UserBrief } from './user';

export interface Story {
  id: number;
  owner_id: number;
  owner?: UserBrief;
  content?: string;
  image_url?: string;
  background_color?: string;
  text_style?: string;
  views_count: number;
  is_viewed?: boolean;
  created_at: string;
  expires_at: string;
}

export interface StoryGroup {
  owner_id: number;
  owner: UserBrief;
  has_unviewed: boolean;
  stories: Story[];
}
