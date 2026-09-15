export type ConversationType = 'DIRECT' | 'GROUP';
export type MessageType = 'TEXT' | 'IMAGE' | 'SYSTEM';

export interface ConversationMember {
  userId: number;
  username: string;
  avatarUrl: string | null;
  role: 'ADMIN' | 'MEMBER';
  joinedAt: string;
  isOnline: boolean;
  lastSeen: string | null;
}

export interface Conversation {
  id: number;
  type: ConversationType;
  name: string | null;
  avatarUrl: string | null;
  creatorId: number | null;
  members: ConversationMember[];
  lastMessage: string | null;
  lastMessageTime: string | null;
  lastMessageSenderName: string | null;
  unreadCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  id: number;
  conversationId: number;
  senderId: number;
  senderUsername: string;
  senderAvatarUrl: string | null;
  receiverId: number | null;
  content: string;
  messageType: MessageType;
  imageUrl: string | null;
  replyToId: number | null;
  replyToContent: string | null;
  replyToSenderUsername: string | null;
  isDeleted: boolean;
  createdAt: string;
  isRead: boolean;
}

export interface TypingEvent {
  conversationId: number;
  userId: number;
  username: string;
  isTyping: boolean;
}

export interface OnlineStatusEvent {
  userId: number;
  isOnline: boolean;
  lastSeen: string;
}

export interface ReadReceiptDto {
  conversationId: number;
  userId: number;
  readAt: string;
}
