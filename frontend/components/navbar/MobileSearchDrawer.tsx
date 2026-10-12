'use client';

import React, { useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import api from '@/lib/axios';
import Avatar from '@/components/ui/Avatar';

interface MobileSearchDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MobileSearchDrawer({ isOpen, onClose }: MobileSearchDrawerProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any>(null);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);

    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current);
    }

    if (value.trim().length < 2) {
      setSearchResults(null);
      setShowSearchDropdown(false);
      return;
    }

    setIsSearching(true);
    searchTimerRef.current = setTimeout(async () => {
      try {
        const res = await api.get(`/search?q=${encodeURIComponent(value.trim())}&type=all&size=5`);
        setSearchResults(res.data);
        setShowSearchDropdown(true);
      } catch (err) {
        console.error("Lỗi tìm kiếm mobile:", err);
      } finally {
        setIsSearching(false);
      }
    }, 300);
  }, []);

  const handleSearchSubmit = (e: React.KeyboardEvent) => {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    if (searchQuery.trim()) {
      setShowSearchDropdown(false);
      onClose();
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="sm:hidden px-3 py-2.5 bg-background/95 backdrop-blur-md border-b border-indigo-500/15 animate-slide-up">
      <div className="relative w-full">
        <span className="absolute inset-y-0 left-3 flex items-center text-muted/60 z-10">
          🔍
        </span>
        <input
          type="text"
          placeholder="Tìm kiếm người dùng, bài viết..."
          value={searchQuery}
          onChange={(e) => handleSearchChange(e.target.value)}
          onKeyDown={handleSearchSubmit}
          autoFocus
          className="input-anime rounded-full pl-9 pr-8 py-2 text-sm w-full"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute inset-y-0 right-3 flex items-center text-muted hover:text-foreground text-xs cursor-pointer"
          >
            ✕
          </button>
        )}
      </div>

      {/* Mobile search results preview */}
      {showSearchDropdown && searchResults && (
        <div className="mt-2 w-full bg-background border border-indigo-500/15 shadow-2xl rounded-xl py-2 max-h-[350px] overflow-y-auto">
          {/* Users */}
          {searchResults.users && searchResults.users.length > 0 && (
            <>
              <div className="px-3 py-1 text-[10px] font-bold text-muted uppercase">
                👤 Người dùng ({searchResults.total_users})
              </div>
              {searchResults.users.map((user: any) => (
                <Link
                  key={`m-user-${user.id}`}
                  href={`/profile/${user.id}`}
                  onClick={() => {
                    setShowSearchDropdown(false);
                    onClose();
                  }}
                  className="flex items-center gap-2.5 px-3 py-2 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                >
                  <Avatar
                    src={user.avatar_url}
                    name={user.username}
                    size="sm"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-xs text-foreground truncate">{user.username}</div>
                    <div className="text-[10px] text-muted truncate">{user.email}</div>
                  </div>
                </Link>
              ))}
            </>
          )}

          {/* Posts */}
          {searchResults.posts && searchResults.posts.length > 0 && (
            <>
              <div className="px-3 py-1 text-[10px] font-bold text-muted uppercase border-t border-indigo-500/10 mt-1">
                📝 Bài viết ({searchResults.total_posts})
              </div>
              {searchResults.posts.map((post: any) => (
                <div
                  key={`m-post-${post.id}`}
                  onClick={() => {
                    setShowSearchDropdown(false);
                    onClose();
                    router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
                  }}
                  className="flex items-center gap-2.5 px-3 py-2 hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
                >
                  <span className="text-base">📄</span>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-xs text-foreground truncate">{post.title || 'Bài viết'}</div>
                    <div className="text-[10px] text-muted truncate">{post.content?.substring(0, 50)}...</div>
                  </div>
                </div>
              ))}
            </>
          )}

          {((searchResults.total_users || 0) > 0 || (searchResults.total_posts || 0) > 0) && (
            <Link
              href={`/search?q=${encodeURIComponent(searchQuery.trim())}`}
              onClick={() => {
                setShowSearchDropdown(false);
                onClose();
              }}
              className="block text-center py-2 text-xs font-bold text-accent-primary hover:bg-black/5 dark:hover:bg-white/5 border-t border-indigo-500/10 mt-1"
            >
              Xem tất cả kết quả →
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
