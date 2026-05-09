import React, { createContext, useState, useEffect } from 'react';
import * as storage from '../utils/storage';

export const NotificationContext = createContext();

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const raw = (await storage.load('notifications', [])) || [];
        setNotifications(raw);
      } catch (e) { console.warn('load notifications failed', e); }
    })();
  }, []);

  const pushNotification = async (n) => {
    const item = { id: `not-${Date.now()}`, read: false, createdAt: new Date().toISOString(), ...n };
    try {
      const next = [item, ...(notifications || [])];
      setNotifications(next);
      await storage.save('notifications', next);
    } catch (e) { console.warn('pushNotification failed', e); }
  };

  const markRead = async (id) => {
    try {
      const next = (notifications || []).map(n => n.id === id ? { ...n, read: true } : n);
      setNotifications(next);
      await storage.save('notifications', next);
    } catch (e) { console.warn('markRead failed', e); }
  };

  const clearAll = async () => {
    try {
      setNotifications([]);
      await storage.save('notifications', []);
    } catch (e) { console.warn('clearAll failed', e); }
  };

  return (
    <NotificationContext.Provider value={{ notifications, pushNotification, markRead, clearAll }}>
      {children}
    </NotificationContext.Provider>
  );
}

