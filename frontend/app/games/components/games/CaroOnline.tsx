"use client";

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  GameItem,
  RoomState,
  RoomChatMessage,
  CaroGameState,
  UserGameRating,
} from '@/types/game';
import { useGameWebSocket } from '@/lib/useGameWebSocket';
import MultiplayerLobby from '../lobby/MultiplayerLobby';
import api from '@/lib/axios';
import toast from 'react-hot-toast';
import {
  Flag,
  RotateCcw,
  LogOut,
  Send,
  Clock,
  WifiOff,
  Trophy,
  Sparkles,
  Bot,
  MessageCircle,
} from 'lucide-react';

interface CaroOnlineProps {
  game: GameItem;
}

const QUICK_EMOJIS = ['👏', '🔥', '🤔', '😅', '👍', 'GG!'];

export default function CaroOnline({ game }: CaroOnlineProps) {
  const searchParams = useSearchParams();
  const initialRoomCode = searchParams?.get('room');

  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [room, setRoom] = useState<RoomState | null>(null);
  const [chatMessages, setChatMessages] = useState<RoomChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isSearchingMatch, setIsSearchingMatch] = useState(false);

  const [myRating, setMyRating] = useState<UserGameRating | null>(null);
  const [eloLeaderboard, setEloLeaderboard] = useState<UserGameRating[]>([]);

  // Live countdown state
  const [nowMs, setNowMs] = useState<number>(Date.now());
  const chatEndRef = useRef<HTMLDivElement>(null);

  const gameSlug = game.slug || 'caro-online';
  const {
    isConnected,
    subscribe,
    toggleReady,
    startRoom,
    leaveRoomWs,
    sendAction,
    sendRoomChat,
    joinMatchmakingWs,
    cancelMatchmakingWs,
  } = useGameWebSocket(currentUserId !== null);

  // Tick every 250ms while PLAYING for smooth countdown bar
  useEffect(() => {
    if (!room || room.status !== 'PLAYING') return;
    const interval = setInterval(() => setNowMs(Date.now()), 250);
    return () => clearInterval(interval);
  }, [room?.status]);

  // Initial load: current user, rating, leaderboard, active room or ?room=CODE
  useEffect(() => {
    const init = async () => {
      try {
        const userRes = await api.get('/users/me');
        if (userRes.data?.id) {
          setCurrentUserId(userRes.data.id);
        }

        await refreshRatings();

        if (initialRoomCode) {
          await handleJoinRoom(initialRoomCode);
        } else {
          const activeRes = await api.get('/games/multiplayer/rooms/active');
          if (activeRes.data?.active && activeRes.data?.room?.gameSlug === gameSlug) {
            const activeRoom: RoomState = activeRes.data.room;
            setRoom(activeRoom);
            setChatMessages(activeRoom.recentChat || []);
          }
        }
      } catch {
        // ignore
      }
    };
    init();
  }, [game.id]);

  const refreshRatings = async () => {
    try {
      const [meRes, lbRes] = await Promise.all([
        api.get(`/games/multiplayer/${game.id}/rating/me`),
        api.get(`/games/multiplayer/${game.id}/elo-leaderboard?limit=15`),
      ]);
      setMyRating(meRes.data || null);
      setEloLeaderboard(lbRes.data || []);
    } catch {
      // ignore
    }
  };

  // Subscribe to personal events (/user/queue/game.events)
  useEffect(() => {
    if (!isConnected) return;
    const sub = subscribe('/user/queue/game.events', (evt: any) => {
      if (evt?.type === 'MATCH_FOUND' && evt?.room) {
        setIsSearchingMatch(false);
        setRoom(evt.room);
        setChatMessages(evt.room.recentChat || []);
        toast.success('🎉 Đã tìm thấy đối thủ! Trận đấu bắt đầu!');
      } else if (evt?.type === 'ERROR' && evt?.message) {
        toast.error(evt.message);
      }
    });
    return () => {
      sub?.unsubscribe();
    };
  }, [isConnected, subscribe]);

  // Subscribe to active room topic & room chat topic
  useEffect(() => {
    if (!isConnected || !room?.roomCode) return;

    const roomSub = subscribe(`/topic/game.room.${room.roomCode}`, (updated: RoomState) => {
      setRoom((prev) => {
        if (prev?.status !== 'FINISHED' && updated.status === 'FINISHED') {
          refreshRatings();
        }
        return updated;
      });
    });

    const chatSub = subscribe(`/topic/game.room.${room.roomCode}.chat`, (msg: RoomChatMessage) => {
      setChatMessages((prev) => [...prev.slice(-49), msg]);
    });

    return () => {
      roomSub?.unsubscribe();
      chatSub?.unsubscribe();
    };
  }, [isConnected, room?.roomCode, subscribe]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages.length]);

  const handleQuickMatch = () => {
    setIsSearchingMatch(true);
    joinMatchmakingWs(gameSlug);
  };

  const handleCancelMatch = () => {
    setIsSearchingMatch(false);
    cancelMatchmakingWs(gameSlug);
  };

  const handlePlayVsBot = async (blockTwoEnds: boolean, turnTimeSeconds: number) => {
    try {
      const res = await api.post('/games/multiplayer/rooms', {
        gameSlug,
        roomName: 'Luyện tập cùng Bot AI',
        isPrivate: true,
        vsBot: true,
        turnTimeSeconds,
        rules: { blockTwoEnds },
      });
      setRoom(res.data);
      setChatMessages(res.data.recentChat || []);
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Không thể tạo trận đấu với Bot');
    }
  };

  const handleCreateRoom = async (opts: {
    roomName: string;
    isPrivate: boolean;
    turnTimeSeconds: number;
    blockTwoEnds: boolean;
  }) => {
    try {
      const res = await api.post('/games/multiplayer/rooms', {
        gameSlug,
        roomName: opts.roomName,
        isPrivate: opts.isPrivate,
        vsBot: false,
        turnTimeSeconds: opts.turnTimeSeconds,
        rules: { blockTwoEnds: opts.blockTwoEnds },
      });
      setRoom(res.data);
      setChatMessages(res.data.recentChat || []);
      toast.success(`Đã tạo phòng ${res.data.roomCode}!`);
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Không thể tạo phòng');
    }
  };

  const handleJoinRoom = async (roomCode: string) => {
    try {
      const res = await api.post(`/games/multiplayer/rooms/${roomCode.trim().toUpperCase()}/join`);
      setRoom(res.data);
      setChatMessages(res.data.recentChat || []);
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Không thể vào phòng này');
    }
  };

  const handleLeaveRoom = async () => {
    if (!room) return;
    const code = room.roomCode;
    leaveRoomWs(code);
    try {
      await api.post(`/games/multiplayer/rooms/${code}/leave`);
    } catch {
      // ignore
    }
    setRoom(null);
    setChatMessages([]);
    refreshRatings();
  };

  const handleCellClick = (row: number, col: number) => {
    if (!room || room.status !== 'PLAYING' || currentUserId === null) return;
    const caroState = room.gameState as CaroGameState;
    const mySlot = room.players.find((p) => p.userId === currentUserId);
    if (!mySlot || mySlot.seatIndex !== caroState.currentTurnSeat) return;
    if (caroState.board?.[row]?.[col] !== 0) return;

    sendAction(room.roomCode, 'MOVE', { row, col });
  };

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!room || !chatInput.trim()) return;
    sendRoomChat(room.roomCode, chatInput.trim(), 'CHAT');
    setChatInput('');
  };

  const winningSet = useMemo(() => {
    const set = new Set<string>();
    const caroState = room?.gameState as CaroGameState | undefined;
    if (caroState?.winningCells) {
      for (const [r, c] of caroState.winningCells) {
        set.add(`${r}-${c}`);
      }
    }
    return set;
  }, [room?.gameState]);

  if (currentUserId === null) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
      </div>
    );
  }

  // Show Lobby if no room or WAITING
  if (!room || room.status === 'WAITING') {
    return (
      <MultiplayerLobby
        game={game}
        currentUserId={currentUserId}
        isConnected={isConnected}
        room={room}
        isSearchingMatch={isSearchingMatch}
        myRating={myRating}
        eloLeaderboard={eloLeaderboard}
        onQuickMatch={handleQuickMatch}
        onCancelMatch={handleCancelMatch}
        onPlayVsBot={handlePlayVsBot}
        onCreateRoom={handleCreateRoom}
        onJoinRoom={handleJoinRoom}
        onToggleReady={() => room && toggleReady(room.roomCode)}
        onStartRoom={() => room && startRoom(room.roomCode)}
        onLeaveRoom={handleLeaveRoom}
      />
    );
  }

  // --- ACTIVE MATCH / FINISHED BOARD ---
  const caroState = room.gameState as CaroGameState;
  const board = caroState?.board || Array.from({ length: 15 }, () => Array(15).fill(0));
  const mySlot = room.players.find((p) => p.userId === currentUserId);
  const isMyTurn = room.status === 'PLAYING' && mySlot?.seatIndex === caroState?.currentTurnSeat;

  const turnRemainingSec = room.turnDeadlineEpochMs
    ? Math.max(0, Math.ceil((room.turnDeadlineEpochMs - nowMs) / 1000))
    : room.turnTimeSeconds;
  const turnPercent = Math.min(100, Math.max(0, (turnRemainingSec / (room.turnTimeSeconds || 30)) * 100));

  const reconnectRemainingSec = room.reconnectDeadlineEpochMs
    ? Math.max(0, Math.ceil((room.reconnectDeadlineEpochMs - nowMs) / 1000))
    : null;

  const winnerPlayer =
    room.winnerSeat !== null && room.winnerSeat !== undefined
      ? room.players.find((p) => p.seatIndex === room.winnerSeat)
      : null;

  return (
    <div className="max-w-6xl mx-auto w-full space-y-4">
      {/* Disconnect warning banner */}
      {room.disconnectedUserId && reconnectRemainingSec !== null && room.status === 'PLAYING' && (
        <div className="p-3 rounded-2xl bg-amber-500/15 border border-amber-500/40 text-amber-300 text-xs font-bold flex items-center justify-center gap-2 animate-pulse">
          <WifiOff className="w-4 h-4" />
          Đối thủ đang mất kết nối! Chờ kết nối lại trong {reconnectRemainingSec}s...
        </div>
      )}

      {/* Finished Banner */}
      {room.status === 'FINISHED' && (
        <div className="glass-card rounded-2xl p-4 sm:p-5 border border-amber-500/40 bg-gradient-to-r from-indigo-500/15 via-amber-500/10 to-rose-500/15 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-center sm:text-left">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-2xl shrink-0">
              {winnerPlayer ? (winnerPlayer.userId === currentUserId ? '🏆' : '⚔️') : '🤝'}
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-foreground flex items-center gap-2 justify-center sm:justify-start">
                {winnerPlayer
                  ? winnerPlayer.userId === currentUserId
                    ? 'CHIẾN THẮNG!'
                    : `${winnerPlayer.username} đã chiến thắng!`
                  : 'HÒA CỜ!'}
              </h3>
              <p className="text-xs text-text-muted">{room.systemMessage}</p>
              {mySlot?.eloDelta !== null && mySlot?.eloDelta !== undefined && (
                <span
                  className={`inline-block mt-1 text-xs font-mono font-black px-2 py-0.5 rounded-full ${
                    mySlot.eloDelta >= 0
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'bg-rose-500/20 text-rose-400'
                  }`}
                >
                  ELO: {mySlot.elo} ({mySlot.eloDelta >= 0 ? `+${mySlot.eloDelta}` : mySlot.eloDelta})
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              disabled={mySlot?.wantsRematch}
              onClick={() => sendAction(room.roomCode, 'REMATCH')}
              className="flex-1 sm:flex-initial btn-anime disabled:opacity-60 px-5 py-2.5 rounded-xl text-xs font-black text-white flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              {mySlot?.wantsRematch ? 'Đang chờ đối thủ...' : 'Tái đấu'}
            </button>
            <button
              onClick={handleLeaveRoom}
              className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl text-xs font-bold bg-surface-hover hover:bg-surface-hover/80 text-foreground border border-indigo-500/20 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <LogOut className="w-4 h-4" /> Về Sảnh
            </button>
          </div>
        </div>
      )}

      {/* Main Layout: Board + Right Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Left/Center: Player Bars + 15x15 Board */}
        <div className="lg:col-span-8 space-y-3">
          {/* 2 Players Strip */}
          <div className="grid grid-cols-2 gap-3">
            {[0, 1].map((seat) => {
              const p = room.players.find((pl) => pl.seatIndex === seat);
              const activeTurn = room.status === 'PLAYING' && caroState?.currentTurnSeat === seat;
              const isX = seat === 0;
              return (
                <div
                  key={seat}
                  className={`glass-card rounded-2xl p-3 border transition-all ${
                    activeTurn
                      ? isX
                        ? 'border-indigo-400 shadow-lg shadow-indigo-500/20 bg-indigo-500/10'
                        : 'border-rose-400 shadow-lg shadow-rose-500/20 bg-rose-500/10'
                      : 'border-indigo-500/15 opacity-80'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-lg shrink-0 ${
                          isX
                            ? 'bg-indigo-500/25 text-indigo-300 border border-indigo-400/40'
                            : 'bg-rose-500/25 text-rose-300 border border-rose-400/40'
                        }`}
                      >
                        {isX ? 'X' : 'O'}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1">
                          {p?.bot && <Bot className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                          <span className="font-bold text-xs sm:text-sm text-foreground truncate">
                            {p?.username || 'Đang chờ...'}
                          </span>
                        </div>
                        <span className="text-[11px] font-mono text-amber-400">
                          ELO {p?.elo ?? 1000}
                        </span>
                      </div>
                    </div>

                    {activeTurn && (
                      <span
                        className={`text-xs font-mono font-black flex items-center gap-1 px-2 py-1 rounded-lg ${
                          turnRemainingSec <= 8
                            ? 'bg-rose-500/25 text-rose-300 animate-pulse'
                            : 'bg-surface-hover text-foreground'
                        }`}
                      >
                        <Clock className="w-3.5 h-3.5" /> {turnRemainingSec}s
                      </span>
                    )}
                  </div>

                  {/* Turn Timer Progress Bar */}
                  <div className="mt-2 h-1.5 w-full rounded-full bg-surface-hover overflow-hidden">
                    <div
                      className={`h-full transition-all duration-200 ${
                        !activeTurn
                          ? 'w-0'
                          : turnRemainingSec <= 8
                          ? 'bg-rose-500'
                          : isX
                          ? 'bg-indigo-400'
                          : 'bg-rose-400'
                      }`}
                      style={{ width: activeTurn ? `${turnPercent}%` : '0%' }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* 15x15 Caro Board */}
          <div className="glass-card rounded-2xl p-2 sm:p-3 border border-indigo-500/25 overflow-x-auto">
            <div
              className="mx-auto w-full max-w-[560px] aspect-square grid bg-slate-900/80 border border-indigo-500/30 rounded-xl overflow-hidden select-none"
              style={{ gridTemplateColumns: 'repeat(15, minmax(0, 1fr))' }}
            >
              {board.map((rowArr, r) =>
                rowArr.map((cell, c) => {
                  const isLast =
                    caroState?.lastMove &&
                    caroState.lastMove[0] === r &&
                    caroState.lastMove[1] === c;
                  const isWin = winningSet.has(`${r}-${c}`);
                  const clickable = isMyTurn && cell === 0;

                  return (
                    <button
                      key={`${r}-${c}`}
                      type="button"
                      disabled={!clickable}
                      onClick={() => handleCellClick(r, c)}
                      className={`relative aspect-square border border-indigo-500/15 flex items-center justify-center text-xs sm:text-base md:text-lg font-black transition-colors ${
                        isWin
                          ? 'bg-amber-500/35 ring-1 ring-amber-400 animate-pulse'
                          : isLast
                          ? 'bg-indigo-500/25 ring-1 ring-inset ring-cyan-400/70'
                          : clickable
                          ? 'hover:bg-indigo-500/15 cursor-pointer'
                          : 'cursor-default'
                      }`}
                      aria-label={`Ô ${r + 1}, ${c + 1}`}
                    >
                      {cell === 1 && (
                        <span className="text-indigo-400 drop-shadow-[0_0_6px_rgba(129,140,248,0.75)] leading-none">
                          ✕
                        </span>
                      )}
                      {cell === 2 && (
                        <span className="text-rose-400 drop-shadow-[0_0_6px_rgba(251,113,133,0.75)] leading-none">
                          ◯
                        </span>
                      )}
                    </button>
                  );
                })
              )}
            </div>

            <div className="mt-2.5 flex items-center justify-between text-[11px] text-text-muted px-1">
              <span>
                Nước đi: <strong className="text-foreground font-mono">{caroState?.moveCount ?? 0}</strong> •{' '}
                {caroState?.blockTwoEnds ? 'Luật chặn 2 đầu' : 'Luật tự do'}
              </span>
              <span className="font-semibold text-indigo-300">
                {room.status === 'PLAYING'
                  ? isMyTurn
                    ? '✨ Đến lượt bạn đánh!'
                    : '⏳ Đang chờ đối thủ...'
                  : 'Trận đấu đã kết thúc'}
              </span>
            </div>
          </div>
        </div>

        {/* Right Panel: Room Info, Actions & Live Chat */}
        <div className="lg:col-span-4 space-y-3">
          {/* Room Controls */}
          <div className="glass-card rounded-2xl p-4 border border-indigo-500/20 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-foreground truncate">{room.roomName}</span>
              <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-indigo-500/15 text-indigo-300">
                {room.roomCode}
              </span>
            </div>

            <div className="flex gap-2">
              {room.status === 'PLAYING' && (
                <button
                  onClick={() => sendAction(room.roomCode, 'RESIGN')}
                  className="flex-1 py-2 rounded-xl text-xs font-bold bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Flag className="w-3.5 h-3.5" /> Đầu hàng
                </button>
              )}
              <button
                onClick={handleLeaveRoom}
                className="flex-1 py-2 rounded-xl text-xs font-bold bg-surface-hover hover:bg-surface-hover/80 text-text-muted hover:text-foreground border border-indigo-500/20 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" /> Thoát phòng
              </button>
            </div>
          </div>

          {/* Room Chat */}
          <div className="glass-card rounded-2xl p-4 border border-indigo-500/20 flex flex-col h-[360px]">
            <div className="flex items-center gap-2 pb-2.5 border-b border-indigo-500/15">
              <MessageCircle className="w-4 h-4 text-indigo-400" />
              <h4 className="text-xs font-bold text-foreground">Chat Trong Phòng</h4>
            </div>

            <div className="flex-1 overflow-y-auto py-3 space-y-2 pr-1">
              {chatMessages.length === 0 ? (
                <p className="text-[11px] text-text-muted text-center py-8">
                  Gửi lời chào hoặc biểu cảm cho đối thủ nhé!
                </p>
              ) : (
                chatMessages.map((msg) => {
                  const isMe = msg.senderId === currentUserId;
                  return (
                    <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                      <span className="text-[10px] text-text-muted mb-0.5">{msg.senderName}</span>
                      <div
                        className={`px-3 py-1.5 rounded-2xl text-xs max-w-[85%] break-words ${
                          msg.type === 'EMOJI'
                            ? 'text-lg bg-surface-hover/60'
                            : isMe
                            ? 'bg-indigo-600/80 text-white'
                            : 'bg-surface-hover text-foreground border border-indigo-500/15'
                        }`}
                      >
                        {msg.content}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Quick Emojis */}
            <div className="flex items-center justify-between gap-1 py-2 border-t border-indigo-500/10">
              {QUICK_EMOJIS.map((em) => (
                <button
                  key={em}
                  type="button"
                  onClick={() => sendRoomChat(room.roomCode, em, 'EMOJI')}
                  className="flex-1 py-1 rounded-lg text-xs hover:bg-indigo-500/20 transition-colors cursor-pointer"
                >
                  {em}
                </button>
              ))}
            </div>

            <form onSubmit={handleSendChat} className="flex gap-1.5 pt-1">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Nhắn tin..."
                maxLength={200}
                className="flex-1 text-xs px-3 py-2 rounded-xl bg-surface-hover/60 border border-indigo-500/20 focus:border-indigo-400 focus:outline-none text-foreground"
              />
              <button
                type="submit"
                className="p-2 rounded-xl bg-indigo-500/25 hover:bg-indigo-500/40 text-indigo-300 border border-indigo-500/30 cursor-pointer"
                aria-label="Gửi"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
