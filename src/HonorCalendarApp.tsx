import React, { useState, useEffect, useRef, useMemo } from 'react';
import { CalendarEvent, Local, EmailLog, ViewMode, GOOGLE_CALENDAR_COLORS, UserSession } from './types';
import { 
  INITIAL_EVENTS, 
  DEFAULT_LOCALES,
  DEFAULT_MENU_OPTIONS 
} from './data/seedData';
import { 
  saveCachedEvents, 
  getCachedEvents, 
  saveCachedLocales, 
  getCachedLocales,
  saveCachedMenuOptions,
  getCachedMenuOptions,
  queueOfflineAction, 
  getOfflineQueue, 
  clearOfflineQueue,
  useOnlineStatus 
} from './utils/offlineStorage';
import { NotificationItem, notificationService } from './utils/notifications';
import { soundManager } from './utils/soundEffects';
import { formatISO, MONTH_NAMES_ES } from './utils/dateUtils';
import { notify } from './utils/toastHelper';

import { HonorNavbar } from './honor-components/HonorNavbar';
import { HonorSidebar } from './honor-components/HonorSidebar';
import { HonorMonthView } from './honor-components/HonorMonthView';
import { WeekView } from './components/WeekView';
import { DayView } from './components/DayView';
import { AgendaView } from './components/AgendaView';
import { LocalSummaryPopover } from './components/LocalSummaryPopover';
import { EventModal } from './components/EventModal';
import { LocalModal } from './components/LocalModal';
import { MenuSettingsModal } from './components/MenuSettingsModal';
import { ShareModal } from './components/ShareModal';
import { EmailOutboxModal } from './components/EmailOutboxModal';
import { NotificationsDrawer } from './components/NotificationsDrawer';
import { SupabaseModal } from './components/SupabaseModal';
import { DailyMenuSummaryModal } from './components/DailyMenuSummaryModal';
import { SummaryConfigModal } from './components/SummaryConfigModal';
import { AccessManagementModal } from './components/AccessManagementModal';
import { HonorDayDetailsModal } from './honor-components/HonorDayDetailsModal';
import { 
  isSupabaseConfigured, 
  fetchSupabaseEvents, 
  fetchSupabaseLocales,
  fetchSupabaseMenuOptions,
  upsertSupabaseEvent, 
  deleteSupabaseEvent, 
  upsertSupabaseLocal,
  upsertSupabaseMenuOptions,
  subscribeSupabaseEvents 
} from './lib/supabase';

interface CalendarAppProps {
  session: UserSession;
  onLogout: () => void;
}

