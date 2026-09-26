import React, { useState, useRef, useEffect } from 'react';
import api from '@/lib/axios';
import { ChatMessage } from '@/types/messages';

interface SelectedFile {
  url: string;
  name: string;
  size: number;
}

interface MessageInputProps {
  onSendMessage: (payload: {
    content: string;
    messageType: 'TEXT' | 'IMAGE' | 'FILE';
    imageUrl?: string | null;
    fileUrl?: string | null;
    fileName?: string | null;
    fileSize?: number | null;
    replyToId?: number | null;
  }) => void;
  onTyping: (isTyping: boolean) => void;
  replyingTo: ChatMessage | null;
  onCancelReply: () => void;
  disabled?: boolean;
  sendOnEnter?: boolean;
}

const QUICK_EMOJIS = ['❤️', '😂', '👍', '🔥', '🎉', '✨', '🥺', '🌸'];

export default function MessageInput({
  onSendMessage,
  onTyping,
  replyingTo,
  onCancelReply,
  disabled = false,
  sendOnEnter = true,
}: MessageInputProps) {
  const [text, setText] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<SelectedFile | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input on mount or reply change
  useEffect(() => {
    inputRef.current?.focus();
  }, [replyingTo]);

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setText(val);
    setUploadError(null);

    // Trigger typing event
    onTyping(true);
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = setTimeout(() => {
      onTyping(false);
    }, 2500);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (sendOnEnter && e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadError(null);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (res.data && res.data.url) {
        setSelectedImage(res.data.url);
        setSelectedFile(null); // image and file are separate
      }
    } catch (err) {
      console.error('Lỗi tải ảnh:', err);
      setUploadError('Không thể tải ảnh lên. Vui lòng thử lại!');
    } finally {
      setIsUploading(false);
      if (imageInputRef.current) imageInputRef.current.value = '';
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setUploadError('Kích thước file vượt quá giới hạn 10MB.');
      return;
    }

    setIsUploading(true);
    setUploadError(null);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await api.post('/upload/file', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (res.data && res.data.url) {
        setSelectedFile({
          url: res.data.url,
          name: res.data.fileName || file.name,
          size: res.data.fileSize || file.size,
        });
        setSelectedImage(null);
      }
    } catch (err) {
      console.error('Lỗi tải file:', err);
      setUploadError('Không thể tải file lên. Vui lòng thử lại!');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if ((!text.trim() && !selectedImage && !selectedFile) || disabled || isUploading) return;

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      onTyping(false);
    }

    let messageType: 'TEXT' | 'IMAGE' | 'FILE' = 'TEXT';
    if (selectedFile) {
      messageType = 'FILE';
    } else if (selectedImage) {
      messageType = 'IMAGE';
    }

    onSendMessage({
      content: text.trim(),
      messageType,
      imageUrl: selectedImage,
      fileUrl: selectedFile?.url,
      fileName: selectedFile?.name,
      fileSize: selectedFile?.size,
      replyToId: replyingTo ? replyingTo.id : null,
    });

    setText('');
    setSelectedImage(null);
    setSelectedFile(null);
    setUploadError(null);
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
    <div className="p-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-t border-slate-200 dark:border-indigo-500/20 text-slate-800 dark:text-slate-100">
      {/* Upload error banner */}
      {uploadError && (
        <div className="p-2 mb-2 bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 rounded-xl text-xs flex items-center justify-between">
          <span>⚠️ {uploadError}</span>
          <button onClick={() => setUploadError(null)} className="text-red-400 font-bold px-1">✕</button>
        </div>
      )}

      {/* Reply banner if actively replying */}
      {replyingTo && (
        <div className="flex items-center justify-between bg-indigo-50 dark:bg-indigo-500/15 border-l-4 border-indigo-500 px-3 py-1.5 rounded-r-lg mb-2 text-xs">
          <div className="truncate">
            <span className="font-bold text-indigo-600 dark:text-indigo-400">
              Đang trả lời {replyingTo.senderUsername}:
            </span>{' '}
            <span className="text-slate-600 dark:text-slate-300 truncate">
              {replyingTo.content || (replyingTo.fileName ? `📎 [File] ${replyingTo.fileName}` : '[Hình ảnh]')}
            </span>
          </div>
          <button
            type="button"
            onClick={onCancelReply}
            className="text-slate-400 hover:text-slate-700 dark:hover:text-white ml-2 p-1"
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

      {/* Uploaded file preview card */}
      {selectedFile && (
        <div className="inline-flex items-center gap-2 mb-2 p-2 bg-indigo-50 dark:bg-indigo-950/40 rounded-xl border border-indigo-200 dark:border-indigo-500/30 text-xs">
          <span className="text-xl">📄</span>
          <div className="max-w-xs">
            <p className="font-semibold text-slate-800 dark:text-slate-100 truncate">{selectedFile.name}</p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">{formatFileSize(selectedFile.size)}</p>
          </div>
          <button
            type="button"
            onClick={() => setSelectedFile(null)}
            className="p-1 text-slate-400 hover:text-red-500 font-bold ml-1"
            title="Xóa tệp đính kèm"
          >
            ✕
          </button>
        </div>
      )}

      {/* Emoji quick popover */}
      {showEmojiPicker && (
        <div className="flex gap-2 p-2 bg-white dark:bg-slate-800 backdrop-blur-md rounded-xl border border-slate-200 dark:border-indigo-500/30 mb-2 shadow-lg animate-scale-up">
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
        {/* Hidden image input */}
        <input
          type="file"
          ref={imageInputRef}
          accept="image/*"
          className="hidden"
          onChange={handleImageSelect}
        />

        {/* Hidden file input (PDF, DOCX, ZIP, etc.) */}
        <input
          type="file"
          ref={fileInputRef}
          accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.rar,.7z,.txt,.csv,.mp3,.mp4,audio/*,video/*"
          className="hidden"
          onChange={handleFileSelect}
        />

        {/* Image Attachment button */}
        <button
          type="button"
          onClick={() => imageInputRef.current?.click()}
          disabled={isUploading || disabled}
          className="p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-white/10 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors disabled:opacity-50"
          title="Gửi hình ảnh"
        >
          {isUploading && !selectedFile ? (
            <span className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin inline-block"></span>
          ) : (
            '🖼️'
          )}
        </button>

        {/* File Attachment button */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading || disabled}
          className="p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-white/10 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors disabled:opacity-50"
          title="Đính kèm tệp (PDF, Word, Zip...)"
        >
          {isUploading && selectedFile ? (
            <span className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin inline-block"></span>
          ) : (
            '📎'
          )}
        </button>

        {/* Emoji trigger button */}
        <button
          type="button"
          onClick={() => setShowEmojiPicker((prev) => !prev)}
          className="p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-white/10 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors"
          title="Chọn biểu cảm"
        >
          😊
        </button>

        {/* Text Input */}
        <input
          ref={inputRef}
          type="text"
          value={text}
          onChange={handleTextChange}
          onKeyDown={handleKeyDown}
          placeholder="Nhập tin nhắn..."
          disabled={disabled}
          className="flex-1 px-4 py-2.5 bg-slate-100 dark:bg-slate-800/80 border border-slate-300 dark:border-indigo-500/30 rounded-xl text-sm outline-none focus:border-indigo-500 text-slate-800 dark:text-slate-100 placeholder-slate-400"
        />

        {/* Send Button */}
        <button
          type="submit"
          disabled={(!text.trim() && !selectedImage && !selectedFile) || disabled || isUploading}
          className="px-5 py-2.5 btn-anime rounded-xl text-sm font-bold disabled:opacity-40 transition-opacity flex items-center gap-1.5 shadow-md shadow-indigo-500/20"
        >
          <span>Gửi</span>
          <span>🚀</span>
        </button>
      </form>
    </div>
  );
}
