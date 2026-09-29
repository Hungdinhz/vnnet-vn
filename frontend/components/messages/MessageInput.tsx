import React, { useState, useRef, useEffect } from 'react';
import api from '@/lib/axios';
import { ChatMessage } from '@/types/messages';

export interface AttachmentItem {
  id: string;
  type: 'IMAGE' | 'FILE';
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
  droppedFiles?: FileList | File[] | null;
  onClearDroppedFiles?: () => void;
}

const QUICK_EMOJIS = ['❤️', '😂', '👍', '🔥', '🎉', '✨', '🥺', '🌸'];

export default function MessageInput({
  onSendMessage,
  onTyping,
  replyingTo,
  onCancelReply,
  disabled = false,
  sendOnEnter = true,
  droppedFiles,
  onClearDroppedFiles,
}: MessageInputProps) {
  const [text, setText] = useState('');
  const [attachments, setAttachments] = useState<AttachmentItem[]>([]);
  const [uploadingCount, setUploadingCount] = useState(0);
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

  // Handle dropped files from drag-and-drop
  useEffect(() => {
    if (droppedFiles && droppedFiles.length > 0) {
      uploadFiles(droppedFiles);
      if (onClearDroppedFiles) {
        onClearDroppedFiles();
      }
    }
  }, [droppedFiles]);

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

  const uploadFiles = async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    if (fileArray.length === 0) return;

    setUploadError(null);
    setUploadingCount((prev) => prev + fileArray.length);

    for (const file of fileArray) {
      if (file.size > 20 * 1024 * 1024) {
        setUploadError(`Tệp "${file.name}" vượt quá giới hạn 20MB.`);
        setUploadingCount((prev) => Math.max(0, prev - 1));
        continue;
      }

      const isImg = file.type.startsWith('image/');
      const endpoint = isImg ? '/upload' : '/upload/file';

      const formData = new FormData();
      formData.append('file', file);

      try {
        const res = await api.post(endpoint, formData, {
          headers: { 'Content-Type': undefined },
        });
        if (res.data && res.data.url) {
          const item: AttachmentItem = {
            id: `${Date.now()}-${Math.random()}`,
            type: isImg ? 'IMAGE' : 'FILE',
            url: res.data.url,
            name: res.data.fileName || file.name,
            size: res.data.fileSize || file.size,
          };
          setAttachments((prev) => [...prev, item]);
        }
      } catch (err: any) {
        console.error('Lỗi tải file:', err);
        setUploadError(`Không thể tải "${file.name}". Vui lòng thử lại!`);
      } finally {
        setUploadingCount((prev) => Math.max(0, prev - 1));
      }
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      uploadFiles(e.target.files);
    }
    if (imageInputRef.current) imageInputRef.current.value = '';
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      uploadFiles(e.target.files);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  const formatFileSize = (bytes: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getFileIcon = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase();
    if (['doc', 'docx'].includes(ext || '')) return '📝';
    if (['xls', 'xlsx'].includes(ext || '')) return '📊';
    if (['pdf'].includes(ext || '')) return '📕';
    if (['zip', 'rar', '7z'].includes(ext || '')) return '🗜️';
    if (['mp3', 'wav', 'ogg'].includes(ext || '')) return '🎵';
    if (['mp4', 'mov', 'avi'].includes(ext || '')) return '🎬';
    return '📄';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if ((!text.trim() && attachments.length === 0) || disabled || uploadingCount > 0) return;

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      onTyping(false);
    }

    if (attachments.length === 0) {
      onSendMessage({
        content: text.trim(),
        messageType: 'TEXT',
        replyToId: replyingTo ? replyingTo.id : null,
      });
    } else {
      // Gửi từng tệp/ảnh: tệp đầu tiên đi kèm text nội dung (nếu có) và replyToId
      attachments.forEach((att, index) => {
        onSendMessage({
          content: index === 0 ? text.trim() : '',
          messageType: att.type,
          imageUrl: att.type === 'IMAGE' ? att.url : null,
          fileUrl: att.type === 'FILE' ? att.url : null,
          fileName: att.type === 'FILE' ? att.name : null,
          fileSize: att.type === 'FILE' ? att.size : null,
          replyToId: index === 0 && replyingTo ? replyingTo.id : null,
        });
      });
    }

    setText('');
    setAttachments([]);
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

  const isUploadingActive = uploadingCount > 0;

  return (
    <div className="p-3 bg-white dark:bg-slate-800 border-t border-gray-200 dark:border-slate-700 relative">
      {/* Upload error banner */}
      {uploadError && (
        <div className="mb-2 p-2 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-500/30 rounded-xl text-xs text-red-600 dark:text-red-400 flex items-center justify-between animate-fade-in">
          <span>{uploadError}</span>
          <button
            type="button"
            onClick={() => setUploadError(null)}
            className="text-red-400 hover:text-red-600 font-bold ml-2"
          >
            ✕
          </button>
        </div>
      )}

      {/* Replying banner */}
      {replyingTo && (
        <div className="flex items-center justify-between mb-2 p-2 bg-sky-50 dark:bg-sky-500/15 rounded-xl border-l-4 border-sky-500 text-xs">
          <div className="flex-1 truncate">
            <span className="font-semibold text-sky-600 dark:text-sky-400">
              Đang trả lời {replyingTo.senderNickname || replyingTo.senderUsername}:
            </span>{' '}
            <span className="text-slate-600 dark:text-slate-300 truncate">
              {replyingTo.content || (replyingTo.fileName ? `📎 [Tệp] ${replyingTo.fileName}` : '[Hình ảnh]')}
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

      {/* Multi-attachment preview strip */}
      {(attachments.length > 0 || isUploadingActive) && (
        <div className="flex flex-wrap items-center gap-2 mb-2.5 p-2.5 bg-slate-50 dark:bg-slate-700/40 rounded-xl border border-slate-200 dark:border-slate-700 max-h-40 overflow-y-auto">
          {attachments.map((att) => (
            <div key={att.id} className="relative group/att">
              {att.type === 'IMAGE' ? (
                <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-sky-400/40 shadow-xs">
                  <img src={att.url} alt={att.name} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeAttachment(att.id)}
                    className="absolute top-1 right-1 bg-black/70 hover:bg-black text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px]"
                    title="Xóa ảnh"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 px-2.5 py-1.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-600 text-xs shadow-xs">
                  <span className="text-lg">{getFileIcon(att.name)}</span>
                  <div className="max-w-[130px]">
                    <p className="font-semibold text-slate-800 dark:text-slate-100 truncate text-[11px]">{att.name}</p>
                    <p className="text-[9px] text-slate-500 dark:text-slate-400">{formatFileSize(att.size)}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeAttachment(att.id)}
                    className="text-slate-400 hover:text-red-500 ml-1 font-bold"
                    title="Xóa tệp"
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>
          ))}

          {isUploadingActive && (
            <div className="flex items-center gap-2 px-3 py-2 bg-white/80 dark:bg-slate-800/80 rounded-xl border border-sky-300 dark:border-sky-500/30 text-xs text-sky-600 dark:text-sky-400 font-medium">
              <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-sky-500 border-t-transparent" />
              <span>Đang tải {uploadingCount} tệp...</span>
            </div>
          )}

          {attachments.length > 1 && (
            <button
              type="button"
              onClick={() => setAttachments([])}
              className="text-[11px] text-slate-400 hover:text-red-500 font-medium px-2 py-1 transition-colors"
            >
              Xóa tất cả
            </button>
          )}
        </div>
      )}

      {/* Emoji quick popover */}
      {showEmojiPicker && (
        <div className="flex gap-2 p-2 bg-white dark:bg-slate-800 backdrop-blur-md rounded-xl border border-slate-200 dark:border-slate-600 mb-2 shadow-lg animate-scale-up">
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
        {/* Hidden multiple image input */}
        <input
          type="file"
          ref={imageInputRef}
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleImageSelect}
        />

        {/* Hidden multiple file input (PDF, DOCX, ZIP, TXT, etc.) */}
        <input
          type="file"
          ref={fileInputRef}
          multiple
          accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.rar,.7z,.txt,.csv,.mp3,.mp4,audio/*,video/*"
          className="hidden"
          onChange={handleFileSelect}
        />

        {/* Image Attachment button */}
        <button
          type="button"
          onClick={() => imageInputRef.current?.click()}
          disabled={isUploadingActive || disabled}
          className="p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-white/10 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors disabled:opacity-50"
          title="Chọn hình ảnh (có thể chọn nhiều ảnh cùng lúc)"
        >
          🖼️
        </button>

        {/* File Attachment button */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploadingActive || disabled}
          className="p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-white/10 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors disabled:opacity-50"
          title="Đính kèm tệp (Word, PDF, Zip... có thể chọn nhiều tệp)"
        >
          📎
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
          placeholder={
            attachments.length > 0
              ? 'Thêm chú thích hoặc nhấn Gửi...'
              : 'Nhập tin nhắn (hoặc kéo thả file vào đây)...'
          }
          disabled={disabled}
          className="flex-1 px-4 py-2.5 bg-slate-100 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-600 rounded-xl text-sm outline-none focus:border-sky-500 text-slate-800 dark:text-slate-100 placeholder-slate-400"
        />

        {/* Send Button */}
        <button
          type="submit"
          disabled={(!text.trim() && attachments.length === 0) || disabled || isUploadingActive}
          className="px-5 py-2.5 bg-sky-500 hover:bg-sky-600 text-white rounded-xl text-sm font-bold disabled:opacity-40 transition-opacity flex items-center gap-1.5 shadow-sm"
        >
          <span>{isUploadingActive ? 'Đang tải...' : 'Gửi'}</span>
          <span>{isUploadingActive ? '⏳' : '🚀'}</span>
        </button>
      </form>
    </div>
  );
}
