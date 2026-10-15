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
    <div className="space-y-4">
      {/* Top Banner & Main Actions */}
      <div className="glass-card rounded-2xl p-4 md:p-6 relative overflow-hidden border border-sky-500/15">
        <div className="absolute -right-12 -top-12 w-48 h-48 bg-gradient-to-br from-sky-500/20 to-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-12 -bottom-12 w-48 h-48 bg-gradient-to-tr from-sky-400/15 to-purple-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">🛒</span>
              <h1 className="text-xl md:text-2xl font-black tracking-tight text-foreground">
                Chợ <span className="gradient-text">VnNet</span>
              </h1>
              <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-sky-500/15 text-sky-400 border border-sky-500/30">
                {totalItems} tin đăng
              </span>
            </div>
            <p className="text-xs md:text-sm text-secondary mt-1">
              Khám phá đồ công nghệ, thời trang, xe cộ, nhà đất và dịch vụ từ cộng đồng uy tín
            </p>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <button
              onClick={onOpenMyItems}
              className="px-3.5 py-2 rounded-xl bg-card border border-border text-xs sm:text-sm font-semibold hover:border-sky-500/50 hover:bg-sky-500/5 transition-all flex items-center gap-2"
            >
              <Package className="w-4 h-4 text-sky-400" />
              <span>Tin của tôi</span>
              {myItemsCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-sky-500 text-white text-[11px] font-bold flex items-center justify-center">
                  {myItemsCount}
                </span>
              )}
            </button>

            <button
              onClick={onOpenCreate}
              className="px-4 py-2 rounded-xl btn-anime text-xs sm:text-sm font-bold flex items-center gap-2 shadow-lg shadow-sky-500/20"
            >
              <PlusCircle className="w-4 h-4" />
              <span>+ Đăng bán</span>
            </button>
          </div>
        </div>

        {/* Search Bar & Filter Controls */}
        <div className="mt-4 pt-4 border-t border-border/50 flex flex-col sm:flex-row gap-2.5">
          <form onSubmit={handleSearchSubmit} className="relative flex-1">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm kiếm điện thoại, laptop, xe cộ, đồ gia dụng..."
              className="w-full pl-10 pr-10 py-2.5 rounded-xl input-anime text-xs sm:text-sm"
            />
            <Search className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
            {searchTerm && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  onFilterChange({ query: '', page: 0 });
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </form>

          <div className="relative flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowPriceFilter(!showPriceFilter)}
              className={`px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium border flex items-center gap-1.5 transition-all ${
                filters.minPrice || filters.maxPrice
                  ? 'bg-sky-500/15 border-sky-500 text-sky-400'
                  : 'bg-card border-border text-secondary hover:text-foreground hover:border-sky-500/40'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Khoảng giá</span>
              {(filters.minPrice || filters.maxPrice) && (
                <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" />
              )}
            </button>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="px-3 py-2.5 rounded-xl text-xs text-rose-400 hover:bg-rose-500/10 border border-rose-500/20 transition-colors"
                title="Xóa tất cả bộ lọc"
              >
                Đặt lại
              </button>
            )}

            {/* Price Filter Dropdown Modal */}
            {showPriceFilter && (
              <div className="absolute right-0 top-full mt-2 w-72 glass-card rounded-2xl p-4 shadow-2xl border border-sky-500/25 z-40 animate-slide-up">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted mb-3">
                  Lọc theo giá (VNĐ)
                </h4>
                <div className="space-y-3">
                  <div>
                    <label className="text-[11px] text-secondary">Từ mức giá</label>
                    <input
                      type="number"
                      placeholder="0 đ"
                      value={minPrice}
                      onChange={(e) => setMinPrice(e.target.value)}
                      className="w-full mt-1 px-3 py-1.5 text-xs rounded-lg input-anime"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-secondary">Đến mức giá</label>
                    <input
                      type="number"
                      placeholder="Không giới hạn"
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(e.target.value)}
                      className="w-full mt-1 px-3 py-1.5 text-xs rounded-lg input-anime"
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
                      className="flex-1 py-1.5 rounded-lg text-xs font-medium text-secondary hover:bg-card-border"
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
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
