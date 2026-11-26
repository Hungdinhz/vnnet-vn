export interface GameItem {
  id: number;
  title: string;
  slug?: string;
  description: string;
  category: string;
  game_mode?: 'SINGLE' | 'MULTIPLAYER' | 'HYBRID';
  min_players?: number;
  max_players?: number;
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

export interface RoomPlayer {
  userId: number | null;
  username: string;
  avatarUrl?: string | null;
  seatIndex: number;
  symbol?: string;
  ready: boolean;
  host: boolean;
  bot: boolean;
  connected: boolean;
  elo: number;
  eloDelta?: number | null;
  wantsRematch: boolean;
}

export interface RoomChatMessage {
  id: string;
  roomCode: string;
  senderId: number;
  senderName: string;
  senderAvatar?: string | null;
  content: string;
  type: 'CHAT' | 'EMOJI' | 'SYSTEM';
  timestamp: number;
}

export interface CaroGameState {
  boardSize: number;
  board: number[][];
  currentTurnSeat: number;
  blockTwoEnds: boolean;
  moveCount: number;
  lastMove: [number, number] | null;
  winningCells: [number, number][];
}

export interface RoomState {
  roomCode: string;
  roomName: string;
  gameSlug: string;
  gameId: number;
  status: 'WAITING' | 'PLAYING' | 'FINISHED';
  isPrivate: boolean;
  vsBot: boolean;
  maxPlayers: number;
  turnTimeSeconds: number;
  turnDeadlineEpochMs?: number | null;
  reconnectDeadlineEpochMs?: number | null;
  disconnectedUserId?: number | null;
  hostUserId: number;
  rules: Record<string, any>;
  players: RoomPlayer[];
  gameState: CaroGameState | Record<string, any>;
  winnerUserId?: number | null;
  winnerSeat?: number | null;
  endReason?: string | null;
  systemMessage?: string | null;
  recentChat: RoomChatMessage[];
}

export interface UserGameRating {
  rank: number;
  userId: number;
  username: string;
  avatarUrl?: string | null;
  elo: number;
  wins: number;
  losses: number;
  draws: number;
  winStreak: number;
  bestWinStreak: number;
  winRate: number;
}
