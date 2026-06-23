// app/messages/page.tsx
"use client";

import Navbar from '@/components/Navbar';
import { useState } from 'react';

const contacts = [
  { id: 1, name: 'Miyuki', lastMsg: 'Hẹn gặp lại nhé! 😊', time: '2 phút', online: true, emoji: '🌸' },
  { id: 2, name: 'Tanaka', lastMsg: 'Bạn xem anime tập mới chưa?', time: '15 phút', online: true, emoji: '⚡' },
  { id: 3, name: 'Sakura', lastMsg: 'Gửi bạn ảnh cosplay nè', time: '1 giờ', online: false, emoji: '🌺' },
  { id: 4, name: 'Hiro', lastMsg: 'Tối nay chơi game không?', time: '3 giờ', online: false, emoji: '🎮' },
  { id: 5, name: 'Yuki', lastMsg: 'Cảm ơn bạn nhiều!', time: '1 ngày', online: false, emoji: '❄️' },
];

export default function MessagesPage() {
  const [selectedContact, setSelectedContact] = useState<number | null>(null);
  const selected = contacts.find(c => c.id === selectedContact);

  return (
    <div className="min-h-screen bg-[#0F0B1E] text-[#E8E0F0]">
      <Navbar />
      <div className="max-w-7xl mx-auto flex h-[calc(100vh-3.5rem)]">
        {/* Contacts sidebar */}
        <div className="w-80 border-r border-purple-500/10 flex flex-col">
          <div className="p-4 border-b border-purple-500/10">
            <h1 className="text-xl font-extrabold gradient-text mb-3">💬 Tin nhắn</h1>
            <input type="text" placeholder="Tìm kiếm cuộc trò chuyện..." className="w-full px-3 py-2 input-anime rounded-lg text-sm" />
          </div>
          <div className="flex-1 overflow-y-auto">
            {contacts.map(contact => (
              <button key={contact.id} onClick={() => setSelectedContact(contact.id)} className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors text-left ${selectedContact === contact.id ? 'bg-purple-500/10 border-l-2 border-purple-500' : ''}`}>
                <div className="relative">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500/30 to-pink-500/30 rounded-full flex items-center justify-center text-xl border border-purple-500/20">
                    {contact.emoji}
                  </div>
                  {contact.online && <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-[#0F0B1E]"></div>}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-sm text-purple-100">{contact.name}</span>
                    <span className="text-[10px] text-purple-400/40">{contact.time}</span>
                  </div>
                  <p className="text-xs text-purple-400/50 truncate">{contact.lastMsg}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Chat area */}
        <div className="flex-1 flex flex-col">
          {selected ? (
            <>
              <div className="px-6 py-3 border-b border-purple-500/10 flex items-center gap-3 glass-nav">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500/30 to-pink-500/30 rounded-full flex items-center justify-center text-lg border border-purple-500/20">{selected.emoji}</div>
                <div>
                  <div className="font-bold text-purple-100 text-sm">{selected.name}</div>
                  <div className="text-[10px] text-purple-400/40">{selected.online ? '🟢 Đang hoạt động' : '⚫ Ngoại tuyến'}</div>
                </div>
              </div>
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-4xl mb-3">💬</div>
                  <p className="text-purple-400/40 text-sm">Tính năng nhắn tin đang được phát triển</p>
                  <p className="text-purple-400/25 text-xs mt-1">Sắp có trong bản cập nhật tiếp theo ✨</p>
                </div>
              </div>
              <div className="px-4 py-3 border-t border-purple-500/10">
                <div className="flex gap-2">
                  <input type="text" placeholder="Nhập tin nhắn..." className="flex-1 px-4 py-2.5 input-anime rounded-xl text-sm" disabled />
                  <button className="px-4 py-2.5 btn-anime rounded-xl text-sm opacity-50 cursor-not-allowed">Gửi</button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="text-6xl mb-4 animate-float">✉️</div>
                <h2 className="text-xl font-bold gradient-text mb-2">Tin nhắn của bạn</h2>
                <p className="text-purple-400/40 text-sm">Chọn một cuộc trò chuyện để bắt đầu</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
