import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import {
  Notification,
  getNotifications,
  getUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
} from '../services/notifications';
import { useAuth } from './AuthContext';
import { useWebSocket } from './WebSocketContext';

interface NotificationContextType {
  unreadCount: number;
  notifications: Notification[];
  loading: boolean;
  refreshUnreadCount: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
  markOneRead: (id: number) => Promise<void>;
  markAllRead: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType>({
  unreadCount: 0,
  notifications: [],
  loading: false,
  refreshUnreadCount: async () => {},
  refreshNotifications: async () => {},
  markOneRead: async () => {},
  markAllRead: async () => {},
});

export const useNotifications = () => useContext(NotificationContext);

const POLL_INTERVAL_CONNECTED = 60000; // 60s when WebSocket is connected
const POLL_INTERVAL_FALLBACK = 15000;  // 15s fallback when disconnected

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const { isConnected, subscribe } = useWebSocket();
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const refreshUnreadCount = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const count = await getUnreadCount();
      setUnreadCount(count);
    } catch {
      // silently fail
    }
  }, [isAuthenticated]);

  const refreshNotifications = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      const data = await getNotifications();
      const items = Array.isArray(data) ? data : (data.results || []);
      setNotifications(items);
      // Use API count for accuracy (items may be paginated)
      const apiCount = await getUnreadCount();
      setUnreadCount(apiCount);
    } catch {
      // silently fail
    }
    setLoading(false);
  }, [isAuthenticated]);

  const markOneRead = useCallback(async (id: number) => {
    try {
      await markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {
      // silently fail
    }
  }, []);

  const markAllRead = useCallback(async () => {
    try {
      await markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch {
      // silently fail
    }
  }, []);

  // Subscribe to notification WebSocket events
  useEffect(() => {
    const unsub = subscribe('notification', (data: any) => {
      // Prepend the new notification to the list
      const newNotif: Notification = {
        id: Date.now(), // Temporary ID until refresh
        recipient: 0,
        sender: null,
        sender_username: data.sender_username || '',
        notification_type: data.notification_type,
        title: data.title,
        message: data.message || '',
        link: data.link || '',
        related_id: data.related_id || null,
        is_read: false,
        created_at: new Date().toISOString(),
      };
      setNotifications((prev) => [newNotif, ...prev]);
      setUnreadCount((prev) => prev + 1);
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
      setNotifications([]);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isAuthenticated, isConnected, refreshUnreadCount]);

  return (
    <NotificationContext.Provider
      value={{
        unreadCount,
        notifications,
        loading,
        refreshUnreadCount,
        refreshNotifications,
        markOneRead,
        markAllRead,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationContext;
