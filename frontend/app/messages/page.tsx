// app/messages/page.tsx
"use client";

import Navbar from '@/components/Navbar';
import { useState, useEffect, useRef, Suspense } from 'react';
import api from '@/lib/axios';
import { useRouter, useSearchParams } from 'next/navigation';

function MessagesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedContact, setSelectedContact] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages change
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Fetch current user
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    const fetchMe = async () => {
      try {
        const res = await api.get('/users/me');
        setCurrentUser(res.data);
      } catch (err) {
        console.error("Lỗi lấy thông tin cá nhân:", err);
      }
    };
    fetchMe();
  }, [router]);

  // Fetch conversations
  const fetchConversations = async () => {
    try {
      const res = await api.get('/messages/conversations');
      setConversations(res.data || []);
    } catch (err) {
      console.error("Lỗi lấy danh sách hội thoại:", err);
    }
  };

  // Fetch chat history for selected contact
  const fetchMessages = async (contactId: number) => {
    try {
      const res = await api.get(`/messages/${contactId}`);
      setMessages(res.data || []);
    } catch (err) {
      console.error("Lỗi lấy tin nhắn:", err);
    }
  };

  const [hasInitQuery, setHasInitQuery] = useState(false);

  // Initial fetch and polling
  useEffect(() => {
    if (!currentUser) return;
    
    fetchConversations();
    
    // Check for userId in query params to start a new chat
    const userIdStr = searchParams.get('userId');
    if (userIdStr && !hasInitQuery) {
      const uId = Number(userIdStr);
      api.get(`/users/${uId}`).then(res => {
        const newUser = res.data;
        setSelectedContact(newUser);
        setConversations(prev => {
          if (prev.find(c => c.contact.id === uId)) return prev;
          return [{ contact: newUser, lastMessage: 'Bắt đầu cuộc trò chuyện...', unreadCount: 0, lastMessageTime: new Date().toISOString() }, ...prev];
        });
      }).catch(e => console.error("Không tìm thấy user", e))
        .finally(() => setHasInitQuery(true));
    }
    
    const intervalId = setInterval(() => {
      fetchConversations();
      if (selectedContact) {
        fetchMessages(selectedContact.id);
      }
    }, 3000); // Poll every 3 seconds

    return () => clearInterval(intervalId);
  }, [currentUser, selectedContact, searchParams, hasInitQuery]);

  // When selected contact changes
  useEffect(() => {
    if (selectedContact) {
      fetchMessages(selectedContact.id);
    } else {
      setMessages([]);
    }
  }, [selectedContact]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedContact) return;

    setIsSending(true);
    try {
      const res = await api.post('/messages', {
        receiverId: selectedContact.id,
        content: newMessage
      });
      // Append to UI immediately
      setMessages(prev => [...prev, res.data]);
      setNewMessage('');
      fetchConversations(); // Update last message in sidebar
    } catch (err) {
      console.error("Lỗi gửi tin nhắn:", err);
    } finally {
      setIsSending(false);
    }
  };

  const getInitials = (name: string) => {
    if (!name) return 'U';
    return name.charAt(0).toUpperCase();
  };

  const formatTime = (timeStr: string) => {
    if (!timeStr) return '';
    try {
      const date = new Date(timeStr);
      return new Intl.DateTimeFormat('vi-VN', { hour: '2-digit', minute: '2-digit' }).format(date);
    } catch {
      return '';
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <div className="max-w-7xl mx-auto flex h-[calc(100vh-3.5rem)]">
        
        {/* Contacts sidebar */}
        <div className="w-80 border-r border-indigo-500/10 flex flex-col glass-card rounded-tl-xl overflow-hidden mt-2 mb-4 ml-2 md:ml-4">
          <div className="p-4 border-b border-indigo-500/10">
            <h1 className="text-xl font-extrabold gradient-text mb-3 flex items-center gap-2">
              <span>💬</span> Tin nhắn
            </h1>
            <input 
              type="text" 
              placeholder="Tìm kiếm cuộc trò chuyện..." 
              className="w-full px-3 py-2 input-anime rounded-lg text-sm" 
            />
          </div>
          <div className="flex-1 overflow-y-auto">
            {conversations.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted/40">
                Chưa có cuộc trò chuyện nào.<br/> Hãy vào trang Bạn bè để gửi tin nhắn.
              </div>
            ) : (
              conversations.map((conv, idx) => {
                const contact = conv.contact;
                const isSelected = selectedContact?.id === contact.id;
                return (
                  <button 
                    key={contact.id || idx} 
                    onClick={() => setSelectedContact(contact)} 
                    className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-black/5 dark:hover:bg-black/5 dark:bg-white/5 transition-colors text-left ${isSelected ? 'bg-indigo-500/10 border-l-[3px] border-indigo-500' : 'border-l-[3px] border-transparent'}`}
                  >
                    <div className="relative flex-shrink-0">
                      {contact.avatarUrl ? (
                        <img 
                          src={contact.avatarUrl} 
                          alt={contact.username} 
                          className="w-12 h-12 rounded-full object-cover border border-indigo-500/20"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gradient-to-br from-indigo-500/30 to-indigo-600/30 rounded-full flex items-center justify-center font-bold text-secondary border border-indigo-500/20 text-lg">
                          {getInitials(contact.username)}
                        </div>
                      )}
                      {conv.unreadCount > 0 && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-indigo-500 rounded-full border-2 border-background flex items-center justify-center text-[10px] font-bold text-white shadow-sm">
                          {conv.unreadCount > 9 ? '9+' : conv.unreadCount}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center mb-0.5">
                        <span className="font-semibold text-[15px] text-foreground truncate">{contact.username}</span>
                        <span className="text-[10px] text-muted/40">{formatTime(conv.lastMessageTime)}</span>
                      </div>
                      <p className={`text-xs truncate ${conv.unreadCount > 0 ? 'text-secondary font-bold' : 'text-muted/50'}`}>
                        {conv.lastMessage}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Chat area */}
        <div className="flex-1 flex flex-col glass-card rounded-tr-xl overflow-hidden mt-2 mb-4 mr-2 md:mr-4 ml-2 border-l border-indigo-500/10">
          {selectedContact ? (
            <>
              {/* Chat Header */}
              <div className="px-6 py-3 border-b border-indigo-500/10 flex items-center gap-3 bg-black/20">
                <div className="relative flex-shrink-0">
                  {selectedContact.avatarUrl ? (
                    <img 
                      src={selectedContact.avatarUrl} 
                      alt={selectedContact.username} 
                      className="w-10 h-10 rounded-full object-cover border border-indigo-500/20"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-gradient-to-br from-indigo-500/30 to-indigo-600/30 rounded-full flex items-center justify-center font-bold text-secondary border border-indigo-500/20">
                      {getInitials(selectedContact.username)}
                    </div>
                  )}
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-400 rounded-full border-2 border-background"></div>
                </div>
                <div>
                  <div className="font-bold text-foreground text-[15px]">{selectedContact.username}</div>
                  <div className="text-[11px] text-emerald-400/80 font-medium">Đang hoạt động</div>
                </div>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-transparent to-black/10">
                {messages.length === 0 ? (
                  <div className="h-full flex items-center justify-center">
                    <div className="text-center text-muted/40 text-sm bg-black/5 dark:bg-white/5 px-6 py-3 rounded-xl">
                      Hãy gửi lời chào đầu tiên đến {selectedContact.username}! 👋
                    </div>
                  </div>
                ) : (
                  messages.map((msg, idx) => {
                    const isMine = currentUser && msg.senderId === currentUser.id;
                    return (
                      <div key={msg.id || idx} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[70%] rounded-2xl px-4 py-2 text-[14px] leading-relaxed shadow-sm ${
                          isMine 
                            ? 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white rounded-tr-sm' 
                            : 'bg-black/10 dark:bg-white/10 text-foreground rounded-tl-sm border border-indigo-500/10'
                        }`}>
                          <p>{msg.content}</p>
                          <div className={`text-[10px] mt-1 text-right ${isMine ? 'text-white/60' : 'text-muted/40'}`}>
                            {formatTime(msg.createdAt)}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input */}
              <div className="px-4 py-3 bg-black/20 border-t border-indigo-500/10">
                <form onSubmit={handleSendMessage} className="flex gap-2">
                  <input 
                    type="text" 
                    value={newMessage}
                    onChange={e => setNewMessage(e.target.value)}
                    placeholder="Nhập tin nhắn..." 
                    className="flex-1 px-4 py-2.5 input-anime rounded-xl text-sm" 
                  />
                  <button 
                    type="submit"
                    disabled={!newMessage.trim() || isSending}
                    className="px-6 py-2.5 btn-anime rounded-xl text-sm font-bold disabled:opacity-50 transition-opacity"
                  >
                    Gửi 🚀
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center bg-black/10">
              <div className="text-center">
                <div className="text-6xl mb-4 animate-float">✉️</div>
                <h2 className="text-xl font-bold gradient-text mb-2">Tin nhắn của bạn</h2>
                <p className="text-muted/40 text-sm">Chọn một người bạn để bắt đầu trò chuyện</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function MessagesPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div></div>}>
      <MessagesContent />
    </Suspense>
  );
}
