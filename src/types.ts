export type EventColor = {
  id: string;
  name: string;
  bg: string;
  text: string;
  border: string;
  dot: string;
};

export const GOOGLE_CALENDAR_COLORS: EventColor[] = [
  { id: 'peacock', name: 'Azul Pavo (Turnos)', bg: '#039be5', text: '#ffffff', border: '#0288d1', dot: '#039be5' },
  { id: 'flamingo', name: 'Flamenco (Urgente)', bg: '#e67c73', text: '#ffffff', border: '#d9534f', dot: '#e67c73' },
  { id: 'grape', name: 'Uva (Especial)', bg: '#8e24aa', text: '#ffffff', border: '#7b1fa2', dot: '#8e24aa' },
  { id: 'sage', name: 'Salvia (Mantenimiento)', bg: '#33b679', text: '#ffffff', border: '#2e7d32', dot: '#33b679' },
  { id: 'banana', name: 'Plátano (Capacitación)', bg: '#f6bf26', text: '#1f2937', border: '#f59e0b', dot: '#f6bf26' },
  { id: 'tangerine', name: 'Mandarina (Inspección)', bg: '#f4511e', text: '#ffffff', border: '#d84315', dot: '#f4511e' },
  { id: 'blueberry', name: 'Arándano (Operaciones)', bg: '#3f51b5', text: '#ffffff', border: '#303f9f', dot: '#3f51b5' },
  { id: 'basil', name: 'Albahaca (Apertura)', bg: '#0b8043', text: '#ffffff', border: '#0a6b38', dot: '#0b8043' },
  { id: 'graphite', name: 'Grafito (Cierre)', bg: '#616161', text: '#ffffff', border: '#424242', dot: '#616161' },
  { id: 'amethyst', name: 'Amatista (Inventario)', bg: '#7986cb', text: '#ffffff', border: '#5c6bc0', dot: '#7986cb' },
];

export interface Local {
  id: string;
  name: string;
  colorId: string;
}

export interface Attendee {
  email: string;
  name?: string;
  role: 'admin' | 'editor' | 'viewer';
  status: 'accepted' | 'tentative' | 'declined';
}

export interface DishSelection {
  proteina: string;
  ensalada: string;
  salsa: string;
  guarnicion: string;
  carbohidrato: string;
}

export interface ReminderConfig {
  id: string;
  type: 'email' | 'notification';
  minutesBefore: number;
  sent?: boolean;
}

export interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  startDate: string; // ISO format or YYYY-MM-DDTHH:mm
  endDate: string;
  allDay: boolean;
  colorId: string;
  localId: string;
  localName: string;
  status: 'confirmed' | 'pending' | 'in_progress' | 'cancelled';
  attendees: Attendee[];
  reminders: ReminderConfig[];
  createdBy: string;
  updatedAt: string;
  notes?: string;
  dish?: DishSelection;
}

export interface EmailLog {
  id: string;
  eventId: string;
  eventTitle: string;
  recipient: string;
  subject: string;
  body: string;
  sentAt: string;
  status: 'sent' | 'pending' | 'failed';
  triggerType: 'automatic' | 'manual';
}

export type ViewMode = 'month' | 'week' | 'day' | 'agenda';

export interface SyncMessage {
  type: 'event:create' | 'event:update' | 'event:delete' | 'sync:full' | 'user:joined' | 'user:left' | 'email:sent';
  payload: any;
  senderId: string;
  timestamp: number;
}

export interface ConnectedUser {
  id: string;
  name: string;
  email: string;
  color: string;
  lastActive: number;
}
