import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import type {
  Notification,
  NotificationType,
} from '../components/NotificationBar';

interface NotificationContextType {
  notifications: Notification[];
  notify: (message: string, type?: NotificationType) => void;
  remove: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
);

export function useNotification() {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    throw new Error('useNotification deve ser usado dentro do NotificationProvider');
  }
  return ctx;
}

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  function notify(message: string, type: NotificationType = 'info') {
    const id = Math.random().toString(36).slice(2);
    setNotifications((prev) => [...prev, { id, message, type }]);
  }

  function remove(id: string) {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }

  return (
    <NotificationContext.Provider value={{ notifications, notify, remove }}>
      {children}
    </NotificationContext.Provider>
  );
}
