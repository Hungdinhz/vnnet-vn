// app/page.tsx
"use client";

import { useState, useEffect } from 'react';
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

  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [file, setFile] = useState<File | null>(null); 
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isPosting, setIsPosting] = useState(false);
  const [isComposing, setIsComposing] = useState(false);

  const fetchPosts = async () => {
    try {
      const response = await api.get('/posts'); 
      setPosts(response.data); 
    } catch (error) {
      console.error("Lỗi khi tải bài viết:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const [requestedUserIds, setRequestedUserIds] = useState<Set<number>>(new Set());

  const fetchSuggestedUsers = async () => {
    try {
      const res = await api.get('/friends/suggestions');
      setSuggestedUsers((res.data || []).slice(0, 5));
    } catch (err) {
      console.error("Lỗi tải gợi ý bạn bè:", err);
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
    fetchPosts();
  }, [router]);

  useEffect(() => {
    if (currentUser) {
      fetchSuggestedUsers();
    }
  }, [currentUser]);

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

      // Step 1: Upload image to Cloudinary if file exists
      if (file) {
        const formData = new FormData();
        formData.append("file", file);
        
        const uploadRes = await api.post("/upload", formData, {
          headers: { "Content-Type": "multipart/form-data" }
        });
        uploadedImageUrl = uploadRes.data.url;
      }

      // Step 2: Create post
      await api.post('/posts', {
        title: newTitle || "Bài viết mới",
        content: newContent,
        image_url: uploadedImageUrl 
      });

      // Clear form
      setNewTitle('');
      setNewContent('');
      setFile(null);
      setImagePreview(null);
      setIsComposing(false);
      
      const fileInput = document.getElementById('file-upload') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      
      toast.success("Đăng bài viết thành công!");
      fetchPosts(); 
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
    return name.charAt(0).toUpperCase();
  };

  const trendingTopics = [
    { tag: '#AnimeViệtNam', count: '2.1K bài viết' },
    { tag: '#CosplayVN', count: '1.8K bài viết' },
    { tag: '#GameMobile', count: '956 bài viết' },
    { tag: '#MangaMới', count: '743 bài viết' },
    { tag: '#LivestreamHot', count: '512 bài viết' },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      
      <div className="max-w-7xl mx-auto flex gap-4 px-2 md:px-4">
        
        {/* Left Sidebar */}
        <Sidebar />
        
        {/* Center: News Feed */}
        <main className="flex-1 max-w-2xl py-4 md:py-6 mx-auto">
          
          {/* Post publisher */}
          <div className="glass-card rounded-xl p-4 mb-4">
            {!isComposing ? (
              <div className="flex gap-3 items-center">
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
                <div 
                  onClick={() => setIsComposing(true)}
                  className="flex-1 px-4 py-2.5 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-black/10 dark:bg-white/10 border border-purple-500/10 text-accent-purple/60 rounded-full cursor-pointer transition-colors text-[15px]"
                >
                  {currentUser?.username ? currentUser.username : "Bạn"} ơi, bạn đang nghĩ gì thế? ✨
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between gap-3 mb-3">
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
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-foreground">
                        {currentUser?.username || "Người dùng"}
                      </div>
                      <div className="text-xs text-muted/50 flex items-center gap-1">
                        <span>🌏 Công khai</span>
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => setIsComposing(false)}
                    className="w-8 h-8 rounded-full bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-black/10 dark:bg-white/10 flex items-center justify-center text-muted/60 transition-colors focus:outline-none"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleCreatePost} className="space-y-3 animate-slide-up">
                  <input
                    type="text"
                    placeholder="Tiêu đề bài viết (tùy chọn)..."
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full px-3 py-1.5 input-anime rounded-lg text-sm font-semibold"
                  />
                  <textarea
                    placeholder="Chia sẻ suy nghĩ của bạn..."
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2.5 input-anime rounded-lg resize-none text-[15px]"
                    required
                  />

                  {/* Image attachment preview */}
                  {imagePreview && (
                    <div className="relative border border-purple-500/20 rounded-lg overflow-hidden max-h-[300px] bg-black/20 flex justify-center">
                      <img src={imagePreview} alt="Preview" className="max-w-full h-auto object-contain max-h-[300px]" />
                      <button 
                        type="button"
                        onClick={() => { setFile(null); setImagePreview(null); }}
                        className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm focus:outline-none transition-colors"
                      >
                        ✕
                      </button>
                    </div>
                  )}
                  
                  <hr className="border-purple-500/10" />
                  
                  <div className="flex items-center justify-between">
                    {/* Photo attachment icon button */}
                    <label className="flex items-center gap-2 cursor-pointer hover:bg-black/5 dark:hover:bg-black/5 dark:bg-white/5 px-3 py-2 rounded-lg transition-colors text-accent-purple/70">
                      <span className="text-xl">🖼️</span>
                      <span className="text-sm font-semibold">Ảnh/Video</span>
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
                      className="px-8 py-2 rounded-lg text-sm shadow-sm transition-all btn-anime"
                    >
                      {isPosting ? 'Đang đăng...' : '✨ Đăng bài'}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>

          {/* Posts Feed container */}
          {isLoading ? (
            <div className="flex justify-center items-center py-20 glass-card rounded-xl">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
            </div>
          ) : (
            <div className="space-y-4">
              {posts.length === 0 ? (
                <div className="text-center glass-card p-10 rounded-xl">
                  <div className="text-3xl mb-2">📰</div>
                  <p className="font-semibold text-foreground">Chưa có bài viết nào.</p>
                  <p className="text-sm text-muted/50 mt-1">Hãy bắt đầu chia sẻ câu chuyện đầu tiên! ✨</p>
                </div>
              ) : (
                posts.map((post, index) => (
                  <PostCard 
                    key={post.id || index} 
                    post={post} 
                    onPostDeleted={fetchPosts}
                    onPostUpdated={fetchPosts}
                  /> 
                ))
              )}
            </div>
          )}
        </main>

        {/* Right Sidebar: Trending & Suggestions */}
        <aside className="w-72 hidden lg:block py-6 sticky top-14 h-[calc(100vh-3.5rem)] overflow-y-auto">
          
          {/* Trending card */}
          <div className="glass-card rounded-xl p-4 mb-4">
            <h4 className="text-xs font-bold text-muted uppercase tracking-wider mb-3 flex items-center gap-1.5">
              🔥 Xu hướng
            </h4>
            <div className="space-y-3">
              {trendingTopics.map((topic, idx) => (
                <div key={idx} className="flex justify-between items-center hover:bg-black/5 dark:hover:bg-black/5 dark:bg-white/5 p-2 -mx-2 rounded-lg transition-colors cursor-pointer group">
                  <div>
                    <div className="font-semibold text-sm text-foreground group-hover:text-accent-pink transition-colors">{topic.tag}</div>
                    <div className="text-[10px] text-muted">{topic.count}</div>
                  </div>
                  <span className="text-muted/50 text-xs">•••</span>
                </div>
              ))}
            </div>
          </div>

          {/* Suggestions block */}
          {suggestedUsers.length > 0 && (
            <div className="glass-card rounded-xl p-4">
              <div className="flex justify-between items-center mb-3">
                <h4 className="text-xs font-bold text-muted uppercase tracking-wider">✨ Người bạn có thể biết</h4>
                <Link href="/friends" className="text-xs text-accent-pink hover:underline font-semibold">Xem tất cả</Link>
              </div>

              <div className="space-y-3.5">
                {suggestedUsers.map((user, idx) => (
                  <div key={user.id || idx} className="flex items-center justify-between gap-2">
                    <Link href={`/profile/${user.id}`} className="flex items-center gap-2.5 group">
                      {user.avatar_url ? (
                        <img 
                          src={user.avatar_url} 
                          alt={user.username} 
                          className="w-9 h-9 rounded-full object-cover avatar-glow"
                        />
                      ) : (
                        <div className="w-9 h-9 bg-gradient-to-br from-purple-500/50 to-pink-500/50 rounded-full text-secondary flex items-center justify-center font-bold text-sm shadow-sm group-hover:from-purple-500 group-hover:to-pink-500 transition-all">
                          {getInitials(user.username)}
                        </div>
                      )}
                      <div>
                        <div className="font-semibold text-xs text-foreground group-hover:text-accent-pink transition-colors max-w-[110px] truncate">{user.username}</div>
                        <div className="text-[9px] text-muted truncate max-w-[110px]">{user.email}</div>
                      </div>
                    </Link>

                    {requestedUserIds.has(user.id) ? (
                      <button
                        disabled
                        className="px-3 py-1.5 bg-black/5 dark:bg-black/5 dark:bg-white/5 text-muted font-semibold text-[11px] rounded-full shadow-sm border border-purple-500/10 cursor-not-allowed"
                      >
                        Đã gửi
                      </button>
                    ) : (
                      <button
                        onClick={() => handleAddFriend(user.id)}
                        className="px-3 py-1.5 bg-purple-500/10 hover:bg-gradient-to-r hover:from-purple-500 hover:to-pink-500 text-accent-purple hover:text-white font-semibold text-[11px] rounded-full transition-all flex items-center gap-1 shadow-sm border border-purple-500/20 hover:border-transparent"
                      >
                        <span>➕</span> Kết bạn
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </aside>

      </div>
    </div>
  );
}
