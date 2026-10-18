'use client';

import React, { useState, useEffect } from 'react';
import { X, PlusCircle, CheckCircle, Edit3, Trash2, Eye, MapPin } from 'lucide-react';
import { MarketplaceItem } from '@/types/marketplace';
import Spinner from '@/components/ui/Spinner';
import { formatPrice } from './ItemCard';

interface MyItemsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  myItems: MarketplaceItem[];
  loading: boolean;
  onRefresh: () => void;
  onOpenCreate: () => void;
  onEdit: (item: MarketplaceItem) => void;
  onDelete: (id: number) => void;
  onMarkAsSold: (item: MarketplaceItem) => void;
  onSelectItem: (item: MarketplaceItem) => void;
}

export default function MyItemsPanel({
  isOpen,
  onClose,
  myItems,
  loading,
  onRefresh,
  onOpenCreate,
  onEdit,
  onDelete,
  onMarkAsSold,
  onSelectItem,
}: MyItemsPanelProps) {
  const [filter, setFilter] = useState<'all' | 'active' | 'sold'>('all');

  useEffect(() => {
    if (isOpen) {
      onRefresh();
    }
  }, [isOpen, onRefresh]);

  if (!isOpen) return null;

  const filteredItems = myItems.filter((item) => {
    if (filter === 'active') return item.status === 'active';
    if (filter === 'sold') return item.status === 'sold';
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />

      <div className="relative z-10 w-full max-w-3xl bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-900/90">
          <div className="flex items-center gap-2">
            <span className="text-xl">📦</span>
            <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">
              Quản lý tin đăng của tôi
            </h3>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-sky-500/15 text-sky-500 dark:text-sky-400">
              {myItems.length} tin
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onClose();
                onOpenCreate();
              }}
              className="px-3 py-1.5 rounded-xl btn-anime text-xs font-bold flex items-center gap-1.5 shadow-sm"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Đăng bán mới</span>
              <span className="sm:hidden">Đăng tin</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Filters */}
        <div className="px-4 sm:px-6 py-2.5 border-b border-slate-200 dark:border-slate-800/80 flex gap-1.5 sm:gap-2 bg-slate-50/40 dark:bg-slate-900/40">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              filter === 'all'
                ? 'bg-sky-500 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800/60'
            }`}
          >
            Tất cả ({myItems.length})
          </button>
          <button
            onClick={() => setFilter('active')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              filter === 'active'
                ? 'bg-sky-500 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800/60'
            }`}
          >
            Đang bán ({myItems.filter((i) => i.status === 'active').length})
          </button>
          <button
            onClick={() => setFilter('sold')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              filter === 'sold'
                ? 'bg-sky-500 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800/60'
            }`}
          >
            Đã bán ({myItems.filter((i) => i.status === 'sold').length})
          </button>
        </div>

        {/* Items List */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-3 bg-white dark:bg-slate-900">
          {loading ? (
            <div className="flex justify-center py-12">
              <Spinner size="lg" />
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <div className="text-4xl">🛍️</div>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                {filter === 'all'
                  ? 'Bạn chưa đăng bán sản phẩm nào trên Chợ.'
                  : `Không có sản phẩm nào ở trạng thái này.`}
              </p>
              <button
                onClick={() => {
                  onClose();
                  onOpenCreate();
                }}
                className="px-4 py-2 rounded-xl btn-anime text-xs font-bold inline-flex items-center gap-1.5 shadow-md shadow-sky-500/20"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Đăng sản phẩm đầu tiên</span>
              </button>
            </div>
          ) : (
            filteredItems.map((item) => {
              const coverImg =
                item.image_urls && item.image_urls.length > 0 ? item.image_urls[0] : null;
              const isSold = item.status === 'sold';

              return (
                <div
                  key={item.id}
                  className="p-3 sm:p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:border-sky-500/40 transition-all"
                >
                  <div
                    onClick={() => {
                      onClose();
                      onSelectItem(item);
                    }}
                    className="flex items-center gap-3 cursor-pointer flex-1 min-w-0 w-full sm:w-auto"
                  >
                    <div className="w-16 h-16 rounded-xl bg-slate-200 dark:bg-zinc-900 border border-slate-300 dark:border-slate-700 overflow-hidden shrink-0 relative">
                      {coverImg ? (
                        <img
                          src={coverImg}
                          alt={item.title}
                          className={`w-full h-full object-cover ${isSold ? 'grayscale opacity-75' : ''}`}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xl text-slate-400">
                          📦
                        </div>
                      )}
                      {isSold && (
                        <span className="absolute inset-0 bg-black/60 flex items-center justify-center text-[9px] font-bold text-white uppercase">
                          Đã bán
                        </span>
                      )}
                    </div>

                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs sm:text-sm font-bold text-sky-500 dark:text-sky-400">
                          {formatPrice(item.price)}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            isSold
                              ? 'bg-rose-500/10 text-rose-500 dark:text-rose-400 border border-rose-500/20'
                              : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                          }`}
                        >
                          {isSold ? 'Đã bán' : 'Đang bán'}
                        </span>
                      </div>
                      <h4 className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                        {item.title}
                      </h4>
                      <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400">
                        <span className="flex items-center gap-1">
                          <Eye className="w-3 h-3 text-sky-400" />
                          {item.views_count || 0} lượt xem
                        </span>
                        {item.location && (
                          <span className="flex items-center gap-1 truncate">
                            <MapPin className="w-3 h-3" />
                            {item.location}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-200 dark:border-slate-700/50">
                    {!isSold && (
                      <button
                        onClick={() => onMarkAsSold(item)}
                        className="px-2.5 py-1.5 rounded-lg bg-emerald-600/15 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-600/25 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1 transition-colors"
                        title="Đánh dấu đã bán"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>Đã bán</span>
                      </button>
                    )}

                    <button
                      onClick={() => {
                        onClose();
                        onEdit(item);
                      }}
                      className="p-2 rounded-lg bg-slate-200/60 dark:bg-slate-700/50 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
                      title="Sửa tin"
                    >
                      <Edit3 className="w-4 h-4 text-sky-500 dark:text-sky-400" />
                    </button>

                    <button
                      onClick={() => onDelete(item.id)}
                      className="p-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 dark:text-rose-400 border border-rose-500/20 transition-colors"
                      title="Xóa tin"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
