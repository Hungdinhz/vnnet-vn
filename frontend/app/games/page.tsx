// app/games/page.tsx
"use client";

import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import { useState } from 'react';

const gameCategories = ['Tất cả', 'Hành động', 'Câu đố', 'Phiêu lưu', 'Thể thao', 'Chiến thuật'];

const games = [
  { id: 1, name: 'Samurai Rush', category: 'Hành động', players: '12.5K', rating: 4.8, emoji: '⚔️', gradient: 'from-red-500/30 to-orange-500/20' },
  { id: 2, name: 'Puzzle Master', category: 'Câu đố', players: '8.2K', rating: 4.6, emoji: '🧩', gradient: 'from-blue-500/30 to-cyan-500/20' },
  { id: 3, name: 'Dragon Quest VN', category: 'Phiêu lưu', players: '15.1K', rating: 4.9, emoji: '🐉', gradient: 'from-purple-500/30 to-pink-500/20' },
  { id: 4, name: 'Soccer Stars', category: 'Thể thao', players: '6.7K', rating: 4.3, emoji: '⚽', gradient: 'from-green-500/30 to-emerald-500/20' },
  { id: 5, name: 'Tower Defense', category: 'Chiến thuật', players: '9.8K', rating: 4.7, emoji: '🏰', gradient: 'from-yellow-500/30 to-amber-500/20' },
  { id: 6, name: 'Ninja Run', category: 'Hành động', players: '11.3K', rating: 4.5, emoji: '🥷', gradient: 'from-gray-500/30 to-slate-500/20' },
  { id: 7, name: 'Word Chain', category: 'Câu đố', players: '5.4K', rating: 4.2, emoji: '📝', gradient: 'from-teal-500/30 to-cyan-500/20' },
  { id: 8, name: 'Space Explorer', category: 'Phiêu lưu', players: '7.9K', rating: 4.4, emoji: '🚀', gradient: 'from-indigo-500/30 to-violet-500/20' },
  { id: 9, name: 'Chess Battle', category: 'Chiến thuật', players: '4.1K', rating: 4.8, emoji: '♟️', gradient: 'from-stone-500/30 to-zinc-500/20' },
];

export default function GamesPage() {
  const [activeCategory, setActiveCategory] = useState('Tất cả');
  const filtered = activeCategory === 'Tất cả' ? games : games.filter(g => g.category === activeCategory);

  return (
    <div className="min-h-screen bg-[#0F0B1E] text-[#E8E0F0]">
      <Navbar />
      <div className="max-w-7xl mx-auto flex gap-4 px-2 md:px-4">
        <Sidebar />
        <main className="flex-1 py-4 md:py-6 max-w-5xl mx-auto">
          <div className="glass-card rounded-xl p-4 mb-4">
            <h1 className="text-2xl font-extrabold gradient-text mb-2">🎮 Trò chơi</h1>
            <p className="text-sm text-purple-400/50 mb-4">Khám phá và chơi các trò chơi thú vị cùng bạn bè</p>
            <div className="flex flex-wrap gap-2">
              {gameCategories.map(cat => (
                <button key={cat} onClick={() => setActiveCategory(cat)} className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${activeCategory === cat ? 'btn-anime' : 'bg-white/5 text-purple-300/60 hover:bg-white/10 border border-purple-500/10'}`}>{cat}</button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(game => (
              <div key={game.id} className="glass-card glass-card-hover rounded-xl overflow-hidden transition-all duration-300 group">
                <div className={`h-32 bg-gradient-to-br ${game.gradient} flex items-center justify-center`}>
                  <span className="text-6xl group-hover:scale-110 transition-transform duration-300">{game.emoji}</span>
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-purple-100 text-[15px] mb-1">{game.name}</h3>
                  <div className="flex items-center gap-3 text-xs text-purple-400/50 mb-3">
                    <span>👥 {game.players} người chơi</span>
                    <span>⭐ {game.rating}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="flex-1 py-2 btn-anime rounded-lg text-xs">🎮 Chơi ngay</button>
                    <button className="px-3 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-xs text-purple-300/60 border border-purple-500/10 transition-colors">♥</button>
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
