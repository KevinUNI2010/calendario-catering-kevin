import { useState, useEffect } from 'react';
import { CalendarEvent, Local, EmailLog } from '../types';

const STORAGE_KEYS = {
  EVENTS: 'calendario_events_cache_v3',
  LOCALES: 'calendario_locales_cache_v3',
  EMAILS: 'calendario_emails_cache',
  OFFLINE_QUEUE: 'calendario_offline_queue',
  THEME: 'calendario_dark_theme',
};

export interface QueuedAction {
  id: string;
  type: 'create' | 'update' | 'delete';
  payload: any;
  timestamp: number;
}

export function saveCachedEvents(events: CalendarEvent[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(events));
  } catch (e) {
    console.warn('Could not cache events locally', e);
  }
}

export function getCachedEvents(): CalendarEvent[] | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.EVENTS);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('Could not read cached events', e);
  }
  return null;
}

export function saveCachedLocales(locales: Local[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.LOCALES, JSON.stringify(locales));
  } catch (e) {}
}

export function getCachedLocales(): Local[] | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.LOCALES);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return null;
}

export function queueOfflineAction(action: Omit<QueuedAction, 'id' | 'timestamp'>): void {
  try {
    const existing: QueuedAction[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.OFFLINE_QUEUE) || '[]');
    const newAction: QueuedAction = {
      ...action,
      id: 'queue_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      timestamp: Date.now(),
    };
    existing.push(newAction);
    localStorage.setItem(STORAGE_KEYS.OFFLINE_QUEUE, JSON.stringify(existing));
  } catch (e) {
    console.warn('Could not queue offline action', e);
  }
}

export function getOfflineQueue(): QueuedAction[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.OFFLINE_QUEUE) || '[]');
  } catch {
    return [];
  }
}

export function clearOfflineQueue(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.OFFLINE_QUEUE);
  } catch {}
}

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}
