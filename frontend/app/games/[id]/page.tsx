"use client";

export const dynamic = 'force-dynamic';

import React, { useState, useEffect, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import Leaderboard from '../components/Leaderboard';
import AchievementBadge from '../components/AchievementBadge';
import { GameItem, LeaderboardEntry, GameAchievement, GameScoreResult } from '@/types/game';
import api from '@/lib/axios';
import toast from 'react-hot-toast';
import { ArrowLeft, Play, Trophy, Award, Clock, Users, Flame, Star } from 'lucide-react';

function GameDetailContent() {
  const params = useParams();
  const router = useRouter();
  const gameId = params?.id as string;

  const [game, setGame] = useState<GameItem | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [achievements, setAchievements] = useState<GameAchievement[]>([]);
  const [myScores, setMyScores] = useState<GameScoreResult[]>([]);
  const [activeTab, setActiveTab] = useState<'leaderboard' | 'achievements' | 'history'>('leaderboard');
  const [isLoading, setIsLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<number | undefined>(undefined);

  useEffect(() => {
    if (gameId) {
      fetchGameDetails();
      fetchUserData();
    }
  }, [gameId]);

  const fetchUserData = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const res = await api.get('/users/me');
      if (res.data?.id) {
        setCurrentUserId(res.data.id);
        fetchMyScores();
      }
    } catch (e) {
      // Optional auth
    }
  };

  const fetchGameDetails = async () => {
    setIsLoading(true);
    try {
      const [gameRes, lbRes, achRes] = await Promise.all([
        api.get(`/games/${gameId}`),
        api.get(`/games/${gameId}/leaderboard?page=0&size=20`),
        api.get(`/games/${gameId}/achievements`),
      ]);

      setGame(gameRes.data);
      setLeaderboard(lbRes.data?.content || []);
      setAchievements(achRes.data || []);
    } catch (error: any) {
      toast.error('Không tìm thấy thông tin trò chơi');
      router.push('/games');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMyScores = async () => {
    try {
      const res = await api.get(`/games/${gameId}/scores/me`);
      setMyScores(res.data || []);
    } catch (e) {
      // Ignore if not logged in
    }
  };

  if (isLoading || !game) {
    return (
      <div className="min-h-screen bg-background flex justify-center items-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
      </div>
    );
  }

  const unlockedCount = achievements.filter((a) => a.unlocked_by_current_user).length;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <div className="max-w-7xl mx-auto flex gap-4 px-2 md:px-4">
        <Sidebar />

        <main className="flex-1 py-4 md:py-6 max-w-5xl mx-auto space-y-6">
          {/* Back button */}
          <Link
            href="/games"
            className="inline-flex items-center gap-2 text-xs font-semibold text-text-muted hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Quay lại danh sách trò chơi
          </Link>

          {/* Hero Banner */}
          <div className="glass-card rounded-3xl border border-indigo-500/25 overflow-hidden shadow-2xl">
            <div className="relative h-56 md:h-72 w-full">
              <img
                src={game.image_url || game.thumbnail_url}
                alt={game.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />

              {/* Bottom details overlay */}
              <div className="absolute bottom-6 left-6 right-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold px-3 py-1 rounded-full bg-indigo-600/80 backdrop-blur-md text-white border border-indigo-400/30">
                      {game.category}
                    </span>
                    <span className="text-xs font-bold px-3 py-1 rounded-full bg-surface-hover/80 backdrop-blur-md text-amber-300 border border-amber-500/30">
                      Độ khó: {game.difficulty}
                    </span>
                    <span className="text-xs font-bold px-3 py-1 rounded-full bg-surface-hover/80 backdrop-blur-md text-indigo-300 border border-indigo-500/20">
                      Điểm tối đa: {game.max_score}
                    </span>
                  </div>

                  <h1 className="text-2xl md:text-4xl font-black text-white tracking-tight drop-shadow-md">
                    {game.title}
                  </h1>

                  <div className="flex items-center gap-4 text-xs text-white/80">
                    <span className="flex items-center gap-1">
                      <Users className="w-4 h-4 text-indigo-300" /> {game.play_count} lượt chơi
                    </span>
                    {game.current_user_high_score !== undefined && game.current_user_high_score !== null && (
                      <span className="flex items-center gap-1 text-amber-300 font-bold">
                        <Trophy className="w-4 h-4" /> Kỷ lục của bạn: {game.current_user_high_score}
                      </span>
                    )}
                  </div>
                </div>

                {/* Big Play Button */}
                <button
                  onClick={() => router.push(`/games/${game.id}/play`)}
                  className="btn-anime py-3.5 px-8 rounded-2xl font-black text-white text-sm md:text-base flex items-center justify-center gap-2 shadow-xl shadow-indigo-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer flex-shrink-0"
                >
                  <Play className="w-5 h-5 fill-current" />
                  CHƠI NGAY
                </button>
              </div>
            </div>

            {/* Description */}
            <div className="p-6 border-t border-indigo-500/10">
              <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-400 mb-1">
                Giới thiệu trò chơi
              </h3>
              <p className="text-sm text-text-muted leading-relaxed">
                {game.description}
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-indigo-500/20 gap-2">
            <button
              onClick={() => setActiveTab('leaderboard')}
              className={`pb-3 px-4 text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                activeTab === 'leaderboard'
                  ? 'border-indigo-500 text-indigo-400'
                  : 'border-transparent text-text-muted hover:text-foreground'
              }`}
            >
              <Trophy className="w-4 h-4" /> Bảng Xếp Hạng ({leaderboard.length})
            </button>

            <button
              onClick={() => setActiveTab('achievements')}
              className={`pb-3 px-4 text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                activeTab === 'achievements'
                  ? 'border-indigo-500 text-indigo-400'
                  : 'border-transparent text-text-muted hover:text-foreground'
              }`}
            >
              <Award className="w-4 h-4" /> Thành Tựu ({unlockedCount}/{achievements.length})
            </button>

            {currentUserId && (
              <button
                onClick={() => setActiveTab('history')}
                className={`pb-3 px-4 text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                  activeTab === 'history'
                    ? 'border-indigo-500 text-indigo-400'
                    : 'border-transparent text-text-muted hover:text-foreground'
                }`}
              >
                <Clock className="w-4 h-4" /> Lịch Sử Của Tôi ({myScores.length})
              </button>
            )}
          </div>

          {/* Tab Content */}
          <div className="glass-card rounded-3xl border border-indigo-500/20 overflow-hidden p-4 md:p-6">
            {activeTab === 'leaderboard' && (
              <Leaderboard
                entries={leaderboard}
                currentUserId={currentUserId}
                emptyMessage="Chưa có ai ghi điểm trên trò chơi này. Hãy là người đầu tiên!"
              />
            )}

            {activeTab === 'achievements' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {achievements.map((ach) => (
                  <AchievementBadge key={ach.id} achievement={ach} />
                ))}
              </div>
            )}

            {activeTab === 'history' && (
              <div className="space-y-3">
                {myScores.length === 0 ? (
                  <div className="text-center py-10 text-text-muted text-sm">
                    Bạn chưa chơi ván nào trong trò này. Hãy nhấn &quot;CHƠI NGAY&quot; để trải nghiệm nhé!
                  </div>
                ) : (
                  <div className="divide-y divide-indigo-500/10">
                    {myScores.map((score, index) => (
                      <div
                        key={score.id || index}
                        className="py-3 flex items-center justify-between text-sm"
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-6 text-center text-xs font-mono text-text-muted">
                            #{index + 1}
                          </span>
                          <div>
                            <p className="font-semibold text-foreground">
                              {new Date(score.created_at).toLocaleString('vi-VN')}
                            </p>
                            <p className="text-xs text-text-muted">
                              Thời gian chơi: {score.play_time_seconds} giây
                            </p>
                          </div>
                        </div>

                        <div className="text-right font-black text-indigo-400 font-mono text-base">
                          {score.score.toLocaleString()} <span className="text-xs text-text-muted font-normal">điểm</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default function GameDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex justify-center items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
        </div>
      }
    >
      <GameDetailContent />
    </Suspense>
  );
}
