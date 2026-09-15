// app/messages/page.tsx
'use client';

import React, { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import Navbar from '@/components/Navbar';
import api from '@/lib/axios';
import { useRouter, useSearchParams } from 'next/navigation';
import { useWebSocket } from '@/lib/useWebSocket';
import {
  Conversation,
  ChatMessage,
  TypingEvent,
  ReadReceiptDto,
  OnlineStatusEvent,
} from '@/types/messages';
import ConversationList from '@/components/messages/ConversationList';
import ChatHeader from '@/components/messages/ChatHeader';
import MessageBubble from '@/components/messages/MessageBubble';
import MessageInput from '@/components/messages/MessageInput';
import TypingIndicator from '@/components/messages/TypingIndicator';
import CreateGroupModal from '@/components/messages/CreateGroupModal';
import GroupInfoModal from '@/components/messages/GroupInfoModal';
import ImageLightbox from '@/components/messages/ImageLightbox';

function MessagesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  const [isGroupInfoOpen, setIsGroupInfoOpen] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [hasInitQuery, setHasInitQuery] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // WebSocket Hook
  const { isConnected, subscribe, sendMessage, sendTyping, sendReadReceipt } =
    useWebSocket(currentUser);

  // Scroll to bottom helper
  const scrollToBottom = (smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
  };

  // 1. Fetch current user
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    api
      .get('/users/me')
      .then((res) => setCurrentUser(res.data))
      .catch((err) => {
        console.error('Lỗi lấy thông tin người dùng:', err);
      });
  }, [router]);

  // 2. Fetch conversations
  const fetchConversations = useCallback(async () => {
    try {
      const res = await api.get('/conversations');
      setConversations(res.data || []);
    } catch (err) {
      console.error('Lỗi lấy danh sách cuộc trò chuyện:', err);
    }
  }, []);

  useEffect(() => {
    if (currentUser) {
      fetchConversations();
    }
  }, [currentUser, fetchConversations]);

  // 3. Handle userId query param (?userId=123)
  useEffect(() => {
    const userIdStr = searchParams.get('userId');
    if (userIdStr && currentUser && !hasInitQuery) {
      const uId = Number(userIdStr);
      if (uId && uId !== currentUser.id) {
        api
          .post('/conversations/direct', { userId: uId })
          .then((res) => {
            const conv = res.data;
            setActiveConversation(conv);
            setConversations((prev) => {
              const exists = prev.find((c) => c.id === conv.id);
              if (exists) return prev;
              return [conv, ...prev];
            });
          })
          .catch((err) => console.error('Lỗi mở cuộc trò chuyện trực tiếp:', err))
          .finally(() => setHasInitQuery(true));
      }
    }
  }, [searchParams, currentUser, hasInitQuery]);

  // 4. Fetch messages when activeConversation changes
  const fetchMessages = useCallback(async (convId: number) => {
    setLoadingMessages(true);
    try {
      const res = await api.get(`/conversations/${convId}/messages?page=0&size=50`);
      setMessages(res.data || []);
      setTimeout(() => scrollToBottom(false), 50);

      // Mark as read in backend
      api.put(`/conversations/${convId}/read`).catch(() => {});
      // Clear unread count locally
      setConversations((prev) =>
        prev.map((c) => (c.id === convId ? { ...c, unreadCount: 0 } : c))
      );
    } catch (err) {
      console.error('Lỗi lấy tin nhắn:', err);
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  useEffect(() => {
    if (activeConversation) {
      fetchMessages(activeConversation.id);
      setTypingUsers([]);
      setReplyingTo(null);
    } else {
      setMessages([]);
    }
  }, [activeConversation, fetchMessages]);

  // 5. WebSocket Subscriptions
  useEffect(() => {
    if (!isConnected || !currentUser) return;

    // A. Subscribe to user conversation queue (updates conversation list when new message arrives)
    const convSub = subscribe('/user/queue/conversations', (updatedConv: Conversation) => {
      setConversations((prev) => {
        const filtered = prev.filter((c) => c.id !== updatedConv.id);
        return [updatedConv, ...filtered];
      });

      // If this conversation is currently open, keep activeConversation synced
      if (activeConversation?.id === updatedConv.id) {
        setActiveConversation((prev) => (prev ? { ...prev, ...updatedConv } : updatedConv));
      }
    });

    // B. Subscribe to online status changes
    const onlineSub = subscribe('/topic/online', (status: OnlineStatusEvent) => {
      setConversations((prev) =>
        prev.map((c) => ({
          ...c,
          members: c.members.map((m) =>
            m.userId === status.userId
              ? { ...m, isOnline: status.isOnline, lastSeen: status.lastSeen }
              : m
          ),
        }))
      );
      if (activeConversation) {
        setActiveConversation((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            members: prev.members.map((m) =>
              m.userId === status.userId
                ? { ...m, isOnline: status.isOnline, lastSeen: status.lastSeen }
                : m
            ),
          };
        });
      }
    });

    return () => {
      convSub?.unsubscribe();
      onlineSub?.unsubscribe();
    };
  }, [isConnected, currentUser, activeConversation, subscribe]);

  // C. Subscribe to Active Conversation Topics
  useEffect(() => {
    if (!isConnected || !activeConversation) return;

    const convId = activeConversation.id;

    // Real-time messages topic
    const msgSub = subscribe(`/topic/conversation.${convId}`, (incoming: ChatMessage) => {
      setMessages((prev) => {
        // If message already exists (e.g. deletion or edit)
        const idx = prev.findIndex((m) => m.id === incoming.id);
        if (idx !== -1) {
          const updated = [...prev];
          updated[idx] = incoming;
          return updated;
        }
        return [...prev, incoming];
      });
      scrollToBottom(true);

      // Send read receipt if received while in this conversation
      if (incoming.senderId !== currentUser?.id) {
        sendReadReceipt(convId);
      }
    });

    // Typing topic
    const typingSub = subscribe(
      `/topic/conversation.${convId}.typing`,
      (event: TypingEvent) => {
        if (event.userId === currentUser?.id) return;
        setTypingUsers((prev) => {
          if (event.isTyping) {
            return prev.includes(event.username) ? prev : [...prev, event.username];
          } else {
            return prev.filter((u) => u !== event.username);
          }
        });
      }
    );

    // Read receipts topic
    const readSub = subscribe(
      `/topic/conversation.${convId}.read`,
      (receipt: ReadReceiptDto) => {
        if (receipt.userId !== currentUser?.id) {
          setMessages((prev) =>
            prev.map((m) =>
              m.senderId === currentUser?.id ? { ...m, isRead: true } : m
            )
          );
        }
      }
    );

    return () => {
      msgSub?.unsubscribe();
      typingSub?.unsubscribe();
      readSub?.unsubscribe();
    };
  }, [isConnected, activeConversation, currentUser, subscribe, sendReadReceipt]);

  // 6. Action Handlers
  const handleSendMessage = async (payload: {
    content: string;
    messageType: 'TEXT' | 'IMAGE';
    imageUrl?: string | null;
    replyToId?: number | null;
  }) => {
    if (!activeConversation) return;

    const msgPayload = {
      conversationId: activeConversation.id,
      content: payload.content,
      messageType: payload.messageType,
      imageUrl: payload.imageUrl,
      replyToId: payload.replyToId,
    };

    if (isConnected) {
      sendMessage(msgPayload);
    } else {
      // REST fallback
      try {
        const res = await api.post(`/conversations/${activeConversation.id}/messages`, msgPayload);
        setMessages((prev) => [...prev, res.data]);
        scrollToBottom(true);
        fetchConversations();
      } catch (err) {
        console.error('Lỗi gửi tin nhắn qua REST:', err);
      }
    }
  };

  const handleTyping = (isTyping: boolean) => {
    if (activeConversation && isConnected) {
      sendTyping(activeConversation.id, isTyping);
    }
  };

  const handleDeleteMessage = async (messageId: number) => {
    if (!confirm('Bạn có chắc chắn muốn thu hồi tin nhắn này?')) return;
    try {
      await api.delete(`/messages/${messageId}`);
      // Updated message will be broadcast via WS or local fallback
      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId
            ? { ...m, isDeleted: true, content: 'Tin nhắn đã được thu hồi', imageUrl: null }
            : m
        )
      );
    } catch (err) {
      console.error('Lỗi thu hồi tin nhắn:', err);
      alert('Không thể thu hồi tin nhắn!');
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Navbar />

      <div className="max-w-7xl mx-auto w-full flex-1 flex h-[calc(100vh-4rem)] p-2 md:p-4 gap-2">
        {/* Sidebar: Conversation List */}
        <div
          className={`${
            activeConversation ? 'hidden md:flex' : 'flex'
          } w-full md:w-80 lg:w-96 flex-col glass-card rounded-2xl overflow-hidden shadow-xl border border-indigo-500/15`}
        >
          <ConversationList
            conversations={conversations}
            selectedId={activeConversation?.id || null}
            onSelect={(conv) => setActiveConversation(conv)}
            currentUser={currentUser}
            onOpenCreateGroup={() => setIsCreateGroupOpen(true)}
          />
        </div>

        {/* Main Area: Chat Window */}
        <div
          className={`${
            !activeConversation ? 'hidden md:flex' : 'flex'
          } flex-1 flex-col glass-card rounded-2xl overflow-hidden shadow-xl border border-indigo-500/15 bg-black/15 backdrop-blur-md relative`}
        >
          {activeConversation ? (
            <>
              {/* Header */}
              <ChatHeader
                conversation={activeConversation}
                currentUser={currentUser}
                onBack={() => setActiveConversation(null)}
                onOpenGroupInfo={() => setIsGroupInfoOpen(true)}
              />

              {/* Messages Container */}
              <div
                ref={chatContainerRef}
                className="flex-1 overflow-y-auto p-4 space-y-1 bg-gradient-to-b from-transparent to-black/10"
              >
                {loadingMessages ? (
                  <div className="h-full flex items-center justify-center">
                    <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="h-full flex items-center justify-center">
                    <div className="text-center p-6 glass-card rounded-2xl border border-indigo-500/15 max-w-sm">
                      <div className="text-4xl mb-2">👋</div>
                      <h3 className="font-bold text-sm gradient-text mb-1">
                        Bắt đầu cuộc trò chuyện
                      </h3>
                      <p className="text-xs text-muted/60">
                        Hãy gửi lời chào hoặc một hình ảnh dễ thương đến{' '}
                        {activeConversation.name}!
                      </p>
                    </div>
                  </div>
                ) : (
                  messages.map((msg) => (
                    <MessageBubble
                      key={msg.id}
                      message={msg}
                      isMine={msg.senderId === currentUser?.id}
                      isGroup={activeConversation.type === 'GROUP'}
                      onReply={(target) => setReplyingTo(target)}
                      onDelete={handleDeleteMessage}
                      onImageClick={(url) => setLightboxImage(url)}
                    />
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Typing indicator */}
              <TypingIndicator typingUsers={typingUsers} />

              {/* Input Area */}
              <MessageInput
                onSendMessage={handleSendMessage}
                onTyping={handleTyping}
                replyingTo={replyingTo}
                onCancelReply={() => setReplyingTo(null)}
              />
            </>
          ) : (
            /* Empty state when no conversation is selected */
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="text-center max-w-md">
                <div className="text-7xl mb-4 animate-bounce">💬</div>
                <h2 className="text-2xl font-black gradient-text mb-2">
                  Tin nhắn VnNet Real-time
                </h2>
                <p className="text-sm text-muted/60 leading-relaxed mb-6">
                  Chọn một cuộc trò chuyện từ danh sách hoặc bắt đầu trò chuyện với bạn bè để trải nghiệm nhắn tin real-time tốc độ cao!
                </p>
                <div className="flex justify-center gap-3">
                  <button
                    onClick={() => setIsCreateGroupOpen(true)}
                    className="px-4 py-2.5 btn-anime text-xs font-bold rounded-xl shadow-md flex items-center gap-2"
                  >
                    <span>👥</span>
                    <span>Tạo nhóm chat</span>
                  </button>
                  <button
                    onClick={() => router.push('/friends')}
                    className="px-4 py-2.5 bg-white/10 hover:bg-white/15 text-foreground text-xs font-bold rounded-xl transition-colors flex items-center gap-2 border border-white/10"
                  >
                    <span>🔍</span>
                    <span>Tìm bạn bè</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <CreateGroupModal
        isOpen={isCreateGroupOpen}
        onClose={() => setIsCreateGroupOpen(false)}
        onGroupCreated={(newConv) => {
          setConversations((prev) => [newConv, ...prev]);
          setActiveConversation(newConv);
        }}
      />

      <GroupInfoModal
        conversation={activeConversation}
        currentUser={currentUser}
        isOpen={isGroupInfoOpen}
        onClose={() => setIsGroupInfoOpen(false)}
        onUpdateConversation={(updated) => {
          setActiveConversation(updated);
          setConversations((prev) =>
            prev.map((c) => (c.id === updated.id ? updated : c))
          );
        }}
        onLeaveSuccess={() => {
          if (activeConversation) {
            setConversations((prev) =>
              prev.filter((c) => c.id !== activeConversation.id)
            );
            setActiveConversation(null);
          }
        }}
      />

      <ImageLightbox
        imageUrl={lightboxImage}
        onClose={() => setLightboxImage(null)}
      />
    </div>
  );
}

export default function MessagesPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-indigo-500 border-t-transparent"></div>
        </div>
      }
    >
      <MessagesContent />
    </Suspense>
  );
}
