import React, { useState, useEffect, useRef, useMemo } from 'react';
import { CalendarEvent, Local, EmailLog, ViewMode, GOOGLE_CALENDAR_COLORS } from './types';
import { INITIAL_EVENTS, DEFAULT_LOCALES } from './data/seedData';
import { 
  saveCachedEvents, 
  getCachedEvents, 
  saveCachedLocales, 
  getCachedLocales, 
  queueOfflineAction, 
  getOfflineQueue, 
  clearOfflineQueue,
  useOnlineStatus 
} from './utils/offlineStorage';
import { NotificationItem, notificationService } from './utils/notifications';
import { soundManager } from './utils/soundEffects';
import { formatISO } from './utils/dateUtils';

import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { MonthView } from './components/MonthView';
import { WeekView } from './components/WeekView';
import { DayView } from './components/DayView';
import { AgendaView } from './components/AgendaView';
import { LocalSummaryPopover } from './components/LocalSummaryPopover';
import { EventModal } from './components/EventModal';
import { LocalModal } from './components/LocalModal';
import { ShareModal } from './components/ShareModal';
import { EmailOutboxModal } from './components/EmailOutboxModal';
import { NotificationsDrawer } from './components/NotificationsDrawer';
import { SupabaseModal } from './components/SupabaseModal';
import { 
  isSupabaseConfigured, 
  fetchSupabaseEvents, 
  fetchSupabaseLocales, 
  upsertSupabaseEvent, 
  deleteSupabaseEvent, 
  subscribeSupabaseEvents 
} from './lib/supabase';

