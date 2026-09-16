"use client";

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { GameItem } from '@/types/game';
import { Play, Trophy, Users, Star, Flame, Sparkles } from 'lucide-react';

interface GameCardProps {
  game: GameItem;
}

export default function GameCard({ game }: GameCardProps) {
  const router = useRouter();

  const getDifficultyColor = (diff: string) => {
    switch (diff?.toUpperCase()) {
      case 'EASY':
        return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
      case 'HARD':
        return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
      case 'MEDIUM':
      default:
        return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
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

  const isHot = game.play_count >= 40;

  return (
    <div className="glass-card glass-card-hover rounded-2xl overflow-hidden flex flex-col transition-all duration-300 group border border-indigo-500/20 hover:border-indigo-500/40">
      {/* Thumbnail */}
      <div className="relative h-44 w-full overflow-hidden bg-surface-hover">
        <img
          src={game.thumbnail_url || game.image_url || 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600&auto=format&fit=crop&q=60'}
          alt={game.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />

        {/* Badges */}
        <div className="absolute top-3 left-3 flex gap-1.5 flex-wrap">
          {isHot && (
            <span className="flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-500/90 text-white shadow-lg shadow-rose-500/30">
              <Flame className="w-3 h-3" /> HOT
            </span>
          )}
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-indigo-600/80 backdrop-blur-md text-indigo-100 border border-indigo-400/30">
            {getCategoryLabel(game.category)}
          </span>
        </div>

        <div className="absolute top-3 right-3">
          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border backdrop-blur-md ${getDifficultyColor(game.difficulty)}`}>
            {game.difficulty}
          </span>
        </div>

        {/* Bottom thumbnail info */}
        <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between text-xs text-white/90 drop-shadow">
          <span className="flex items-center gap-1">
            <Users className="w-3.5 h-3.5 text-indigo-300" />
            <span>{game.play_count} lượt chơi</span>
          </span>
          {game.current_user_high_score !== undefined && game.current_user_high_score !== null && (
            <span className="flex items-center gap-1 font-semibold text-amber-300">
              <Trophy className="w-3.5 h-3.5" />
              <span>Kỷ lục: {game.current_user_high_score}</span>
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
