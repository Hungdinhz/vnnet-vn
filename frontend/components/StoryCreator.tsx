// components/StoryCreator.tsx
"use client";

import { useState } from 'react';
import api from '@/lib/axios';
import toast from 'react-hot-toast';

interface StoryCreatorProps {
  onClose: () => void;
  onCreated: () => void;
}

const GRADIENT_PRESETS = [
  { name: 'Tím hồng', value: 'from-purple-600 to-pink-500' },
  { name: 'Xanh tím', value: 'from-blue-600 to-purple-600' },
  { name: 'Cam đỏ', value: 'from-orange-500 to-rose-500' },
  { name: 'Xanh lá', value: 'from-emerald-500 to-teal-600' },
  { name: 'Xanh dương', value: 'from-cyan-500 to-blue-600' },
  { name: 'Hồng tím', value: 'from-pink-500 to-violet-600' },
  { name: 'Vàng cam', value: 'from-yellow-400 to-orange-500' },
  { name: 'Đen xám', value: 'from-gray-800 to-gray-900' },
  { name: 'Indigo', value: 'from-indigo-500 to-purple-700' },
  { name: 'Rose Gold', value: 'from-rose-400 to-amber-300' },
];

const TEXT_STYLES = [
  { name: 'Bình thường', value: 'normal', preview: 'Aa' },
  { name: 'In đậm', value: 'bold', preview: 'Aa' },
  { name: 'Nghiêng', value: 'italic', preview: 'Aa' },
];

export default function StoryCreator({ onClose, onCreated }: StoryCreatorProps) {
  const [mode, setMode] = useState<'text' | 'image'>('text');
  const [content, setContent] = useState('');
  const [backgroundColor, setBackgroundColor] = useState(GRADIENT_PRESETS[0].value);
  const [textStyle, setTextStyle] = useState('normal');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
      setMode('image');
    }
  };

  const handleSubmit = async () => {
    if (mode === 'text' && !content.trim()) {
      toast.error('Hãy nhập nội dung cho story!');
      return;
    }
    if (mode === 'image' && !imageFile) {
      toast.error('Hãy chọn ảnh cho story!');
      return;
    }

    setIsSubmitting(true);
    try {
      let imageUrl = null;

      if (imageFile) {
        const formData = new FormData();
        formData.append('file', imageFile);
        const uploadRes = await api.post('/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        imageUrl = uploadRes.data.url;
      }

      await api.post('/stories', {
        content: content || null,
        image_url: imageUrl,
        background_color: mode === 'text' ? backgroundColor : null,
        text_style: mode === 'text' ? textStyle : null,
      });

      toast.success('Đăng story thành công! ✨');
      onCreated();
    } catch (err: any) {
      console.error('Lỗi tạo story:', err);
      toast.error(err.response?.data?.detail || 'Không thể tạo story');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="glass-card rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-purple-500/10">
          <h3 className="font-extrabold text-foreground text-lg">📖 Tạo Story</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 flex items-center justify-center text-muted/60 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Mode Switcher */}
        <div className="flex px-5 pt-4 gap-2">
          <button
            type="button"
            onClick={() => { setMode('text'); setImageFile(null); setImagePreview(null); }}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
              mode === 'text'
                ? 'btn-anime shadow-md'
                : 'bg-black/5 dark:bg-white/5 text-muted/60 hover:bg-black/10 dark:hover:bg-white/10'
            }`}
          >
            ✍️ Viết text
          </button>
          <button
            type="button"
            onClick={() => setMode('image')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
              mode === 'image'
                ? 'btn-anime shadow-md'
                : 'bg-black/5 dark:bg-white/5 text-muted/60 hover:bg-black/10 dark:hover:bg-white/10'
            }`}
          >
            🖼️ Upload ảnh
          </button>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto max-h-[60vh]">
          {/* Preview */}
          <div className="relative w-full aspect-[9/16] max-h-[320px] rounded-2xl overflow-hidden shadow-lg border border-purple-500/10">
            {mode === 'image' && imagePreview ? (
              <div className="w-full h-full relative">
                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                {content && (
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 pt-10">
                    <p className="text-white text-sm font-medium drop-shadow-lg">{content}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className={`w-full h-full bg-gradient-to-br ${backgroundColor} flex items-center justify-center p-6`}>
                <p className={`text-white text-center drop-shadow-lg leading-relaxed ${
                  textStyle === 'bold' ? 'text-2xl font-extrabold' :
                  textStyle === 'italic' ? 'text-xl italic font-light' :
                  'text-lg font-medium'
                }`}>
                  {content || 'Nội dung story sẽ hiển thị ở đây...'}
                </p>
              </div>
            )}
          </div>

          {/* Content input */}
          <textarea
            placeholder={mode === 'image' ? 'Thêm mô tả cho ảnh (tùy chọn)...' : 'Viết nội dung story của bạn...'}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={2}
            className="w-full px-4 py-3 input-anime rounded-xl resize-none text-sm"
          />

          {/* Image upload */}
          {mode === 'image' && (
            <label className="flex items-center justify-center gap-2 cursor-pointer border-2 border-dashed border-purple-500/20 hover:border-purple-500/40 rounded-xl py-4 transition-colors text-accent-purple/70 text-sm font-bold">
              <span className="text-xl">📷</span>
              <span>{imageFile ? 'Đổi ảnh khác' : 'Chọn ảnh từ thiết bị'}</span>
              <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
            </label>
          )}

          {/* Text mode: Color picker */}
          {mode === 'text' && (
            <>
              <div>
                <label className="text-xs font-bold text-muted/60 mb-2 block">🎨 Chọn màu nền</label>
                <div className="grid grid-cols-5 gap-2">
                  {GRADIENT_PRESETS.map((preset) => (
                    <button
                      key={preset.value}
                      type="button"
                      onClick={() => setBackgroundColor(preset.value)}
                      className={`w-full aspect-square rounded-xl bg-gradient-to-br ${preset.value} transition-all hover:scale-105 ${
                        backgroundColor === preset.value ? 'ring-2 ring-white ring-offset-2 ring-offset-background scale-105 shadow-lg' : ''
                      }`}
                      title={preset.name}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-muted/60 mb-2 block">🔤 Kiểu chữ</label>
                <div className="flex gap-2">
                  {TEXT_STYLES.map((style) => (
                    <button
                      key={style.value}
                      type="button"
                      onClick={() => setTextStyle(style.value)}
                      className={`flex-1 py-2 rounded-xl text-sm transition-all border ${
                        textStyle === style.value
                          ? 'border-purple-500 bg-purple-500/10 text-accent-purple font-bold'
                          : 'border-purple-500/10 text-muted/60 hover:bg-black/5 dark:hover:bg-white/5'
                      } ${
                        style.value === 'bold' ? 'font-extrabold' :
                        style.value === 'italic' ? 'italic' : ''
                      }`}
                    >
                      {style.name}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-purple-500/10 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-xs font-bold text-muted/60 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
          >
            Hủy
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || (mode === 'text' && !content.trim()) || (mode === 'image' && !imageFile)}
            className="flex-1 py-2.5 rounded-xl text-xs font-bold btn-anime shadow-md disabled:opacity-40"
          >
            {isSubmitting ? 'Đang đăng...' : '✨ Đăng Story'}
          </button>
        </div>
      </div>
    </div>
  );
}
