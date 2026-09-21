export interface GameItem {
  id: number;
  title: string;
  description: string;
  category: string;
  image_url: string;
  thumbnail_url: string;
  max_score: number;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  is_active: boolean;
  play_count: number;
  created_at: string;
  current_user_high_score?: number | null;
  current_user_plays?: number | null;
  achievements_count?: number;
}

export interface UserOut {
  id: number;
  username: string;
  avatar_url?: string;
}

export interface LeaderboardEntry {
  rank: number;
  user: UserOut;
  high_score: number;
  total_plays: number;
  last_played_at: string;
}

export interface GameAchievement {
  id: number;
  game_id: number;
  title: string;
  description: string;
  icon: string;
  required_score: number;
  required_plays: number;
  unlocked_by_current_user: boolean;
  unlocked_at?: string | null;
}

export interface GameScoreResult {
  id: number;
  game_id: number;
  game_title: string;
  user: UserOut;
  score: number;
  play_time_seconds: number;
  created_at: string;
  rank?: number;
  unlocked_achievements?: GameAchievement[];
}

export interface GameStats {
  total_games_played: number;
  total_plays: number;
  total_score: number;
  achievements_unlocked: number;
  favorite_game?: GameItem | null;
  recent_scores?: GameScoreResult[];
}
