"use client";

import React from 'react';
import Link from 'next/link';
import { GameStats } from '@/types/game';
import { Trophy, Gamepad2, Award, Zap, Flame, Clock } from 'lucide-react';

interface GameStatsProps {
  stats: GameStats | null;
  isLoading?: boolean;
}

export default function GameStatsComponent({ stats, isLoading = false }: GameStatsProps) {
  if (isLoading) {
    return (
      <div className="animate-pulse space-y-3 p-4">
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 rounded-xl bg-surface-hover/60" />
          ))}
        </div>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="space-y-4">
      {/* 4 Stat Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="glass-card p-3.5 rounded-2xl border border-indigo-500/20 flex flex-col justify-between">
          <div className="flex items-center justify-between text-text-muted">
            <span className="text-xs">Đã chơi</span>
            <Gamepad2 className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="mt-2">
            <span className="text-xl font-black text-foreground">
              {stats.total_games_played}
            </span>
            <span className="text-[11px] text-text-muted ml-1">trò</span>
          </div>
        </div>

        <div className="glass-card p-3.5 rounded-2xl border border-indigo-500/20 flex flex-col justify-between">
          <div className="flex items-center justify-between text-text-muted">
            <span className="text-xs">Tổng ván</span>
            <Flame className="w-4 h-4 text-rose-400" />
          </div>
          <div className="mt-2">
            <span className="text-xl font-black text-foreground">
              {stats.total_plays}
            </span>
            <span className="text-[11px] text-text-muted ml-1">lượt</span>
          </div>
        </div>

        <div className="glass-card p-3.5 rounded-2xl border border-indigo-500/20 flex flex-col justify-between">
          <div className="flex items-center justify-between text-text-muted">
            <span className="text-xs">Tổng điểm</span>
            <Zap className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2">
            <span className="text-xl font-black text-amber-400">
              {stats.total_score.toLocaleString()}
            </span>
          </div>
        </div>

        <div className="glass-card p-3.5 rounded-2xl border border-indigo-500/20 flex flex-col justify-between">
          <div className="flex items-center justify-between text-text-muted">
            <span className="text-xs">Thành tựu</span>
            <Award className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2">
            <span className="text-xl font-black text-emerald-400">
              {stats.achievements_unlocked}
            </span>
            <span className="text-[11px] text-text-muted ml-1">huy hiệu</span>
          </div>
        </div>
      </div>

      {/* Favorite Game */}
      {stats.favorite_game && (
        <div className="glass-card p-4 rounded-2xl border border-indigo-500/20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-text-muted flex items-center gap-1.5">
              <Trophy className="w-3.5 h-3.5 text-amber-400" /> Trò chơi yêu thích
            </span>
            <span className="text-[11px] text-indigo-400 font-medium">Hay chơi nhất</span>
          </div>
          <Link
            href={`/games/${stats.favorite_game.id}`}
            className="flex items-center gap-3 group mt-1 p-2 -mx-2 rounded-xl hover:bg-surface-hover/50 transition-colors"
          >
            <img
              src={stats.favorite_game.thumbnail_url || stats.favorite_game.image_url}
              alt={stats.favorite_game.title}
              className="w-12 h-12 rounded-xl object-cover border border-indigo-500/30"
            />
            <div className="min-w-0 flex-1">
              <h4 className="text-sm font-bold text-foreground group-hover:text-indigo-400 truncate transition-colors">
                {stats.favorite_game.title}
              </h4>
              <p className="text-xs text-text-muted">
                {stats.favorite_game.play_count} lượt chơi trên hệ thống
              </p>
            </div>
          </Link>
        </div>
      )}

      {/* Recent Scores */}
      {stats.recent_scores && stats.recent_scores.length > 0 && (
        <div className="glass-card p-4 rounded-2xl border border-indigo-500/20">
          <h4 className="text-xs font-semibold text-text-muted mb-3 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-indigo-400" /> Lượt chơi gần đây
          </h4>
          <div className="space-y-2">
            {stats.recent_scores.map((score) => (
              <div
                key={score.id}
                className="flex items-center justify-between text-xs p-2 rounded-xl bg-surface-hover/30"
              >
                <div className="min-w-0 pr-2">
                  <p className="font-semibold text-foreground truncate">
                    {score.game_title || `Game #${score.game_id}`}
                  </p>
                  <p className="text-[10px] text-text-muted">
                    {new Date(score.created_at).toLocaleDateString('vi-VN')} • {score.play_time_seconds}s
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <span className="font-bold text-indigo-400 text-sm">
                    +{score.score}
                  </span>
                  <span className="text-[10px] text-text-muted ml-0.5">đ</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
