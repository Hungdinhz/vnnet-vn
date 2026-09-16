"use client";

export const dynamic = 'force-dynamic';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import AnimeQuiz from '../../components/games/AnimeQuiz';
import MemoryMatch from '../../components/games/MemoryMatch';
import SpeedType from '../../components/games/SpeedType';
import { GameItem, GameScoreResult } from '@/types/game';
import { normalizeGameItem } from '@/lib/gameUtils';
import api from '@/lib/axios';
import toast from 'react-hot-toast';
import { ArrowLeft, Trophy, Award, RotateCcw, Home, Sparkles } from 'lucide-react';

function GamePlayContent() {
  const params = useParams();
  const router = useRouter();
  const gameId = params?.id as string;

  const [game, setGame] = useState<GameItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [gameSessionKey, setGameSessionKey] = useState(0);

  // Result state
  const [showResultModal, setShowResultModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resultData, setResultData] = useState<GameScoreResult | null>(null);
  const isSubmittingRef = useRef(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Vui lòng đăng nhập để tham gia chơi game và ghi điểm!');
      router.push('/login');
      return;
    }

    if (gameId) {
      fetchGame();
    }
  }, [gameId]);

  const fetchGame = async () => {
    setIsLoading(true);
    try {
      const res = await api.get(`/games/${gameId}`);
      setGame(normalizeGameItem(res.data));
    } catch (e) {
      toast.error('Không tìm thấy trò chơi');
      router.push('/games');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGameEnd = async (finalScore: number, playTimeSeconds: number) => {
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;

    setIsSubmitting(true);
    setShowResultModal(true);

    try {
      const res = await api.post(`/games/${gameId}/scores`, {
        score: finalScore,
        play_time_seconds: playTimeSeconds,
      });

      setResultData(res.data);
      toast.success(`Đã ghi nhận ${finalScore} điểm thành công!`);

      if (res.data?.unlocked_achievements && res.data.unlocked_achievements.length > 0) {
        toast.success(`🎉 Mở khóa ${res.data.unlocked_achievements.length} danh hiệu mới!`, {
          duration: 4000,
        });
      }
    } catch (error: any) {
      const errMsg = error.response?.data?.detail || 'Không thể lưu điểm số';
      toast.error(errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const restartGame = () => {
    isSubmittingRef.current = false;
    setShowResultModal(false);
    setResultData(null);
    setGameSessionKey((prev) => prev + 1);
  };

  if (isLoading || !game) {
    return (
      <div className="min-h-screen bg-background flex justify-center items-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
      </div>
    );
  }

  const renderGameComponent = () => {
    const cat = game.category?.toUpperCase();
    if (cat === 'PUZZLE' || game.title.toLowerCase().includes('memory')) {
      return <MemoryMatch key={gameSessionKey} game={game} onGameEnd={handleGameEnd} />;
    }
    if (cat === 'ACTION' || game.title.toLowerCase().includes('type')) {
      return <SpeedType key={gameSessionKey} game={game} onGameEnd={handleGameEnd} />;
    }
    return <AnimeQuiz key={gameSessionKey} game={game} onGameEnd={handleGameEnd} />;
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-6 flex flex-col space-y-4">
        {/* Navigation & Header */}
        <div className="flex items-center justify-between border-b border-indigo-500/15 pb-4">
          <Link
            href={`/games/${game.id}`}
            className="inline-flex items-center gap-2 text-xs font-semibold text-text-muted hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Thoát trò chơi
          </Link>

          <div className="text-center">
            <h1 className="text-lg font-bold text-foreground">
              {game.title}
            </h1>
            <span className="text-xs text-text-muted">
              Độ khó: {game.difficulty} • Tối đa: {game.max_score} điểm
            </span>
          </div>

          <button
            onClick={restartGame}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl bg-surface-hover hover:bg-surface-hover/80 text-text-muted hover:text-foreground border border-indigo-500/20 transition-all cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Chơi lại
          </button>
        </div>

        {/* Game Arena */}
        <div className="flex-1 flex flex-col justify-center py-4">
          {renderGameComponent()}
        </div>
      </main>

      {/* Result Modal */}
      {showResultModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="glass-card max-w-md w-full p-6 md:p-8 rounded-3xl border border-indigo-500/40 shadow-2xl text-center space-y-6 relative overflow-hidden">
            {/* Sparkle background element */}
            <div className="absolute top-0 right-1/2 translate-x-1/2 -mt-10 w-40 h-40 bg-indigo-500/20 rounded-full blur-2xl pointer-events-none" />

            <div className="relative">
              <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-tr from-indigo-500 to-pink-500 flex items-center justify-center text-4xl shadow-lg shadow-indigo-500/30 mb-4 animate-bounce">
                🏆
              </div>

              <h2 className="text-2xl font-black text-foreground tracking-tight">
                Hoàn Thành Vòng Chơi!
              </h2>
              <p className="text-xs text-text-muted mt-1">
                Kết quả lượt chơi {game.title}
              </p>
            </div>

            {/* Score info */}
            {isSubmitting ? (
              <div className="py-6 flex flex-col items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
                <span className="text-xs text-text-muted">Đang lưu kết quả và tính toán xếp hạng...</span>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-surface-hover/60 p-4 rounded-2xl border border-indigo-500/20 flex items-center justify-around">
                  <div>
                    <span className="text-xs text-text-muted block">Điểm đạt được</span>
                    <span className="text-3xl font-black text-indigo-400 font-mono">
                      {resultData?.score ?? 0}
                    </span>
                  </div>

                  <div className="h-10 w-px bg-indigo-500/20" />

                  <div>
                    <span className="text-xs text-text-muted block">Xếp hạng</span>
                    <span className="text-2xl font-black text-amber-400 font-mono">
                      #{resultData?.rank ?? '-'}
                    </span>
                  </div>

                  <div className="h-10 w-px bg-indigo-500/20" />

                  <div>
                    <span className="text-xs text-text-muted block">Thời gian</span>
                    <span className="text-lg font-black text-foreground font-mono">
                      {resultData?.play_time_seconds ?? 0}s
                    </span>
                  </div>
                </div>

                {/* Newly Unlocked Achievements */}
                {resultData?.unlocked_achievements && resultData.unlocked_achievements.length > 0 && (
                  <div className="space-y-2 text-left">
                    <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" /> Danh hiệu mới mở khóa:
                    </span>
                    <div className="space-y-1.5 max-h-32 overflow-y-auto">
                      {resultData.unlocked_achievements.map((ach) => (
                        <div
                          key={ach.id}
                          className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center gap-2.5"
                        >
                          <span className="text-xl">{ach.icon || '🎖️'}</span>
                          <div className="min-w-0 flex-1">
                            <h4 className="text-xs font-bold text-foreground truncate">
                              {ach.title}
                            </h4>
                            <p className="text-[10px] text-text-muted truncate">
                              {ach.description}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Action buttons */}
            <div className="pt-2 space-y-2">
              <button
                disabled={isSubmitting}
                onClick={restartGame}
                className="w-full btn-anime py-3 rounded-xl font-bold text-white shadow-lg shadow-indigo-500/30 flex items-center justify-center gap-2 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" /> Chơi Lại Ván Này
              </button>

              <div className="flex gap-2">
                <button
                  onClick={() => router.push(`/games/${game.id}`)}
                  className="flex-1 py-2.5 px-3 rounded-xl text-xs font-semibold bg-surface-hover hover:bg-surface-hover/80 text-foreground border border-indigo-500/20 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Trophy className="w-3.5 h-3.5 text-amber-400" /> Bảng Xếp Hạng
                </button>

                <button
                  onClick={() => router.push('/games')}
                  className="flex-1 py-2.5 px-3 rounded-xl text-xs font-semibold bg-surface-hover hover:bg-surface-hover/80 text-text-muted hover:text-foreground border border-indigo-500/20 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Home className="w-3.5 h-3.5" /> Danh Sách Game
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function GamePlayPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex justify-center items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
        </div>
      }
    >
      <GamePlayContent />
    </Suspense>
  );
}
