import { useEffect, useRef, useState, useCallback } from 'react';
import { Client, IMessage } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import api from '@/lib/axios';
import { ChatMessage, TypingEvent, ReadReceiptDto, OnlineStatusEvent, Conversation } from '@/types/messages';

export function useWebSocket(currentUser: any) {
  const [isConnected, setIsConnected] = useState(false);
  const clientRef = useRef<Client | null>(null);

  // Get base url for WS
  const getWsUrl = () => {
    const base = api.defaults.baseURL || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:8000');
    return `${base.replace(/\/$/, '')}/ws`;
  };

  useEffect(() => {
    if (!currentUser || typeof window === 'undefined') return;

    const token = localStorage.getItem('token');
    if (!token) return;

    const client = new Client({
      webSocketFactory: () => new SockJS(getWsUrl()),
      connectHeaders: {
        Authorization: `Bearer ${token}`,
      },
      debug: (msg) => {
        // Can be disabled in production
        // console.log('[STOMP]', msg);
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      onConnect: () => {
        setIsConnected(true);
      },
      onDisconnect: () => {
        setIsConnected(false);
      },
      onStompError: (frame) => {
        console.error('STOMP error:', frame.headers['message']);
      },
    });

    client.activate();
    clientRef.current = client;

    return () => {
      if (client.active) {
        client.deactivate();
      }
      setIsConnected(false);
    };
  }, [currentUser]);

  // Subscribe helper
  const subscribe = useCallback(
    (destination: string, callback: (data: any) => void) => {
      if (!clientRef.current || !clientRef.current.connected) {
        return null;
      }
      const sub = clientRef.current.subscribe(destination, (msg: IMessage) => {
        try {
          const body = JSON.parse(msg.body);
          callback(body);
        } catch (e) {
          console.error('Failed to parse STOMP message:', e);
        }
      });
      return sub;
    },
    []
  );

  // Send message
  const sendMessage = useCallback(
    (payload: {
      conversationId: number;
      content: string;
      messageType?: 'TEXT' | 'IMAGE' | 'SYSTEM';
      imageUrl?: string | null;
      replyToId?: number | null;
    }) => {
      if (clientRef.current && clientRef.current.connected) {
        clientRef.current.publish({
          destination: '/app/chat.sendMessage',
          body: JSON.stringify(payload),
        });
      }
    },
    []
  );

  // Send typing event
  const sendTyping = useCallback(
    (conversationId: number, isTyping: boolean) => {
      if (clientRef.current && clientRef.current.connected) {
        clientRef.current.publish({
          destination: '/app/chat.typing',
          body: JSON.stringify({ conversationId, isTyping }),
        });
      }
    },
    []
  );

  // Send read receipt
  const sendReadReceipt = useCallback(
    (conversationId: number) => {
      if (clientRef.current && clientRef.current.connected) {
        clientRef.current.publish({
          destination: '/app/chat.read',
          body: JSON.stringify({ conversationId }),
        });
      }
    },
    []
  );

  return {
    isConnected,
    client: clientRef.current,
    subscribe,
    sendMessage,
    sendTyping,
    sendReadReceipt,
  };
}
