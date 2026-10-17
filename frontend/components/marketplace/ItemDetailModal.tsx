'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  X,
  MessageCircle,
  MapPin,
  Calendar,
  Eye,
  Share2,
  Edit3,
  Trash2,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import { MarketplaceItem, CONDITION_LABELS, CATEGORY_LABELS } from '@/types/marketplace';
import Avatar from '@/components/ui/Avatar';
import { formatPrice, timeAgo } from './ItemCard';
import toast from 'react-hot-toast';

interface ItemDetailModalProps {
  item: MarketplaceItem | null;
  onClose: () => void;
  currentUserId?: number;
  onEdit: (item: MarketplaceItem) => void;
  onDelete: (id: number) => void;
  onMarkAsSold: (item: MarketplaceItem) => void;
}

export default function ItemDetailModal({
  item,
  onClose,
  currentUserId,
  onEdit,
  onDelete,
  onMarkAsSold,
}: ItemDetailModalProps) {
  const router = useRouter();
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  if (!item) return null;

  const isOwner = Boolean(currentUserId && item.seller_id === currentUserId);
  const isSold = item.status === 'sold';
  const images = item.image_urls && item.image_urls.length > 0 ? item.image_urls : [];

  const handleNextImage = () => {
    setActiveImageIndex((prev) => (prev + 1) % images.length);
  };

  const handlePrevImage = () => {
    setActiveImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const handleContactSeller = () => {
    if (!currentUserId) {
      toast.error('Vui lòng đăng nhập để nhắn tin cho người bán');
      router.push('/login');
      return;
    }
    // Chuyển hướng tới trang tin nhắn và mở hội thoại trực tiếp với người bán
    router.push(`/messages?userId=${item.seller_id}`);
    onClose();
  };

  const handleShare = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Đã sao chép liên kết sản phẩm!');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />

      <div className="relative z-10 w-full max-w-4xl bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-4 sm:px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/90">
          <div className="flex items-center gap-2">
            <span className="text-xl">
              {CATEGORY_LABELS[item.category]?.icon || '📦'}
            </span>
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
              {CATEGORY_LABELS[item.category]?.label || item.category}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="p-1.5 rounded-full text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Chia sẻ sản phẩm"
            >
              <Share2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="overflow-y-auto flex-1 grid grid-cols-1 md:grid-cols-2 gap-0">
          {/* Left Column: Image Gallery */}
          <div className="p-4 sm:p-6 bg-zinc-950/40 flex flex-col justify-between border-b md:border-b-0 md:border-r border-border/50">
            <div className="space-y-3">
              {/* Main Image */}
              <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-zinc-900 border border-border/60 flex items-center justify-center group">
                {images.length > 0 ? (
                  <img
                    src={images[activeImageIndex]}
                    alt={item.title}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="text-muted flex flex-col items-center gap-2">
                    <span className="text-4xl">📦</span>
                    <span className="text-xs">Không có hình ảnh</span>
                  </div>
                )}

                {/* Left / Right Nav buttons if multiple images */}
                {images.length > 1 && (
                  <>
                    <button
                      onClick={handlePrevImage}
                      className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/60 text-white hover:bg-black/80 transition-all opacity-0 group-hover:opacity-100"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={handleNextImage}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/60 text-white hover:bg-black/80 transition-all opacity-0 group-hover:opacity-100"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </>
                )}

                {/* Sold Overlay */}
                {isSold && (
                  <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center">
                    <span className="px-5 py-2 rounded-xl bg-rose-600 text-white text-sm font-black tracking-widest uppercase shadow-2xl rotate-[-6deg] border-2 border-white/30">
                      ĐÃ BÁN 🤝
                    </span>
                  </div>
                )}
              </div>

              {/* Thumbnail Strip */}
              {images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {images.map((imgUrl, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveImageIndex(idx)}
                      className={`relative w-14 h-14 rounded-lg overflow-hidden shrink-0 border-2 transition-all ${
                        activeImageIndex === idx
                          ? 'border-sky-500 scale-95 shadow-md shadow-sky-500/20'
                          : 'border-transparent opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={imgUrl} alt={`thumb-${idx}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Safety tip */}
            <div className="mt-4 p-3 rounded-xl bg-sky-500/5 border border-sky-500/15 text-[11px] text-secondary flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
              <span>
                Lời khuyên: Nên gặp trực tiếp kiểm tra hàng và thanh toán khi đã hài lòng để đảm bảo an toàn.
              </span>
            </div>
          </div>

          {/* Right Column: Information & Actions */}
          <div className="p-5 sm:p-6 flex flex-col justify-between space-y-5">
            <div className="space-y-4">
              {/* Price & Status */}
              <div className="flex items-center justify-between">
                <div className="text-2xl sm:text-3xl font-black text-sky-400 tracking-tight">
                  {formatPrice(item.price)}
                </div>
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-sky-500/15 text-sky-400 border border-sky-500/30">
                  {CONDITION_LABELS[item.condition] || item.condition}
                </span>
              </div>

              {/* Title */}
              <h2 className="text-lg sm:text-xl font-bold text-foreground leading-snug">
                {item.title}
              </h2>

              {/* Meta Grid */}
              <div className="grid grid-cols-2 gap-2 py-3 border-y border-border/60 text-xs text-secondary">
                <div className="flex items-center gap-1.5 truncate">
                  <MapPin className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                  <span className="truncate">{item.location || 'Toàn quốc'}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                  <span>{timeAgo(item.created_at)}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                  <span>{item.views_count || 0} lượt xem</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-sky-400">🏷️</span>
                  <span>{CATEGORY_LABELS[item.category]?.label || item.category}</span>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted">
                  Mô tả sản phẩm
                </h4>
                <p className="text-xs sm:text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto pr-2">
                  {item.description}
                </p>
              </div>

              {/* Seller Information Box */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Avatar
                    src={item.seller?.avatar_url}
                    name={item.seller?.full_name || item.seller?.username}
                    size="md"
                  />
                  <div>
                    <div className="text-xs sm:text-sm font-bold text-foreground">
                      {item.seller?.full_name || item.seller?.username}
                    </div>
                    <div className="text-[11px] text-muted">
                      @{item.seller?.username}
                    </div>
                  </div>
                </div>
                <div className="text-xs text-sky-400 font-semibold px-2.5 py-1 rounded-full bg-sky-500/10 border border-sky-500/20">
                  Người bán
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-2 border-t border-border/60">
              {isOwner ? (
                /* Owner Controls */
                <div className="flex flex-wrap gap-2">
                  {!isSold && (
                    <button
                      onClick={() => onMarkAsSold(item)}
                      className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-md shadow-emerald-600/20"
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>Đánh dấu đã bán</span>
                    </button>
                  )}

                  <button
                    onClick={() => onEdit(item)}
                    className="px-4 py-2.5 rounded-xl bg-card border border-border hover:border-sky-500/50 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
                  >
                    <Edit3 className="w-4 h-4 text-sky-400" />
                    <span>Sửa</span>
                  </button>

                  <button
                    onClick={() => onDelete(item.id)}
                    className="px-3.5 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Gỡ tin</span>
                  </button>
                </div>
              ) : (
                /* Buyer Controls */
                <div className="space-y-2">
                  {isSold ? (
                    <div className="w-full py-3 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-center text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400">
                      Sản phẩm này đã được bán
                    </div>
                  ) : (
                    <button
                      onClick={handleContactSeller}
                      className="w-full py-3 rounded-xl btn-anime text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-sky-500/25"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>Nhắn tin cho người bán qua Messenger</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
