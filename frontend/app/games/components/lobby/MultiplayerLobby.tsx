"use client";

import React, { useState, useEffect } from 'react';
import { GameItem, RoomState, UserGameRating } from '@/types/game';
import api from '@/lib/axios';
import toast from 'react-hot-toast';
import {
  Swords,
  Bot,
  Plus,
  KeyRound,
  RefreshCw,
  Users,
  Trophy,
  Copy,
  Check,
  UserPlus,
  Play,
  LogOut,
  Shield,
  Lock,
  Globe,
  Clock,
  Loader2,
  Crown,
} from 'lucide-react';

interface FriendItem {
  id: number;
  username: string;
  avatar_url?: string | null;
}

interface MultiplayerLobbyProps {
  game: GameItem;
  currentUserId: number;
  isConnected: boolean;
  room: RoomState | null;
  isSearchingMatch: boolean;
  myRating: UserGameRating | null;
  eloLeaderboard: UserGameRating[];
  onQuickMatch: () => void;
  onCancelMatch: () => void;
  onPlayVsBot: (blockTwoEnds: boolean, turnTimeSeconds: number) => void;
  onCreateRoom: (opts: {
    roomName: string;
    isPrivate: boolean;
    turnTimeSeconds: number;
    blockTwoEnds: boolean;
  }) => void;
  onJoinRoom: (roomCode: string) => void;
  onToggleReady: () => void;
  onStartRoom: () => void;
  onLeaveRoom: () => void;
}

