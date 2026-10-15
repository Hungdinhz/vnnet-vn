'use client';

import React from 'react';
import { MapPin, Eye, Star, ShieldCheck } from 'lucide-react';
import { MarketplaceItem, CONDITION_LABELS } from '@/types/marketplace';
import Avatar from '@/components/ui/Avatar';

interface ItemCardProps {
  item: MarketplaceItem;
  onClick: () => void;
}

export function formatPrice(price: number): string {
  if (price === 0) return 'Miễn phí';
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(price);
}

export function timeAgo(dateStr: string): string {
  try {
    const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
    if (diff < 60) return 'Vừa xong';
    if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
    if (diff < 2592000) return `${Math.floor(diff / 86400)} ngày trước`;
    return new Date(dateStr).toLocaleDateString('vi-VN');
  } catch {
    return dateStr;
  }
}

export default function ItemCard({ item, onClick }: ItemCardProps) {
  const isSold = item.status === 'sold';
  const coverImage = item.image_urls && item.image_urls.length > 0 ? item.image_urls[0] : null;

  return (
    <div
      onClick={onClick}
      className="group glass-card glass-card-hover rounded-2xl overflow-hidden cursor-pointer flex flex-col transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-sky-500/10 border border-border/70 relative"
    >
      {/* Image Container with 4:3 Aspect Ratio */}
      <div className="relative aspect-[4/3] bg-zinc-900/40 overflow-hidden">
        {coverImage ? (
          <img
            src={coverImage}
            alt={item.title}
            className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 ${
              isSold ? 'grayscale opacity-75' : ''
            }`}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-muted gap-1 bg-gradient-to-br from-card to-card-border/30">
            <span className="text-3xl">📦</span>
            <span className="text-[11px]">Chưa có ảnh</span>
          </div>
        )}

        {/* Condition Badge */}
        <div className="absolute top-2.5 left-2.5 z-10">
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider backdrop-blur-md bg-black/60 text-sky-300 border border-sky-400/30">
            {CONDITION_LABELS[item.condition] || item.condition}
          </span>
        </div>

        {/* Sold Overlay Badge */}
        {isSold && (
          <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px] flex items-center justify-center z-10">
            <span className="px-4 py-1.5 rounded-xl bg-rose-600 text-white text-xs font-black tracking-widest uppercase shadow-lg shadow-rose-600/40 rotate-[-8deg] border-2 border-white/30">
              ĐÃ BÁN 🤝
            </span>
          </div>
        )}

        {/* Image Count Indicator */}
        {item.image_urls && item.image_urls.length > 1 && (
          <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-black/60 text-white backdrop-blur-sm">
            📷 {item.image_urls.length}
          </div>
        )}
      </div>

      {/* Content Container */}
      <div className="p-3.5 flex-1 flex flex-col justify-between space-y-2">
        <div className="space-y-1">
          {/* Price */}
          <div className="text-base sm:text-lg font-black text-sky-400 tracking-tight">
            {formatPrice(item.price)}
          </div>

          {/* Title */}
          <h3 className="text-xs sm:text-sm font-semibold text-foreground line-clamp-2 leading-snug group-hover:text-sky-400 transition-colors">
            {item.title}
          </h3>
        </div>

        {/* Meta: Location & Views */}
        <div className="space-y-2 pt-1 border-t border-border/40">
          <div className="flex items-center justify-between text-[11px] text-muted">
            <div className="flex items-center gap-1 truncate max-w-[65%]">
              <MapPin className="w-3 h-3 text-sky-400 shrink-0" />
              <span className="truncate">{item.location || 'Toàn quốc'}</span>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <Eye className="w-3 h-3" />
              <span>{item.views_count || 0}</span>
            </div>
          </div>

          {/* Seller Brief info */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-1.5 truncate">
              <Avatar
                src={item.seller?.avatar_url}
                name={item.seller?.full_name || item.seller?.username}
                size="xs"
              />
              <span className="text-xs font-medium text-secondary truncate max-w-[100px] sm:max-w-[120px]">
                {item.seller?.full_name || item.seller?.username}
              </span>
            </div>

            {/* Seller Rating Badge */}
            {item.seller?.rating_avg ? (
              <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-amber-500/10 text-amber-400 text-[11px] font-bold border border-amber-500/20">
                <Star className="w-3 h-3 fill-amber-400" />
                <span>{item.seller.rating_avg.toFixed(1)}</span>
              </div>
            ) : (
              <span className="text-[10px] text-muted flex items-center gap-0.5">
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                <span>Mới</span>
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
