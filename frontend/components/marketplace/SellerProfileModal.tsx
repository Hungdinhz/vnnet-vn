'use client';

import React, { useEffect, useState } from 'react';
import { X, Star, MapPin, Package, CheckCircle, ShieldCheck } from 'lucide-react';
import { SellerProfile } from '@/types/marketplace';
import Avatar from '@/components/ui/Avatar';
import Spinner from '@/components/ui/Spinner';
import { timeAgo } from './ItemCard';

interface SellerProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  sellerId: number | null;
  onFetchProfile: (sellerId: number) => Promise<SellerProfile>;
}

export default function SellerProfileModal({
  isOpen,
  onClose,
  sellerId,
  onFetchProfile,
}: SellerProfileModalProps) {
  const [profile, setProfile] = useState<SellerProfile | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && sellerId) {
      setLoading(true);
      onFetchProfile(sellerId)
        .then((data) => setProfile(data))
        .catch((err) => console.error('Lỗi lấy hồ sơ người bán:', err))
        .finally(() => setLoading(false));
    } else {
      setProfile(null);
    }
  }, [isOpen, sellerId, onFetchProfile]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />

      <div className="relative z-10 w-full max-w-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-3.5 sm:py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-900/90">
          <div className="flex items-center gap-2">
            <span className="text-xl">👤</span>
            <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">Hồ sơ người bán</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {loading ? (
            <div className="flex justify-center py-12">
              <Spinner size="lg" />
            </div>
          ) : profile ? (
            <>
              {/* Seller Overview Card */}
              <div className="p-4 rounded-2xl glass-card border border-sky-500/20 flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-left">
                <Avatar
                  src={profile.avatar_url}
                  name={profile.full_name || profile.username}
                  size="xl"
                  glow
                />

                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center justify-center sm:justify-start gap-2">
                    <h4 className="text-base sm:text-lg font-bold text-foreground">
                      {profile.full_name || profile.username}
                    </h4>
                    <ShieldCheck className="w-4 h-4 text-sky-400" />
                  </div>
                  <p className="text-xs text-muted">@{profile.username}</p>

                  {profile.location && (
                    <div className="flex items-center justify-center sm:justify-start gap-1 text-xs text-secondary pt-0.5">
                      <MapPin className="w-3.5 h-3.5 text-sky-400" />
                      <span>{profile.location}</span>
                    </div>
                  )}

                  {/* Rating Stars Summary */}
                  <div className="pt-2 flex items-center justify-center sm:justify-start gap-1.5">
                    {profile.rating_avg ? (
                      <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-400 text-xs font-bold border border-amber-500/20">
                        <Star className="w-4 h-4 fill-amber-400" />
                        <span>{profile.rating_avg.toFixed(1)} / 5</span>
                        <span className="text-muted font-normal">
                          ({profile.rating_count} đánh giá từ người mua)
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-muted">Chưa có đánh giá nào</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Stats Counters */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl bg-card-border/30 border border-border/70 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center">
                    <Package className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-lg font-black text-foreground">
                      {profile.active_items_count}
                    </div>
                    <div className="text-xs text-secondary">Đang rao bán</div>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-card-border/30 border border-border/70 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                    <CheckCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-lg font-black text-foreground">
                      {profile.sold_items_count}
                    </div>
                    <div className="text-xs text-secondary">Đã giao dịch xong</div>
                  </div>
                </div>
              </div>

              {/* Reviews List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h5 className="text-xs font-bold uppercase tracking-wider text-muted">
                    Đánh giá từ người mua ({profile.reviews?.length || 0})
                  </h5>
                </div>

                {profile.reviews && profile.reviews.length > 0 ? (
                  <div className="space-y-2.5">
                    {profile.reviews.map((rev) => (
                      <div
                        key={rev.id}
                        className="p-3.5 rounded-xl bg-card-border/20 border border-border/60 space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Avatar
                              src={rev.reviewer?.avatar_url}
                              name={rev.reviewer?.full_name || rev.reviewer?.username}
                              size="sm"
                            />
                            <div>
                              <div className="text-xs font-semibold text-foreground">
                                {rev.reviewer?.full_name || rev.reviewer?.username}
                              </div>
                              <div className="text-[10px] text-muted">
                                {timeAgo(rev.created_at)}
                              </div>
                            </div>
                          </div>

                          {/* Rating Stars */}
                          <div className="flex items-center gap-0.5">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star
                                key={s}
                                className={`w-3.5 h-3.5 ${
                                  s <= rev.rating
                                    ? 'text-amber-400 fill-amber-400'
                                    : 'text-zinc-600'
                                }`}
                              />
                            ))}
                          </div>
                        </div>

                        {rev.item_title && (
                          <div className="text-[11px] text-sky-400/90 font-medium truncate">
                            📦 Sản phẩm: {rev.item_title}
                          </div>
                        )}

                        {rev.comment && (
                          <p className="text-xs text-secondary leading-relaxed">
                            {rev.comment}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 text-center text-xs text-muted rounded-xl bg-card-border/10 border border-dashed border-border">
                    Người bán này chưa có nhận xét nào từ người mua.
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-xs text-muted">
              Không tìm thấy thông tin người bán
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
