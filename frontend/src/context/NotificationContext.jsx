import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import {
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '../services/notificationApi';

const NotificationContext = createContext(null);

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:5000';
const SETTINGS_KEY = 'fixitpro_provider_settings';

const defaultSettings = {
  bookingAlerts: true,
  soundAlerts: true,
  weeklySummary: false,
};

const readSettings = () => {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return defaultSettings;
    return { ...defaultSettings, ...JSON.parse(raw) };
  } catch (_error) {
    return defaultSettings;
  }
};

const playNotificationBeep = () => {
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(880, ctx.currentTime);
    gainNode.gain.setValueAtTime(0.001, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.08, ctx.currentTime + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    oscillator.start();
    oscillator.stop(ctx.currentTime + 0.2);
  } catch (_error) {
    // Ignore audio errors to avoid disrupting notification flow.
  }
};

export function NotificationProvider({ children }) {
  const { token, isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [latestNotification, setLatestNotification] = useState(null);
  const [settings, setSettings] = useState(defaultSettings);
  const socketRef = useRef(null);

  useEffect(() => {
    setSettings(readSettings());

    const handleSettingsSync = (event) => {
      const next = event?.detail ? { ...defaultSettings, ...event.detail } : readSettings();
      setSettings(next);
    };

    window.addEventListener('provider-settings-updated', handleSettingsSync);
    window.addEventListener('storage', handleSettingsSync);

    return () => {
      window.removeEventListener('provider-settings-updated', handleSettingsSync);
      window.removeEventListener('storage', handleSettingsSync);
    };
  }, []);

  const loadNotifications = async () => {
    if (!isAuthenticated) return;

    try {
      setLoading(true);
      const data = await fetchNotifications(1, 20);
      setNotifications(data.notifications || []);
      setUnreadCount(Number(data.unreadCount || 0));
    } catch (_error) {
      // Keep UI functional even if notification fetch fails.
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, [isAuthenticated]);

  useEffect(() => {
    if (!token || !isAuthenticated) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      setNotifications([]);
      setUnreadCount(0);
      setLatestNotification(null);
      return;
    }

    const socket = io(SOCKET_URL, {
      transports: ['websocket'],
      auth: {
        token,
      },
    });

    socket.on('notification:new', ({ notification }) => {
      if (!notification) return;
      setNotifications((prev) => [notification, ...prev].slice(0, 20));
      setUnreadCount((prev) => prev + 1);
      if (settings.bookingAlerts) {
        setLatestNotification(notification);
      }
      if (settings.soundAlerts) {
        playNotificationBeep();
      }
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [token, isAuthenticated, settings.bookingAlerts, settings.soundAlerts]);

  const readNotification = async (notificationId) => {
    try {
      await markNotificationRead(notificationId);
      setNotifications((prev) =>
        prev.map((item) =>
          item._id === notificationId
            ? { ...item, isRead: true, readAt: new Date().toISOString() }
            : item
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (_error) {
      // Ignore UI errors for individual notification read.
    }
  };

  const readAllNotifications = async () => {
    try {
      await markAllNotificationsRead();
      setNotifications((prev) => prev.map((item) => ({ ...item, isRead: true, readAt: new Date().toISOString() })));
      setUnreadCount(0);
      socketRef.current?.emit('notification:read-all');
    } catch (_error) {
      // Ignore UI errors for bulk read.
    }
  };

  const dismissLatestNotification = () => {
    setLatestNotification(null);
  };

  const value = useMemo(
    () => ({
      notifications,
      unreadCount,
      loading,
      latestNotification,
      loadNotifications,
      readNotification,
      readAllNotifications,
      dismissLatestNotification,
    }),
    [notifications, unreadCount, loading, latestNotification]
  );

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return ctx;
}
