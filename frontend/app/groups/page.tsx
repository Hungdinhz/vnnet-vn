// app/groups/page.tsx
"use client";

import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';

const groups = [
  { id: 1, name: 'Anime Việt Nam 🇻🇳', members: '45.2K', posts: '120 bài/ngày', emoji: '🎌', gradient: 'from-red-500/30 to-pink-500/20' },
  { id: 2, name: 'Lập trình viên VN', members: '32.1K', posts: '85 bài/ngày', emoji: '💻', gradient: 'from-blue-500/30 to-cyan-500/20' },
  { id: 3, name: 'Cosplay Community', members: '18.7K', posts: '45 bài/ngày', emoji: '🎭', gradient: 'from-purple-500/30 to-violet-500/20' },
  { id: 4, name: 'Game Mobile Việt', members: '28.5K', posts: '92 bài/ngày', emoji: '🎮', gradient: 'from-green-500/30 to-emerald-500/20' },
  { id: 5, name: 'Manga & Light Novel', members: '21.3K', posts: '67 bài/ngày', emoji: '📖', gradient: 'from-yellow-500/30 to-amber-500/20' },
  { id: 6, name: 'Nhiếp ảnh & Sáng tạo', members: '15.8K', posts: '38 bài/ngày', emoji: '📸', gradient: 'from-teal-500/30 to-cyan-500/20' },
];

export default function GroupsPage() {
  return (
    <div className="min-h-screen bg-[#0F0B1E] text-[#E8E0F0]">
      <Navbar />
      <div className="max-w-7xl mx-auto flex gap-4 px-2 md:px-4">
        <Sidebar />
        <main className="flex-1 py-4 md:py-6 max-w-5xl mx-auto">
          <div className="glass-card rounded-xl p-4 mb-4">
            <div className="flex items-center justify-between mb-2">
              <h1 className="text-2xl font-extrabold gradient-text">🏘️ Nhóm</h1>
              <button className="px-4 py-2 btn-anime rounded-lg text-xs">➕ Tạo nhóm mới</button>
            </div>
            <p className="text-sm text-purple-400/50">Tham gia các nhóm cùng sở thích</p>
          </div>

          <div className="glass-card rounded-xl p-4 mb-4">
            <h2 className="font-bold text-purple-200 mb-3 text-sm">📌 Nhóm của bạn</h2>
            <div className="text-center py-8 text-purple-400/30 text-sm">Bạn chưa tham gia nhóm nào. Hãy khám phá các nhóm bên dưới!</div>
          </div>

          <div className="glass-card rounded-xl p-4 mb-4">
            <h2 className="font-bold text-purple-200 mb-3 text-sm">✨ Gợi ý nhóm cho bạn</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {groups.map(group => (
              <div key={group.id} className="glass-card glass-card-hover rounded-xl overflow-hidden transition-all duration-300 group/card">
                <div className={`h-28 bg-gradient-to-br ${group.gradient} flex items-center justify-center`}>
                  <span className="text-5xl group-hover/card:scale-110 transition-transform duration-300">{group.emoji}</span>
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-purple-100 text-[14px] mb-1">{group.name}</h3>
                  <div className="flex items-center gap-3 text-xs text-purple-400/50 mb-3">
                    <span>👥 {group.members} thành viên</span>
                    <span>📝 {group.posts}</span>
                  </div>
                  <button className="w-full py-2 btn-anime rounded-lg text-xs">Tham gia nhóm</button>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
