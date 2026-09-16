"use client";

export const dynamic = 'force-dynamic';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import GameCard from './components/GameCard';
import Leaderboard from './components/Leaderboard';
import GameStatsComponent from './components/GameStats';
import { GameItem, LeaderboardEntry, GameStats } from '@/types/game';
import api from '@/lib/axios';
import toast from 'react-hot-toast';
import { Gamepad2, Search, Trophy, Flame, Sparkles } from 'lucide-react';

const CATEGORIES = [
  { key: 'ALL', label: 'Tất cả' },
  { key: 'QUIZ', label: 'Câu Đố' },
  { key: 'PUZZLE', label: 'Xếp Hình' },
  { key: 'ACTION', label: 'Hành Động' },
];

function GamesContent() {
  const router = useRouter();
  const [games, setGames] = useState<GameItem[]>([]);
  const [globalLeaderboard, setGlobalLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [myStats, setMyStats] = useState<GameStats | null>(null);
  const [currentUserId, setCurrentUserId] = useState<number | undefined>(undefined);

  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isLeaderboardLoading, setIsLeaderboardLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchUserDataAndStats();
    fetchGames();
    fetchGlobalLeaderboard();
  }, []);

  useEffect(() => {
    fetchGames();
  }, [selectedCategory]);

  const fetchUserDataAndStats = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const userRes = await api.get('/users/me');
      if (userRes.data?.id) {
        setCurrentUserId(userRes.data.id);
      }

      const statsRes = await api.get('/games/stats/me');
      if (statsRes.data) {
        setMyStats(statsRes.data);
      }
    } catch (error) {
      // User not logged in or token expired - optional auth for browsing games
    }
  };

  const fetchGames = async () => {
    setIsLoading(true);
    try {
      const params: any = {};
      if (selectedCategory !== 'ALL') {
        params.category = selectedCategory;
      }
      if (searchQuery.trim()) {
        params.keyword = searchQuery.trim();
      }

      const res = await api.get('/games', { params });
      setGames(res.data || []);
    } catch (error: any) {
      toast.error('Không thể tải danh sách trò chơi');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchGlobalLeaderboard = async () => {
    setIsLeaderboardLoading(true);
    try {
      const res = await api.get('/games/leaderboard/global?page=0&size=5');
      setGlobalLeaderboard(res.data?.content || []);
    } catch (error) {
      // Silently fail or empty leaderboard
    } finally {
      setIsLeaderboardLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchGames();
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <div className="max-w-7xl mx-auto flex gap-4 px-2 md:px-4">
        <Sidebar />

        <main className="flex-1 py-4 md:py-6 max-w-5xl mx-auto space-y-6">
          {/* Header Banner */}
          <div className="glass-card p-6 md:p-8 rounded-3xl border border-indigo-500/25 relative overflow-hidden">
            <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-1/3 -mb-8 w-48 h-48 bg-pink-500/10 rounded-full blur-2xl pointer-events-none" />

            <div className="relative z-10 max-w-2xl">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 text-xs font-bold mb-3">
                <Sparkles className="w-3.5 h-3.5" /> VnNet Arcade & Games
              </div>
              <h1 className="text-2xl md:text-3xl font-black text-foreground tracking-tight">
                🎮 Đấu Trường Trò Chơi Anime
              </h1>
              <p className="text-sm text-text-muted mt-2 leading-relaxed">
                Khám phá các mini game phong cách Anime, tranh tài trên bảng xếp hạng toàn server và mở khóa hàng loạt danh hiệu thành tựu vinh quang!
              </p>
            </div>
          </div>

          {/* Search & Category Filter */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-3">
            {/* Category tabs */}
            <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.key}
                  onClick={() => setSelectedCategory(cat.key)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    selectedCategory === cat.key
                      ? 'btn-anime text-white shadow-md shadow-indigo-500/20'
                      : 'bg-surface-hover/60 hover:bg-surface-hover text-text-muted hover:text-foreground border border-indigo-500/10'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Search form */}
            <form onSubmit={handleSearchSubmit} className="relative w-full md:w-72">
              <input
                type="text"
                placeholder="Tìm tên game..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs py-2.5 pl-9 pr-3 rounded-xl bg-surface-hover/60 border border-indigo-500/20 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-foreground"
              />
              <Search className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
            </form>
          </div>

          {/* Main Grid & Right Sidebar */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Games Grid (2 cols on desktop) */}
            <div className="lg:col-span-2 space-y-4">
              {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="glass-card rounded-2xl h-72 animate-pulse bg-surface-hover/40" />
                  ))}
                </div>
              ) : games.length === 0 ? (
                <div className="glass-card p-12 text-center rounded-3xl border border-indigo-500/15">
                  <Gamepad2 className="w-12 h-12 mx-auto text-indigo-400/40 mb-3" />
                  <h3 className="font-bold text-base text-foreground">Không tìm thấy trò chơi nào</h3>
                  <p className="text-xs text-text-muted mt-1">
                    Thử tìm kiếm với từ khóa khác hoặc chuyển sang danh mục khác nhé!
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {games.map((game) => (
                    <GameCard key={game.id} game={game} />
                  ))}
                </div>
              )}
            </div>

            {/* Sidebar Right Column (Leaderboard & Stats) */}
            <div className="space-y-6">
              {/* User Stats if logged in */}
              {myStats && (
                <div className="glass-card p-4 rounded-3xl border border-indigo-500/20">
                  <h3 className="font-bold text-sm text-foreground mb-3 flex items-center gap-2">
                    <Flame className="w-4 h-4 text-amber-400" /> Thống Kê Của Bạn
                  </h3>
                  <GameStatsComponent stats={myStats} />
                </div>
              )}

              {/* Global Leaderboard */}
              <div className="glass-card rounded-3xl border border-indigo-500/20 overflow-hidden">
                <div className="p-4 border-b border-indigo-500/15 flex items-center justify-between">
                  <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-amber-400" /> BXH Toàn Server
                  </h3>
                  <span className="text-[11px] text-text-muted">Top 5</span>
                </div>
                <Leaderboard
                  entries={globalLeaderboard}
                  isLoading={isLeaderboardLoading}
                  currentUserId={currentUserId}
                  emptyMessage="Chưa có điểm nào được ghi nhận."
                />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default function GamesPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex justify-center items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
        </div>
      }
    >
      <GamesContent />
    </Suspense>
  );
}
