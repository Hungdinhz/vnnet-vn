import React from 'react';
import { downloadMediaOrFile } from '@/lib/downloadHelper';

interface ImageLightboxProps {
  imageUrl: string | null;
  onClose: () => void;
}

export default function ImageLightbox({ imageUrl, onClose }: ImageLightboxProps) {
  if (!imageUrl) return null;

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="relative max-w-4xl max-h-[90vh] flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
        <div className="absolute -top-12 right-0 flex items-center gap-2">
          <button
            onClick={() => downloadMediaOrFile(imageUrl, 'image.png')}
            className="px-3 py-1.5 text-xs font-bold text-white bg-white/20 hover:bg-white/30 rounded-xl transition-colors flex items-center gap-1.5"
            title="Tải ảnh về máy"
          >
            <span>⬇️</span>
            <span>Tải ảnh</span>
          </button>
          <button
            onClick={onClose}
            className="p-2 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-colors"
            title="Đóng"
          >
            ✕
          </button>
        </div>
        <img
          src={imageUrl}
          alt="Xem ảnh lớn"
          className="max-h-[85vh] max-w-full rounded-xl object-contain shadow-2xl border border-white/10"
        />
      </div>
    </div>
  );
}
