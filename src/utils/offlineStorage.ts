import { useState, useEffect } from 'react';
import { CalendarEvent, Local, EmailLog } from '../types';
import { normalizeLocalDateString } from './dateUtils';

const STORAGE_KEYS = {
  EVENTS: 'calendario_events_cache_v5',
  LOCALES: 'calendario_locales_cache_v5',
  MENU_OPTIONS: 'calendario_menu_options_cache_v3',
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

const IDB_NAME = 'CateringKevinDB_v1';
const IDB_STORE = 'events_store';

function openIDB(): Promise<IDBDatabase | null> {
  if (typeof window === 'undefined' || !window.indexedDB) return Promise.resolve(null);
  return new Promise((resolve) => {
    try {
      const request = indexedDB.open(IDB_NAME, 1);
      request.onupgradeneeded = (e: any) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(IDB_STORE)) {
          db.createObjectStore(IDB_STORE, { keyPath: 'id' });
        }
      };
      request.onsuccess = (e: any) => resolve(e.target.result);
      request.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

export async function saveEventsToIDB(events: CalendarEvent[]): Promise<void> {
  const db = await openIDB();
  if (!db) return;
  try {
    const tx = db.transaction(IDB_STORE, 'readwrite');
    const store = tx.objectStore(IDB_STORE);
    store.clear();
    for (const evt of events) {
      store.put(evt);
    }
  } catch (e) {
    console.warn('Could not save to IndexedDB', e);
  }
}

export async function getEventsFromIDB(): Promise<CalendarEvent[] | null> {
  const db = await openIDB();
  if (!db) return null;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(IDB_STORE, 'readonly');
      const store = tx.objectStore(IDB_STORE);
      const req = store.getAll();
      req.onsuccess = () => {
        if (Array.isArray(req.result) && req.result.length > 0) {
          resolve(req.result.map(e => ({
            ...e,
            startDate: normalizeLocalDateString(e.startDate),
            endDate: normalizeLocalDateString(e.endDate || e.startDate),
          })));
        } else {
          resolve(null);
        }
      };
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

export async function saveSingleEventPhotoToIDB(eventId: string, photo: string): Promise<void> {
  const db = await openIDB();
  if (!db || !eventId || !photo) return;
  try {
    const tx = db.transaction(IDB_STORE, 'readwrite');
    const store = tx.objectStore(IDB_STORE);
    const req = store.get(eventId);
    req.onsuccess = () => {
      const existing = req.result || { id: eventId };
      existing.evidencePhoto = photo;
      if (existing.dish) {
        existing.dish = { ...existing.dish, evidencePhoto: photo };
      }
      store.put(existing);
    };
  } catch (e) {
    console.warn('Could not save single photo to IndexedDB', e);
  }
}

export async function getEventEvidenceFromIDB(eventId: string): Promise<string | null> {
  const db = await openIDB();
  if (!db || !eventId) return null;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(IDB_STORE, 'readonly');
      const store = tx.objectStore(IDB_STORE);
      const req = store.get(eventId);
      req.onsuccess = () => {
        const item = req.result;
        resolve(item?.evidencePhoto || item?.dish?.evidencePhoto || null);
      };
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

export function saveCachedEvents(events: CalendarEvent[]): void {
  // 1. Guardar eventos completos con sus fotos en IndexedDB (sin límite de 5MB)
  saveEventsToIDB(events).catch(() => {});

  // 2. Guardar en localStorage siempre la versión ligera (~60 KB) para arranque instantáneo (0 ms)
  try {
    const lightweightEvents = events.map(e => {
      const hasPhoto = Boolean(e.hasEvidencePhoto || e.evidencePhoto || e.dish?.evidencePhoto);
      const { evidencePhoto, ...rest } = e;
      return {
        ...rest,
        evidencePhoto: undefined,
        dish: rest.dish ? { ...rest.dish, evidencePhoto: undefined } : undefined,
        hasEvidencePhoto: hasPhoto
      };
    });
    localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(lightweightEvents));
  } catch (e) {
    console.warn('Could not cache events locally', e);
  }
}

export function getCachedEvents(): CalendarEvent[] | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.EVENTS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.map((e: CalendarEvent) => ({
          ...e,
          startDate: normalizeLocalDateString(e.startDate),
          endDate: normalizeLocalDateString(e.endDate || e.startDate),
        }));
      }
    }
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

export function saveCachedMenuOptions(options: any): void {
  try {
    localStorage.setItem(STORAGE_KEYS.MENU_OPTIONS, JSON.stringify(options));
  } catch (e) {}
}

export function getCachedMenuOptions(): any | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.MENU_OPTIONS);
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
