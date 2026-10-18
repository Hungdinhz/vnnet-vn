'use client';

import { useState, useCallback, useEffect } from 'react';
import api from '@/lib/axios';
import { MarketplaceItem, MarketplaceFilters, SellerReview, SellerProfile } from '@/types/marketplace';
import toast from 'react-hot-toast';

export function useMarketplace() {
  const [items, setItems] = useState<MarketplaceItem[]>([]);
  const [myItems, setMyItems] = useState<MarketplaceItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMyItems, setLoadingMyItems] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [totalElements, setTotalElements] = useState(0);

  const [filters, setFilters] = useState<MarketplaceFilters>({
    category: 'all',
    query: '',
    minPrice: undefined,
    maxPrice: undefined,
    page: 0,
    size: 12,
  });

  // Fetch danh sách sản phẩm với filters
  const fetchItems = useCallback(async (currentFilters: MarketplaceFilters, isLoadMore = false) => {
    setLoading(true);
    try {
      const params: Record<string, any> = {
        page: currentFilters.page ?? 0,
        size: currentFilters.size ?? 12,
      };

      if (currentFilters.category && currentFilters.category !== 'all') {
        params.category = currentFilters.category;
      }
      if (currentFilters.query && currentFilters.query.trim()) {
        params.query = currentFilters.query.trim();
      }
      if (currentFilters.minPrice !== undefined && currentFilters.minPrice > 0) {
        params.min_price = currentFilters.minPrice;
      }
      if (currentFilters.maxPrice !== undefined && currentFilters.maxPrice > 0) {
        params.max_price = currentFilters.maxPrice;
      }

      const res = await api.get('/marketplace', { params });
      const data = res.data;

      if (isLoadMore) {
        setItems((prev) => [...prev, ...(data.content || [])]);
      } else {
        setItems(data.content || []);
      }

      setPage(data.page ?? 0);
      setHasMore(data.has_next ?? false);
      setTotalElements(data.total_elements ?? 0);
    } catch (err: any) {
      console.warn('Lỗi tải danh sách chợ:', err?.message);
      // Chỉ hiện toast khi người dùng chủ động tải thêm trang
      if (isLoadMore) {
        toast.error('Không thể tải thêm sản phẩm');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Tải danh sách khi filters thay đổi
  useEffect(() => {
    fetchItems(filters, false);
  }, [filters, fetchItems]);

  // Tải thêm trang tiếp theo (Pagination / Infinite scroll)
  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      const nextPage = page + 1;
      const nextFilters = { ...filters, page: nextPage };
      setFilters(nextFilters);
      fetchItems(nextFilters, true);
    }
  }, [loading, hasMore, page, filters, fetchItems]);

  // Fetch tin đăng của người dùng hiện tại
  const fetchMyItems = useCallback(async () => {
    if (typeof window === 'undefined') return;
    const token = localStorage.getItem('token');
    if (!token) {
      setMyItems([]);
      return;
    }
    setLoadingMyItems(true);
    try {
      const res = await api.get('/marketplace/my-items');
      setMyItems(res.data || []);
    } catch (err: any) {
      console.warn('Lỗi tải tin đăng của tôi:', err?.message);
    } finally {
      setLoadingMyItems(false);
    }
  }, []);

  // Tạo sản phẩm mới
  const createItem = async (data: {
    title: string;
    description: string;
    price: number;
    category: string;
    condition?: string;
    location?: string;
    image_urls?: string[];
  }) => {
    try {
      const res = await api.post('/marketplace', data);
      toast.success('Đã đăng sản phẩm lên Chợ thành công! 🎉');
      setItems((prev) => [res.data, ...prev]);
      fetchMyItems();
      return res.data;
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Không thể đăng sản phẩm. Vui lòng thử lại';
      toast.error(msg);
      throw err;
    }
  };

  // Cập nhật sản phẩm
  const updateItem = async (
    id: number,
    data: {
      title?: string;
      description?: string;
      price?: number;
      category?: string;
      condition?: string;
      location?: string;
      image_urls?: string[];
      status?: string;
    }
  ) => {
    try {
      const res = await api.put(`/marketplace/${id}`, data);
      toast.success('Đã cập nhật sản phẩm thành công!');
      setItems((prev) => prev.map((item) => (item.id === id ? res.data : item)));
      setMyItems((prev) => prev.map((item) => (item.id === id ? res.data : item)));
      return res.data;
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Không thể cập nhật sản phẩm';
      toast.error(msg);
      throw err;
    }
  };

  // Xóa sản phẩm
  const deleteItem = async (id: number) => {
    try {
      await api.delete(`/marketplace/${id}`);
      toast.success('Đã gỡ bài đăng thành công');
      setItems((prev) => prev.filter((item) => item.id !== id));
      setMyItems((prev) => prev.filter((item) => item.id !== id));
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Không thể xóa sản phẩm';
      toast.error(msg);
      throw err;
    }
  };

  // Đánh dấu đã bán
  const markAsSold = async (id: number, buyerInfo?: { buyer_id?: number; buyer_username?: string }) => {
    try {
      const res = await api.patch(`/marketplace/${id}/sold`, buyerInfo || {});
      toast.success('Đã đánh dấu sản phẩm là Đã bán! 🤝');
      setItems((prev) => prev.map((item) => (item.id === id ? res.data : item)));
      setMyItems((prev) => prev.map((item) => (item.id === id ? res.data : item)));
      return res.data;
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Không thể cập nhật trạng thái đã bán';
      toast.error(msg);
      throw err;
    }
  };

  // Đánh giá người bán (chỉ người mua)
  const submitReview = async (
    sellerId: number,
    data: { item_id?: number; rating: number; comment?: string }
  ) => {
    try {
      const res = await api.post(`/marketplace/sellers/${sellerId}/reviews`, data);
      toast.success('Cảm ơn bạn đã gửi đánh giá người bán! ⭐');
      return res.data;
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Không thể gửi đánh giá. Vui lòng kiểm tra lại';
      toast.error(msg);
      throw err;
    }
  };

  // Lấy hồ sơ người bán
  const getSellerProfile = async (sellerId: number): Promise<SellerProfile> => {
    const res = await api.get(`/marketplace/sellers/${sellerId}/profile`);
    return res.data;
  };

  // Lấy chi tiết sản phẩm và ghi nhận lượt xem theo thời gian thực
  const viewItem = async (id: number): Promise<MarketplaceItem | null> => {
    try {
      const res = await api.get(`/marketplace/${id}`);
      if (res.data) {
        setItems((prev) =>
          prev.map((i) => (i.id === id ? { ...i, views_count: res.data.views_count } : i))
        );
        setMyItems((prev) =>
          prev.map((i) => (i.id === id ? { ...i, views_count: res.data.views_count } : i))
        );
        return res.data;
      }
      return null;
    } catch (err: any) {
      console.warn('Lỗi khi tải chi tiết sản phẩm:', err?.message);
      return null;
    }
  };

  return {
    items,
    setItems,
    myItems,
    setMyItems,
    loading,
    loadingMyItems,
    page,
    hasMore,
    totalElements,
    filters,
    setFilters,
    fetchItems,
    loadMore,
    fetchMyItems,
    createItem,
    updateItem,
    deleteItem,
    markAsSold,
    viewItem,
    submitReview,
    getSellerProfile,
  };
}
