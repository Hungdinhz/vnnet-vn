'use client';

import React, { useState } from 'react';
import { Search, PlusCircle, Package, SlidersHorizontal, X } from 'lucide-react';
import { MarketplaceFilters } from '@/types/marketplace';

interface MarketplaceHeaderProps {
  filters: MarketplaceFilters;
  onFilterChange: (filters: Partial<MarketplaceFilters>) => void;
  onOpenCreate: () => void;
  onOpenMyItems: () => void;
  myItemsCount?: number;
  totalItems: number;
}

export default function MarketplaceHeader({
  filters,
  onFilterChange,
  onOpenCreate,
  onOpenMyItems,
  myItemsCount = 0,
  totalItems,
}: MarketplaceHeaderProps) {
  const [searchTerm, setSearchTerm] = useState(filters.query || '');
  const [showPriceFilter, setShowPriceFilter] = useState(false);
  const [minPrice, setMinPrice] = useState<string>(filters.minPrice ? String(filters.minPrice) : '');
  const [maxPrice, setMaxPrice] = useState<string>(filters.maxPrice ? String(filters.maxPrice) : '');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onFilterChange({ query: searchTerm, page: 0 });
  };

  const handleApplyPrice = () => {
    onFilterChange({
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      page: 0,
    });
    setShowPriceFilter(false);
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setMinPrice('');
    setMaxPrice('');
    onFilterChange({
      query: '',
      minPrice: undefined,
      maxPrice: undefined,
      category: 'all',
      page: 0,
    });
  };

  const hasActiveFilters =
    Boolean(filters.query) ||
    Boolean(filters.minPrice) ||
    Boolean(filters.maxPrice) ||
    (filters.category && filters.category !== 'all');

  return (
    <div className="space-y-3 sm:space-y-4 w-full min-w-0">
      {/* Top Banner & Main Actions */}
      <div className="glass-card rounded-2xl p-3 sm:p-5 md:p-6 relative border border-sky-500/15">
        <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
          <div className="absolute -right-12 -top-12 w-48 h-48 bg-gradient-to-br from-sky-500/20 to-indigo-500/20 rounded-full blur-3xl" />
          <div className="absolute -left-12 -bottom-12 w-48 h-48 bg-gradient-to-tr from-sky-400/15 to-purple-500/15 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xl sm:text-2xl shrink-0">🛒</span>
              <h1 className="text-lg sm:text-xl md:text-2xl font-black tracking-tight text-foreground">
                Chợ <span className="gradient-text">VnNet</span>
              </h1>
              <span className="px-2 py-0.5 text-[11px] sm:text-xs font-semibold rounded-full bg-sky-500/15 text-sky-400 border border-sky-500/30">
                {totalItems} tin
              </span>
            </div>
            <p className="text-[11px] sm:text-xs md:text-sm text-secondary mt-0.5 sm:mt-1 line-clamp-2">
              Khám phá đồ công nghệ, thời trang, xe cộ, nhà đất và dịch vụ từ cộng đồng uy tín
            </p>
          </div>

          {/* Action buttons: 2 columns on mobile, flex on desktop */}
          <div className="grid grid-cols-2 gap-2 w-full sm:w-auto sm:flex sm:items-center shrink-0">
            <button
              onClick={onOpenMyItems}
              className="w-full sm:w-auto px-3 py-2 rounded-xl bg-card border border-border text-xs sm:text-sm font-semibold hover:border-sky-500/50 hover:bg-sky-500/5 transition-all flex items-center justify-center gap-1.5"
            >
              <Package className="w-4 h-4 text-sky-400 shrink-0" />
              <span className="truncate">Tin của tôi</span>
              {myItemsCount > 0 && (
                <span className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-sky-500 text-white text-[10px] sm:text-[11px] font-bold flex items-center justify-center shrink-0">
                  {myItemsCount}
                </span>
              )}
            </button>

            <button
              onClick={onOpenCreate}
              className="w-full sm:w-auto px-3.5 py-2 rounded-xl btn-anime text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 shadow-md shadow-sky-500/20"
            >
              <PlusCircle className="w-4 h-4 shrink-0" />
              <span>+ Đăng bán</span>
            </button>
          </div>
        </div>

        {/* Search Bar & Filter Controls */}
        <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-border/50 flex flex-col sm:flex-row gap-2 sm:gap-2.5">
          <form onSubmit={handleSearchSubmit} className="relative flex-1 min-w-0 w-full">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm điện thoại, xe cộ, laptop, thời trang..."
              className="w-full pl-9 pr-8 py-2 sm:py-2.5 rounded-xl input-anime text-xs sm:text-sm"
            />
            <Search className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
            {searchTerm && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  onFilterChange({ query: '', page: 0 });
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-muted hover:text-foreground"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </form>

          <div className="relative flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-start">
            <button
              type="button"
              onClick={() => setShowPriceFilter(!showPriceFilter)}
              className={`flex-1 sm:flex-none px-3 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-medium border flex items-center justify-center gap-1.5 transition-all ${
                filters.minPrice || filters.maxPrice
                  ? 'bg-sky-500/15 border-sky-500 text-sky-400'
                  : 'bg-card border-border text-secondary hover:text-foreground hover:border-sky-500/40'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5 shrink-0" />
              <span>Khoảng giá</span>
              {(filters.minPrice || filters.maxPrice) && (
                <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" />
              )}
            </button>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="px-2.5 py-2 sm:py-2.5 rounded-xl text-xs text-rose-400 hover:bg-rose-500/10 border border-rose-500/20 transition-colors shrink-0"
                title="Xóa tất cả bộ lọc"
              >
                Đặt lại
              </button>
            )}

            {/* Price Filter Dropdown Modal (Mobile-safe width & outside click) */}
            {showPriceFilter && (
              <>
                <div
                  className="fixed inset-0 z-30"
                  onClick={() => setShowPriceFilter(false)}
                />
                <div className="absolute right-0 top-full mt-2 w-[calc(100vw-2.5rem)] sm:w-72 max-w-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-2xl p-4 shadow-2xl border border-slate-200 dark:border-slate-800 z-40 animate-slide-up">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
                    Lọc theo giá (VNĐ)
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <label className="text-[11px] text-slate-500 dark:text-slate-400">Từ mức giá</label>
                      <input
                        type="number"
                        placeholder="0 đ"
                        value={minPrice}
                        onChange={(e) => setMinPrice(e.target.value)}
                        className="w-full mt-1 px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-500 dark:text-slate-400">Đến mức giá</label>
                      <input
                        type="number"
                        placeholder="Không giới hạn"
                        value={maxPrice}
                        onChange={(e) => setMaxPrice(e.target.value)}
                        className="w-full mt-1 px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
                      />
                    </div>
                    <div className="flex gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setMinPrice('');
                          setMaxPrice('');
                          onFilterChange({ minPrice: undefined, maxPrice: undefined, page: 0 });
                          setShowPriceFilter(false);
                        }}
                        className="flex-1 py-1.5 rounded-lg text-xs font-medium text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      >
                        Bỏ lọc
                      </button>
                      <button
                        type="button"
                        onClick={handleApplyPrice}
                        className="flex-1 py-1.5 rounded-lg text-xs font-bold btn-anime"
                      >
                        Áp dụng
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