export function HonorCalendarApp({ session, onLogout }: CalendarAppProps) {
  // Online/Offline status
  const isOnline = useOnlineStatus();

  // Calendar Date State (default to current date)
  const [currentDate, setCurrentDate] = useState<Date>(() => new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => typeof window !== 'undefined' ? window.innerWidth >= 1024 : true);

  // Data State
  const [events, setEvents] = useState<CalendarEvent[]>(() => {
    return getCachedEvents() || INITIAL_EVENTS;
  });
  
  const [allLocales, setAllLocales] = useState<Local[]>(() => {
    return getCachedLocales() || DEFAULT_LOCALES;
  });

  const [menuOptions, setMenuOptions] = useState(() => {
    return getCachedMenuOptions() || DEFAULT_MENU_OPTIONS;
  });

  // Filter locales if the user is a viewer
  const locales = useMemo(() => {
    if (session.role === 'admin') return allLocales;
    return allLocales.filter(l => session.allowedLocales?.includes(l.id));
  }, [allLocales, session]);

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
  const [localForEditModal, setLocalForEditModal] = useState<Local | null>(null);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isAccessManagementOpen, setIsAccessManagementOpen] = useState(false);
  const [dailySummaryModalData, setDailySummaryModalData] = useState<{ isOpen: boolean, date: Date | null, events: CalendarEvent[], subtitle?: string }>({
    isOpen: false,
    date: null,
    events: []
  });
  const [honorDayModalData, setHonorDayModalData] = useState<{ isOpen: boolean, date: Date | null, events: CalendarEvent[] }>({
    isOpen: false,
    date: null,
    events: []
  });
  const [isSummaryConfigOpen, setIsSummaryConfigOpen] = useState(false);

  // Sync with Supabase Database and Realtime if credentials are provided (Vercel-ready)
  useEffect(() => {
    if (!isSupabaseConfigured()) return;

    // Initial load from Supabase
    fetchSupabaseLocales().then((supaLocales) => {
      if (supaLocales !== null) {
        setAllLocales(supaLocales);
        saveCachedLocales(supaLocales);
      }
    });
    
    // Initial load Menu Options from Supabase
    fetchSupabaseMenuOptions().then((supaMenu) => {
      if (supaMenu) {
        setMenuOptions(supaMenu);
        saveCachedMenuOptions(supaMenu);
      }
    });

    fetchSupabaseEvents().then((supaEvents) => {
      if (supaEvents !== null) {
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
      if (selectedLocalIds.length === 0) {
        return false;
      }
      if (!selectedLocalIds.includes(evt.localId)) {
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
    setCurrentDate(new Date()); 
  };

  const handleGenerateSummary = (start: Date, end: Date) => {
    // Filtrar eventos de ese rango
    const rangeEvents = filteredEvents.filter(e => {
      const eStart = new Date(e.startDate);
      const eEnd = new Date(e.endDate);
      return eStart <= end && eEnd >= start;
    });

    const formatDayMonth = (d: Date) => `${d.getDate()} ${MONTH_NAMES_ES[d.getMonth()].substring(0, 3)}`;

    setDailySummaryModalData({
      isOpen: true,
      date: start, // Solo de referencia
      events: rangeEvents,
      subtitle: `Del ${formatDayMonth(start)} al ${formatDayMonth(end)}`
    });
  };

  // Event Handlers
  const handleSelectEvent = (e: React.MouseEvent | null, event: CalendarEvent) => {
    if (e && e.stopPropagation) {
      e.stopPropagation();
    }
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
    notify.success('Actualizado', 'Evento actualizado rápidamente');

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
      notify.success('Guardado', 'Evento creado exitosamente');
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
      notify.success('Guardado', 'Evento actualizado exitosamente');
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
    notify.success('Eliminado', 'Evento eliminado correctamente');

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
      notify.success('Enviado', 'Correo de aviso enviado exitosamente');
    } catch (e) {
      console.warn('Error sending email', e);
      notify.error('Error', 'Hubo un error al enviar el correo');
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

  const handleSaveLocal = async (newLocal: Local) => {
    const isNew = !allLocales.some(l => l.id === newLocal.id);
    const updatedLocales = isNew 
      ? [...allLocales, newLocal] 
      : allLocales.map(l => l.id === newLocal.id ? newLocal : l);

    setAllLocales(updatedLocales);
    saveCachedLocales(updatedLocales);
    
    if (isNew) {
      setSelectedLocalIds([...selectedLocalIds, newLocal.id]);
      if (isSupabaseConfigured()) {
        await upsertSupabaseLocal(newLocal);
      }
    } else {
      // Si se editó el local, actualizar todos los eventos asociados
      const updatedEvents = events.map(e => {
        if (e.localId === newLocal.id) {
          return { ...e, colorId: newLocal.colorId, localName: newLocal.name };
        }
        return e;
      });
      setEvents(updatedEvents);
      saveCachedEvents(updatedEvents);
      
      if (isSupabaseConfigured()) {
        await upsertSupabaseLocal(newLocal);
        // Sincronizar en segundo plano los eventos actualizados
        updatedEvents.filter(e => e.localId === newLocal.id).forEach(e => upsertSupabaseEvent(e));
      }
    }
    notify.success('Guardado', isNew ? 'Local creado correctamente' : 'Local actualizado correctamente');
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 font-sans transition-colors duration-200">
      
      {/* Top Navbar */}
      <HonorNavbar
        currentDate={currentDate}
        onPrevDate={handlePrevDate}
        onNextDate={handleNextDate}
        onToday={handleToday}
        viewMode={viewMode}
        onChangeViewMode={setViewMode}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        onWeeklySummary={() => setIsSummaryConfigOpen(true)}
      />

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden relative">
        
        {/* Sidebar */}
        <HonorSidebar
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
          onAddLocal={() => {
            setLocalForEditModal(null);
            setIsLocalModalOpen(true);
          }}
          onEditLocal={(loc) => {
            setLocalForEditModal(loc);
            setIsLocalModalOpen(true);
          }}
          onOpenSettings={() => setIsSettingsModalOpen(true)}
          onOpenAccessManagement={() => setIsAccessManagementOpen(true)}
          role={session.role}
          userName={session.name}
          onLogout={onLogout}
        />

        {/* View Component */}
        <main className="flex-1 flex flex-col h-full overflow-hidden bg-white dark:bg-gray-900">
          {viewMode === 'month' && (
            <HonorMonthView
              currentDate={currentDate}
              events={filteredEvents}
              onSelectEvent={handleSelectEvent}
              onCreateEventOnDate={handleCreateEventOnDate}
              onShowDaySummary={(date, events) => setHonorDayModalData({ isOpen: true, date, events })}
              role={session.role}
              locales={locales}
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
              role={session.role}
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
          role={session.role}
        />
      )}

      {/* Full Event Create / Edit Modal */}
      <EventModal
        isOpen={Boolean(eventForEditModal)}
        event={eventForEditModal}
        locales={locales}
        menuOptions={menuOptions}
        onClose={() => setEventForEditModal(null)}
        onSave={handleSaveFullEvent}
        onDelete={handleDeleteEvent}
      />

      {/* Add / Edit Local Modal */}
      <LocalModal
        isOpen={isLocalModalOpen}
        initialLocal={localForEditModal}
        onClose={() => {
          setIsLocalModalOpen(false);
          setLocalForEditModal(null);
        }}
        onSave={handleSaveLocal}
      />

      {/* Menu Settings Modal */}
      <MenuSettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        menuOptions={menuOptions}
        onSave={async (newOptions) => {
          setMenuOptions(newOptions);
          saveCachedMenuOptions(newOptions);
          if (isSupabaseConfigured()) {
            await upsertSupabaseMenuOptions(newOptions);
          }
          notify.success('Actualizado', 'Opciones de menú guardadas');
        }}
      />
      <SummaryConfigModal
        isOpen={isSummaryConfigOpen}
        onClose={() => setIsSummaryConfigOpen(false)}
        onGenerate={handleGenerateSummary}
        initialDate={currentDate}
      />
      <DailyMenuSummaryModal
        isOpen={dailySummaryModalData.isOpen}
        onClose={() => setDailySummaryModalData({ ...dailySummaryModalData, isOpen: false })}
        date={dailySummaryModalData.date}
        events={dailySummaryModalData.events}
        subtitle={dailySummaryModalData.subtitle}
      />
      {isAccessManagementOpen && (
        <AccessManagementModal
          locales={allLocales}
          onClose={() => setIsAccessManagementOpen(false)}
        />
      )}

      {honorDayModalData.isOpen && (
        <HonorDayDetailsModal
          isOpen={honorDayModalData.isOpen}
          onClose={() => setHonorDayModalData({ ...honorDayModalData, isOpen: false })}
          date={honorDayModalData.date}
          events={honorDayModalData.events}
          onSelectEvent={(event) => handleSelectEvent(null, event)}
          role={session.role}
        />
      )}

    </div>
  );
}
