// app/page.tsx
"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import api from '@/lib/axios';
import PostCard from '@/components/PostCard';
import toast from 'react-hot-toast';

export default function Home() {
  const router = useRouter();
  
  const [posts, setPosts] = useState<any[]>([]); 
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [suggestedUsers, setSuggestedUsers] = useState<any[]>([]);
  const [myGroups, setMyGroups] = useState<any[]>([]);

  // Pagination state
  const [page, setPage] = useState(0);
  const [hasNext, setHasNext] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Form states for creating post
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [file, setFile] = useState<File | null>(null); 
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isPosting, setIsPosting] = useState(false);
  const [isComposing, setIsComposing] = useState(false);
  
  // Destination group
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const [showGroupDropdown, setShowGroupDropdown] = useState(false);

  const [requestedUserIds, setRequestedUserIds] = useState<Set<number>>(new Set());

  const fetchPosts = async (pageNum: number = 0, reset: boolean = false) => {
    if (reset) {
      setIsLoading(true);
    } else {
      setIsLoadingMore(true);
    }
    try {
      const response = await api.get(`/posts?page=${pageNum}&size=10`);
      const data = response.data;
      
      if (reset) {
        setPosts(data.content || []);
      } else {
        setPosts(prev => [...prev, ...(data.content || [])]);
      }
      setHasNext(data.has_next || false);
      setPage(pageNum);
    } catch (error) {
      console.error("Lỗi khi tải bài viết:", error);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  const fetchSuggestedUsers = async () => {
    try {
      const res = await api.get('/friends/suggestions');
      setSuggestedUsers((res.data || []).slice(0, 4));
    } catch (err) {
      console.error("Lỗi tải gợi ý bạn bè:", err);
    }
  };

  const fetchMyGroups = async () => {
    try {
      const res = await api.get('/groups/me');
      setMyGroups(res.data || []);
    } catch (err) {
      console.error("Lỗi tải danh sách nhóm của tôi:", err);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    const fetchMe = async () => {
      try {
        const res = await api.get('/users/me');
        setCurrentUser(res.data);
      } catch (err) {
        console.error("Lỗi tải self user:", err);
      }
    };

    fetchMe();
    fetchPosts(0, true);
  }, [router]);

  useEffect(() => {
    if (currentUser) {
      fetchSuggestedUsers();
      fetchMyGroups();
    }
  }, [currentUser]);

  // Infinite scroll observer
  const lastPostCallback = useCallback((node: HTMLDivElement | null) => {
    if (isLoadingMore) return;
    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasNext && !isLoadingMore) {
        fetchPosts(page + 1, false);
      }
    }, { threshold: 0.1 });

    if (node) observerRef.current.observe(node);
  }, [isLoadingMore, hasNext, page]);

  // Handle image preview
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files ? e.target.files[0] : null;
    setFile(selectedFile);
    if (selectedFile) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
    } else {
      setImagePreview(null);
    }
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContent.trim()) return;

    setIsPosting(true);
    try {
      let uploadedImageUrl = null;

      // Upload image to Cloudinary if file exists
      if (file) {
        const formData = new FormData();
        formData.append("file", file);
        
        const uploadRes = await api.post("/upload", formData, {
          headers: { "Content-Type": "multipart/form-data" }
        });
        uploadedImageUrl = uploadRes.data.url;
      }

      // Create post
      await api.post('/posts', {
        title: newTitle || "Bài viết mới",
        content: newContent,
        image_url: uploadedImageUrl,
        group_id: selectedGroupId
      });

      // Clear form
      setNewTitle('');
      setNewContent('');
      setFile(null);
      setImagePreview(null);
      setIsComposing(false);
      setSelectedGroupId(null);
      
      const fileInput = document.getElementById('file-upload') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      
      toast.success("Đăng bài viết thành công!");
      fetchPosts(0, true); 
    } catch (error) {
      console.error("Lỗi khi đăng bài:", error);
      toast.error("Đăng bài thất bại, vui lòng thử lại!");
    } finally {
      setIsPosting(false);
    }
  };

  const handleAddFriend = async (friendId: number) => {
    try {
      await api.post(`/friends/request/${friendId}`);
      toast.success('Đã gửi lời mời kết bạn!');
      setRequestedUserIds(prev => new Set(prev).add(friendId));
    } catch (err: any) {
      console.error("Lỗi kết bạn:", err);
      toast.error(err.response?.data?.detail || "Gửi lời mời thất bại");
    }
  };

  const getInitials = (name: string) => {
    if (!name) return 'U';
    return name.trim().charAt(0).toUpperCase();
  };

  // Get current greeting based on local hour
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Chào buổi sáng';
    if (hour < 18) return 'Chào buổi chiều';
    return 'Chào buổi tối';
  };

  const trendingTopics = [
    { tag: '#VnNetSocial', count: '1.2K thảo luận' },
    { tag: '#SpringBoot3', count: '840 bài viết' },
    { tag: '#NextJS16', count: '652 bài viết' },
    { tag: '#Taiwind4', count: '419 bài viết' },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      <Navbar />
      
      <div className="max-w-7xl mx-auto flex gap-4 px-2 md:px-4">
        
        {/* Left Sidebar */}
        <Sidebar />
        
        {/* Center: News Feed */}
        <main className="flex-1 max-w-2xl py-4 md:py-6 mx-auto w-full">
          
          {/* Welcome Dashboard Card */}
          <div className="glass-card rounded-2xl p-5 mb-5 relative overflow-hidden border border-purple-500/10 shadow-lg animate-slide-up">
            <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-gradient-to-br from-accent-purple/20 to-accent-pink/10 rounded-full blur-3xl pointer-events-none" />
            <div className="flex justify-between items-center relative z-10">
              <div>
                <h2 className="text-xl md:text-2xl font-extrabold tracking-tight">
                  {getGreeting()},{' '}
                  <span className="gradient-text">{currentUser?.username || 'Bạn'}</span>! ✨
                </h2>
                <p className="text-xs text-muted/70 mt-1 font-medium">Chào mừng bạn quay trở lại với VnNet. Cập nhật bảng tin ngay nào!</p>
              </div>
              <div className="text-3xl animate-float">🚀</div>
            </div>

            {/* Quick stats mini row */}
            <div className="grid grid-cols-3 gap-2.5 mt-4 pt-4 border-t border-purple-500/10 text-center">
              <div className="bg-black/10 dark:bg-white/[0.02] p-2 rounded-xl border border-purple-500/5">
                <span className="block text-xs font-bold text-accent-purple">👥 Bạn bè</span>
                <span className="text-sm font-extrabold font-mono mt-0.5 block">Đang kết nối</span>
              </div>
              <div className="bg-black/10 dark:bg-white/[0.02] p-2 rounded-xl border border-purple-500/5">
                <span className="block text-xs font-bold text-accent-pink">🏘️ Nhóm</span>
                <span className="text-sm font-extrabold font-mono mt-0.5 block">{myGroups.length} đã tham gia</span>
              </div>
              <Link href="/groups" className="bg-black/10 dark:bg-white/[0.02] p-2 rounded-xl border border-purple-500/5 hover:bg-purple-500/10 transition-colors cursor-pointer block">
                <span className="block text-xs font-bold text-cyan-400">➕ Khám phá</span>
                <span className="text-xs font-semibold text-muted mt-1 block">Tìm nhóm mới</span>
              </Link>
            </div>
          </div>

          {/* Stories / Joined Groups Circle Row */}
          {myGroups.length > 0 && (
            <div className="glass-card rounded-2xl p-4 mb-5 border border-purple-500/10">
              <div className="flex items-center justify-between mb-3 px-1">
                <span className="text-xs font-bold uppercase tracking-wider text-accent-purple/80">👥 Nhóm của bạn ({myGroups.length})</span>
                <Link href="/groups" className="text-[11px] text-accent-pink font-semibold hover:underline">Tất cả nhóm</Link>
              </div>
              <div className="flex gap-4 overflow-x-auto pb-1.5 scrollbar-thin">
                {myGroups.map((group) => (
                  <Link 
                    key={group.id} 
                    href={`/groups/${group.id}`} 
                    className="flex flex-col items-center gap-1.5 flex-shrink-0 group cursor-pointer w-16"
                  >
                    <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-purple-500/20 group-hover:border-accent-pink group-hover:scale-105 transition-all avatar-glow relative bg-gradient-to-br from-purple-600/30 to-pink-500/30 flex items-center justify-center font-bold text-white text-sm">
                      {group.cover_url ? (
                        <img src={group.cover_url} alt={group.name} className="w-full h-full object-cover" />
                      ) : (
                        getInitials(group.name)
                      )}
                    </div>
                    <span className="text-[10px] font-semibold text-center text-muted group-hover:text-foreground transition-colors truncate w-full">
                      {group.name}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Smart Post Publisher */}
          <div className="glass-card rounded-2xl p-4.5 mb-5 border border-purple-500/10 shadow-lg relative">
            {!isComposing ? (
              <div className="flex gap-3.5 items-center">
                {currentUser?.avatar_url ? (
                  <img 
                    src={currentUser.avatar_url} 
                    alt={currentUser.username} 
                    className="w-10 h-10 rounded-full object-cover avatar-glow"
                  />
                ) : (
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full text-white flex items-center justify-center font-bold shadow-md">
                    {getInitials(currentUser?.username)}
                  </div>
                )}
                <div 
                  onClick={() => setIsComposing(true)}
                  className="flex-1 px-4 py-3 bg-black/5 dark:bg-white/[0.03] hover:bg-black/10 dark:hover:bg-white/[0.06] border border-purple-500/10 text-accent-purple/60 rounded-full cursor-pointer transition-all text-sm font-medium"
                >
                  {currentUser?.username ? currentUser.username : "Bạn"} ơi, hôm nay bạn muốn chia sẻ điều gì? ✨
                </div>
              </div>
            ) : (
              <div className="space-y-4 animate-slide-up">
                <div className="flex items-center justify-between gap-3 pb-3 border-b border-purple-500/10">
                  <div className="flex items-center gap-3">
                    {currentUser?.avatar_url ? (
                      <img 
                        src={currentUser.avatar_url} 
                        alt={currentUser.username} 
                        className="w-10 h-10 rounded-full object-cover avatar-glow"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full text-white flex items-center justify-center font-bold">
                        {getInitials(currentUser?.username)}
                      </div>
                    )}
                    <div>
                      <div className="text-sm font-bold text-foreground">
                        {currentUser?.username || "Người dùng"}
                      </div>
                      
                      {/* Destination Selector Dropdown */}
                      <div className="relative mt-1">
                        <button
                          type="button"
                          onClick={() => setShowGroupDropdown(!showGroupDropdown)}
                          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-accent-purple hover:bg-purple-500/20 transition-all text-[11px] font-bold focus:outline-none"
                        >
                          {selectedGroupId ? (
                            <>👥 Đăng vào nhóm: {myGroups.find(g => g.id === selectedGroupId)?.name || 'Đang chọn'}</>
                          ) : (
                            <>🌏 Đăng công khai (Bảng tin)</>
                          )}
                          <span className="text-[8px]">▼</span>
                        </button>

                        {showGroupDropdown && (
                          <div className="absolute left-0 mt-1 w-64 glass-card rounded-xl py-1.5 shadow-2xl z-50 animate-slide-up max-h-56 overflow-y-auto">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedGroupId(null);
                                setShowGroupDropdown(false);
                              }}
                              className={`w-full text-left px-3.5 py-2 text-xs font-semibold hover:bg-purple-500/10 flex items-center gap-2 ${
                                selectedGroupId === null ? 'text-accent-pink' : 'text-foreground'
                              }`}
                            >
                              <span>🌏</span> Đăng công khai (Bảng tin)
                            </button>
                            
                            {myGroups.map((group) => (
                              <button
                                key={group.id}
                                type="button"
                                onClick={() => {
                                  setSelectedGroupId(group.id);
                                  setShowGroupDropdown(false);
                                }}
                                className={`w-full text-left px-3.5 py-2 text-xs font-semibold hover:bg-purple-500/10 flex items-center gap-2 ${
                                  selectedGroupId === group.id ? 'text-accent-pink' : 'text-foreground'
                                }`}
                              >
                                <span>👥</span> Nhóm: {group.name}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                    </div>
                  </div>
                  
                  <button 
                    onClick={() => {
                      setIsComposing(false);
                      setSelectedGroupId(null);
                    }}
                    className="w-8 h-8 rounded-full bg-black/5 dark:bg-white/[0.04] hover:bg-black/10 dark:hover:bg-white/[0.08] flex items-center justify-center text-muted transition-colors focus:outline-none"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleCreatePost} className="space-y-3.5">
                  <input
                    type="text"
                    placeholder="Tiêu đề bài viết (tùy chọn)..."
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full px-3.5 py-2.5 input-anime rounded-xl text-xs font-bold"
                  />
                  <textarea
                    placeholder="Hãy viết gì đó thú vị..."
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    rows={4}
                    className="w-full px-4 py-3 input-anime rounded-xl resize-none text-[14px]"
                    required
                  />

                  {/* Image attachment preview */}
                  {imagePreview && (
                    <div className="relative border border-purple-500/15 rounded-xl overflow-hidden max-h-[280px] bg-black/25 flex justify-center shadow-inner">
                      <img src={imagePreview} alt="Preview" className="max-w-full h-auto object-contain max-h-[280px]" />
                      <button 
                        type="button"
                        onClick={() => { setFile(null); setImagePreview(null); }}
                        className="absolute top-2.5 right-2.5 bg-black/70 hover:bg-black/90 text-white rounded-full w-7 h-7 flex items-center justify-center font-bold text-xs focus:outline-none transition-colors border border-white/10"
                      >
                        ✕
                      </button>
                    </div>
                  )}
                  
                  <hr className="border-purple-500/10" />
                  
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer hover:bg-purple-500/10 dark:bg-white/[0.02] border border-purple-500/15 px-4 py-2.5 rounded-xl transition-all text-accent-purple/90 text-xs font-bold">
                      <span className="text-base">🖼️</span>
                      <span>Thêm ảnh bài viết</span>
                      <input 
                        id="file-upload"
                        type="file" 
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </label>

                    <button
                      type="submit"
                      disabled={isPosting || !newContent.trim()}
                      className="px-6 py-2.5 rounded-xl text-xs font-bold shadow-lg transition-all btn-anime"
                    >
                      {isPosting ? 'Đang gửi...' : '✨ Đăng lên'}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>

          {/* Posts Feed container */}
          {isLoading ? (
            <div className="flex flex-col justify-center items-center py-24 glass-card rounded-2xl gap-3 border border-purple-500/10">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-accent-purple"></div>
              <span className="text-xs text-muted/60 font-semibold">Đang chuẩn bị bảng tin của bạn...</span>
            </div>
          ) : (
            <div className="space-y-5">
              {posts.length === 0 ? (
                <div className="text-center glass-card p-12 rounded-2xl border border-purple-500/10">
                  <div className="text-4xl mb-3">📰</div>
                  <p className="font-extrabold text-foreground">Bảng tin trống</p>
                  <p className="text-xs text-muted/50 mt-1">Chưa có bài viết phù hợp hiển thị. Hãy kết bạn hoặc tham gia nhóm nhé! ✨</p>
                </div>
              ) : (
                <>
                  {posts.map((post, index) => (
                    <PostCard 
                      key={post.id || index} 
                      post={post} 
                      onPostDeleted={() => fetchPosts(0, true)}
                      onPostUpdated={() => fetchPosts(0, true)}
                    /> 
                  ))}

                  {/* Infinite scroll trigger */}
                  {hasNext && (
                    <div ref={lastPostCallback} className="flex justify-center items-center py-6">
                      {isLoadingMore ? (
                        <div className="flex items-center gap-3 bg-purple-500/15 border border-purple-500/20 px-5 py-3 rounded-full shadow-md">
                          <div className="animate-spin rounded-full h-4.5 w-4.5 border-b-2 border-accent-purple"></div>
                          <span className="text-xs text-muted font-bold">Đang tải thêm câu chuyện...</span>
                        </div>
                      ) : (
                        <div className="h-4"></div>
                      )}
                    </div>
                  )}

                  {/* End of feed */}
                  {!hasNext && posts.length > 0 && (
                    <div className="text-center py-6">
                      <div className="glass-card inline-flex items-center gap-2 px-6 py-3 rounded-full border border-purple-500/10">
                        <span className="text-sm">✨</span>
                        <span className="text-xs text-muted font-bold">Bạn đã xem hết các bài viết mới nhất</span>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </main>

        {/* Right Sidebar: Trending & Suggested Groups & Friends */}
        <aside className="w-80 hidden lg:block py-6 sticky top-14 h-[calc(100vh-3.5rem)] overflow-y-auto space-y-5">
          
          {/* My Groups shortcuts widget */}
          <div className="glass-card rounded-2xl p-4.5 border border-purple-500/10">
            <div className="flex justify-between items-center mb-3">
              <h4 className="text-xs font-bold text-accent-purple uppercase tracking-wider flex items-center gap-1.5">
                👥 Nhóm đã tham gia
              </h4>
              <Link href="/groups" className="text-[10px] text-accent-pink hover:underline font-bold">Quản lý</Link>
            </div>
            
            {myGroups.length === 0 ? (
              <div className="text-center py-4 bg-black/10 dark:bg-white/[0.01] rounded-xl border border-purple-500/5">
                <span className="text-base block">🏘️</span>
                <span className="text-[10px] text-muted">Bạn chưa tham gia nhóm nào</span>
                <Link href="/groups" className="text-[10px] text-accent-purple font-bold hover:underline block mt-1.5">Khám phá ngay ➔</Link>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-52 overflow-y-auto pr-0.5">
                {myGroups.slice(0, 5).map((group) => (
                  <Link 
                    key={group.id} 
                    href={`/groups/${group.id}`}
                    className="flex items-center justify-between hover:bg-purple-500/10 p-2 -mx-1.5 rounded-xl transition-all group"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8.5 h-8.5 rounded-full overflow-hidden bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center font-bold text-white text-xs">
                        {group.cover_url ? (
                          <img src={group.cover_url} alt={group.name} className="w-full h-full object-cover" />
                        ) : (
                          getInitials(group.name)
                        )}
                      </div>
                      <div>
                        <div className="font-bold text-xs text-foreground group-hover:text-accent-pink transition-colors truncate max-w-[130px]">{group.name}</div>
                        <div className="text-[9px] text-muted/60 mt-0.5">Thành viên tích cực</div>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-accent-purple bg-purple-500/10 px-2 py-0.5 rounded-full">Xem</span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Suggestions block */}
          {suggestedUsers.length > 0 && (
            <div className="glass-card rounded-2xl p-4.5 border border-purple-500/10">
              <div className="flex justify-between items-center mb-3">
                <h4 className="text-xs font-bold text-accent-purple uppercase tracking-wider flex items-center gap-1.5">
                  ✨ Người bạn có thể biết
                </h4>
                <Link href="/friends" className="text-[10px] text-accent-pink hover:underline font-bold">Xem tất cả</Link>
              </div>

              <div className="space-y-3">
                {suggestedUsers.map((user, idx) => (
                  <div key={user.id || idx} className="flex items-center justify-between gap-2.5">
                    <Link href={`/profile/${user.id}`} className="flex items-center gap-2.5 group flex-1 min-w-0">
                      {user.avatar_url ? (
                        <img 
                          src={user.avatar_url} 
                          alt={user.username} 
                          className="w-9 h-9 rounded-full object-cover avatar-glow flex-shrink-0"
                        />
                      ) : (
                        <div className="w-9 h-9 bg-gradient-to-br from-purple-500/50 to-pink-500/50 rounded-full text-white flex items-center justify-center font-bold text-xs shadow-sm flex-shrink-0 group-hover:from-purple-500 group-hover:to-pink-500 transition-all">
                          {getInitials(user.username)}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-xs text-foreground group-hover:text-accent-pink transition-colors truncate">{user.username}</div>
                        <div className="text-[9px] text-muted truncate">{user.email}</div>
                      </div>
                    </Link>

                    {requestedUserIds.has(user.id) ? (
                      <button
                        disabled
                        className="px-2.5 py-1 bg-black/10 dark:bg-white/[0.02] text-muted font-bold text-[10px] rounded-full border border-purple-500/10 cursor-not-allowed flex-shrink-0"
                      >
                        Đã gửi
                      </button>
                    ) : (
                      <button
                        onClick={() => handleAddFriend(user.id)}
                        className="px-2.5 py-1 bg-purple-500/10 hover:bg-gradient-to-r hover:from-purple-500 hover:to-pink-500 text-accent-purple hover:text-white font-bold text-[10px] rounded-full transition-all flex items-center gap-0.5 border border-purple-500/15 hover:border-transparent flex-shrink-0"
                      >
                        Kết bạn
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Trending hashtags card */}
          <div className="glass-card rounded-2xl p-4.5 border border-purple-500/10">
            <h4 className="text-xs font-bold text-accent-purple uppercase tracking-wider mb-3 flex items-center gap-1.5">
              🔥 Xu hướng cộng đồng
            </h4>
            <div className="space-y-2.5">
              {trendingTopics.map((topic, idx) => (
                <div key={idx} className="flex justify-between items-center hover:bg-purple-500/10 p-2 -mx-1.5 rounded-xl transition-all cursor-pointer group">
                  <div>
                    <div className="font-bold text-xs text-foreground group-hover:text-accent-pink transition-colors">{topic.tag}</div>
                    <div className="text-[9px] text-muted/60 mt-0.5">{topic.count}</div>
                  </div>
                  <span className="text-muted/40 text-[10px]">•••</span>
                </div>
              ))}
            </div>
          </div>
        </aside>

      </div>
    </div>
  );
}
