// components/StoryViewer.tsx
"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import api from '@/lib/axios';

interface StoryViewerProps {
  storyGroups: any[];
  initialGroupIndex: number;
  currentUserId?: number;
  onClose: () => void;
}

export default function StoryViewer({ storyGroups, initialGroupIndex, currentUserId, onClose }: StoryViewerProps) {
  const [groupIndex, setGroupIndex] = useState(initialGroupIndex);
  const [storyIndex, setStoryIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [viewers, setViewers] = useState<any[]>([]);
  const [showViewers, setShowViewers] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentGroup = storyGroups[groupIndex];
  const currentStory = currentGroup?.stories?.[storyIndex];
  const isOwner = currentUserId && currentGroup?.user_id === currentUserId;

  const STORY_DURATION = 5000; // 5 seconds per story
  const TICK_INTERVAL = 50;

  // Mark story as viewed
  const markViewed = useCallback(async (storyId: number) => {
    try {
      await api.post(`/stories/${storyId}/view`);
    } catch {}
  }, []);

  // Auto-advance timer
  useEffect(() => {
    if (!currentStory || isPaused) return;
    setProgress(0);
    markViewed(currentStory.id);

    timerRef.current = setInterval(() => {
      setProgress(prev => {
        const next = prev + (TICK_INTERVAL / STORY_DURATION) * 100;
        if (next >= 100) {
          goNext();
          return 0;
        }
        return next;
      });
    }, TICK_INTERVAL);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [groupIndex, storyIndex, isPaused, currentStory?.id]);

  const goNext = useCallback(() => {
    if (!currentGroup) return;
    if (storyIndex < currentGroup.stories.length - 1) {
      setStoryIndex(prev => prev + 1);
      setProgress(0);
    } else if (groupIndex < storyGroups.length - 1) {
      setGroupIndex(prev => prev + 1);
      setStoryIndex(0);
      setProgress(0);
    } else {
      onClose();
    }
  }, [groupIndex, storyIndex, currentGroup, storyGroups.length, onClose]);

  const goPrev = useCallback(() => {
    if (storyIndex > 0) {
      setStoryIndex(prev => prev - 1);
      setProgress(0);
    } else if (groupIndex > 0) {
      const prevGroup = storyGroups[groupIndex - 1];
      setGroupIndex(prev => prev - 1);
      setStoryIndex(prevGroup.stories.length - 1);
      setProgress(0);
    }
  }, [groupIndex, storyIndex, storyGroups]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); goNext(); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); goPrev(); }
      else if (e.key === 'Escape') { onClose(); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goNext, goPrev, onClose]);

  // Handle click areas (left 1/3 = prev, right 2/3 = next)
  const handleContentClick = (e: React.MouseEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = e.clientX - rect.left;
    if (x < rect.width / 3) {
      goPrev();
    } else {
      goNext();
    }
  };

  // Fetch viewers for owner
  const fetchViewers = async () => {
    if (!currentStory || !isOwner) return;
    try {
      const res = await api.get(`/stories/${currentStory.id}/viewers`);
      setViewers(res.data || []);
      setShowViewers(true);
    } catch (err) {
      console.error('Lỗi tải viewers:', err);
    }
  };

  const handleDelete = async () => {
    if (!currentStory || !isOwner) return;
    if (!confirm('Bạn có chắc muốn xóa story này?')) return;
    try {
      await api.delete(`/stories/${currentStory.id}`);
      // If last story in group, close or go to next group
      if (currentGroup.stories.length <= 1) {
        onClose();
      } else {
        currentGroup.stories.splice(storyIndex, 1);
        if (storyIndex >= currentGroup.stories.length) {
          setStoryIndex(currentGroup.stories.length - 1);
        }
        setProgress(0);
      }
    } catch (err) {
      console.error('Lỗi xóa story:', err);
    }
  };

  const formatTimeAgo = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const diff = Date.now() - new Date(dateStr).getTime();
      const mins = Math.floor(diff / 60000);
      if (mins < 1) return 'Vừa xong';
      if (mins < 60) return `${mins}p`;
      const hours = Math.floor(mins / 60);
      return `${hours}h`;
    } catch { return ''; }
  };

  const getInitials = (name: string) => name ? name.charAt(0).toUpperCase() : 'U';

  if (!currentGroup || !currentStory) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center">
      {/* Close button */}
      <button 
        onClick={onClose}
        className="absolute top-4 right-4 z-50 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white text-xl transition-colors"
      >
        ✕
      </button>

      {/* Navigation arrows */}
      {(groupIndex > 0 || storyIndex > 0) && (
        <button 
          onClick={goPrev}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-50 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white text-lg transition-colors"
        >
          ◀
        </button>
      )}
      {(groupIndex < storyGroups.length - 1 || storyIndex < currentGroup.stories.length - 1) && (
        <button 
          onClick={goNext}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-50 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white text-lg transition-colors"
        >
          ▶
        </button>
      )}

      {/* Story container */}
      <div 
        ref={containerRef}
        className="relative w-full max-w-[420px] h-[85vh] max-h-[750px] rounded-2xl overflow-hidden shadow-2xl"
        onClick={handleContentClick}
        onMouseDown={() => setIsPaused(true)}
        onMouseUp={() => setIsPaused(false)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => setIsPaused(false)}
      >
        {/* Progress bars */}
        <div className="absolute top-0 left-0 right-0 z-40 flex gap-1 p-2">
          {currentGroup.stories.map((_: any, i: number) => (
            <div key={i} className="flex-1 h-[3px] bg-white/20 rounded-full overflow-hidden">
              <div 
                className="h-full bg-white rounded-full transition-all duration-75 ease-linear"
                style={{ 
                  width: i < storyIndex ? '100%' : i === storyIndex ? `${progress}%` : '0%'
                }}
              />
            </div>
          ))}
        </div>

        {/* Header: user info */}
        <div className="absolute top-5 left-0 right-0 z-40 flex items-center justify-between px-4 pt-2">
          <div className="flex items-center gap-2.5">
            {currentGroup.avatar_url ? (
              <img src={currentGroup.avatar_url} alt={currentGroup.username} className="w-9 h-9 rounded-full object-cover border-2 border-white/30" />
            ) : (
              <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-full flex items-center justify-center text-sm font-bold text-white border-2 border-white/30">
                {getInitials(currentGroup.username)}
              </div>
            )}
            <div>
              <div className="text-white font-semibold text-sm drop-shadow-lg">{currentGroup.username}</div>
              <div className="text-white/60 text-[10px] drop-shadow">{formatTimeAgo(currentStory.created_at)}</div>
            </div>
          </div>

          {isOwner && (
            <div className="flex items-center gap-2">
              <button 
                onClick={(e) => { e.stopPropagation(); fetchViewers(); }}
                className="flex items-center gap-1 px-2.5 py-1 bg-white/10 hover:bg-white/20 rounded-full text-white text-[11px] font-semibold transition-colors backdrop-blur-sm"
              >
                👁️ {currentStory.views_count || 0}
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); handleDelete(); }}
                className="w-8 h-8 bg-white/10 hover:bg-red-500/30 rounded-full flex items-center justify-center text-white text-sm transition-colors backdrop-blur-sm"
              >
                🗑️
              </button>
            </div>
          )}
        </div>

        {/* Story content */}
        {currentStory.image_url ? (
          <img 
            src={currentStory.image_url} 
            alt="Story"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className={`w-full h-full bg-gradient-to-br ${currentStory.background_color || 'from-indigo-600 to-indigo-500'} flex items-center justify-center p-8`}>
            <p className={`text-white text-center leading-relaxed drop-shadow-lg ${
              currentStory.text_style === 'bold' ? 'text-3xl font-extrabold' :
              currentStory.text_style === 'italic' ? 'text-2xl italic font-light' :
              'text-xl font-medium'
            }`}>
              {currentStory.content}
            </p>
          </div>
        )}

        {/* Text overlay on image stories */}
        {currentStory.image_url && currentStory.content && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-6 pt-16">
            <p className="text-white text-lg font-medium drop-shadow-lg">{currentStory.content}</p>
          </div>
        )}
      </div>

      {/* Viewers sidebar (for owner) */}
      {showViewers && (
        <div className="fixed inset-0 z-[110] flex items-end justify-center" onClick={() => setShowViewers(false)}>
          <div 
            className="w-full max-w-[420px] bg-background rounded-t-2xl p-4 pb-8 animate-slide-up max-h-[50vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-foreground text-sm">👁️ Đã xem ({viewers.length})</h3>
              <button onClick={() => setShowViewers(false)} className="text-muted/50 hover:text-foreground transition-colors">✕</button>
            </div>
            {viewers.length === 0 ? (
              <p className="text-center text-muted/40 text-sm py-4">Chưa có ai xem story này</p>
            ) : (
              <div className="space-y-2.5">
                {viewers.map((v: any) => (
                  <div key={v.id} className="flex items-center gap-3">
                    {v.avatar_url ? (
                      <img src={v.avatar_url} alt={v.username} className="w-9 h-9 rounded-full object-cover" />
                    ) : (
                      <div className="w-9 h-9 bg-gradient-to-br from-indigo-500/50 to-indigo-600/50 rounded-full flex items-center justify-center text-sm font-bold text-white">
                        {getInitials(v.username)}
                      </div>
                    )}
                    <span className="text-sm font-semibold text-foreground">{v.username}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
