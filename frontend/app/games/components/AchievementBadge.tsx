"use client";

import React from 'react';
import { GameAchievement } from '@/types/game';
import { Lock, CheckCircle2, Sparkles } from 'lucide-react';

interface AchievementBadgeProps {
  achievement: GameAchievement;
}

export default function AchievementBadge({ achievement }: AchievementBadgeProps) {
  const isUnlocked = achievement.unlocked_by_current_user;

  return (
    <div
      className={`p-4 rounded-2xl border transition-all duration-300 flex items-start gap-3.5 ${
        isUnlocked
          ? 'glass-card bg-indigo-500/10 border-indigo-500/40 shadow-lg shadow-indigo-500/10'
          : 'bg-surface-hover/20 border-indigo-500/10 opacity-60 grayscale hover:grayscale-0 hover:opacity-90'
      }`}
    >
      {/* Icon */}
      <div
        className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0 shadow-inner ${
          isUnlocked
            ? 'bg-gradient-to-br from-indigo-500/30 to-pink-500/30 border border-indigo-400/40'
            : 'bg-surface-hover/60 border border-indigo-500/10'
        }`}
      >
        {achievement.icon || '🏆'}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <h4 className="font-bold text-sm text-foreground truncate">
            {achievement.title}
          </h4>
          {isUnlocked ? (
            <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded-full border border-emerald-500/30 flex-shrink-0">
              <CheckCircle2 className="w-3 h-3" /> Đã đạt
            </span>
          ) : (
            <span className="flex items-center gap-1 text-[11px] font-semibold text-text-muted bg-surface-hover px-2 py-0.5 rounded-full border border-indigo-500/10 flex-shrink-0">
              <Lock className="w-3 h-3" /> Khóa
            </span>
          )}
        </div>

        <p className="text-xs text-text-muted mt-1 leading-relaxed">
          {achievement.description}
        </p>

        {/* Requirements */}
        <div className="mt-2.5 flex items-center gap-2 flex-wrap text-[11px]">
          {achievement.required_score > 0 && (
            <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20 font-medium">
              Yêu cầu: {achievement.required_score} điểm
            </span>
          )}
          {achievement.required_plays > 0 && (
            <span className="px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-medium">
              Yêu cầu: {achievement.required_plays} ván
            </span>
          )}
          {isUnlocked && achievement.unlocked_at && (
            <span className="text-[10px] text-text-muted/70 ml-auto">
              Đạt lúc {new Date(achievement.unlocked_at).toLocaleDateString('vi-VN')}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
