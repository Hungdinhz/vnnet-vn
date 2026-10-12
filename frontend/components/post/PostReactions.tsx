'use client';

import React from 'react';

const REACTION_TYPES = [
  { type: 'like', emoji: '❤️', label: 'Thích' },
  { type: 'haha', emoji: '😂', label: 'Haha' },
  { type: 'wow', emoji: '😮', label: 'Wow' },
  { type: 'sad', emoji: '😢', label: 'Buồn' },
  { type: 'angry', emoji: '😡', label: 'Phẫn nộ' },
  { type: 'thumbsup', emoji: '👍', label: 'Tuyệt' },
];

const getReactionEmoji = (type: string) => REACTION_TYPES.find(r => r.type === type)?.emoji || '❤️';
const getReactionLabel = (type: string) => REACTION_TYPES.find(r => r.type === type)?.label || 'Thích';

interface PostReactionsProps {
  post: any;
  isOwner: boolean;
  likeCount: number;
  localCommentsCount: number;
  myReaction: string | null;
  isLoadingLike: boolean;
  likeAnimating: boolean;
  showReactionPicker: boolean;
  showComments: boolean;
  onReaction: (type: string) => void;
  onReactionHover: () => void;
  onReactionLeave: () => void;
  onToggleComments: () => void;
  onOpenShare: () => void;
}

export default function PostReactions({
  isOwner,
  likeCount,
  localCommentsCount,
  myReaction,
  isLoadingLike,
  likeAnimating,
  showReactionPicker,
  showComments,
  onReaction,
  onReactionHover,
  onReactionLeave,
  onToggleComments,
  onOpenShare,
}: PostReactionsProps) {
  return (
    <>
      {/* Stats counter */}
      <div className="flex items-center justify-between text-xs text-muted/50 pb-3 border-b border-indigo-500/10 mb-2 px-1">
        <div className="flex items-center gap-1">
          {likeCount > 0 && (
            <>
              <span className="flex items-center justify-center w-5 h-5 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-full text-white text-[10px] font-bold shadow-sm">
                ❤️
              </span>
              <span className="font-medium text-indigo-300/70">{likeCount} lượt thích</span>
            </>
          )}
        </div>
        <div
          className="cursor-pointer hover:underline hover:text-accent-purple transition-colors"
          onClick={onToggleComments}
        >
          {localCommentsCount} bình luận
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-around border-b border-indigo-500/10 pb-1.5 mb-2.5 gap-1">
        <div
          className="relative flex-1 min-w-0"
          onMouseEnter={onReactionHover}
          onMouseLeave={onReactionLeave}
        >
          <button
            onClick={() => onReaction(myReaction || 'like')}
            disabled={isLoadingLike}
            className={`w-full flex items-center justify-center gap-1 sm:gap-2 px-1 sm:px-2 py-1.5 sm:py-2 rounded-lg font-semibold text-xs sm:text-sm transition-all focus:outline-none ${
              myReaction
                ? 'text-pink-400 bg-pink-500/10 hover:bg-pink-500/20'
                : 'text-accent-purple/60 hover:bg-black/5 dark:hover:bg-white/5 hover:text-secondary'
            }`}
          >
            <span className={`text-base sm:text-lg shrink-0 ${likeAnimating ? 'animate-heart-pop' : ''}`}>
              {myReaction ? getReactionEmoji(myReaction) : '🤍'}
            </span>
            <span className="truncate">{myReaction ? getReactionLabel(myReaction) : 'Thích'}</span>
          </button>

          {/* Reaction Picker Popup */}
          {showReactionPicker && (
            <div
              className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 glass-card rounded-full px-2 py-1.5 flex gap-0.5 shadow-2xl border border-purple-500/20 animate-slide-up z-50"
              onMouseEnter={onReactionHover}
              onMouseLeave={onReactionLeave}
            >
              {REACTION_TYPES.map((reaction) => (
                <button
                  key={reaction.type}
                  onClick={(e) => {
                    e.stopPropagation();
                    onReaction(reaction.type);
                  }}
                  className={`w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-full hover:scale-[1.4] hover:bg-purple-500/10 transition-all duration-200 text-lg sm:text-xl group relative ${
                    myReaction === reaction.type ? 'scale-110 bg-purple-500/10' : ''
                  }`}
                  title={reaction.label}
                >
                  <span className="group-hover:animate-bounce">{reaction.emoji}</span>
                  <span className="absolute -top-7 text-[9px] font-bold bg-black/80 text-white px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                    {reaction.label}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={onToggleComments}
          className={`flex-1 min-w-0 flex items-center justify-center gap-1 sm:gap-2 px-1 sm:px-2 py-1.5 sm:py-2 rounded-lg font-semibold text-xs sm:text-sm transition-all focus:outline-none ${
            showComments
              ? 'text-accent-purple bg-indigo-500/10 hover:bg-indigo-500/20'
              : 'text-accent-purple/60 hover:bg-black/5 dark:hover:bg-white/5 hover:text-secondary'
          }`}
        >
          <span className="text-base sm:text-lg shrink-0">💬</span>
          <span className="truncate">Bình luận</span>
        </button>

        {!isOwner && (
          <button
            onClick={onOpenShare}
            className="flex-1 min-w-0 flex items-center justify-center gap-1 sm:gap-2 px-1 sm:px-2 py-1.5 sm:py-2 rounded-lg font-semibold text-xs sm:text-sm transition-all focus:outline-none text-accent-purple/60 hover:bg-black/5 dark:hover:bg-white/5 hover:text-secondary"
          >
            <span className="text-base sm:text-lg shrink-0">↪️</span>
            <span className="truncate">Chia sẻ</span>
          </button>
        )}
      </div>
    </>
  );
}
