'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import MarketplaceHeader from '@/components/marketplace/MarketplaceHeader';
import CategoryFilter from '@/components/marketplace/CategoryFilter';
import ItemGrid from '@/components/marketplace/ItemGrid';
import ItemDetailModal from '@/components/marketplace/ItemDetailModal';
import CreateItemModal from '@/components/marketplace/CreateItemModal';
import MyItemsPanel from '@/components/marketplace/MyItemsPanel';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { useMarketplace } from '@/hooks/useMarketplace';
import { useAuth } from '@/hooks/useAuth';
import { MarketplaceItem, MarketplaceCategory } from '@/types/marketplace';
import toast from 'react-hot-toast';

export default function MarketplacePage() {
  const router = useRouter();
  const { currentUser } = useAuth();
  const {
    items,
    setItems,
    myItems,
    setMyItems,
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
    viewItem,
  } = useMarketplace();

  // Modals state
  const [selectedItem, setSelectedItem] = useState<MarketplaceItem | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MarketplaceItem | null>(null);
  const [isMyItemsOpen, setIsMyItemsOpen] = useState(false);
  const activeDetailIdRef = useRef<number | null>(null);

  const handleCloseDetail = () => {
    activeDetailIdRef.current = null;
    setSelectedItem(null);
  };

  // Interactive Confirmation Dialog State
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText: string;
    cancelText?: string;
    variant: 'danger' | 'success' | 'warning' | 'primary';
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Xác nhận',
    variant: 'primary',
    onConfirm: () => {},
  });

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
      router.push('/login');
      return;
    }
    setEditingItem(null);
    setIsCreateOpen(true);
  };

  const handleOpenEdit = (item: MarketplaceItem) => {
    setIsMyItemsOpen(false);
    setSelectedItem(null);
    setEditingItem(item);
    setIsCreateOpen(true);
  };

  const handleOpenMyItems = () => {
    if (!currentUser) {
      toast.error('Vui lòng đăng nhập để xem tin đăng của bạn');
      router.push('/login');
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

  const handleDeleteItem = (id: number) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Gỡ bài đăng khỏi Chợ?',
      message: 'Bạn có chắc chắn muốn gỡ sản phẩm này không? Sau khi gỡ, người mua sẽ không thể tìm thấy tin đăng này trên Chợ nữa.',
      confirmText: 'Xác nhận gỡ tin',
      cancelText: 'Giữ lại',
      variant: 'danger',
      onConfirm: async () => {
        await deleteItem(id);
        if (selectedItem?.id === id) {
          setSelectedItem(null);
        }
      },
    });
  };

  const handleMarkAsSold = (item: MarketplaceItem) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Xác nhận đã bán sản phẩm?',
      message: 'Chúc mừng bạn đã bán thành công! Sản phẩm sẽ được gắn nhãn "Đã bán" 🤝 và sẽ tự động biến mất khỏi trang Chợ sau 6 tiếng.',
      confirmText: 'Xác nhận đã bán',
      cancelText: 'Chưa bán',
      variant: 'success',
      onConfirm: async () => {
        const updated = await markAsSold(item.id);
        if (selectedItem?.id === item.id) {
          setSelectedItem(updated);
        }
      },
    });
  };

  const handleSelectItem = async (item: MarketplaceItem) => {
    activeDetailIdRef.current = item.id;

    // 1. Phản hồi tức thì trên giao diện: mở modal và tăng 1 lượt xem ngay lập tức
    const optimisticViews = (item.views_count || 0) + 1;
    const optimisticItem = { ...item, views_count: optimisticViews };
    setSelectedItem(optimisticItem);

    // Cập nhật lượt xem trên card trong danh sách tức thì
    setItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, views_count: optimisticViews } : i))
    );
    setMyItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, views_count: optimisticViews } : i))
    );

    // 2. Gọi API để backend ghi nhận lượt xem vào Database theo thời gian thực
    const fresh = await viewItem(item.id);
    // Chỉ cập nhật nếu modal vẫn đang mở đúng sản phẩm này (không tự ý hiện lại khi đã đóng)
    if (fresh && activeDetailIdRef.current === item.id) {
      setSelectedItem(fresh);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      <div className="max-w-7xl mx-auto flex gap-4 px-2 sm:px-4 w-full min-w-0">
        {/* Left Sidebar */}
        <Sidebar />

        {/* Main Marketplace Content */}
        <main className="flex-1 py-3 sm:py-5 md:py-6 max-w-5xl mx-auto space-y-3 sm:space-y-4 w-full min-w-0">
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
            onSelectItem={handleSelectItem}
            onOpenCreate={handleOpenCreate}
          />
        </main>
      </div>

      {/* Item Detail Modal */}
      <ItemDetailModal
        item={selectedItem}
        onClose={handleCloseDetail}
        currentUserId={currentUser?.id}
        onEdit={handleOpenEdit}
        onDelete={handleDeleteItem}
        onMarkAsSold={handleMarkAsSold}
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
        onSelectItem={handleSelectItem}
      />

      {/* Interactive Confirmation Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmText={confirmDialog.confirmText}
        cancelText={confirmDialog.cancelText}
        variant={confirmDialog.variant}
      />
    </div>
  );
}
