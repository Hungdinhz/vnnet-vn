import React, { useState, useRef, useEffect } from 'react';
import api from '@/lib/axios';
import { ChatMessage } from '@/types/messages';

interface MessageInputProps {
  onSendMessage: (payload: {
    content: string;
    messageType: 'TEXT' | 'IMAGE';
    imageUrl?: string | null;
    replyToId?: number | null;
  }) => void;
  onTyping: (isTyping: boolean) => void;
  replyingTo: ChatMessage | null;
  onCancelReply: () => void;
  disabled?: boolean;
}

const QUICK_EMOJIS = ['❤️', '😂', '👍', '🔥', '🎉', '✨', '🥺', '🌸'];

export default function MessageInput({
  onSendMessage,
  onTyping,
  replyingTo,
  onCancelReply,
  disabled = false,
}: MessageInputProps) {
  const [text, setText] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input on mount or reply change
  useEffect(() => {
    inputRef.current?.focus();
  }, [replyingTo]);

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setText(val);

    // Trigger typing event
    onTyping(true);
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = setTimeout(() => {
      onTyping(false);
    }, 2500);
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Upload to /upload
    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (res.data && res.data.url) {
        setSelectedImage(res.data.url);
      }
    } catch (err) {
      console.error('Lỗi tải ảnh:', err);
      alert('Không thể tải ảnh lên. Vui lòng thử lại!');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if ((!text.trim() && !selectedImage) || disabled || isUploading) return;

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      onTyping(false);
    }

    onSendMessage({
      content: text.trim(),
      messageType: selectedImage ? 'IMAGE' : 'TEXT',
      imageUrl: selectedImage,
      replyToId: replyingTo ? replyingTo.id : null,
    });

    setText('');
    setSelectedImage(null);
    if (replyingTo) {
      onCancelReply();
    }
  };

  const handleAddEmoji = (emoji: string) => {
    setText((prev) => prev + emoji);
    setShowEmojiPicker(false);
    inputRef.current?.focus();
  };

  return (
    <div className="p-3 bg-black/20 backdrop-blur-md border-t border-indigo-500/15">
      {/* Reply banner if actively replying */}
      {replyingTo && (
        <div className="flex items-center justify-between bg-indigo-500/15 border-l-4 border-indigo-500 px-3 py-1.5 rounded-r-lg mb-2 text-xs">
          <div className="truncate">
            <span className="font-bold text-indigo-300">
              Đang trả lời {replyingTo.senderUsername}:
            </span>{' '}
            <span className="text-muted/70 truncate">
              {replyingTo.content || '[Hình ảnh]'}
            </span>
          </div>
          <button
            type="button"
            onClick={onCancelReply}
            className="text-muted hover:text-white ml-2 p-1"
            title="Hủy trả lời"
          >
            ✕
          </button>
        </div>
      )}

      {/* Uploaded image preview */}
      {selectedImage && (
        <div className="relative inline-block mb-2 rounded-xl overflow-hidden border border-indigo-500/30">
          <img
            src={selectedImage}
            alt="Preview"
            className="w-24 h-24 object-cover rounded-xl"
          />
          <button
            type="button"
            onClick={() => setSelectedImage(null)}
            className="absolute top-1 right-1 bg-black/70 hover:bg-black text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
            title="Xóa ảnh"
          >
            ✕
          </button>
        </div>
      )}

      {/* Emoji quick popover */}
      {showEmojiPicker && (
        <div className="flex gap-2 p-2 bg-black/70 backdrop-blur-md rounded-xl border border-indigo-500/20 mb-2 animate-scale-up">
          {QUICK_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => handleAddEmoji(emoji)}
              className="text-lg hover:scale-125 transition-transform p-1"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        {/* Hidden file input */}
        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          className="hidden"
          onChange={handleImageSelect}
        />

        {/* Attachment button */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading || disabled}
          className="p-2.5 rounded-xl hover:bg-white/10 text-muted hover:text-foreground transition-colors disabled:opacity-50"
          title="Gửi ảnh"
        >
          {isUploading ? (
            <span className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin inline-block"></span>
          ) : (
            '🖼️'
          )}
        </button>

        {/* Emoji trigger button */}
        <button
          type="button"
          onClick={() => setShowEmojiPicker((prev) => !prev)}
          className="p-2.5 rounded-xl hover:bg-white/10 text-muted hover:text-foreground transition-colors"
          title="Chọn emoji"
        >
          😊
        </button>

        {/* Text Input */}
        <input
          ref={inputRef}
          type="text"
          value={text}
          onChange={handleTextChange}
          placeholder="Nhập tin nhắn..."
          disabled={disabled}
          className="flex-1 px-4 py-2.5 input-anime rounded-xl text-sm outline-none"
        />

        {/* Send Button */}
        <button
          type="submit"
          disabled={(!text.trim() && !selectedImage) || disabled || isUploading}
          className="px-5 py-2.5 btn-anime rounded-xl text-sm font-bold disabled:opacity-40 transition-opacity flex items-center gap-1.5 shadow-md shadow-indigo-500/20"
        >
          <span>Gửi</span>
          <span>🚀</span>
        </button>
      </form>
    </div>
  );
}
