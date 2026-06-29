// app/livestream/page.tsx
"use client";

import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import { useState } from 'react';

const categories = ['Tất cả', 'Gaming', 'Âm nhạc', 'Trò chuyện', 'Giáo dục', 'Nấu ăn'];

const streams = [
  { id: 1, title: 'Chơi Genshin Impact cùng mình!', streamer: 'MiyukiGamer', viewers: 2341, category: 'Gaming', emoji: '🎮', live: true, gradient: 'from-purple-500/40 to-pink-500/20' },
  { id: 2, title: 'Cover nhạc Anime buổi tối', streamer: 'SakuraMusic', viewers: 1205, category: 'Âm nhạc', emoji: '🎵', live: true, gradient: 'from-pink-500/40 to-rose-500/20' },
  { id: 3, title: 'Q&A cuối tuần - Hỏi gì trả lời nấy', streamer: 'TanakaSenpai', viewers: 876, category: 'Trò chuyện', emoji: '💬', live: true, gradient: 'from-cyan-500/40 to-blue-500/20' },
  { id: 4, title: 'Học lập trình React cơ bản', streamer: 'CodeMaster', viewers: 543, category: 'Giáo dục', emoji: '📚', live: true, gradient: 'from-emerald-500/40 to-green-500/20' },
  { id: 5, title: 'Nấu Ramen kiểu Nhật', streamer: 'ChefHana', viewers: 1890, category: 'Nấu ăn', emoji: '🍜', live: true, gradient: 'from-orange-500/40 to-amber-500/20' },
  { id: 6, title: 'Valorant rank Radiant', streamer: 'ProGamerVN', viewers: 3210, category: 'Gaming', emoji: '🔫', live: true, gradient: 'from-red-500/40 to-rose-500/20' },
];

export default function LivestreamPage() {
  const [activeCategory, setActiveCategory] = useState('Tất cả');
  const filtered = activeCategory === 'Tất cả' ? streams : streams.filter(s => s.category === activeCategory);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <div className="max-w-7xl mx-auto flex gap-4 px-2 md:px-4">
        <Sidebar />
        <main className="flex-1 py-4 md:py-6 max-w-5xl mx-auto">
          <div className="glass-card rounded-xl p-4 mb-4">
            <div className="flex items-center justify-between mb-2">
              <h1 className="text-2xl font-extrabold gradient-text">📺 Livestream</h1>
              <button className="px-4 py-2 btn-anime rounded-lg text-xs">🔴 Phát trực tiếp</button>
            </div>
            <p className="text-sm text-muted/50 mb-4">Xem và tương tác với các buổi phát trực tiếp</p>
            <div className="flex flex-wrap gap-2">
              {categories.map(cat => (
                <button key={cat} onClick={() => setActiveCategory(cat)} className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${activeCategory === cat ? 'btn-anime' : 'bg-black/5 dark:bg-white/5 text-accent-purple/60 hover:bg-black/10 dark:hover:bg-black/10 dark:bg-white/10 border border-purple-500/10'}`}>{cat}</button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(stream => (
              <div key={stream.id} className="glass-card glass-card-hover rounded-xl overflow-hidden transition-all duration-300 group cursor-pointer">
                <div className={`h-40 bg-gradient-to-br ${stream.gradient} flex items-center justify-center relative`}>
                  <span className="text-6xl group-hover:scale-110 transition-transform duration-300">{stream.emoji}</span>
                  {stream.live && (
                    <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-red-500/90 backdrop-blur-sm px-2 py-0.5 rounded-full">
                      <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                      <span className="text-white text-[10px] font-bold">LIVE</span>
                    </div>
                  )}
                  <div className="absolute bottom-3 right-3 bg-black/50 backdrop-blur-sm px-2 py-0.5 rounded-full text-[10px] text-white font-medium">
                    👁 {stream.viewers.toLocaleString()} đang xem
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-foreground text-[14px] mb-1 line-clamp-1">{stream.title}</h3>
                  <div className="flex items-center justify-between text-xs text-muted/50">
                    <span className="font-semibold text-accent-purple/70">{stream.streamer}</span>
                    <span className="bg-black/5 dark:bg-white/5 px-2 py-0.5 rounded-full border border-purple-500/10">{stream.category}</span>
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
