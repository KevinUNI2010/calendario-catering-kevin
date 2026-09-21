import express from 'express';
import http from 'http';
import path from 'path';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer as createViteServer } from 'vite';
import { INITIAL_EVENTS, DEFAULT_LOCALES } from './src/data/seedData';
import { CalendarEvent, Local, EmailLog } from './src/types';

const app = express();
const PORT = 3000;
const server = http.createServer(app);

// In-memory data store with seeds
let events: CalendarEvent[] = JSON.parse(JSON.stringify(INITIAL_EVENTS));
let locales: Local[] = JSON.parse(JSON.stringify(DEFAULT_LOCALES));
let emailLogs: EmailLog[] = [
  {
    id: 'em-01',
    eventId: 'evt-03',
    eventTitle: 'Turno Matutino y Despacho de Pedidos Online',
    recipient: 'kevin.zambrano.inteligencia@gmail.com',
    subject: '🔔 Recordatorio automático: Turno Matutino en Local Centro Histórico',
    body: 'Hola Kevin, te recordamos que tienes el evento "Turno Matutino y Despacho de Pedidos Online" programado para hoy en Local Centro Histórico.',
    sentAt: '2026-09-14T08:00:00Z',
    status: 'sent',
    triggerType: 'automatic',
  },
  {
    id: 'em-02',
    eventId: 'evt-01',
    eventTitle: 'Apertura Dominical y Revisión de Inventario',
    recipient: 'carlos.mendoza@locales.com',
    subject: '🔔 Recordatorio: Apertura Dominical en Local Centro Histórico',
    body: 'Estimado Carlos, el evento Apertura Dominical comenzará en 60 minutos.',
    sentAt: '2026-09-13T08:00:00Z',
    status: 'sent',
    triggerType: 'automatic',
  }
];

// Connected WebSocket clients
interface ExtendedWebSocket extends WebSocket {
  isAlive?: boolean;
  clientId?: string;
  userName?: string;
}

const wss = new WebSocketServer({ server, path: '/ws' });

function broadcast(type: string, payload: any, senderWs?: WebSocket) {
  const message = JSON.stringify({
    type,
    payload,
    timestamp: Date.now(),
  });

  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN && client !== senderWs) {
      client.send(message);
    }
  });
}

