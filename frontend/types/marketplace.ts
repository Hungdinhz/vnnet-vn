export interface MarketplaceItem {
  id: number;
  title: string;
  description: string;
  price: number;
  category: MarketplaceCategory;
  condition: ItemCondition;
  location?: string;
  image_urls: string[];
  status: ItemStatus;
  seller_id: number;
  seller: MarketplaceSeller;
  buyer_id?: number;
  buyer?: {
    id: number;
    username: string;
    full_name?: string;
    avatar_url?: string;
  };
  views_count: number;
  created_at: string;
  updated_at?: string;
}

export interface MarketplaceSeller {
  id: number;
  username: string;
  full_name?: string;
  avatar_url?: string;
  location?: string;
  rating_avg?: number;
  rating_count?: number;
}

export interface SellerReview {
  id: number;
  seller_id: number;
  reviewer_id: number;
  reviewer: {
    id: number;
    username: string;
    full_name?: string;
    avatar_url?: string;
  };
  item_id?: number;
  item_title?: string;
  rating: number; // 1 to 5
  comment?: string;
  created_at: string;
}

export interface SellerProfile {
  id: number;
  username: string;
  full_name?: string;
  avatar_url?: string;
  location?: string;
  rating_avg?: number;
  rating_count?: number;
  active_items_count: number;
  sold_items_count: number;
  reviews: SellerReview[];
}

export type MarketplaceCategory =
  | 'all'
  | 'dien-tu'
  | 'thoi-trang'
  | 'xe-co'
  | 'nha-dat'
  | 'do-gia-dung'
  | 'the-thao'
  | 'sach-van-phong'
  | 'thu-cung'
  | 'do-an-thuc-uong'
  | 'dich-vu'
  | 'viec-lam'
  | 'khac';

export type ItemCondition = 'new' | 'like_new' | 'used' | 'fair';
export type ItemStatus = 'active' | 'sold' | 'hidden';

export interface MarketplaceFilters {
  category?: MarketplaceCategory;
  query?: string;
  minPrice?: number;
  maxPrice?: number;
  page?: number;
  size?: number;
}

export const CATEGORY_LABELS: Record<MarketplaceCategory, { label: string; icon: string }> = {
  'all':              { label: 'Tất cả',         icon: '🛍️' },
  'dien-tu':          { label: 'Điện tử',        icon: '📱' },
  'thoi-trang':       { label: 'Thời trang',     icon: '👗' },
  'xe-co':            { label: 'Xe cộ',          icon: '🚗' },
  'nha-dat':          { label: 'Nhà đất',        icon: '🏠' },
  'do-gia-dung':      { label: 'Đồ gia dụng',   icon: '🏡' },
  'the-thao':         { label: 'Thể thao',       icon: '⚽' },
  'sach-van-phong':   { label: 'Sách & VP',      icon: '📚' },
  'thu-cung':         { label: 'Thú cưng',       icon: '🐕' },
  'do-an-thuc-uong':  { label: 'Ăn uống',        icon: '🍜' },
  'dich-vu':          { label: 'Dịch vụ',        icon: '🔧' },
  'viec-lam':         { label: 'Việc làm',       icon: '💼' },
  'khac':             { label: 'Khác',           icon: '📦' },
};

export const CONDITION_LABELS: Record<ItemCondition, string> = {
  'new': 'Mới 100%',
  'like_new': 'Như mới',
  'used': 'Đã sử dụng',
  'fair': 'Cũ / có tì vết',
};
