// app/search/page.tsx
"use client";

export const dynamic = 'force-dynamic';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import PostCard from '@/components/PostCard';
import api from '@/lib/axios';

function SearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';

  const [activeTab, setActiveTab] = useState<'all' | 'users' | 'posts'>('all');
  const [users, setUsers] = useState<any[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalPosts, setTotalPosts] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    if (!query.trim()) return;
    setPage(0);
    setUsers([]);
    setPosts([]);
    performSearch(0, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, activeTab]);

  const performSearch = async (pageNum: number, reset: boolean = false) => {
    setIsLoading(true);
    try {
      const type = activeTab;
      const res = await api.get(`/search?q=${encodeURIComponent(query)}&type=${type}&page=${pageNum}&size=10`);
      
      if (type === 'all') {
        setUsers(res.data.users || []);
        setPosts(res.data.posts || []);
        setTotalUsers(res.data.total_users || 0);
        setTotalPosts(res.data.total_posts || 0);
      } else if (type === 'users') {
        if (reset) {
          setUsers(res.data.content || []);
        } else {
          setUsers(prev => [...prev, ...(res.data.content || [])]);
        }
        setTotalUsers(res.data.total_elements || 0);
        setHasMore(res.data.has_next || false);
      } else if (type === 'posts') {
        if (reset) {
          setPosts(res.data.content || []);
        } else {
          setPosts(prev => [...prev, ...(res.data.content || [])]);
        }
        setTotalPosts(res.data.total_elements || 0);
        setHasMore(res.data.has_next || false);
      }
    } catch (err) {
      console.error("Lỗi tìm kiếm:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    performSearch(nextPage, false);
  };

  const getInitials = (name: string) => {
    if (!name) return 'U';
    return name.charAt(0).toUpperCase();
  };

  if (!query.trim()) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Navbar />
        <div className="max-w-7xl mx-auto flex gap-4 px-2 md:px-4">
          <Sidebar />
          <main className="flex-1 py-4 md:py-6 max-w-3xl mx-auto">
            <div className="glass-card rounded-xl p-12 text-center">
              <div className="text-5xl mb-4">🔍</div>
              <h1 className="text-xl font-bold text-foreground mb-2">Tìm kiếm trên VnNet</h1>
              <p className="text-sm text-muted/50">Nhập từ khóa vào thanh tìm kiếm ở phía trên để bắt đầu</p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <div className="max-w-7xl mx-auto flex gap-4 px-2 md:px-4">
        <Sidebar />
        <main className="flex-1 py-4 md:py-6 max-w-3xl mx-auto">
          
          {/* Search Header */}
          <div className="glass-card rounded-xl p-4 mb-4">
            <h1 className="text-xl font-extrabold gradient-text mb-1">
              🔍 Kết quả tìm kiếm
            </h1>
            <p className="text-sm text-muted/50 mb-4">
              Từ khóa: &ldquo;<span className="text-accent-primary font-semibold">{query}</span>&rdquo;
            </p>

            {/* Tabs */}
            <div className="flex items-center gap-2 border-b border-indigo-500/10 pb-2">
              <button
                onClick={() => setActiveTab('all')}
                className={`px-4 py-2 rounded-lg font-bold text-sm transition-all focus:outline-none ${
                  activeTab === 'all'
                    ? 'bg-indigo-500/15 text-accent-purple shadow-sm'
                    : 'text-muted/50 hover:bg-black/5 dark:hover:bg-white/5 hover:text-accent-purple'
                }`}
              >
                ✨ Tất cả
              </button>
              <button
                onClick={() => setActiveTab('users')}
                className={`px-4 py-2 rounded-lg font-bold text-sm transition-all focus:outline-none ${
                  activeTab === 'users'
                    ? 'bg-indigo-500/15 text-accent-purple shadow-sm'
                    : 'text-muted/50 hover:bg-black/5 dark:hover:bg-white/5 hover:text-accent-purple'
                }`}
              >
                👤 Người dùng {totalUsers > 0 && <span className="ml-1 text-xs opacity-60">({totalUsers})</span>}
              </button>
              <button
                onClick={() => setActiveTab('posts')}
                className={`px-4 py-2 rounded-lg font-bold text-sm transition-all focus:outline-none ${
                  activeTab === 'posts'
                    ? 'bg-indigo-500/15 text-accent-purple shadow-sm'
                    : 'text-muted/50 hover:bg-black/5 dark:hover:bg-white/5 hover:text-accent-purple'
                }`}
              >
                📝 Bài viết {totalPosts > 0 && <span className="ml-1 text-xs opacity-60">({totalPosts})</span>}
              </button>
            </div>
          </div>

          {/* Loading state */}
          {isLoading && page === 0 ? (
            <div className="flex justify-center items-center py-20 glass-card rounded-xl">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
            </div>
          ) : (
            <>
              {/* Users Results */}
              {(activeTab === 'all' || activeTab === 'users') && users.length > 0 && (
                <div className="mb-6">
                  {activeTab === 'all' && (
                    <div className="flex items-center justify-between mb-3">
                      <h2 className="text-sm font-bold text-muted uppercase tracking-wider">👤 Người dùng ({totalUsers})</h2>
                      {totalUsers > 5 && (
                        <button onClick={() => setActiveTab('users')} className="text-xs text-accent-primary font-semibold hover:underline">
                          Xem tất cả →
                        </button>
                      )}
                    </div>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {users.map((user: any, idx: number) => (
                      <Link
                        key={user.id || idx}
                        href={`/profile/${user.id}`}
                        className="glass-card glass-card-hover rounded-xl p-4 flex items-center gap-3 transition-all duration-300"
                      >
                        {user.avatar_url ? (
                          <img src={user.avatar_url} alt={user.username} className="w-12 h-12 rounded-full object-cover avatar-glow" />
                        ) : (
                          <div className="w-12 h-12 bg-gradient-to-br from-indigo-500/50 to-indigo-600/50 rounded-full flex items-center justify-center text-lg font-bold text-secondary">
                            {getInitials(user.username)}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-sm text-foreground truncate">{user.username}</div>
                          <div className="text-[11px] text-muted truncate">{user.email}</div>
                          {user.bio && <div className="text-[11px] text-muted/50 truncate mt-0.5">{user.bio}</div>}
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Posts Results */}
              {(activeTab === 'all' || activeTab === 'posts') && posts.length > 0 && (
                <div className="mb-6">
                  {activeTab === 'all' && (
                    <div className="flex items-center justify-between mb-3">
                      <h2 className="text-sm font-bold text-muted uppercase tracking-wider">📝 Bài viết ({totalPosts})</h2>
                      {totalPosts > 5 && (
                        <button onClick={() => setActiveTab('posts')} className="text-xs text-accent-primary font-semibold hover:underline">
                          Xem tất cả →
                        </button>
                      )}
                    </div>
                  )}
                  <div className="space-y-4">
                    {posts.map((post: any, idx: number) => (
                      <PostCard key={post.id || idx} post={post} onPostDeleted={() => performSearch(0, true)} onPostUpdated={() => performSearch(0, true)} />
                    ))}
                  </div>
                </div>
              )}

              {/* Load more button */}
              {activeTab !== 'all' && hasMore && (
                <div className="flex justify-center py-4">
                  <button
                    onClick={loadMore}
                    disabled={isLoading}
                    className="px-6 py-2.5 btn-anime rounded-lg text-sm"
                  >
                    {isLoading ? (
                      <span className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Đang tải...
                      </span>
                    ) : 'Xem thêm kết quả'}
                  </button>
                </div>
              )}

              {/* No results */}
              {users.length === 0 && posts.length === 0 && !isLoading && (
                <div className="glass-card rounded-xl p-12 text-center">
                  <div className="text-5xl mb-4">😔</div>
                  <h2 className="text-lg font-bold text-foreground mb-2">Không tìm thấy kết quả</h2>
                  <p className="text-sm text-muted/50">
                    Không có kết quả nào cho &ldquo;<span className="text-accent-primary font-semibold">{query}</span>&rdquo;. Hãy thử từ khóa khác.
                  </p>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex justify-center items-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
      </div>
    }>
      <SearchContent />
    </Suspense>
  );
}
