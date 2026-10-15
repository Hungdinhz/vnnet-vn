'use client';

import React from 'react';
import ItemCard from './ItemCard';
import { MarketplaceItem } from '@/types/marketplace';
import Spinner from '@/components/ui/Spinner';
import EmptyState from '@/components/ui/EmptyState';
import { PlusCircle } from 'lucide-react';

interface ItemGridProps {
  items: MarketplaceItem[];
  loading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  onSelectItem: (item: MarketplaceItem) => void;
  onOpenCreate: () => void;
}

export default function ItemGrid({
  items,
  loading,
  hasMore,
  onLoadMore,
  onSelectItem,
  onOpenCreate,
}: ItemGridProps) {
  if (!loading && items.length === 0) {
    return (
      <EmptyState
        title="Chưa có sản phẩm nào phù hợp"
        description="Hãy thử tìm với từ khóa khác, thay đổi danh mục hoặc là người đầu tiên đăng bán sản phẩm tại đây!"
        action={
          <button
            onClick={onOpenCreate}
            className="px-5 py-2.5 rounded-xl btn-anime text-xs sm:text-sm font-bold flex items-center gap-2 shadow-lg"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ Đăng bán ngay</span>
          </button>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* 2 cols on mobile, 3 on md, 4 on xl */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
        {items.map((item) => (
          <ItemCard
            key={item.id}
            item={item}
            onClick={() => onSelectItem(item)}
          />
        ))}
      </div>

      {/* Loading indicator */}
      {loading && (
        <div className="flex justify-center py-8">
          <Spinner size="lg" />
        </div>
      )}

      {/* Load More Button */}
      {!loading && hasMore && (
        <div className="flex justify-center pt-2 pb-6">
          <button
            onClick={onLoadMore}
            className="px-6 py-2.5 rounded-xl bg-card border border-border hover:border-sky-500/50 hover:bg-sky-500/5 text-xs sm:text-sm font-semibold transition-all shadow-sm"
          >
            Xem thêm sản phẩm khác
          </button>
        </div>
      )}
    </div>
  );
}
