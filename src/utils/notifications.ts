import { soundManager } from './soundEffects';

export interface NotificationItem {
  id: string;
  title: string;
  body: string;
  timestamp: string;
  read: boolean;
  type: 'reminder' | 'email' | 'sync' | 'system';
  eventId?: string;
}

class NotificationService {
  private hasRequestedPermission = false;

  public async requestPermission(): Promise<NotificationPermission> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'denied';
    }
    try {
      const perm = await Notification.requestPermission();
      this.hasRequestedPermission = true;
      return perm;
    } catch {
      return 'denied';
    }
  }

  public getPermissionStatus(): NotificationPermission {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'denied';
    }
    return Notification.permission;
  }

  public notify(title: string, options?: { body?: string; icon?: string; tag?: string; playSound?: boolean }): void {
    const playSound = options?.playSound !== false;
    if (playSound) {
      soundManager.playDing();
    }

    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(title, {
          body: options?.body || 'Recordatorio de Calendario',
          icon: options?.icon || '/calendar-icon.svg',
          tag: options?.tag,
        });
      } catch (e) {
        console.warn('Native notification failed', e);
      }
    }
  }
}

export const notificationService = new NotificationService();
