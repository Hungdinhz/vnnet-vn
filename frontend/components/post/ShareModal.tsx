'use client';

import React from 'react';
import Modal from '@/components/ui/Modal';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  post: any;
  shareContent: string;
  setShareContent: (val: string) => void;
  isSharing: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

export default function ShareModal({
  isOpen,
  onClose,
  post,
  shareContent,
  setShareContent,
  isSharing,
  onSubmit,
}: ShareModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Chia sẻ bài viết" maxWidth="md">
      <form onSubmit={onSubmit} className="space-y-4">
        <textarea
          value={shareContent}
          onChange={(e) => setShareContent(e.target.value)}
          placeholder="Hãy nói gì đó về bài viết này..."
          className="w-full px-3 py-2 input-anime rounded-lg resize-none text-sm"
          rows={3}
        />

        {/* Preview of the shared post */}
        <div className="border border-indigo-500/10 rounded-lg p-3 bg-white/[0.02] opacity-80 pointer-events-none">
          <div className="flex items-center gap-2 mb-2">
            <div className="font-semibold text-[13px] text-secondary">{post.owner?.username}</div>
          </div>
          {post.title && <h4 className="font-semibold text-[13px] text-foreground mb-1">{post.title}</h4>}
          <p className="text-[12px] text-accent-purple/50 line-clamp-2">{post.content}</p>
        </div>

        <button
          type="submit"
          disabled={isSharing}
          className="w-full py-2 btn-anime rounded-lg text-sm shadow-sm"
        >
          {isSharing ? "Đang chia sẻ..." : "✨ Chia sẻ ngay"}
        </button>
      </form>
    </Modal>
  );
}