export default function App() {
  // Online/Offline status
  const isOnline = useOnlineStatus();

  // Calendar Date State (default to context date: September 14, 2026)
  const [currentDate, setCurrentDate] = useState<Date>(() => new Date(2026, 8, 14));
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => typeof window !== 'undefined' ? window.innerWidth >= 1024 : true);

  // Data State
  const [events, setEvents] = useState<CalendarEvent[]>(() => {
    return getCachedEvents() || INITIAL_EVENTS;
  });
  const [locales, setLocales] = useState<Local[]>(() => {
    return getCachedLocales() || DEFAULT_LOCALES;
  });
  // Filters State
  const [selectedLocalIds, setSelectedLocalIds] = useState<string[]>(() => locales.map(l => l.id));

  // Notifications State
  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: 'notif-welcome',
      title: 'Sistema en tiempo real activo',
      body: 'Calendario conectado y sincronizado con múltiples locales.',
      timestamp: new Date().toISOString(),
      read: false,
      type: 'system',
    }
  ]);

  // Modals & Popovers State
  const [selectedEventForSummary, setSelectedEventForSummary] = useState<CalendarEvent | null>(null);
  const [eventForEditModal, setEventForEditModal] = useState<Partial<CalendarEvent> | null>(null);
  const [isLocalModalOpen, setIsLocalModalOpen] = useState(false);

  // Sync with Supabase Database and Realtime if credentials are provided (Vercel-ready)
  useEffect(() => {
    if (!isSupabaseConfigured()) return;

    // Initial load from Supabase
    fetchSupabaseLocales().then((supaLocales) => {
      if (supaLocales && supaLocales.length > 0) {
        setLocales(supaLocales);
        saveCachedLocales(supaLocales);
      }
    });

    fetchSupabaseEvents().then((supaEvents) => {
      if (supaEvents && supaEvents.length > 0) {
        setEvents(supaEvents);
        saveCachedEvents(supaEvents);
      }
    });

    // Realtime subscriptions
    const unsubscribe = subscribeSupabaseEvents(
      (newEvent) => {
        setEvents((prev) => {
          if (prev.some(e => e.id === newEvent.id)) return prev;
          const next = [...prev, newEvent];
          saveCachedEvents(next);
          return next;
        });
        soundManager.playQuickClick();
      },
      (updatedEvent) => {
        setEvents((prev) => {
          const next = prev.map(e => e.id === updatedEvent.id ? updatedEvent : e);
          saveCachedEvents(next);
          return next;
        });
        setSelectedEventForSummary((curr) => curr && curr.id === updatedEvent.id ? updatedEvent : curr);
      },
      (deletedId) => {
        setEvents((prev) => {
          const next = prev.filter(e => e.id !== deletedId);
          saveCachedEvents(next);
          return next;
        });
        setSelectedEventForSummary((curr) => curr && curr.id === deletedId ? null : curr);
      }
    );

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // WebSocket reference
  const wsRef = useRef<WebSocket | null>(null);

  // Connect WebSocket for real-time collaboration
  useEffect(() => {
    let ws: WebSocket | null = null;
    let reconnectTimeout: any = null;

    const connectWebSocket = () => {
      try {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/ws`;
        ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          // Flush offline queued actions if any
          flushOfflineQueue();
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            const { type, payload } = data;

            if (type === 'sync:full') {
              if (payload.events) {
                setEvents(payload.events);
                saveCachedEvents(payload.events);
              }
              if (payload.locales) {
                setLocales(payload.locales);
                saveCachedLocales(payload.locales);
              }
            } else if (type === 'event:create') {
              setEvents((prev) => {
                if (prev.some(e => e.id === payload.id)) return prev;
                const next = [...prev, payload];
                saveCachedEvents(next);
                return next;
              });
              // Audio subtle click on peer action
              soundManager.playQuickClick();
            } else if (type === 'event:update') {
              setEvents((prev) => {
                const next = prev.map(e => e.id === payload.id ? { ...e, ...payload } : e);
                saveCachedEvents(next);
                return next;
              });
              // Also update summary if open
              setSelectedEventForSummary((curr) => curr && curr.id === payload.id ? { ...curr, ...payload } : curr);
            } else if (type === 'event:delete') {
              setEvents((prev) => {
                const next = prev.filter(e => e.id !== payload.id);
                saveCachedEvents(next);
                return next;
              });
              setSelectedEventForSummary((curr) => curr && curr.id === payload.id ? null : curr);
            } else if (type === 'sync:locales') {
              if (payload.locales) {
                setLocales(payload.locales);
                saveCachedLocales(payload.locales);
              }
            } else if (type === 'email:sent') {
              // Trigger in-app notification & chime
              notificationService.notify(payload.subject, {
                body: `Enviado a ${payload.recipient}`,
                playSound: true,
              });
              setNotifications((prev) => [
                {
                  id: 'notif-em-' + Date.now(),
                  title: payload.subject,
                  body: `Despachado a ${payload.recipient}`,
                  timestamp: payload.sentAt,
                  read: false,
                  type: 'email',
                  eventId: payload.eventId,
                },
                ...prev,
              ]);
            }
          } catch (e) {
            console.error('WebSocket parse error', e);
          }
        };

        ws.onclose = () => {
          reconnectTimeout = setTimeout(connectWebSocket, 3000);
        };

        ws.onerror = () => {
          ws?.close();
        };
      } catch (err) {
        reconnectTimeout = setTimeout(connectWebSocket, 3000);
      }
    };

    connectWebSocket();

    return () => {
      clearTimeout(reconnectTimeout);
      if (ws) ws.close();
    };
  }, []);

  // Flush queued actions when reconnected
  const flushOfflineQueue = async () => {
    const queue = getOfflineQueue();
    if (queue.length === 0) return;

    for (const item of queue) {
      try {
        if (item.type === 'create') {
          await fetch('/api/events', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(item.payload),
          });
        } else if (item.type === 'update') {
          await fetch(`/api/events/${item.payload.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(item.payload),
          });
        } else if (item.type === 'delete') {
          await fetch(`/api/events/${item.payload.id}`, {
            method: 'DELETE',
          });
        }
      } catch (e) {
        console.warn('Could not sync queued offline item', e);
      }
    }
    clearOfflineQueue();
  };

  // Automated In-App notification checker for upcoming events (every 20s)
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      events.forEach((event) => {
        if (!event.reminders) return;
        const start = new Date(event.startDate);
        const diffMinutes = Math.round((start.getTime() - now.getTime()) / (1000 * 60));

        event.reminders.forEach((rem) => {
          if (rem.type === 'notification' && !rem.sent && diffMinutes <= rem.minutesBefore && diffMinutes >= 0) {
            rem.sent = true;
            notificationService.notify(`🔔 Recordatorio: ${event.title}`, {
              body: `En ${event.localName} dentro de ${diffMinutes} min.`,
              playSound: true,
            });
            setNotifications((prev) => [
              {
                id: 'notif-' + Date.now(),
                title: `Recordatorio: ${event.title}`,
                body: `Inicia en ${event.localName} a las ${new Date(event.startDate).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}.`,
                timestamp: new Date().toISOString(),
                read: false,
                type: 'reminder',
                eventId: event.id,
              },
              ...prev,
            ]);
          }
        });
      });
    }, 20000);

    return () => clearInterval(interval);
  }, [events]);

  // Filtered events
  const filteredEvents = useMemo(() => {
    return events.filter((evt) => {
      // Local filter
      if (selectedLocalIds.length > 0 && !selectedLocalIds.includes(evt.localId)) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = evt.title.toLowerCase().includes(q);
        const matchesLocal = evt.localName.toLowerCase().includes(q);
        const matchesDesc = (evt.description || '').toLowerCase().includes(q);
        const matchesNotes = (evt.notes || '').toLowerCase().includes(q);
        return matchesTitle || matchesLocal || matchesDesc || matchesNotes;
      }
      return true;
    });
  }, [events, selectedLocalIds, searchQuery]);

  // Date Navigation Handlers
  const handlePrevDate = () => {
    setCurrentDate((prev) => {
      const d = new Date(prev);
      if (viewMode === 'month') {
        d.setMonth(d.getMonth() - 1);
      } else if (viewMode === 'week') {
        d.setDate(d.getDate() - 7);
      } else {
        d.setDate(d.getDate() - 1);
      }
      return d;
    });
  };

  const handleNextDate = () => {
    setCurrentDate((prev) => {
      const d = new Date(prev);
      if (viewMode === 'month') {
        d.setMonth(d.getMonth() + 1);
      } else if (viewMode === 'week') {
        d.setDate(d.getDate() + 7);
      } else {
        d.setDate(d.getDate() + 1);
      }
      return d;
    });
  };

  const handleToday = () => {
    setCurrentDate(new Date(2026, 8, 14)); // Current context date
  };

  // Event Handlers
  const handleSelectEvent = (e: React.MouseEvent, event: CalendarEvent) => {
    e.stopPropagation();
    setSelectedEventForSummary(event);
  };

  const handleQuickUpdate = async (updatedFields: Partial<CalendarEvent>) => {
    if (!selectedEventForSummary) return;
    const updated: CalendarEvent = {
      ...selectedEventForSummary,
      ...updatedFields,
      updatedAt: new Date().toISOString(),
    };

    // Optimistic update
    setEvents((prev) => {
      const next = prev.map(e => e.id === updated.id ? updated : e);
      saveCachedEvents(next);
      return next;
    });
    setSelectedEventForSummary(updated);

    // Sync via Supabase if configured (for Vercel)
    if (isSupabaseConfigured()) {
      upsertSupabaseEvent(updated);
    }

    // Sync via WS or REST
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'event:update', payload: updated }));
    } else {
      queueOfflineAction({ type: 'update', payload: updated });
    }

    try {
      await fetch(`/api/events/${updated.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });
    } catch {}
  };

  const handleSaveFullEvent = async (event: CalendarEvent) => {
    const isNew = !events.some(e => e.id === event.id);

    // Sync via Supabase if configured (for Vercel)
    if (isSupabaseConfigured()) {
      upsertSupabaseEvent(event);
    }

    if (isNew) {
      setEvents((prev) => {
        const next = [...prev, event];
        saveCachedEvents(next);
        return next;
      });
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'event:create', payload: event }));
      } else {
        queueOfflineAction({ type: 'create', payload: event });
      }
      try {
        await fetch('/api/events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(event),
        });
      } catch {}
    } else {
      setEvents((prev) => {
        const next = prev.map(e => e.id === event.id ? event : e);
        saveCachedEvents(next);
        return next;
      });
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'event:update', payload: event }));
      } else {
        queueOfflineAction({ type: 'update', payload: event });
      }
      try {
        await fetch(`/api/events/${event.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(event),
        });
      } catch {}
    }
  };

  const handleDeleteEvent = async (id: string) => {
    setEvents((prev) => {
      const next = prev.filter(e => e.id !== id);
      saveCachedEvents(next);
      return next;
    });

    // Sync via Supabase if configured (for Vercel)
    if (isSupabaseConfigured()) {
      deleteSupabaseEvent(id);
    }

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'event:delete', payload: { id } }));
    } else {
      queueOfflineAction({ type: 'delete', payload: { id } });
    }

    try {
      await fetch(`/api/events/${id}`, { method: 'DELETE' });
    } catch {}
  };

  const handleSendInstantEmail = async (event: CalendarEvent) => {
    try {
      const res = await fetch('/api/emails/send-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: event.id,
          recipient: event.attendees?.[0]?.email || 'kevin.zambrano.inteligencia@gmail.com',
          subject: `🔔 Recordatorio Inmediato: ${event.title} (${event.localName})`,
          customBody: `Aviso inmediato para el personal del local ${event.localName}.\n\nEvento: ${event.title}\nHorario: ${new Date(event.startDate).toLocaleTimeString('es-ES')} - ${new Date(event.endDate).toLocaleTimeString('es-ES')}\n\nDespachado manualmente desde Calendario de Locales.`,
        }),
      });
      const data = await res.json();
    } catch (e) {
      console.warn('Error sending email', e);
    }
  };

  const handleShareCalendar = async (email: string, role: string) => {
    try {
      await fetch('/api/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, role }),
      });
    } catch {}
  };

  const handleCreateEventOnDate = (date: Date) => {
    setEventForEditModal({
      startDate: formatISO(date, 9, 0),
      endDate: formatISO(date, 11, 0),
      localId: locales[0]?.id || 'loc-1',
      localName: locales[0]?.name || 'Local Centro Histórico',
      colorId: 'peacock',
    });
  };

  const handleCreateEventOnDateHour = (date: Date, hour: number) => {
    setEventForEditModal({
      startDate: formatISO(date, hour, 0),
      endDate: formatISO(date, hour + 1, 30),
      localId: locales[0]?.id || 'loc-1',
      localName: locales[0]?.name || 'Local Centro Histórico',
      colorId: 'peacock',
    });
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 font-sans transition-colors duration-200">
      
      {/* Top Navbar */}
      <Navbar
        currentDate={currentDate}
        onPrevDate={handlePrevDate}
        onNextDate={handleNextDate}
        onToday={handleToday}
        viewMode={viewMode}
        onChangeViewMode={setViewMode}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
      />

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden relative">
        
        {/* Sidebar */}
        <Sidebar
          isOpen={isSidebarOpen}
          currentDate={currentDate}
          onSelectDate={(d) => setCurrentDate(d)}
          locales={locales}
          selectedLocalIds={selectedLocalIds}
          onToggleLocal={(id) => {
            setSelectedLocalIds((prev) =>
              prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
            );
          }}
          onOpenCreateModal={() => handleCreateEventOnDate(currentDate)}
          onClose={() => setIsSidebarOpen(false)}
          onAddLocal={() => setIsLocalModalOpen(true)}
        />

        {/* View Component */}
        <main className="flex-1 flex flex-col h-full overflow-hidden bg-white dark:bg-gray-900">
          {viewMode === 'month' && (
            <MonthView
              currentDate={currentDate}
              events={filteredEvents}
              onSelectEvent={handleSelectEvent}
              onCreateEventOnDate={handleCreateEventOnDate}
            />
          )}

          {viewMode === 'week' && (
            <WeekView
              currentDate={currentDate}
              events={filteredEvents}
              onSelectEvent={handleSelectEvent}
              onCreateEventOnDateHour={handleCreateEventOnDateHour}
            />
          )}

          {viewMode === 'day' && (
            <DayView
              currentDate={currentDate}
              events={filteredEvents}
              onSelectEvent={handleSelectEvent}
              onCreateEventOnHour={(h) => handleCreateEventOnDateHour(currentDate, h)}
            />
          )}

          {viewMode === 'agenda' && (
            <AgendaView
              events={filteredEvents}
              onSelectEvent={handleSelectEvent}
              onOpenFullEdit={(evt) => setEventForEditModal(evt)}
              onDeleteEvent={handleDeleteEvent}
            />
          )}
        </main>

      </div>

      {/* Offline Toast Banner */}
      {!isOnline && (
        <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-xl bg-amber-600 px-3.5 py-2 text-xs font-semibold text-white shadow-lg animate-in slide-in-from-bottom duration-200">
          <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
          <span>Modo Sin Conexión — Los cambios de tus locales se sincronizarán al recuperar red.</span>
        </div>
      )}

      {/* Local Summary & Quick Edit Popover */}
      {selectedEventForSummary && (
        <LocalSummaryPopover
          event={selectedEventForSummary}
          local={locales.find(l => l.id === selectedEventForSummary.localId)}
          onClose={() => setSelectedEventForSummary(null)}
          onQuickUpdate={handleQuickUpdate}
          onOpenFullEdit={(evt) => {
            setSelectedEventForSummary(null);
            setEventForEditModal(evt);
          }}
          onDelete={handleDeleteEvent}
        />
      )}

      {/* Full Event Create / Edit Modal */}
      <EventModal
        isOpen={Boolean(eventForEditModal)}
        event={eventForEditModal}
        locales={locales}
        onClose={() => setEventForEditModal(null)}
        onSave={handleSaveFullEvent}
        onDelete={handleDeleteEvent}
      />

      {/* Add Local Modal */}
      <LocalModal
        isOpen={isLocalModalOpen}
        onClose={() => setIsLocalModalOpen(false)}
        onSave={(newLocal) => {
          const updatedLocales = [...locales, newLocal];
          setLocales(updatedLocales);
          saveCachedLocales(updatedLocales);
          setSelectedLocalIds([...selectedLocalIds, newLocal.id]);
        }}
      />

    </div>
  );
}
