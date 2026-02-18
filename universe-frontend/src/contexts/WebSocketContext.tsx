import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';

type EventHandler = (data: any) => void;

interface WebSocketContextType {
  isConnected: boolean;
  subscribe: (eventType: string, handler: EventHandler) => () => void;
}

const WebSocketContext = createContext<WebSocketContextType>({
  isConnected: false,
  subscribe: () => () => {},
});

export const useWebSocket = () => useContext(WebSocketContext);

const RECONNECT_DELAY = 3000;

export const WebSocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, token } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const handlersRef = useRef<Map<string, Set<EventHandler>>>(new Map());
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);

  const subscribe = useCallback((eventType: string, handler: EventHandler) => {
    if (!handlersRef.current.has(eventType)) {
      handlersRef.current.set(eventType, new Set());
    }
    handlersRef.current.get(eventType)!.add(handler);

    // Return unsubscribe function
    return () => {
      const handlers = handlersRef.current.get(eventType);
      if (handlers) {
        handlers.delete(handler);
        if (handlers.size === 0) {
          handlersRef.current.delete(eventType);
        }
      }
    };
  }, []);

  useEffect(() => {
    mountedRef.current = true;

    if (!isAuthenticated || !token) {
      // Clean up any existing connection
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      setIsConnected(false);
      return;
    }

    const connect = () => {
      if (!mountedRef.current) return;

      // Determine WebSocket URL
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.hostname;
      const port = '8000'; // Django backend port
      const url = `${protocol}//${host}:${port}/ws/notifications/?token=${token}`;

      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        if (!mountedRef.current) return;
        setIsConnected(true);
      };

      ws.onmessage = (event) => {
        if (!mountedRef.current) return;
        try {
          const message = JSON.parse(event.data);
          const { type, data } = message;
          const handlers = handlersRef.current.get(type);
          if (handlers) {
            handlers.forEach((handler) => handler(data));
          }
        } catch (err) {
          console.error('[WebSocket] Failed to parse message:', err);
        }
      };

      ws.onclose = () => {
        if (!mountedRef.current) return;
        setIsConnected(false);
        wsRef.current = null;
        // Auto-reconnect
        reconnectTimerRef.current = setTimeout(connect, RECONNECT_DELAY);
      };

      ws.onerror = (err) => {
        console.error('[WebSocket] Error:', err);
        ws.close();
      };
    };

    connect();

    return () => {
      mountedRef.current = false;
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [isAuthenticated, token]);

  return (
    <WebSocketContext.Provider value={{ isConnected, subscribe }}>
      {children}
    </WebSocketContext.Provider>
  );
};

export default WebSocketContext;
