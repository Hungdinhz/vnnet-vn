import { useEffect, useRef, useState, useCallback } from 'react';
import { Client, IMessage, StompSubscription } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import api from '@/lib/axios';
import { getAuthToken } from '@/lib/auth';

export function useGameWebSocket(enabled: boolean) {
  const [isConnected, setIsConnected] = useState(false);
  const clientRef = useRef<Client | null>(null);

  const getWsUrl = () => {
    const base =
      api.defaults.baseURL ||
      process.env.NEXT_PUBLIC_API_URL ||
      'https://vnnet-vn-java.onrender.com';
    return `${base.replace(/\/$/, '')}/ws`;
  };

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;
    const token = getAuthToken();
    if (!token) return;

    const client = new Client({
      webSocketFactory: () => new SockJS(getWsUrl()),
      beforeConnect: () => {
        const latest = getAuthToken();
        client.connectHeaders = latest ? { Authorization: `Bearer ${latest}` } : {};
      },
      connectHeaders: {
        Authorization: `Bearer ${token}`,
      },
      reconnectDelay: 3000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      onConnect: () => setIsConnected(true),
      onDisconnect: () => setIsConnected(false),
      onWebSocketClose: () => setIsConnected(false),
      onStompError: (frame) => {
        console.error('[GameWS] STOMP error:', frame.headers['message']);
      },
    });

    client.activate();
    clientRef.current = client;

    return () => {
      if (client.active) {
        client.deactivate();
      }
      clientRef.current = null;
      setIsConnected(false);
    };
  }, [enabled]);

  const subscribe = useCallback(
    (destination: string, callback: (data: any) => void): StompSubscription | null => {
      if (!clientRef.current || !clientRef.current.connected) return null;
      return clientRef.current.subscribe(destination, (msg: IMessage) => {
        try {
          callback(JSON.parse(msg.body));
        } catch (e) {
          console.error('[GameWS] Parse error:', e);
        }
      });
    },
    []
  );

  const publish = useCallback((destination: string, body: Record<string, any>) => {
    if (clientRef.current && clientRef.current.connected) {
      clientRef.current.publish({
        destination,
        body: JSON.stringify(body),
      });
      return true;
    }
    return false;
  }, []);

  const toggleReady = useCallback(
    (roomCode: string) => publish('/app/game.room.ready', { roomCode }),
    [publish]
  );

  const startRoom = useCallback(
    (roomCode: string) => publish('/app/game.room.start', { roomCode }),
    [publish]
  );

  const leaveRoomWs = useCallback(
    (roomCode: string) => publish('/app/game.room.leave', { roomCode }),
    [publish]
  );

  const sendAction = useCallback(
    (roomCode: string, type: string, payload: Record<string, any> = {}) =>
      publish('/app/game.action', { roomCode, type, payload }),
    [publish]
  );

  const sendRoomChat = useCallback(
    (roomCode: string, content: string, type: 'CHAT' | 'EMOJI' = 'CHAT') =>
      publish('/app/game.chat', { roomCode, content, type }),
    [publish]
  );

  const joinMatchmakingWs = useCallback(
    (gameSlug: string) => publish('/app/game.matchmaking.join', { gameSlug }),
    [publish]
  );

  const cancelMatchmakingWs = useCallback(
    (gameSlug: string) => publish('/app/game.matchmaking.cancel', { gameSlug }),
    [publish]
  );

  return {
    isConnected,
    subscribe,
    toggleReady,
    startRoom,
    leaveRoomWs,
    sendAction,
    sendRoomChat,
    joinMatchmakingWs,
    cancelMatchmakingWs,
  };
}