function broadcastAll(type: string, payload: any) {
  const message = JSON.stringify({
    type,
    payload,
    timestamp: Date.now(),
  });

  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

wss.on('connection', (ws: ExtendedWebSocket) => {
  ws.isAlive = true;
  ws.clientId = 'user_' + Math.random().toString(36).substring(2, 9);

  ws.on('pong', () => {
    ws.isAlive = true;
  });

  // Send initial full sync
  ws.send(JSON.stringify({
    type: 'sync:full',
    payload: {
      events,
      locales,
      emailLogs,
      activeClientsCount: wss.clients.size,
    },
    timestamp: Date.now(),
  }));

  // Notify everyone about new connected collaborator
  broadcastAll('user:presence', {
    activeClientsCount: wss.clients.size,
  });

  ws.on('message', (data: string) => {
    try {
      const parsed = JSON.parse(data.toString());
      const { type, payload } = parsed;

      if (type === 'event:create') {
        const newEvt: CalendarEvent = {
          ...payload,
          id: payload.id || 'evt-' + Date.now(),
          updatedAt: new Date().toISOString(),
        };
        // Idempotent check
        if (!events.some((e) => e.id === newEvt.id)) {
          events.push(newEvt);
        }
        broadcast('event:create', newEvt, ws);
      } else if (type === 'event:update') {
        const index = events.findIndex((e) => e.id === payload.id);
        if (index !== -1) {
          events[index] = { ...events[index], ...payload, updatedAt: new Date().toISOString() };
          broadcast('event:update', events[index], ws);
        }
      } else if (type === 'event:delete') {
        events = events.filter((e) => e.id !== payload.id);
        broadcast('event:delete', { id: payload.id }, ws);
      } else if (type === 'sync:request') {
        ws.send(JSON.stringify({
          type: 'sync:full',
          payload: { events, locales, emailLogs, activeClientsCount: wss.clients.size },
          timestamp: Date.now(),
        }));
      }
    } catch (err) {
      console.error('Error handling ws message:', err);
    }
  });

  ws.on('close', () => {
    broadcastAll('user:presence', {
      activeClientsCount: wss.clients.size,
    });
  });
});

// Periodic automated email reminder background worker
// Checks for upcoming events needing automatic email reminders
setInterval(() => {
  const now = new Date();

  events.forEach((event) => {
    const start = new Date(event.startDate);
    const diffMinutes = Math.round((start.getTime() - now.getTime()) / (1000 * 60));

    if (!event.reminders) return;

    let updated = false;

    event.reminders.forEach((reminder) => {
      // If reminder is of type email, hasn't been sent, and we are within the notification window
      // (e.g. within target minutes and event has not finished more than 30 mins ago)
      if (
        reminder.type === 'email' &&
        !reminder.sent &&
        diffMinutes <= reminder.minutesBefore &&
        diffMinutes >= -30
      ) {
        reminder.sent = true;
        updated = true;

        // Send email to attendees or default user
        const recipients = event.attendees && event.attendees.length > 0
          ? event.attendees.map(a => a.email)
          : ['kevin.zambrano.inteligencia@gmail.com'];

        recipients.forEach((recipient) => {
          const emailRecord: EmailLog = {
            id: 'em-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
            eventId: event.id,
            eventTitle: event.title,
            recipient,
            subject: `⏰ Recordatorio Automático: "${event.title}" en ${event.localName}`,
            body: `Hola,\n\nEste es un recordatorio automático programado para el evento "${event.title}" en ${event.localName}.\n\n📅 Fecha: ${new Date(event.startDate).toLocaleString('es-ES', { dateStyle: 'full', timeStyle: 'short' })}\n🏢 Local: ${event.localName}\n📝 Descripción: ${event.description || 'Sin notas adicionales'}\n\nEste correo fue despachado automáticamente por el servicio de sincronización de Calendario.`,
            sentAt: new Date().toISOString(),
            status: 'sent',
            triggerType: 'automatic',
          };

          emailLogs.unshift(emailRecord);
          // Keep maximum 100 email logs
          if (emailLogs.length > 100) emailLogs.pop();

          broadcastAll('email:sent', emailRecord);
        });
      }
    });

    if (updated) {
      broadcastAll('event:update', event);
    }
  });
}, 15000); // Check every 15 seconds

// JSON body parser
app.use(express.json());

// API Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// GET Events
app.get('/api/events', (req, res) => {
  res.json({ events, count: events.length });
});

// POST Create Event
app.post('/api/events', (req, res) => {
  const newEvt: CalendarEvent = {
    ...req.body,
    id: req.body.id || 'evt-' + Date.now(),
    updatedAt: new Date().toISOString(),
  };
  events.push(newEvt);
  broadcastAll('event:create', newEvt);
  res.status(201).json(newEvt);
});

// PUT Update Event
app.put('/api/events/:id', (req, res) => {
  const { id } = req.params;
  const index = events.findIndex((e) => e.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Evento no encontrado' });
  }
  events[index] = {
    ...events[index],
    ...req.body,
    updatedAt: new Date().toISOString(),
  };
  broadcastAll('event:update', events[index]);
  res.json(events[index]);
});

// DELETE Event
app.delete('/api/events/:id', (req, res) => {
  const { id } = req.params;
  events = events.filter((e) => e.id !== id);
  broadcastAll('event:delete', { id });
  res.json({ success: true, id });
});

// GET Locales
app.get('/api/locales', (req, res) => {
  res.json({ locales });
});

// POST Create or Update Local
app.post('/api/locales', (req, res) => {
  const localData: Local = req.body;
  const index = locales.findIndex((l) => l.id === localData.id);
  if (index !== -1) {
    locales[index] = { ...locales[index], ...localData };
  } else {
    locales.push({
      ...localData,
      id: localData.id || 'loc-' + (locales.length + 1),
    });
  }
  broadcastAll('sync:locales', { locales });
  res.json({ success: true, locales });
});

// GET Email Logs (Outbox)
app.get('/api/emails', (req, res) => {
  res.json({ emailLogs });
});

// POST Send Test or Manual Email Reminder
app.post('/api/emails/send-test', (req, res) => {
  const { eventId, recipient, subject, customBody } = req.body;
  const event = events.find((e) => e.id === eventId);

  const targetRecipient = recipient || 'kevin.zambrano.inteligencia@gmail.com';
  const targetTitle = event ? event.title : 'Evento de Prueba';
  const targetLocal = event ? event.localName : 'Local Principal';

  const newLog: EmailLog = {
    id: 'em-' + Date.now(),
    eventId: eventId || 'evt-test',
    eventTitle: targetTitle,
    recipient: targetRecipient,
    subject: subject || `🔔 Recordatorio Prioritario: "${targetTitle}" en ${targetLocal}`,
    body: customBody || `Estimado usuario,\n\nEste es un recordatorio directo para la actividad programada en ${targetLocal}.\n\nFecha y hora: ${event ? new Date(event.startDate).toLocaleString('es-ES') : new Date().toLocaleString('es-ES')}\n\nEstado actual: Confirmado.\n\nSincronizado vía Calendario en tiempo real.`,
    sentAt: new Date().toISOString(),
    status: 'sent',
    triggerType: 'manual',
  };

  emailLogs.unshift(newLog);
  if (emailLogs.length > 100) emailLogs.pop();

  broadcastAll('email:sent', newLog);
  res.json({ success: true, email: newLog });
});

// POST Share Calendar
app.post('/api/share', (req, res) => {
  const { email, role, eventId } = req.body;
  if (eventId) {
    const event = events.find((e) => e.id === eventId);
    if (event) {
      if (!event.attendees) event.attendees = [];
      const existing = event.attendees.find((a) => a.email === email);
      if (existing) {
        existing.role = role || 'editor';
      } else {
        event.attendees.push({
          email,
          name: email.split('@')[0],
          role: role || 'editor',
          status: 'accepted',
        });
      }
      broadcastAll('event:update', event);
    }
  }

  // Create an automatic invitation email log
  const shareEmailLog: EmailLog = {
    id: 'em-' + Date.now(),
    eventId: eventId || 'all',
    eventTitle: eventId ? 'Acceso a Evento Compartido' : 'Acceso a Calendario de Locales',
    recipient: email,
    subject: `📋 Invitación para colaborar en Calendario de Locales`,
    body: `Hola,\n\nHas recibido una invitación con permisos de "${role || 'editor'}" para acceder y sincronizar eventos en tiempo real en Calendario de Locales.\n\nPuedes ver los turnos y actividades programadas iniciando sesión en la aplicación.`,
    sentAt: new Date().toISOString(),
    status: 'sent',
    triggerType: 'manual',
  };
  emailLogs.unshift(shareEmailLog);
  broadcastAll('email:sent', shareEmailLog);

  res.json({ success: true, message: `Calendario compartido con ${email}` });
});

// Mount Vite middleware for dev or serve static files in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Calendario server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
