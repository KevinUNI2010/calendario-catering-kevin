import React from 'react';
import { NotificationItem, notificationService } from '../utils/notifications';
import { soundManager } from '../utils/soundEffects';
import { X, Bell, Volume2, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';

interface NotificationsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: NotificationItem[];
  onClearAll: () => void;
  onMarkAllRead: () => void;
}

export const NotificationsDrawer: React.FC<NotificationsDrawerProps> = ({
  isOpen,
  onClose,
  notifications,
  onClearAll,
  onMarkAllRead,
}) => {
  if (!isOpen) return null;

  const handleTestNativeNotification = async () => {
    const perm = await notificationService.requestPermission();
    notificationService.notify('🔔 Recordatorio de Local Centro Histórico', {
      body: 'El turno especial de degustación comenzará en 15 minutos.',
      playSound: true,
    });
  };

  const handleTestSoundOnly = () => {
    soundManager.playDing();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end p-4 bg-black/30 backdrop-blur-2xs animate-in fade-in duration-150">
      <div className="w-full max-w-sm bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden flex flex-col max-h-[85vh] mt-12 mr-2">
        
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-gray-200 dark:border-gray-800 bg-gray-50/70 dark:bg-gray-800/40">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <h3 className="font-bold text-gray-900 dark:text-white text-sm">
              Centro de Notificaciones
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Tools: Test Alert & Audio */}
        <div className="p-3 bg-blue-50/40 dark:bg-blue-950/20 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between gap-2 text-xs">
          <button
            type="button"
            onClick={handleTestNativeNotification}
            className="flex-1 py-1.5 px-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold transition cursor-pointer text-center text-[11px]"
          >
            Probar Notificación
          </button>
          <button
            type="button"
            onClick={handleTestSoundOnly}
            className="p-1.5 rounded-lg border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200 transition cursor-pointer"
            title="Probar sonido de campana"
          >
            <Volume2 className="w-4 h-4" />
          </button>
        </div>

        {/* List of Notifications */}
        <div className="p-3 overflow-y-auto space-y-2 flex-1 text-xs">
          {notifications.length === 0 ? (
            <div className="text-center py-10 text-gray-400">
              <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p>No tienes notificaciones pendientes.</p>
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                className={`p-3 rounded-xl border transition ${
                  n.read
                    ? 'border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30 text-gray-600 dark:text-gray-400'
                    : 'border-blue-200 dark:border-blue-900 bg-blue-50/40 dark:bg-blue-950/20 text-gray-900 dark:text-gray-100 shadow-2xs'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="font-bold truncate">{n.title}</span>
                  <span className="text-[10px] text-gray-400 shrink-0 font-mono">
                    {new Date(n.timestamp).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="mt-1 text-[11px] leading-relaxed opacity-90">
                  {n.body}
                </p>
              </div>
            ))
          )}
        </div>

        {/* Footer Actions */}
        {notifications.length > 0 && (
          <div className="p-3 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 flex items-center justify-between text-xs">
            <button
              type="button"
              onClick={onMarkAllRead}
              className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
            >
              Marcar leídas
            </button>
            <button
              type="button"
              onClick={onClearAll}
              className="text-gray-500 hover:text-red-500 transition"
            >
              Limpiar todo
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
