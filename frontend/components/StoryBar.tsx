// components/StoryBar.tsx
"use client";

import { useState, useEffect, useRef } from 'react';
import api from '@/lib/axios';
import StoryViewer from './StoryViewer';
import StoryCreator from './StoryCreator';

interface StoryGroup {
  user_id: number;
  username: string;
  avatar_url: string | null;
  has_unviewed: boolean;
  stories: any[];
}

export default function StoryBar() {
  const [storyGroups, setStoryGroups] = useState<StoryGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerGroupIndex, setViewerGroupIndex] = useState(0);
  const [creatorOpen, setCreatorOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const fetchStories = async () => {
    try {
      const res = await api.get('/stories');
      setStoryGroups(res.data || []);
    } catch (err) {
      console.error('Lỗi tải stories:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const fetchMe = async () => {
      try {
        const res = await api.get('/users/me');
        setCurrentUser(res.data);
      } catch {}
    };
    fetchMe();
    fetchStories();
  }, []);

  const openViewer = (groupIndex: number) => {
    setViewerGroupIndex(groupIndex);
    setViewerOpen(true);
  };

  const getInitials = (name: string) => name ? name.charAt(0).toUpperCase() : 'U';

  const handleStoryCreated = () => {
    setCreatorOpen(false);
    fetchStories();
  };

  if (isLoading) {
    return (
      <div className="glass-card rounded-xl p-4 mb-4">
        <div className="flex items-center gap-3 overflow-hidden">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-1.5 flex-shrink-0 animate-pulse">
              <div className="w-16 h-16 rounded-full bg-purple-500/10"></div>
              <div className="w-12 h-2 rounded bg-purple-500/10"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="glass-card rounded-xl p-4 mb-4">
        <div 
          ref={scrollRef}
          className="flex items-start gap-3 overflow-x-auto scrollbar-hide pb-1"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {/* Create Story button */}
          <button 
            onClick={() => setCreatorOpen(true)}
            className="flex flex-col items-center gap-1.5 flex-shrink-0 group cursor-pointer"
          >
            <div className="relative w-16 h-16 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 border-2 border-dashed border-purple-500/40 flex items-center justify-center group-hover:border-purple-400 group-hover:from-purple-500/30 group-hover:to-pink-500/30 transition-all duration-300">
              <span className="text-2xl group-hover:scale-110 transition-transform">➕</span>
            </div>
            <span className="text-[10px] font-semibold text-muted/60 max-w-[64px] truncate">Tạo story</span>
          </button>

          {/* Story groups */}
          {storyGroups.map((group, idx) => (
            <button 
              key={group.user_id} 
              onClick={() => openViewer(idx)}
              className="flex flex-col items-center gap-1.5 flex-shrink-0 group cursor-pointer"
            >
              <div className={`relative w-16 h-16 rounded-full p-[3px] transition-all duration-300 group-hover:scale-105 ${
                group.has_unviewed
                  ? 'bg-gradient-to-br from-purple-500 via-pink-500 to-cyan-400 shadow-lg shadow-purple-500/20'
                  : 'bg-gradient-to-br from-gray-400/30 to-gray-500/30'
              }`}>
                <div className="w-full h-full rounded-full bg-background p-[2px]">
                  {group.avatar_url ? (
                    <img src={group.avatar_url} alt={group.username} className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-purple-500/50 to-pink-500/50 rounded-full flex items-center justify-center text-lg font-bold text-white">
                      {getInitials(group.username)}
                    </div>
                  )}
                </div>
                {/* Story count badge */}
                {group.stories.length > 1 && (
                  <div className="absolute -bottom-0.5 -right-0.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-[9px] font-bold rounded-full w-5 h-5 flex items-center justify-center border-2 border-background shadow-sm">
                    {group.stories.length}
                  </div>
                )}
              </div>
              <span className={`text-[10px] font-semibold max-w-[64px] truncate ${
                group.has_unviewed ? 'text-foreground' : 'text-muted/40'
              }`}>
                {currentUser && group.user_id === currentUser.id ? 'Story của bạn' : group.username}
              </span>
            </button>
          ))}

          {/* Empty state */}
          {storyGroups.length === 0 && (
            <div className="flex items-center gap-2 text-muted/40 text-sm pl-2">
              <span>📖</span>
              <span>Chưa có story nào. Hãy là người đầu tiên!</span>
            </div>
          )}
        </div>
      </div>

      {/* Story Viewer Modal */}
      {viewerOpen && storyGroups.length > 0 && (
        <StoryViewer
          storyGroups={storyGroups}
          initialGroupIndex={viewerGroupIndex}
          currentUserId={currentUser?.id}
          onClose={() => { setViewerOpen(false); fetchStories(); }}
        />
      )}

      {/* Story Creator Modal */}
      {creatorOpen && (
        <StoryCreator
          onClose={() => setCreatorOpen(false)}
          onCreated={handleStoryCreated}
        />
      )}
    </>
  );
}
