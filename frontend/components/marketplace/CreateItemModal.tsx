'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, Upload, Trash2, ImagePlus } from 'lucide-react';
import { MarketplaceItem, MarketplaceCategory, ItemCondition, CATEGORY_LABELS, CONDITION_LABELS } from '@/types/marketplace';
import api from '@/lib/axios';
import Spinner from '@/components/ui/Spinner';
import toast from 'react-hot-toast';

interface CreateItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<any>;
  editingItem?: MarketplaceItem | null;
  defaultLocation?: string;
}

export default function CreateItemModal({
  isOpen,
  onClose,
  onSubmit,
  editingItem,
  defaultLocation,
}: CreateItemModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState<string>('');
  const [category, setCategory] = useState<MarketplaceCategory>('dien-tu');
  const [condition, setCondition] = useState<ItemCondition>('used');
  const [location, setLocation] = useState('');
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync state when editingItem changes
  useEffect(() => {
    if (editingItem) {
      setTitle(editingItem.title || '');
      setDescription(editingItem.description || '');
      setPrice(editingItem.price ? String(editingItem.price) : '0');
      setCategory(editingItem.category || 'dien-tu');
      setCondition(editingItem.condition || 'used');
      setLocation(editingItem.location || '');
      setImageUrls(editingItem.image_urls || []);
    } else {
      setTitle('');
      setDescription('');
      setPrice('');
      setCategory('dien-tu');
      setCondition('used');
      setLocation(defaultLocation || '');
      setImageUrls([]);
    }
  }, [editingItem, defaultLocation, isOpen]);

  if (!isOpen) return null;

  // Handle image upload to Cloudinary via backend /upload endpoint
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (imageUrls.length + files.length > 5) {
      toast.error('Tối đa 5 hình ảnh cho mỗi sản phẩm');
      return;
    }

    setUploadingImage(true);
    const newUrls: string[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append('file', file);

        const res = await api.post('/upload', formData);
        if (res.data?.url) {
          newUrls.push(res.data.url);
        }
      }

      setImageUrls((prev) => [...prev, ...newUrls].slice(0, 5));
      toast.success('Đã tải ảnh lên thành công!');
    } catch (err: any) {
      console.error('Lỗi tải ảnh:', err);
      toast.error('Không thể tải ảnh lên. Vui lòng thử lại');
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveImage = (indexToRemove: number) => {
    setImageUrls((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error('Vui lòng nhập tiêu đề sản phẩm');
      return;
    }

    if (!description.trim()) {
      toast.error('Vui lòng nhập mô tả chi tiết');
      return;
    }

    const numPrice = Number(price);
    if (isNaN(numPrice) || numPrice < 0) {
      toast.error('Vui lòng nhập mức giá hợp lệ (>= 0)');
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim(),
        price: numPrice,
        category,
        condition,
        location: location.trim() || undefined,
        image_urls: imageUrls,
      });
      onClose();
    } catch (err) {
      // error handled in hook
    } finally {
      setSubmitting(false);
    }
  };

  const categories = (Object.keys(CATEGORY_LABELS) as MarketplaceCategory[]).filter(
    (c) => c !== 'all'
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />

      <div className="relative z-10 w-full max-w-2xl bg-card border border-border/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/60">
          <div className="flex items-center gap-2">
            <span className="text-xl">🛍️</span>
            <h3 className="text-base sm:text-lg font-bold text-foreground">
              {editingItem ? 'Chỉnh sửa tin đăng' : 'Đăng bán sản phẩm mới'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-secondary hover:text-foreground hover:bg-card-border transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5">
          {/* Photos Upload Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-muted">
                Hình ảnh sản phẩm ({imageUrls.length}/5)
              </label>
              <span className="text-[11px] text-secondary">Tối đa 5 ảnh, định dạng JPG, PNG, WEBP</span>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2.5">
              {imageUrls.map((url, idx) => (
                <div
                  key={idx}
                  className="relative aspect-square rounded-xl overflow-hidden border border-border group bg-zinc-900"
                >
                  <img src={url} alt={`preview-${idx}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(idx)}
                    className="absolute top-1 right-1 p-1 rounded-full bg-black/70 text-rose-400 hover:bg-rose-500 hover:text-white transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  {idx === 0 && (
                    <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-sky-500 text-white">
                      Ảnh bìa
                    </span>
                  )}
                </div>
              ))}

              {imageUrls.length < 5 && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingImage}
                  className="aspect-square rounded-xl border-2 border-dashed border-border hover:border-sky-500/60 hover:bg-sky-500/5 transition-all flex flex-col items-center justify-center text-secondary hover:text-sky-400 gap-1"
                >
                  {uploadingImage ? (
                    <Spinner size="sm" />
                  ) : (
                    <>
                      <ImagePlus className="w-6 h-6" />
                      <span className="text-[11px] font-medium">+ Thêm ảnh</span>
                    </>
                  )}
                </button>
              )}
            </div>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageUpload}
              multiple
              accept="image/*"
              className="hidden"
            />
          </div>

          {/* Title */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-secondary">
              Tiêu đề sản phẩm <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="VD: iPhone 13 Pro Max 128GB Quốc Tế còn bảo hành..."
              maxLength={200}
              className="w-full px-3.5 py-2.5 rounded-xl input-anime text-sm"
              required
            />
          </div>

          {/* Category & Price */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-secondary">
                Danh mục <span className="text-rose-500">*</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as MarketplaceCategory)}
                className="w-full px-3.5 py-2.5 rounded-xl input-anime text-sm bg-card"
              >
                {categories.map((catKey) => (
                  <option key={catKey} value={catKey}>
                    {CATEGORY_LABELS[catKey]?.icon} {CATEGORY_LABELS[catKey]?.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-secondary">
                Giá bán (VNĐ) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0 = Miễn phí / Cho tặng"
                min="0"
                step="1000"
                className="w-full px-3.5 py-2.5 rounded-xl input-anime text-sm"
                required
              />
            </div>
          </div>

          {/* Condition & Location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-secondary">Tình trạng</label>
              <select
                value={condition}
                onChange={(e) => setCondition(e.target.value as ItemCondition)}
                className="w-full px-3.5 py-2.5 rounded-xl input-anime text-sm bg-card"
              >
                {(Object.keys(CONDITION_LABELS) as ItemCondition[]).map((condKey) => (
                  <option key={condKey} value={condKey}>
                    {CONDITION_LABELS[condKey]}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-secondary">Khu vực / Tỉnh thành</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="VD: Hà Nội, TP.HCM, Đà Nẵng..."
                className="w-full px-3.5 py-2.5 rounded-xl input-anime text-sm"
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-secondary">
              Mô tả chi tiết <span className="text-rose-500">*</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Mô tả nguồn gốc, phụ kiện đi kèm, tình trạng pin, trầy xước, lý do bán..."
              rows={4}
              className="w-full px-3.5 py-2.5 rounded-xl input-anime text-sm resize-none"
              required
            />
          </div>

          {/* Footer buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-border/60">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-secondary hover:text-foreground hover:bg-card-border transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={submitting || uploadingImage}
              className="px-6 py-2.5 rounded-xl btn-anime text-xs sm:text-sm font-bold flex items-center gap-2 shadow-lg shadow-sky-500/20 disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Spinner size="sm" />
                  <span>Đang lưu...</span>
                </>
              ) : (
                <span>{editingItem ? 'Cập nhật tin' : 'Đăng tin ngay 🚀'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
