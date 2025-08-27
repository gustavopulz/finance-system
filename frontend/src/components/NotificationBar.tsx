import { useEffect } from 'react';

export type NotificationType = 'success' | 'error' | 'info';

export interface Notification {
  id: string;
  message: string;
  type: NotificationType;
}

interface NotificationProps {
  notifications: Notification[];
  onRemove: (id: string) => void;
}

export default function NotificationBar({
  notifications,
  onRemove,
}: NotificationProps) {
  useEffect(() => {
    if (notifications.length === 0) return;
    const timers = notifications.map((n) =>
      setTimeout(() => onRemove(n.id), 4000)
    );
    return () => timers.forEach(clearTimeout);
  }, [notifications, onRemove]);

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 items-end">
      {notifications.map((n) => (
        <div
          key={n.id}
          className={`px-4 py-2 rounded shadow-lg text-white font-medium transition-all
            ${n.type === 'success' ? 'bg-green-600' : n.type === 'error' ? 'bg-red-600' : 'bg-slate-700'}
          `}
        >
          {n.message}
        </div>
      ))}
    </div>
  );
}
