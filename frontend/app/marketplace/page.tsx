'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import MarketplaceHeader from '@/components/marketplace/MarketplaceHeader';
import CategoryFilter from '@/components/marketplace/CategoryFilter';
import ItemGrid from '@/components/marketplace/ItemGrid';
import ItemDetailModal from '@/components/marketplace/ItemDetailModal';
import CreateItemModal from '@/components/marketplace/CreateItemModal';
import SellerReviewModal from '@/components/marketplace/SellerReviewModal';
import SellerProfileModal from '@/components/marketplace/SellerProfileModal';
import MyItemsPanel from '@/components/marketplace/MyItemsPanel';
import { useMarketplace } from '@/hooks/useMarketplace';
import { useAuth } from '@/hooks/useAuth';
import { MarketplaceItem, MarketplaceCategory } from '@/types/marketplace';
import toast from 'react-hot-toast';

export default function MarketplacePage() {
  const { currentUser } = useAuth();
  const {
    items,
    myItems,
    loading,
    loadingMyItems,
    hasMore,
    totalElements,
    filters,
    setFilters,
    loadMore,
    fetchMyItems,
    createItem,
    updateItem,
    deleteItem,
    markAsSold,
    submitReview,
    getSellerProfile,
  } = useMarketplace();

  // Modals state
  const [selectedItem, setSelectedItem] = useState<MarketplaceItem | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MarketplaceItem | null>(null);
  const [isMyItemsOpen, setIsMyItemsOpen] = useState(false);
  const [reviewTarget, setReviewTarget] = useState<{ sellerId: number; itemId: number } | null>(null);
  const [viewingSellerId, setViewingSellerId] = useState<number | null>(null);

  // Fetch my items when user logs in
  useEffect(() => {
    if (currentUser) {
      fetchMyItems();
    }
  }, [currentUser, fetchMyItems]);

  // Handlers
  const handleOpenCreate = () => {
    if (!currentUser) {
      toast.error('Vui lòng đăng nhập để đăng bán sản phẩm');
      return;
    }
    setEditingItem(null);
    setIsCreateOpen(true);
  };

  const handleOpenEdit = (item: MarketplaceItem) => {
    setSelectedItem(null);
    setEditingItem(item);
    setIsCreateOpen(true);
  };

  const handleOpenMyItems = () => {
    if (!currentUser) {
      toast.error('Vui lòng đăng nhập để xem tin đăng của bạn');
      return;
    }
    setIsMyItemsOpen(true);
  };

  const handleSelectCategory = (category: MarketplaceCategory) => {
    setFilters({ ...filters, category, page: 0 });
  };

  const handleFilterChange = (newFilters: any) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  const handleCreateOrUpdate = async (data: any) => {
    if (editingItem) {
      const updated = await updateItem(editingItem.id, data);
      if (selectedItem?.id === editingItem.id) {
        setSelectedItem(updated);
      }
      return updated;
    } else {
      return await createItem(data);
    }
  };

  const handleDeleteItem = async (id: number) => {
    if (window.confirm('Bạn có chắc chắn muốn gỡ sản phẩm này khỏi Chợ?')) {
      await deleteItem(id);
      if (selectedItem?.id === id) {
        setSelectedItem(null);
      }
    }
  };

  const handleMarkAsSold = async (item: MarketplaceItem) => {
    const buyerUsername = window.prompt(
      'Nhập username của người mua (để người mua có thể đánh giá bạn, hoặc nhấn OK để bỏ qua):',
      ''
    );
    const updated = await markAsSold(item.id, {
      buyer_username: buyerUsername ? buyerUsername.trim() : undefined,
    });
    if (selectedItem?.id === item.id) {
      setSelectedItem(updated);
    }
  };

  const handleOpenReview = (sellerId: number, itemId: number) => {
    if (!currentUser) {
      toast.error('Vui lòng đăng nhập để gửi đánh giá');
      return;
    }
    setReviewTarget({ sellerId, itemId });
  };

  const handleSubmitReview = async (
    sellerId: number,
    data: { item_id?: number; rating: number; comment?: string }
  ) => {
    return await submitReview(sellerId, data);
  };

  const handleViewSellerProfile = (sellerId: number) => {
    setViewingSellerId(sellerId);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      <div className="max-w-7xl mx-auto flex gap-4 px-2 md:px-4">
        {/* Left Sidebar */}
        <Sidebar />

        {/* Main Marketplace Content */}
        <main className="flex-1 py-4 md:py-6 max-w-5xl mx-auto space-y-4">
          {/* Header & Search */}
          <MarketplaceHeader
            filters={filters}
            onFilterChange={handleFilterChange}
            onOpenCreate={handleOpenCreate}
            onOpenMyItems={handleOpenMyItems}
            myItemsCount={myItems.length}
            totalItems={totalElements}
          />

          {/* Horizontal Category Carousel */}
          <CategoryFilter
            selectedCategory={filters.category || 'all'}
            onSelectCategory={handleSelectCategory}
          />

          {/* Products Grid */}
          <ItemGrid
            items={items}
            loading={loading}
            hasMore={hasMore}
            onLoadMore={loadMore}
            onSelectItem={(item) => setSelectedItem(item)}
            onOpenCreate={handleOpenCreate}
          />
        </main>
      </div>

      {/* Item Detail Modal */}
      <ItemDetailModal
        item={selectedItem}
        onClose={() => setSelectedItem(null)}
        currentUserId={currentUser?.id}
        onEdit={handleOpenEdit}
        onDelete={handleDeleteItem}
        onMarkAsSold={handleMarkAsSold}
        onOpenReviewSeller={handleOpenReview}
        onViewSellerProfile={handleViewSellerProfile}
      />

      {/* Create / Edit Item Modal */}
      <CreateItemModal
        isOpen={isCreateOpen}
        onClose={() => {
          setIsCreateOpen(false);
          setEditingItem(null);
        }}
        onSubmit={handleCreateOrUpdate}
        editingItem={editingItem}
        defaultLocation={currentUser?.location || undefined}
      />

      {/* My Items Drawer / Modal */}
      <MyItemsPanel
        isOpen={isMyItemsOpen}
        onClose={() => setIsMyItemsOpen(false)}
        myItems={myItems}
        loading={loadingMyItems}
        onRefresh={fetchMyItems}
        onOpenCreate={handleOpenCreate}
        onEdit={handleOpenEdit}
        onDelete={handleDeleteItem}
        onMarkAsSold={handleMarkAsSold}
        onSelectItem={(item) => setSelectedItem(item)}
      />

      {/* Seller Review Modal (Buyer evaluating seller) */}
      <SellerReviewModal
        isOpen={Boolean(reviewTarget)}
        onClose={() => setReviewTarget(null)}
        sellerId={reviewTarget?.sellerId || null}
        itemId={reviewTarget?.itemId || null}
        onSubmit={handleSubmitReview}
      />

      {/* Seller Profile & Reviews Modal */}
      <SellerProfileModal
        isOpen={Boolean(viewingSellerId)}
        onClose={() => setViewingSellerId(null)}
        sellerId={viewingSellerId}
        onFetchProfile={getSellerProfile}
      />
    </div>
  );
}
