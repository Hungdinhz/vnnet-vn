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
import ConfirmRecallModal from '@/components/messages/ConfirmRecallModal';
import ChatSettingsModal, { ChatSettings, DEFAULT_CHAT_SETTINGS } from '@/components/messages/ChatSettingsModal';
import InAppMessageToast, { InAppNotification, playNotificationChime } from '@/components/messages/InAppMessageToast';

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

  // Modals state
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  const [isGroupInfoOpen, setIsGroupInfoOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [recallMessageTarget, setRecallMessageTarget] = useState<ChatMessage | null>(null);
  const [isRecalling, setIsRecalling] = useState(false);

  // In-app notifications state
  const [inAppNotifications, setInAppNotifications] = useState<InAppNotification[]>([]);

  // Chat settings state
  const [chatSettings, setChatSettings] = useState<ChatSettings>(DEFAULT_CHAT_SETTINGS);

  const [loadingMessages, setLoadingMessages] = useState(false);
  const [hasInitQuery, setHasInitQuery] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Load chat settings from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('vnnet_chat_settings');
      if (saved) {
        try {
          setChatSettings(JSON.parse(saved));
        } catch {
          // fallback to default
        }
      }
    }
  }, []);

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
      // Dismiss any active toast for this conversation
      setInAppNotifications((prev) => prev.filter((n) => n.conversationId !== convId));
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

  // Push or update In-App notification with deduplication per user/conversation
  const triggerInAppNotification = useCallback(
    (notifData: {
      conversationId: number;
      senderId: number;
      senderUsername: string;
      senderAvatarUrl: string | null;
      content: string;
      messageType: 'TEXT' | 'IMAGE' | 'FILE' | 'SYSTEM';
      fileName?: string | null;
    }) => {
      // If user has sound enabled, play chime
      if (chatSettings.soundEnabled) {
        playNotificationChime();
      }

      // If desktop notification enabled and document is hidden
      if (
        chatSettings.desktopNotificationEnabled &&
        typeof window !== 'undefined' &&
        'Notification' in window &&
        Notification.permission === 'granted' &&
        document.hidden
      ) {
        try {
          const bodyText = !chatSettings.previewEnabled
            ? 'Đã gửi cho bạn một tin nhắn mới'
            : notifData.messageType === 'IMAGE'
            ? '📷 [Hình ảnh]'
            : notifData.messageType === 'FILE'
            ? `📎 [Tệp] ${notifData.fileName || 'Tài liệu'}`
            : notifData.content || 'Tin nhắn mới';

          new Notification(notifData.senderUsername, {
            body: bodyText,
            icon: notifData.senderAvatarUrl || '/logo.png',
          });
        } catch {
          // ignore
        }
      }

      // In-app stacked notification (+1 counter if from same person/conversation)
      setInAppNotifications((prev) => {
        const existingIdx = prev.findIndex(
          (n) => n.conversationId === notifData.conversationId
        );
        if (existingIdx !== -1) {
          const updated = [...prev];
          const curr = updated[existingIdx];
          updated[existingIdx] = {
            ...curr,
            count: curr.count + 1,
            content: notifData.content,
            messageType: notifData.messageType,
            fileName: notifData.fileName,
            timestamp: new Date(),
          };
          return updated;
        } else {
          const newNotif: InAppNotification = {
            conversationId: notifData.conversationId,
            senderId: notifData.senderId,
            senderUsername: notifData.senderUsername,
            senderAvatarUrl: notifData.senderAvatarUrl,
            content: notifData.content,
            messageType: notifData.messageType,
            fileName: notifData.fileName,
            count: 1,
            timestamp: new Date(),
          };
          return [newNotif, ...prev];
        }
      });
    },
    [chatSettings]
  );

  // Auto-dismiss notifications after 5 seconds
  useEffect(() => {
    if (inAppNotifications.length === 0) return;
    const timer = setTimeout(() => {
      setInAppNotifications((prev) => prev.slice(0, prev.length - 1));
    }, 5000);
    return () => clearTimeout(timer);
  }, [inAppNotifications]);

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
      } else {
        // New message in a conversation that is NOT currently open: trigger notification!
        if (updatedConv.lastMessageSenderName && updatedConv.lastMessageSenderName !== currentUser.username) {
          triggerInAppNotification({
            conversationId: updatedConv.id,
            senderId: 0,
            senderUsername: updatedConv.lastMessageSenderName,
            senderAvatarUrl: updatedConv.avatarUrl,
            content: updatedConv.lastMessage || '',
            messageType: 'TEXT',
          });
        }
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
  }, [isConnected, currentUser, activeConversation, subscribe, triggerInAppNotification]);

  // C. Subscribe to Active Conversation Topics
  useEffect(() => {
    if (!isConnected || !activeConversation) return;

    const convId = activeConversation.id;

    // Real-time messages topic
    const msgSub = subscribe(`/topic/conversation.${convId}`, (incoming: ChatMessage) => {
      setMessages((prev) => {
        const idx = prev.findIndex((m) => m.id === incoming.id);
        if (idx !== -1) {
          const updated = [...prev];
          updated[idx] = incoming;
          return updated;
        }
        return [...prev, incoming];
      });
      scrollToBottom(true);

      // If received while window is blurred or from someone else, trigger chime/notification
      if (incoming.senderId !== currentUser?.id) {
        sendReadReceipt(convId);
        if (typeof document !== 'undefined' && document.hidden) {
          triggerInAppNotification({
            conversationId: convId,
            senderId: incoming.senderId,
            senderUsername: incoming.senderUsername,
            senderAvatarUrl: incoming.senderAvatarUrl,
            content: incoming.content,
            messageType: incoming.messageType,
            fileName: incoming.fileName,
          });
        }
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
  }, [isConnected, activeConversation, currentUser, subscribe, sendReadReceipt, triggerInAppNotification]);

  // 6. Action Handlers
  const handleSendMessage = async (payload: {
    content: string;
    messageType: 'TEXT' | 'IMAGE' | 'FILE';
    imageUrl?: string | null;
    fileUrl?: string | null;
    fileName?: string | null;
    fileSize?: number | null;
    replyToId?: number | null;
  }) => {
    if (!activeConversation) return;

    const msgPayload = {
      conversationId: activeConversation.id,
      content: payload.content,
      messageType: payload.messageType,
      imageUrl: payload.imageUrl,
      fileUrl: payload.fileUrl,
      fileName: payload.fileName,
      fileSize: payload.fileSize,
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

  // Custom modal recall message execution (NO window.confirm)
  const handleConfirmRecall = async (messageId: number) => {
    setIsRecalling(true);
    try {
      await api.delete(`/messages/${messageId}`);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId
            ? {
                ...m,
                isDeleted: true,
                content: 'Tin nhắn đã được thu hồi',
                imageUrl: null,
                fileUrl: null,
              }
            : m
        )
      );
      setRecallMessageTarget(null);
    } catch (err) {
      console.error('Lỗi thu hồi tin nhắn:', err);
    } finally {
      setIsRecalling(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FC] dark:bg-[#0B0819] text-slate-800 dark:text-slate-100 flex flex-col transition-colors duration-200">
      <Navbar />

      <div className="max-w-7xl mx-auto w-full flex-1 flex h-[calc(100vh-4rem)] p-2 md:p-4 gap-3">
        {/* Sidebar: Conversation List */}
        <div
          className={`${
            activeConversation ? 'hidden md:flex' : 'flex'
          } w-full md:w-80 lg:w-96 flex-col bg-white dark:bg-[#130E26] rounded-2xl overflow-hidden shadow-xl border border-slate-200/80 dark:border-indigo-500/15`}
        >
          <ConversationList
            conversations={conversations}
            selectedId={activeConversation?.id || null}
            onSelect={(conv) => setActiveConversation(conv)}
            currentUser={currentUser}
            onOpenCreateGroup={() => setIsCreateGroupOpen(true)}
            onOpenSettings={() => setIsSettingsOpen(true)}
          />
        </div>

        {/* Main Area: Chat Window */}
        <div
          className={`${
            !activeConversation ? 'hidden md:flex' : 'flex'
          } flex-1 flex-col bg-white/95 dark:bg-[#130E26]/90 rounded-2xl overflow-hidden shadow-xl border border-slate-200/80 dark:border-indigo-500/15 relative backdrop-blur-md`}
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
                className="flex-1 overflow-y-auto p-4 space-y-1 bg-slate-50/50 dark:bg-black/15"
              >
                {loadingMessages ? (
                  <div className="h-full flex items-center justify-center">
                    <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="h-full flex items-center justify-center">
                    <div className="text-center p-6 bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-indigo-500/20 max-w-sm shadow-sm">
                      <div className="text-4xl mb-2">👋</div>
                      <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100 mb-1">
                        Bắt đầu cuộc trò chuyện
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Hãy gửi lời chào hoặc một tài liệu, hình ảnh đến{' '}
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
                      onRecallRequest={(target) => setRecallMessageTarget(target)}
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
                sendOnEnter={chatSettings.sendOnEnter}
              />
            </>
          ) : (
            /* Empty state when no conversation is selected */
            <div className="flex-1 flex items-center justify-center p-8 bg-slate-50/40 dark:bg-black/10">
              <div className="text-center max-w-md">
                <div className="text-7xl mb-4 animate-bounce">💬</div>
                <h2 className="text-2xl font-black gradient-text mb-2">
                  Tin nhắn VnNet Real-time
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-6">
                  Chọn một cuộc trò chuyện từ danh sách hoặc bắt đầu trò chuyện với bạn bè để trải nghiệm nhắn tin real-time, gửi tệp và chat nhóm tốc độ cao!
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
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/15 text-slate-700 dark:text-foreground text-xs font-bold rounded-xl transition-colors flex items-center gap-2 border border-slate-200 dark:border-white/10"
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

      <ChatSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={chatSettings}
        onUpdateSettings={(newSettings) => setChatSettings(newSettings)}
      />

      <ConfirmRecallModal
        message={recallMessageTarget}
        isOpen={!!recallMessageTarget}
        onClose={() => setRecallMessageTarget(null)}
        onConfirm={handleConfirmRecall}
        isProcessing={isRecalling}
      />

      <ImageLightbox
        imageUrl={lightboxImage}
        onClose={() => setLightboxImage(null)}
      />

      {/* In-app Message Notifications (stacked per sender/conversation with +1 counter) */}
      <InAppMessageToast
        notifications={inAppNotifications}
        previewEnabled={chatSettings.previewEnabled}
        onDismiss={(convId) =>
          setInAppNotifications((prev) => prev.filter((n) => n.conversationId !== convId))
        }
        onOpenConversation={(convId) => {
          const target = conversations.find((c) => c.id === convId);
          if (target) {
            setActiveConversation(target);
          } else {
            api.get(`/conversations/${convId}`).then((res) => {
              setActiveConversation(res.data);
            });
          }
          setInAppNotifications((prev) => prev.filter((n) => n.conversationId !== convId));
        }}
      />
    </div>
  );
}

export default function MessagesPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F8F9FC] dark:bg-[#0B0819] flex items-center justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-indigo-600 border-t-transparent"></div>
        </div>
      }
    >
      <MessagesContent />
    </Suspense>
  );
}