export default function MultiplayerLobby({
  game,
  currentUserId,
  isConnected,
  room,
  isSearchingMatch,
  myRating,
  eloLeaderboard,
  onQuickMatch,
  onCancelMatch,
  onPlayVsBot,
  onCreateRoom,
  onJoinRoom,
  onToggleReady,
  onStartRoom,
  onLeaveRoom,
}: MultiplayerLobbyProps) {
  const [publicRooms, setPublicRooms] = useState<RoomState[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [joinCode, setJoinCode] = useState('');

  // Create room form
  const [roomName, setRoomName] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [turnTime, setTurnTime] = useState(30);
  const [blockTwoEnds, setBlockTwoEnds] = useState(true);

  // Waiting room helpers
  const [copied, setCopied] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [friends, setFriends] = useState<FriendItem[]>([]);
  const [invitingId, setInvitingId] = useState<number | null>(null);

  const gameSlug = game.slug || 'caro-online';

  const fetchPublicRooms = async () => {
    setLoadingRooms(true);
    try {
      const res = await api.get('/games/multiplayer/rooms', { params: { gameSlug } });
      setPublicRooms(res.data || []);
    } catch {
      // ignore
    } finally {
      setLoadingRooms(false);
    }
  };

  useEffect(() => {
    if (!room) {
      fetchPublicRooms();
    }
  }, [room, gameSlug]);

  const loadFriends = async () => {
    setShowInviteModal(true);
    try {
      const res = await api.get('/friends');
      const list = Array.isArray(res.data) ? res.data : res.data?.content || [];
      setFriends(list);
    } catch {
      toast.error('Không thể tải danh sách bạn bè');
    }
  };

  const handleInviteFriend = async (friendId: number) => {
    if (!room) return;
    setInvitingId(friendId);
    try {
      await api.post(`/games/multiplayer/rooms/${room.roomCode}/invite`, { friendId });
      toast.success('Đã gửi lời mời vào phòng!');
    } catch {
      toast.error('Không thể gửi lời mời');
    } finally {
      setInvitingId(null);
    }
  };

  const copyInviteLink = () => {
    if (!room) return;
    const url = `${window.location.origin}/games/${game.id}/play?room=${room.roomCode}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success('Đã sao chép link mời vào phòng!');
    setTimeout(() => setCopied(false), 2000);
  };

  // --- WAITING ROOM VIEW ---
  if (room && room.status === 'WAITING') {
    const me = room.players.find((p) => p.userId === currentUserId);
    const isHost = room.hostUserId === currentUserId;
    const canStart = isHost && room.players.length >= 2;

    return (
      <div className="max-w-3xl mx-auto w-full space-y-5">
        <div className="glass-card rounded-3xl border border-indigo-500/30 p-5 sm:p-7 space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-indigo-500/15 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  PHÒNG CHỜ
                </span>
                <span className="text-xs font-mono font-black px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                  MÃ: {room.roomCode}
                </span>
              </div>
              <h2 className="text-xl font-black text-foreground mt-2">{room.roomName}</h2>
              <p className="text-xs text-text-muted mt-0.5">
                {room.rules?.blockTwoEnds ? 'Luật chặn 2 đầu' : 'Luật tự do 5 quân'} • {room.turnTimeSeconds}s / lượt •{' '}
                {room.isPrivate ? 'Phòng riêng tư' : 'Phòng công khai'}
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={copyInviteLink}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-surface-hover hover:bg-indigo-500/20 text-foreground border border-indigo-500/25 transition-all cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Đã copy link' : 'Copy link mời'}
              </button>
              <button
                onClick={loadFriends}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-300 border border-indigo-500/30 transition-all cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5" /> Mời bạn bè
              </button>
            </div>
          </div>

          {/* Player Slots */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[0, 1].map((seat) => {
              const p = room.players.find((pl) => pl.seatIndex === seat);
              const symbol = seat === 0 ? 'X' : 'O';
              return (
                <div
                  key={seat}
                  className={`p-4 rounded-2xl border flex items-center gap-3.5 ${
                    p
                      ? 'bg-surface-hover/60 border-indigo-500/30'
                      : 'bg-surface-hover/20 border-dashed border-indigo-500/20'
                  }`}
                >
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xl shrink-0 ${
                      seat === 0
                        ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                        : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                    }`}
                  >
                    {symbol}
                  </div>
                  {p ? (
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-sm text-foreground truncate">{p.username}</span>
                        {p.host && <Crown className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[11px] font-mono text-amber-400">ELO {p.elo}</span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            p.ready
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : 'bg-amber-500/15 text-amber-400'
                          }`}
                        >
                          {p.ready ? 'Sẵn sàng' : 'Chưa sẵn sàng'}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs text-text-muted">
                      Đang chờ người chơi thứ 2...
                      <span className="block text-[11px] opacity-75 mt-0.5">
                        Chia sẻ mã <strong className="font-mono text-indigo-300">{room.roomCode}</strong> cho bạn bè
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {room.systemMessage && (
            <p className="text-xs text-center text-indigo-300 bg-indigo-500/10 py-2 px-3 rounded-xl border border-indigo-500/20">
              {room.systemMessage}
            </p>
          )}

          {/* Controls */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <button
              onClick={onLeaveRoom}
              className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-surface-hover hover:bg-rose-500/15 text-text-muted hover:text-rose-400 border border-indigo-500/15 transition-all cursor-pointer"
            >
              <LogOut className="w-4 h-4" /> Rời phòng
            </button>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={onToggleReady}
                className={`flex-1 sm:flex-initial px-5 py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  me?.ready
                    ? 'bg-amber-500/15 text-amber-300 border-amber-500/30 hover:bg-amber-500/25'
                    : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
                }`}
              >
                {me?.ready ? 'Hủy sẵn sàng' : 'Sẵn sàng'}
              </button>

              {isHost && (
                <button
                  disabled={!canStart}
                  onClick={onStartRoom}
                  className="flex-1 sm:flex-initial btn-anime disabled:opacity-40 disabled:cursor-not-allowed px-6 py-2.5 rounded-xl text-xs font-black text-white flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-500/25 cursor-pointer"
                >
                  <Play className="w-4 h-4 fill-current" /> Bắt đầu ngay
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Invite Friends Modal */}
        {showInviteModal && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="glass-card max-w-md w-full rounded-3xl border border-indigo-500/30 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-base text-foreground flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-indigo-400" /> Mời bạn bè vào phòng {room.roomCode}
                </h3>
                <button
                  onClick={() => setShowInviteModal(false)}
                  className="text-xs text-text-muted hover:text-foreground cursor-pointer"
                >
                  Đóng
                </button>
              </div>
              <div className="max-h-64 overflow-y-auto space-y-2">
                {friends.length === 0 ? (
                  <p className="text-xs text-text-muted text-center py-6">
                    Chưa có bạn bè nào. Bạn có thể copy link mời ở trên nhé!
                  </p>
                ) : (
                  friends.map((f) => (
                    <div
                      key={f.id}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-surface-hover/50 border border-indigo-500/15"
                    >
                      <span className="text-xs font-semibold text-foreground">{f.username}</span>
                      <button
                        disabled={invitingId === f.id}
                        onClick={() => handleInviteFriend(f.id)}
                        className="px-3 py-1.5 rounded-lg text-[11px] font-bold bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/30 cursor-pointer"
                      >
                        {invitingId === f.id ? 'Đang mời...' : 'Mời chơi'}
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // --- MAIN LOBBY VIEW ---
  return (
    <div className="max-w-5xl mx-auto w-full space-y-6">
      {/* Connection status + Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Quick Match */}
        <div className="glass-card rounded-2xl p-5 border border-indigo-500/30 flex flex-col justify-between space-y-4 relative overflow-hidden">
          <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-indigo-500/15 blur-2xl pointer-events-none" />
          <div>
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mb-3">
              <Swords className="w-5 h-5" />
            </div>
            <h3 className="font-black text-base text-foreground">Ghép Trận Nhanh (Rank)</h3>
            <p className="text-xs text-text-muted mt-1">
              Tự động tìm đối thủ 1v1 đang online và tính điểm ELO chuẩn.
            </p>
          </div>

          {isSearchingMatch ? (
            <button
              onClick={onCancelMatch}
              className="w-full py-2.5 rounded-xl text-xs font-bold bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Loader2 className="w-4 h-4 animate-spin" /> Đang tìm đối thủ... (Hủy)
            </button>
          ) : (
            <button
              disabled={!isConnected}
              onClick={onQuickMatch}
              className="w-full btn-anime disabled:opacity-50 py-2.5 rounded-xl text-xs font-black text-white flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/25 cursor-pointer"
            >
              <Swords className="w-4 h-4" /> Tìm Trận Ngay
            </button>
          )}
        </div>

        {/* Play vs Bot AI */}
        <div className="glass-card rounded-2xl p-5 border border-emerald-500/25 flex flex-col justify-between space-y-4">
          <div>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-3">
              <Bot className="w-5 h-5" />
            </div>
            <h3 className="font-black text-base text-foreground">Đấu Với Bot AI</h3>
            <p className="text-xs text-text-muted mt-1">
              Luyện tập ngay lập tức với Bot AI chiến thuật thông minh, không cần chờ đợi.
            </p>
          </div>
          <button
            onClick={() => onPlayVsBot(blockTwoEnds, turnTime)}
            className="w-full py-2.5 rounded-xl text-xs font-bold bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/35 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Bot className="w-4 h-4" /> Chơi Với Máy
          </button>
        </div>

        {/* My ELO Card */}
        <div className="glass-card rounded-2xl p-5 border border-amber-500/25 flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
              <Trophy className="w-4 h-4" /> Hồ Sơ Kỳ Thủ
            </span>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                isConnected
                  ? 'bg-emerald-500/15 text-emerald-400'
                  : 'bg-amber-500/15 text-amber-400'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
              {isConnected ? 'Realtime OK' : 'Đang kết nối...'}
            </span>
          </div>

          <div className="flex items-end justify-between">
            <div>
              <span className="text-[11px] text-text-muted block">Điểm ELO hiện tại</span>
              <span className="text-3xl font-black text-amber-400 font-mono">
                {myRating?.elo ?? 1000}
              </span>
            </div>
            <div className="text-right text-xs">
              <div className="text-emerald-400 font-bold">{myRating?.wins ?? 0} Thắng</div>
              <div className="text-rose-400 font-semibold">{myRating?.losses ?? 0} Thua</div>
              <div className="text-text-muted">{myRating?.draws ?? 0} Hòa</div>
            </div>
          </div>

          <div className="text-[11px] text-text-muted pt-2 border-t border-indigo-500/15 flex justify-between">
            <span>Tỉ lệ thắng: <strong className="text-foreground">{myRating?.winRate ?? 0}%</strong></span>
            <span>Chuỗi thắng: <strong className="text-amber-400">{myRating?.winStreak ?? 0}🔥</strong></span>
          </div>
        </div>
      </div>

      {/* Create Room + Join Room + Public Rooms + ELO Top */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left 2 cols: Create Room + Public Rooms */}
        <div className="lg:col-span-2 space-y-5">
          {/* Create Room & Join by Code */}
          <div className="glass-card rounded-2xl p-5 border border-indigo-500/20 space-y-4">
            <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
              <Plus className="w-4 h-4 text-indigo-400" /> Tạo Phòng Đấu Với Bạn Bè
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="text"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                placeholder="Tên phòng (tùy chọn)..."
                className="text-xs px-3 py-2.5 rounded-xl bg-surface-hover/60 border border-indigo-500/20 focus:border-indigo-400 focus:outline-none text-foreground"
              />

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsPrivate(false)}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold border flex items-center justify-center gap-1 cursor-pointer ${
                    !isPrivate
                      ? 'bg-indigo-500/20 border-indigo-400 text-indigo-300'
                      : 'bg-surface-hover/40 border-indigo-500/15 text-text-muted'
                  }`}
                >
                  <Globe className="w-3.5 h-3.5" /> Công khai
                </button>
                <button
                  type="button"
                  onClick={() => setIsPrivate(true)}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold border flex items-center justify-center gap-1 cursor-pointer ${
                    isPrivate
                      ? 'bg-indigo-500/20 border-indigo-400 text-indigo-300'
                      : 'bg-surface-hover/40 border-indigo-500/15 text-text-muted'
                  }`}
                >
                  <Lock className="w-3.5 h-3.5" /> Riêng tư
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <div className="flex items-center gap-4 flex-wrap">
                <label className="flex items-center gap-2 text-xs text-foreground cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={blockTwoEnds}
                    onChange={(e) => setBlockTwoEnds(e.target.checked)}
                    className="accent-indigo-500 w-3.5 h-3.5"
                  />
                  <Shield className="w-3.5 h-3.5 text-indigo-400" /> Luật chặn 2 đầu
                </label>

                <div className="flex items-center gap-1.5 text-xs text-text-muted">
                  <Clock className="w-3.5 h-3.5 text-indigo-400" />
                  <select
                    value={turnTime}
                    onChange={(e) => setTurnTime(Number(e.target.value))}
                    className="bg-surface-hover border border-indigo-500/20 rounded-lg px-2 py-1 text-xs text-foreground"
                  >
                    <option value={15}>15s / lượt</option>
                    <option value={30}>30s / lượt</option>
                    <option value={45}>45s / lượt</option>
                    <option value={60}>60s / lượt</option>
                  </select>
                </div>
              </div>

              <button
                onClick={() =>
                  onCreateRoom({
                    roomName,
                    isPrivate,
                    turnTimeSeconds: turnTime,
                    blockTwoEnds,
                  })
                }
                className="btn-anime px-5 py-2.5 rounded-xl text-xs font-bold text-white flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Tạo Phòng
              </button>
            </div>

            {/* Join by code */}
            <div className="pt-3 border-t border-indigo-500/15 flex gap-2">
              <div className="relative flex-1">
                <KeyRound className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  placeholder="Nhập mã phòng 6 ký tự (VD: AB12CD)..."
                  maxLength={8}
                  className="w-full text-xs font-mono uppercase pl-9 pr-3 py-2.5 rounded-xl bg-surface-hover/60 border border-indigo-500/20 focus:border-indigo-400 focus:outline-none text-foreground"
                />
              </div>
              <button
                disabled={!joinCode.trim()}
                onClick={() => onJoinRoom(joinCode.trim())}
                className="px-4 py-2.5 rounded-xl text-xs font-bold bg-surface-hover hover:bg-indigo-500/20 text-foreground border border-indigo-500/25 disabled:opacity-40 cursor-pointer"
              >
                Vào Phòng
              </button>
            </div>
          </div>

          {/* Public Rooms List */}
          <div className="glass-card rounded-2xl p-5 border border-indigo-500/20 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-400" /> Phòng Công Khai Đang Mở ({publicRooms.length})
              </h3>
              <button
                onClick={fetchPublicRooms}
                className="text-xs text-text-muted hover:text-foreground flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingRooms ? 'animate-spin' : ''}`} /> Làm mới
              </button>
            </div>

            {publicRooms.length === 0 ? (
              <div className="text-center py-8 text-xs text-text-muted bg-surface-hover/20 rounded-xl border border-dashed border-indigo-500/15">
                Chưa có phòng công khai nào đang chờ. Hãy tạo phòng mới hoặc bấm &quot;Tìm Trận Ngay&quot;!
              </div>
            ) : (
              <div className="space-y-2">
                {publicRooms.map((r) => (
                  <div
                    key={r.roomCode}
                    className="flex items-center justify-between p-3 rounded-xl bg-surface-hover/50 border border-indigo-500/15 hover:border-indigo-400/40 transition-all"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-foreground truncate">{r.roomName}</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-indigo-500/15 text-indigo-300">
                          {r.roomCode}
                        </span>
                      </div>
                      <p className="text-[11px] text-text-muted mt-0.5">
                        {r.players.length}/{r.maxPlayers} người • {r.turnTimeSeconds}s/lượt •{' '}
                        {r.rules?.blockTwoEnds ? 'Chặn 2 đầu' : 'Tự do'}
                      </p>
                    </div>
                    <button
                      onClick={() => onJoinRoom(r.roomCode)}
                      className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-indigo-500/20 hover:bg-indigo-500/35 text-indigo-300 border border-indigo-500/30 cursor-pointer shrink-0"
                    >
                      Tham gia
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right col: ELO Leaderboard */}
        <div className="glass-card rounded-2xl p-5 border border-indigo-500/20 space-y-3 h-fit">
          <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-400" /> Bảng Xếp Hạng ELO
          </h3>
          {eloLeaderboard.length === 0 ? (
            <p className="text-xs text-text-muted text-center py-6">
              Chưa có kỳ thủ nào trên bảng ELO. Hãy là người đầu tiên chiến thắng!
            </p>
          ) : (
            <div className="space-y-2">
              {eloLeaderboard.slice(0, 10).map((entry) => (
                <div
                  key={entry.userId}
                  className={`flex items-center justify-between p-2.5 rounded-xl border text-xs ${
                    entry.userId === currentUserId
                      ? 'bg-indigo-500/15 border-indigo-400/40'
                      : 'bg-surface-hover/40 border-indigo-500/10'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className={`w-5 text-center font-black font-mono ${
                        entry.rank === 1
                          ? 'text-amber-400'
                          : entry.rank === 2
                          ? 'text-slate-300'
                          : entry.rank === 3
                          ? 'text-amber-600'
                          : 'text-text-muted'
                      }`}
                    >
                      #{entry.rank}
                    </span>
                    <div className="min-w-0">
                      <p className="font-bold text-foreground truncate">{entry.username}</p>
                      <p className="text-[10px] text-text-muted">
                        {entry.wins}W - {entry.losses}L ({entry.winRate}%)
                      </p>
                    </div>
                  </div>
                  <span className="font-mono font-black text-amber-400 shrink-0">{entry.elo}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
