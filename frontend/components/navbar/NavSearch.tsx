'use client';

import React, { useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import api from '@/lib/axios';
import Avatar from '@/components/ui/Avatar';

export default function NavSearch() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any>(null);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
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
        console.error("Lỗi tìm kiếm:", err);
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
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <div className="relative max-w-xs w-full hidden sm:block" ref={searchRef}>
      <span className="absolute inset-y-0 left-3 flex items-center text-muted/60 z-10">
        🔍
      </span>
      <input
        type="text"
        placeholder="Tìm kiếm trên VnNet..."
        value={searchQuery}
        onChange={(e) => handleSearchChange(e.target.value)}
        onKeyDown={handleSearchSubmit}
        onFocus={() => {
          if (searchResults && searchQuery.trim().length >= 2) setShowSearchDropdown(true);
        }}
        className="input-anime rounded-full pl-9 pr-4 py-2 text-sm w-60 transition-all focus:w-64"
      />

      {/* Search Dropdown */}
      {showSearchDropdown && searchResults && (
        <div className="absolute left-0 top-full mt-2 w-96 bg-background border border-indigo-500/15 shadow-2xl rounded-xl py-2 z-50 animate-slide-up max-h-[480px] overflow-hidden flex flex-col">
          {/* Users section */}
          {searchResults.users && searchResults.users.length > 0 && (
            <>
              <div className="px-4 py-1.5 text-[11px] font-bold text-muted uppercase tracking-wider">
                👤 Người dùng ({searchResults.total_users})
              </div>
              {searchResults.users.map((user: any) => (
                <Link
                  key={`user-${user.id}`}
                  href={`/profile/${user.id}`}
                  onClick={() => setShowSearchDropdown(false)}
                  className="flex items-center gap-3 px-4 py-2.5 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                >
                  <Avatar src={user.avatar_url} name={user.username} size="sm" />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm text-foreground truncate">{user.username}</div>
                    <div className="text-[11px] text-muted truncate">{user.email}</div>
                  </div>
                </Link>
              ))}
            </>
          )}

          {/* Posts section */}
          {searchResults.posts && searchResults.posts.length > 0 && (
            <>
              <div className="px-4 py-1.5 text-[11px] font-bold text-muted uppercase tracking-wider border-t border-indigo-500/10 mt-1">
                📝 Bài viết ({searchResults.total_posts})
              </div>
              {searchResults.posts.map((post: any) => (
                <div
                  key={`post-${post.id}`}
                  onClick={() => {
                    setShowSearchDropdown(false);
                    router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
                  }}
                  className="flex items-center gap-3 px-4 py-2.5 hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
                >
                  <div className="w-9 h-9 rounded-lg bg-indigo-500/10 flex items-center justify-center text-lg flex-shrink-0 border border-indigo-500/10">
                    📄
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm text-foreground truncate">{post.title || 'Bài viết'}</div>
                    <div className="text-[11px] text-muted truncate">
                      {post.content?.substring(0, 60)}
                      {post.content?.length > 60 ? '...' : ''}
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}

          {/* No results */}
          {(!searchResults.users || searchResults.users.length === 0) &&
            (!searchResults.posts || searchResults.posts.length === 0) && (
              <div className="py-8 text-center">
                <div className="text-2xl mb-1">🔍</div>
                <p className="text-sm text-muted">Không tìm thấy kết quả cho &ldquo;{searchQuery}&rdquo;</p>
              </div>
            )}

          {/* View all results link */}
          {((searchResults.total_users || 0) > 0 || (searchResults.total_posts || 0) > 0) && (
            <Link
              href={`/search?q=${encodeURIComponent(searchQuery.trim())}`}
              onClick={() => setShowSearchDropdown(false)}
              className="block text-center py-2.5 text-xs font-bold text-accent-primary hover:bg-black/5 dark:hover:bg-white/5 transition-colors border-t border-indigo-500/10 mt-1"
            >
              Xem tất cả kết quả →
            </Link>
          )}

          {isSearching && (
            <div className="absolute top-2 right-3">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-500"></div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
