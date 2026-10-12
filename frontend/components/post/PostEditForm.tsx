'use client';

import React from 'react';

interface PostEditFormProps {
  editTitle: string;
  setEditTitle: (val: string) => void;
  editContent: string;
  setEditContent: (val: string) => void;
  isSavingEdit: boolean;
  onSave: (e: React.FormEvent) => void;
  onCancel: () => void;
}

export default function PostEditForm({
  editTitle,
  setEditTitle,
  editContent,
  setEditContent,
  isSavingEdit,
  onSave,
  onCancel,
}: PostEditFormProps) {
  return (
    <form onSubmit={onSave} className="space-y-3 mb-4">
      <input
        type="text"
        value={editTitle}
        onChange={(e) => setEditTitle(e.target.value)}
        className="w-full px-3 py-1.5 input-anime rounded-lg text-sm font-semibold"
        placeholder="Tiêu đề bài viết..."
        required
      />
      <textarea
        value={editContent}
        onChange={(e) => setEditContent(e.target.value)}
        rows={4}
        className="w-full px-3 py-1.5 input-anime rounded-lg text-sm resize-none"
        placeholder="Nội dung bài viết..."
        required
      />
      <div className="flex gap-2 justify-end">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-1.5 text-xs font-semibold text-muted/60 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition-colors"
        >
          Hủy
        </button>
        <button
          type="submit"
          disabled={isSavingEdit}
          className="px-4 py-1.5 text-xs font-semibold btn-anime rounded-lg"
        >
          {isSavingEdit ? "Đang lưu..." : "Lưu thay đổi"}
        </button>
      </div>
    </form>
  );
}
