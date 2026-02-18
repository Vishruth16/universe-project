import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';
import { useWebSocket } from './WebSocketContext';

interface MessageContextType {
  unreadCount: number;
  refreshUnreadCount: () => Promise<void>;
}

const MessageContext = createContext<MessageContextType>({
  unreadCount: 0,
  refreshUnreadCount: async () => {},
});

export const useMessages = () => useContext(MessageContext);

const POLL_INTERVAL_CONNECTED = 60000; // 60s when WebSocket is connected
const POLL_INTERVAL_FALLBACK = 15000;  // 15s fallback when disconnected

const safeGetCount = async (url: string): Promise<number> => {
  try {
    const res = await axios.get(url);
    return res.data.count || 0;
  } catch (err) {
    console.error(`[MessageContext] Failed to fetch ${url}:`, err);
    return 0;
  }
};

export const MessageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const { isConnected, subscribe } = useWebSocket();
  const [unreadCount, setUnreadCount] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const refreshUnreadCount = useCallback(async () => {
    if (!isAuthenticated) return;
    const [marketplace, housing, roommate] = await Promise.all([
      safeGetCount('/api/marketplace-messages/unread_count/'),
      safeGetCount('/api/housing-inquiries/unread_count/'),
      safeGetCount('/api/roommate-messages/unread_count/'),
    ]);
    setUnreadCount(marketplace + housing + roommate);
  }, [isAuthenticated]);

  // Subscribe to unread_update WebSocket events
  useEffect(() => {
    const unsub = subscribe('unread_update', (data: any) => {
      const total = (data.marketplace || 0) + (data.housing || 0) + (data.roommate || 0);
      setUnreadCount(total);
    });
    return unsub;
  }, [subscribe]);

  // Polling with adaptive interval
  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);

    if (isAuthenticated) {
      refreshUnreadCount();
      const interval = isConnected ? POLL_INTERVAL_CONNECTED : POLL_INTERVAL_FALLBACK;
      intervalRef.current = setInterval(refreshUnreadCount, interval);
    } else {
      setUnreadCount(0);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isAuthenticated, isConnected, refreshUnreadCount]);

  return (
    <MessageContext.Provider value={{ unreadCount, refreshUnreadCount }}>
      {children}
    </MessageContext.Provider>
  );
};

export default MessageContext;
