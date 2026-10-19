'use client';

import React, { useState } from 'react';
import api from '@/lib/axios';
import toast from 'react-hot-toast';
import Avatar from '@/components/ui/Avatar';

interface PostComposerProps {
  currentUser: any;
  myGroups: any[];
  friendsList: any[];
  onPostCreated: () => void;
}

export default function PostComposer({
  currentUser,
  myGroups,
  friendsList,
  onPostCreated,
}: PostComposerProps) {
  const [isComposing, setIsComposing] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isPosting, setIsPosting] = useState(false);

  // Destination & Visibility
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const [selectedVisibility, setSelectedVisibility] = useState<'public' | 'friends' | 'private'>('public');
  const [showGroupDropdown, setShowGroupDropdown] = useState(false);

  // Tag friends
  const [taggedFriends, setTaggedFriends] = useState<any[]>([]);
  const [showTagDropdown, setShowTagDropdown] = useState(false);
  const [tagSearch, setTagSearch] = useState('');

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

      if (file) {
        const formData = new FormData();
        formData.append("file", file);

        const uploadRes = await api.post("/upload", formData, {
          headers: { "Content-Type": "multipart/form-data" }
        });
        uploadedImageUrl = uploadRes.data.url;
      }

      await api.post('/posts', {
        title: newTitle || "Bài viết mới",
        content: newContent,
        image_url: uploadedImageUrl,
        group_id: selectedGroupId,
        visibility: selectedGroupId ? 'public' : selectedVisibility,
        mentioned_user_ids: taggedFriends.map(f => f.id),
      });

      setNewTitle('');
      setNewContent('');
      setFile(null);
      setImagePreview(null);
      setIsComposing(false);
      setSelectedGroupId(null);
      setSelectedVisibility('public');
      setTaggedFriends([]);

      const fileInput = document.getElementById('file-upload') as HTMLInputElement;
      if (fileInput) fileInput.value = '';

      toast.success("Đăng bài viết thành công!");
      onPostCreated();
    } catch (error) {
      console.error("Lỗi khi đăng bài:", error);
      toast.error("Đăng bài thất bại, vui lòng thử lại!");
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <div className="glass-card rounded-2xl p-4.5 mb-5 border border-indigo-500/10 shadow-lg relative">
      {!isComposing ? (
        <div className="flex gap-3.5 items-center">
          <Avatar
            src={currentUser?.avatar_url}
            name={currentUser?.username || 'U'}
            size="md"
            glow
          />
          <div
            onClick={() => setIsComposing(true)}
            className="flex-1 px-4 py-3 bg-black/5 dark:bg-white/[0.03] hover:bg-black/10 dark:hover:bg-white/[0.06] border border-indigo-500/10 text-accent-purple/60 rounded-full cursor-pointer transition-all text-sm font-medium"
          >
            {currentUser?.username ? currentUser.username : "Bạn"} ơi, hôm nay bạn muốn chia sẻ điều gì? ✨
          </div>
        </div>
      ) : (
        <div className="space-y-4 animate-slide-up">
          <div className="flex items-center justify-between gap-3 pb-3 border-b border-indigo-500/10">
            <div className="flex items-center gap-3">
              <Avatar
                src={currentUser?.avatar_url}
                name={currentUser?.username || 'U'}
                size="md"
                glow
              />
              <div>
                <div className="text-sm font-bold text-foreground">
                  {currentUser?.username || "Người dùng"}
                </div>

                {/* Destination Selector Dropdown */}
                <div className="relative mt-1">
                  <button
                    type="button"
                    onClick={() => setShowGroupDropdown(!showGroupDropdown)}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-accent-purple hover:bg-indigo-500/20 transition-all text-[11px] font-bold focus:outline-none"
                  >
                    {selectedGroupId ? (
                      <>👥 Đăng vào nhóm: {myGroups.find(g => g.id === selectedGroupId)?.name || 'Đang chọn'}</>
                    ) : selectedVisibility === 'friends' ? (
                      <>👥 Đăng với bạn bè</>
                    ) : selectedVisibility === 'private' ? (
                      <>🔒 Chỉ mình tôi (Cá nhân)</>
                    ) : (
                      <>🌏 Đăng công khai (Bảng tin)</>
                    )}
                    <span className="text-[8px]">▼</span>
                  </button>

                  {showGroupDropdown && (
                    <div className="absolute left-0 mt-1 w-64 glass-card rounded-xl py-1.5 shadow-2xl z-50 animate-slide-up max-h-64 overflow-y-auto border border-indigo-500/20">
                      <div className="px-3 py-1 text-[10px] uppercase font-bold text-muted tracking-wider">
                        Phạm vi hiển thị
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setSelectedGroupId(null);
                          setSelectedVisibility('public');
                          setShowGroupDropdown(false);
                        }}
                        className={`w-full text-left px-3.5 py-2 text-xs font-semibold hover:bg-indigo-500/10 flex items-center gap-2 ${
                          selectedGroupId === null && selectedVisibility === 'public'
                            ? 'text-accent-primary font-bold'
                            : 'text-foreground'
                        }`}
                      >
                        <span>🌏</span>
                        <div>
                          <div>Đăng công khai</div>
                          <div className="text-[10px] text-muted font-normal">Tất cả mọi người đều có thể thấy</div>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setSelectedGroupId(null);
                          setSelectedVisibility('friends');
                          setShowGroupDropdown(false);
                        }}
                        className={`w-full text-left px-3.5 py-2 text-xs font-semibold hover:bg-indigo-500/10 flex items-center gap-2 ${
                          selectedGroupId === null && selectedVisibility === 'friends'
                            ? 'text-accent-primary font-bold'
                            : 'text-foreground'
                        }`}
                      >
                        <span>👥</span>
                        <div>
                          <div>Bạn bè</div>
                          <div className="text-[10px] text-muted font-normal">Chỉ bạn bè mới có thể thấy</div>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setSelectedGroupId(null);
                          setSelectedVisibility('private');
                          setShowGroupDropdown(false);
                        }}
                        className={`w-full text-left px-3.5 py-2 text-xs font-semibold hover:bg-indigo-500/10 flex items-center gap-2 ${
                          selectedGroupId === null && selectedVisibility === 'private'
                            ? 'text-accent-primary font-bold'
                            : 'text-foreground'
                        }`}
                      >
                        <span>🔒</span>
                        <div>
                          <div>Chỉ mình tôi (Cá nhân)</div>
                          <div className="text-[10px] text-muted font-normal">Chỉ một mình bạn thấy bài viết</div>
                        </div>
                      </button>

                      {myGroups.length > 0 && (
                        <>
                          <div className="px-3 pt-2 pb-1 text-[10px] uppercase font-bold text-muted tracking-wider border-t border-indigo-500/10 mt-1">
                            Đăng vào nhóm
                          </div>
                          {myGroups.map((group) => (
                            <button
                              key={group.id}
                              type="button"
                              onClick={() => {
                                setSelectedGroupId(group.id);
                                setShowGroupDropdown(false);
                              }}
                              className={`w-full text-left px-3.5 py-2 text-xs font-semibold hover:bg-indigo-500/10 flex items-center gap-2 ${
                                selectedGroupId === group.id ? 'text-accent-primary font-bold' : 'text-foreground'
                              }`}
                            >
                              <span>🏘️</span>
                              <span className="truncate">{group.name}</span>
                            </button>
                          ))}
                        </>
                      )}
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
              <div className="relative border border-indigo-500/15 rounded-xl overflow-hidden max-h-[280px] bg-black/25 flex justify-center shadow-inner">
                <img src={imagePreview} alt="Preview" className="max-w-full h-auto object-contain max-h-[280px]" />
                <button
                  type="button"
                  onClick={() => {
                    setFile(null);
                    setImagePreview(null);
                  }}
                  className="absolute top-2.5 right-2.5 bg-black/70 hover:bg-black/90 text-white rounded-full w-7 h-7 flex items-center justify-center font-bold text-xs focus:outline-none transition-colors border border-white/10"
                >
                  ✕
                </button>
              </div>
            )}

            <hr className="border-indigo-500/10" />

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer hover:bg-indigo-500/10 dark:bg-white/[0.02] border border-indigo-500/15 px-4 py-2.5 rounded-xl transition-all text-accent-purple/90 text-xs font-bold">
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

              {/* Tag Friends Button */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowTagDropdown(!showTagDropdown)}
                  className={`flex items-center gap-2 hover:bg-purple-500/10 border border-purple-500/15 px-4 py-2.5 rounded-xl transition-all text-xs font-bold ${
                    taggedFriends.length > 0 ? 'text-accent-pink bg-pink-500/5' : 'text-accent-purple/90'
                  }`}
                >
                  <span className="text-base">🏷️</span>
                  <span>Tag bạn bè {taggedFriends.length > 0 ? `(${taggedFriends.length})` : ''}</span>
                </button>

                {showTagDropdown && (
                  <div className="absolute bottom-full left-0 mb-2 w-72 glass-card rounded-xl py-2 shadow-2xl z-50 animate-slide-up max-h-64 overflow-y-auto">
                    <div className="px-3 pb-2 border-b border-purple-500/10">
                      <input
                        type="text"
                        placeholder="Tìm bạn bè..."
                        value={tagSearch}
                        onChange={(e) => setTagSearch(e.target.value)}
                        className="w-full px-3 py-1.5 input-anime rounded-lg text-xs"
                        autoFocus
                      />
                    </div>
                    {friendsList
                      .filter(f => {
                        const name = (f.friend_username || f.username || '').toLowerCase();
                        const fid = f.friend_user_id || f.friend_id || f.id;
                        return (
                          name.includes(tagSearch.toLowerCase()) &&
                          !taggedFriends.find(t => t.id === fid)
                        );
                      })
                      .slice(0, 10)
                      .map((friend) => {
                        const friendId = friend.friend_user_id || friend.friend_id || friend.id;
                        const friendName = friend.friend_username || friend.username;
                        const friendAvatar = friend.friend_avatar_url || friend.avatar_url;
                        return (
                          <button
                            key={friendId}
                            type="button"
                            onClick={() => {
                              setTaggedFriends(prev => [
                                ...prev,
                                { id: friendId, username: friendName, avatar_url: friendAvatar },
                              ]);
                              setTagSearch('');
                            }}
                            className="w-full text-left px-3 py-2 hover:bg-purple-500/10 flex items-center gap-2.5 transition-colors"
                          >
                            <Avatar src={friendAvatar} name={friendName} size="xs" />
                            <span className="text-xs font-semibold text-foreground">{friendName}</span>
                          </button>
                        );
                      })}
                    {friendsList.filter(f => {
                      const name = (f.friend_username || f.username || '').toLowerCase();
                      const fid = f.friend_user_id || f.friend_id || f.id;
                      return (
                        name.includes(tagSearch.toLowerCase()) &&
                        !taggedFriends.find(t => t.id === fid)
                      );
                    }).length === 0 && (
                      <p className="text-center text-xs text-muted/40 py-3">Không tìm thấy bạn bè</p>
                    )}
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={isPosting || !newContent.trim()}
                className="px-6 py-2.5 rounded-xl text-xs font-bold shadow-lg transition-all btn-anime"
              >
                {isPosting ? 'Đang gửi...' : '✨ Đăng lên'}
              </button>
            </div>

            {/* Tagged Friends Chips */}
            {taggedFriends.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {taggedFriends.map(f => (
                  <span
                    key={f.id}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-purple-500/10 border border-purple-500/20 rounded-full text-[11px] font-semibold text-accent-purple"
                  >
                    <Avatar src={f.avatar_url} name={f.username} size="xs" />
                    {f.username}
                    <button
                      type="button"
                      onClick={() => setTaggedFriends(prev => prev.filter(t => t.id !== f.id))}
                      className="text-pink-400 hover:text-pink-300 transition-colors text-[10px] ml-0.5"
                    >
                      ✕
                    </button>
                  </span>
                ))}
              </div>
            )}
          </form>
        </div>
      )}
    </div>
  );
}
