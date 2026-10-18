'use client';

import React, { useState } from 'react';
import { X, Star } from 'lucide-react';
import Spinner from '@/components/ui/Spinner';
import toast from 'react-hot-toast';

interface SellerReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  sellerId: number | null;
  itemId?: number | null;
  onSubmit: (sellerId: number, data: { item_id?: number; rating: number; comment?: string }) => Promise<any>;
}

const RATING_LABELS: Record<number, string> = {
  1: 'Rất không hài lòng 😞',
  2: 'Chưa hài lòng 😐',
  3: 'Bình thường 🙂',
  4: 'Hài lòng, người bán nhiệt tình 😊',
  5: 'Rất tuyệt vời, giao dịch uy tín! 🌟',
};

export default function SellerReviewModal({
  isOpen,
  onClose,
  sellerId,
  itemId,
  onSubmit,
}: SellerReviewModalProps) {
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen || !sellerId) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!rating || rating < 1 || rating > 5) {
      toast.error('Vui lòng chọn số sao đánh giá (1-5 sao)');
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit(sellerId, {
        item_id: itemId || undefined,
        rating,
        comment: comment.trim() || undefined,
      });
      onClose();
    } catch (err) {
      // toast in hook
    } finally {
      setSubmitting(false);
    }
  };

  const currentDisplayRating = hoverRating !== null ? hoverRating : rating;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />

      <div className="relative z-10 w-full max-w-md bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-3.5 sm:py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-900/90">
          <div className="flex items-center gap-2">
            <span className="text-xl">⭐</span>
            <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">
              Đánh giá người bán
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <p className="text-xs text-secondary text-center">
            Trải nghiệm mua hàng của bạn với người bán này như thế nào? Đánh giá của bạn sẽ giúp xây dựng cộng đồng mua bán minh bạch.
          </p>

          {/* Interactive Star Rating */}
          <div className="flex flex-col items-center justify-center space-y-2 py-2">
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(null)}
                  className="p-1 transition-transform hover:scale-125 focus:outline-hidden"
                >
                  <Star
                    className={`w-8 h-8 transition-colors ${
                      star <= currentDisplayRating
                        ? 'text-amber-400 fill-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]'
                        : 'text-zinc-600'
                    }`}
                  />
                </button>
              ))}
            </div>

            <div className="text-xs font-semibold text-amber-400 min-h-4 text-center">
              {RATING_LABELS[currentDisplayRating]}
            </div>
          </div>

          {/* Comment Box */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-secondary">
              Nhận xét / Lời nhắn (tùy chọn)
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="VD: Người bán đóng gói cẩn thận, sản phẩm đúng như ảnh chụp và mô tả, giao dịch nhanh chóng..."
              rows={4}
              className="w-full px-3.5 py-2.5 rounded-xl input-anime text-sm resize-none"
            />
          </div>

          {/* Footer buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-secondary hover:text-foreground hover:bg-card-border"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 rounded-xl btn-anime text-xs font-bold flex items-center gap-2 shadow-lg shadow-sky-500/20"
            >
              {submitting ? (
                <>
                  <Spinner size="sm" />
                  <span>Đang gửi...</span>
                </>
              ) : (
                <span>Gửi đánh giá ⭐</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
