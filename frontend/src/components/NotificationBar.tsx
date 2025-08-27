import { useEffect } from 'react';
import { CheckCircle, XCircle, Info, X } from 'lucide-react';

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
    <div className="fixed top-16 right-4 z-50 flex flex-col gap-3 items-end">
      {notifications.map((n) => {
        const styles =
          n.type === 'success'
            ? 'border-green-500/30 bg-green-500/10 text-green-300'
            : n.type === 'error'
              ? 'border-red-500/30 bg-red-500/10 text-red-300'
              : 'border-blue-500/30 bg-blue-500/10 text-blue-300';

        const Icon =
          n.type === 'success'
            ? CheckCircle
            : n.type === 'error'
              ? XCircle
              : Info;

        return (
          <div
            key={n.id}
            className={`relative w-80 px-4 py-3 rounded-xl border shadow-lg backdrop-blur-sm 
                        flex items-start gap-3 transition-all animate-fade-in-up ${styles}`}
          >
            <Icon size={20} className="flex-shrink-0 mt-0.5" />
            <span className="flex-1 text-sm font-medium">{n.message}</span>
            <button
              onClick={() => onRemove(n.id)}
              className="ml-2 hover:opacity-70 transition"
              aria-label="Fechar notificação"
            >
              <X size={16} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
