"use client";

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { GameItem } from '@/types/game';
import { normalizeGameItem } from '@/lib/gameUtils';
import { Play, Trophy, Users, Star, Flame, Sparkles } from 'lucide-react';

interface GameCardProps {
  game: GameItem;
}

export default function GameCard({ game: rawGame }: GameCardProps) {
  const router = useRouter();
  const game = normalizeGameItem(rawGame);

  const getDifficultyColor = (diff: string) => {
    switch (diff?.toUpperCase()) {
      case 'EASY':
        return 'text-emerald-300 bg-slate-950/80 border-emerald-400/40';
      case 'HARD':
        return 'text-rose-300 bg-slate-950/80 border-rose-400/40';
      case 'MEDIUM':
      default:
        return 'text-amber-300 bg-slate-950/80 border-amber-400/40';
    }
  };

  const getDifficultyLabel = (diff: string) => {
    switch (diff?.toUpperCase()) {
      case 'EASY':
        return 'Dễ';
      case 'HARD':
        return 'Khó';
      case 'MEDIUM':
      default:
        return 'Trung bình';
    }
  };

  const getCategoryLabel = (cat: string) => {
    switch (cat?.toUpperCase()) {
      case 'QUIZ':
        return 'Câu Đố';
      case 'PUZZLE':
        return 'Xếp Hình';
      case 'ACTION':
        return 'Hành Động';
      case 'SPORTS':
        return 'Thể Thao';
      case 'ADVENTURE':
        return 'Phiêu Lưu';
      case 'STRATEGY':
        return 'Chiến Thuật';
      default:
        return cat || 'Mini Game';
    }
  };

  const isHot = game.play_count >= 10;
  const isMultiplayer = game.game_mode === 'MULTIPLAYER' || game.game_mode === 'HYBRID';

  return (
    <div className="glass-card glass-card-hover rounded-2xl overflow-hidden flex flex-col transition-all duration-300 group border border-indigo-500/20 hover:border-indigo-500/40">
      {/* Thumbnail */}
      <div className="relative h-44 w-full overflow-hidden bg-surface-hover">
        <img
          src={game.thumbnail_url || game.image_url || '/images/caro-banner.jpg'}
          alt={game.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/25 to-slate-950/35" />

        {/* Responsive Badges Row — prevents overlap on all screen sizes */}
        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-start justify-between gap-2">
          <div className="flex items-center gap-1.5 flex-wrap min-w-0">
            {isMultiplayer && (
              <span className="flex items-center gap-1 text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/95 text-white shadow-md whitespace-nowrap">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                ONLINE
              </span>
            )}
            {isHot && (
              <span className="flex items-center gap-1 text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-500/95 text-white shadow-md whitespace-nowrap">
                <Flame className="w-3 h-3" /> HOT
              </span>
            )}
            <span className="text-[10px] sm:text-[11px] font-semibold px-2 py-0.5 rounded-full bg-indigo-600/90 backdrop-blur-md text-white border border-indigo-400/30 whitespace-nowrap">
              {getCategoryLabel(game.category)}
            </span>
          </div>

          {!isMultiplayer && (
            <span className={`shrink-0 text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded-full border backdrop-blur-md whitespace-nowrap ${getDifficultyColor(game.difficulty)}`}>
              {getDifficultyLabel(game.difficulty)}
            </span>
          )}
        </div>

        {/* Bottom thumbnail info */}
        <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between text-xs text-white/95 drop-shadow">
          <span className="flex items-center gap-1">
            <Users className="w-3.5 h-3.5 text-indigo-300" />
            <span>{game.play_count} lượt chơi</span>
          </span>
          {game.current_user_high_score !== undefined && game.current_user_high_score !== null && (
            <span className="flex items-center gap-1 font-semibold text-amber-300">
              <Trophy className="w-3.5 h-3.5" />
              <span>{isMultiplayer ? `ELO: ${game.current_user_high_score}` : `Kỷ lục: ${game.current_user_high_score}`}</span>
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <Link href={`/games/${game.id}`}>
            <h3 className="font-bold text-base text-foreground group-hover:text-indigo-400 transition-colors line-clamp-1">
              {game.title}
            </h3>
          </Link>
          <p className="text-xs text-text-muted mt-1.5 line-clamp-2 leading-relaxed">
            {game.description}
          </p>
        </div>

        {/* Actions */}
        <div className="mt-4 pt-3 border-t border-indigo-500/10 flex items-center gap-2">
          <Link
            href={`/games/${game.id}`}
            className="flex-1 text-center py-2 px-3 rounded-xl text-xs font-semibold bg-surface-hover hover:bg-surface-hover/80 text-foreground border border-indigo-500/15 transition-all"
          >
            Chi tiết & BXH
          </Link>
          <button
            onClick={() => router.push(`/games/${game.id}/play`)}
            className="btn-anime py-2 px-4 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-1.5 shadow-md shadow-indigo-500/20 hover:shadow-indigo-500/40 transition-all cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            Chơi Ngay
          </button>
        </div>
      </div>
    </div>
  );
}
