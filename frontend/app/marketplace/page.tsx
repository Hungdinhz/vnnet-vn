// app/marketplace/page.tsx
"use client";

import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import { useState } from 'react';

const categories = ['Tất cả', 'Xe cộ', 'Điện thoại', 'Đồ gia dụng', 'Thời trang', 'Sách & Manga'];

const products = [
  { id: 1, name: 'iPhone 15 Pro Max', price: '28.500.000₫', location: 'Hà Nội', category: 'Điện thoại', emoji: '📱', gradient: 'from-blue-500/30 to-cyan-500/20' },
  { id: 2, name: 'Honda Wave Alpha 2024', price: '18.000.000₫', location: 'TP.HCM', category: 'Xe cộ', emoji: '🏍️', gradient: 'from-red-500/30 to-orange-500/20' },
  { id: 3, name: 'Bộ Manga One Piece 1-100', price: '2.500.000₫', location: 'Đà Nẵng', category: 'Sách & Manga', emoji: '📚', gradient: 'from-yellow-500/30 to-amber-500/20' },
  { id: 4, name: 'Áo Hoodie Anime Limited', price: '350.000₫', location: 'Hà Nội', category: 'Thời trang', emoji: '👕', gradient: 'from-purple-500/30 to-pink-500/20' },
  { id: 5, name: 'Máy lọc không khí Xiaomi', price: '3.200.000₫', location: 'TP.HCM', category: 'Đồ gia dụng', emoji: '🌬️', gradient: 'from-teal-500/30 to-emerald-500/20' },
  { id: 6, name: 'Samsung Galaxy S24 Ultra', price: '25.900.000₫', location: 'Hải Phòng', category: 'Điện thoại', emoji: '📲', gradient: 'from-indigo-500/30 to-violet-500/20' },
];

export default function MarketplacePage() {
  const [activeCategory, setActiveCategory] = useState('Tất cả');
  const filtered = activeCategory === 'Tất cả' ? products : products.filter(p => p.category === activeCategory);

  return (
    <div className="min-h-screen bg-[#0F0B1E] text-[#E8E0F0]">
      <Navbar />
      <div className="max-w-7xl mx-auto flex gap-4 px-2 md:px-4">
        <Sidebar />
        <main className="flex-1 py-4 md:py-6 max-w-5xl mx-auto">
          <div className="glass-card rounded-xl p-4 mb-4">
            <div className="flex items-center justify-between mb-2">
              <h1 className="text-2xl font-extrabold gradient-text">🛒 Chợ</h1>
              <button className="px-4 py-2 btn-anime rounded-lg text-xs">➕ Đăng bán</button>
            </div>
            <p className="text-sm text-purple-400/50 mb-4">Mua bán trao đổi trong cộng đồng</p>
            <div className="flex flex-wrap gap-2">
              {categories.map(cat => (
                <button key={cat} onClick={() => setActiveCategory(cat)} className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${activeCategory === cat ? 'btn-anime' : 'bg-white/5 text-purple-300/60 hover:bg-white/10 border border-purple-500/10'}`}>{cat}</button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(product => (
              <div key={product.id} className="glass-card glass-card-hover rounded-xl overflow-hidden transition-all duration-300 group cursor-pointer">
                <div className={`h-36 bg-gradient-to-br ${product.gradient} flex items-center justify-center`}>
                  <span className="text-6xl group-hover:scale-110 transition-transform duration-300">{product.emoji}</span>
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-purple-100 text-[14px] mb-1 line-clamp-1">{product.name}</h3>
                  <p className="text-lg font-extrabold gradient-text mb-2">{product.price}</p>
                  <div className="flex items-center justify-between text-xs text-purple-400/50">
                    <span>📍 {product.location}</span>
                    <span className="bg-white/5 px-2 py-0.5 rounded-full border border-purple-500/10">{product.category}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
