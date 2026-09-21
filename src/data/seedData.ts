import { CalendarEvent, Local } from '../types';

export const DEFAULT_LOCALES: Local[] = [
  {
    id: 'loc-1',
    name: 'VILLA SANTIAGO',
    colorId: 'peacock',
  },
  {
    id: 'loc-2',
    name: 'CRISTALES',
    colorId: 'sage',
  },
  {
    id: 'loc-3',
    name: 'ARYES',
    colorId: 'grape',
  },
  {
    id: 'loc-4',
    name: 'GLADIOLOS',
    colorId: 'tangerine',
  },
  {
    id: 'loc-5',
    name: 'ESTELAR',
    colorId: 'blueberry',
  },
];

// Helper to format ISO strings around current month (September 2026)
const formatDateTime = (day: number, hour: number, minute: number = 0) => {
  const d = String(day).padStart(2, '0');
  const h = String(hour).padStart(2, '0');
  const m = String(minute).padStart(2, '0');
  return `2026-09-${d}T${h}:${m}`;
};

export const INITIAL_EVENTS: CalendarEvent[] = [
  // Sunday 13
  {
    id: 'evt-01',
    title: 'Apertura Dominical y Revisión de Inventario',
    description: 'Verificación de existencias para la semana y encendido de sistemas de refrigeración.',
    startDate: formatDateTime(13, 9, 0),
    endDate: formatDateTime(13, 11, 30),
    allDay: false,
    colorId: 'peacock',
    localId: 'loc-1',
    localName: 'VILLA SANTIAGO',
    status: 'confirmed',
    attendees: [
      { email: 'carlos.mendoza@locales.com', name: 'Carlos Mendoza', role: 'admin', status: 'accepted' },
      { email: 'kevin.zambrano.inteligencia@gmail.com', name: 'Kevin Zambrano', role: 'editor', status: 'accepted' },
    ],
    reminders: [
      { id: 'rem-1', type: 'email', minutesBefore: 60, sent: true },
      { id: 'rem-2', type: 'notification', minutesBefore: 15, sent: true },
    ],
    createdBy: 'Carlos Mendoza',
    updatedAt: '2026-09-13T08:00:00Z',
    notes: 'Confirmado pedido de panadería fresca a las 08:30.',
  },
  {
    id: 'evt-02',
    title: 'Brunch Ejecutivo y Degustación de Temporada',
    description: 'Atención a comensales VIP con menú de autor y música ambiental en vivo.',
    startDate: formatDateTime(13, 13, 0),
    endDate: formatDateTime(13, 16, 0),
    allDay: false,
    colorId: 'grape',
    localId: 'loc-3',
    localName: 'ARYES',
    status: 'confirmed',
    attendees: [
      { email: 'rodrigo.alarcon@locales.com', name: 'Rodrigo Alarcón', role: 'admin', status: 'accepted' },
    ],
    reminders: [
      { id: 'rem-3', type: 'email', minutesBefore: 120, sent: true },
    ],
    createdBy: 'Rodrigo Alarcón',
    updatedAt: '2026-09-13T10:30:00Z',
  },

  // Monday 14 (TODAY)
  {
    id: 'evt-03',
    title: 'Turno Matutino y Despacho de Pedidos Online',
    description: 'Coordinación con repartidores y preparación del primer bloque de pedidos corporativos.',
    startDate: formatDateTime(14, 8, 30),
    endDate: formatDateTime(14, 12, 0),
    allDay: false,
    colorId: 'peacock',
    localId: 'loc-1',
    localName: 'VILLA SANTIAGO',
    status: 'in_progress',
    attendees: [
      { email: 'carlos.mendoza@locales.com', name: 'Carlos Mendoza', role: 'admin', status: 'accepted' },
      { email: 'kevin.zambrano.inteligencia@gmail.com', name: 'Kevin Zambrano', role: 'editor', status: 'accepted' },
    ],
    reminders: [
      { id: 'rem-4', type: 'email', minutesBefore: 30, sent: true },
      { id: 'rem-5', type: 'notification', minutesBefore: 10, sent: true },
    ],
    createdBy: 'Carlos Mendoza',
    updatedAt: '2026-09-14T07:45:00Z',
    notes: 'Capacidad al 85% para entrega rápida.',
  },
  {
    id: 'evt-04',
    title: 'Mantenimiento Preventivo de Aires y Cafeteras',
    description: 'Limpieza profunda de filtros, descalcificación y certificación técnica semestral.',
    startDate: formatDateTime(14, 10, 0),
    endDate: formatDateTime(14, 12, 30),
    allDay: false,
    colorId: 'sage',
    localId: 'loc-2',
    localName: 'CRISTALES',
    status: 'confirmed',
    attendees: [
      { email: 'valeria.soto@locales.com', name: 'Valeria Soto', role: 'admin', status: 'accepted' },
    ],
    reminders: [
      { id: 'rem-6', type: 'email', minutesBefore: 60, sent: true },
      { id: 'rem-7', type: 'notification', minutesBefore: 15, sent: false },
    ],
    createdBy: 'Valeria Soto',
    updatedAt: '2026-09-14T08:00:00Z',
  },
  {
    id: 'evt-05',
    title: 'Inspección Sanitaria y Auditoría de Seguridad',
    description: 'Revisión de protocolos de higiene, extintores y bitácoras de temperatura.',
    startDate: formatDateTime(14, 14, 0),
    endDate: formatDateTime(14, 16, 30),
    allDay: false,
    colorId: 'tangerine',
    localId: 'loc-4',
    localName: 'GLADIOLOS',
    status: 'pending',
    attendees: [
      { email: 'elena.morales@locales.com', name: 'Elena Morales', role: 'admin', status: 'accepted' },
      { email: 'auditor@sanidad.gob.mx', name: 'Auditor Externo', role: 'viewer', status: 'tentative' },
    ],
    reminders: [
      { id: 'rem-8', type: 'email', minutesBefore: 60, sent: false },
      { id: 'rem-9', type: 'notification', minutesBefore: 10, sent: false },
    ],
    createdBy: 'Elena Morales',
    updatedAt: '2026-09-14T11:00:00Z',
    notes: 'Tener a la mano carpeta de licencias 2026.',
  },
  {
    id: 'evt-06',
    title: 'Noche Temática y Presentación de Menú Cócteles',
    description: 'Evento con música acústica y presentación de la nueva carta de bebidas artesanales.',
    startDate: formatDateTime(14, 19, 0),
    endDate: formatDateTime(14, 23, 0),
    allDay: false,
    colorId: 'blueberry',
    localId: 'loc-5',
    localName: 'ESTELAR',
    status: 'confirmed',
    attendees: [
      { email: 'santiago.ramos@locales.com', name: 'Santiago Ramos', role: 'admin', status: 'accepted' },
      { email: 'kevin.zambrano.inteligencia@gmail.com', name: 'Kevin Zambrano', role: 'editor', status: 'accepted' },
    ],
    reminders: [
      { id: 'rem-10', type: 'email', minutesBefore: 120, sent: false },
      { id: 'rem-11', type: 'notification', minutesBefore: 30, sent: false },
    ],
    createdBy: 'Santiago Ramos',
    updatedAt: '2026-09-14T12:15:00Z',
  },

  // Tuesday 15
  {
    id: 'evt-07',
    title: 'Recepción de Proveedores Cárnicos y Verduras',
    description: 'Control de calidad en muelle de descarga y registro en sistema ERP.',
    startDate: formatDateTime(15, 7, 0),
    endDate: formatDateTime(15, 9, 30),
    allDay: false,
    colorId: 'sage',
    localId: 'loc-2',
    localName: 'CRISTALES',
    status: 'confirmed',
    attendees: [
      { email: 'valeria.soto@locales.com', name: 'Valeria Soto', role: 'admin', status: 'accepted' },
    ],
    reminders: [
      { id: 'rem-12', type: 'email', minutesBefore: 60, sent: false },
    ],
    createdBy: 'Valeria Soto',
    updatedAt: '2026-09-14T14:00:00Z',
  },
  {
    id: 'evt-08',
    title: 'Capacitación en Servicio y Manejo de Reservas',
    description: 'Taller práctico con el equipo de salón sobre etiqueta y resolución de incidencias.',
    startDate: formatDateTime(15, 11, 0),
    endDate: formatDateTime(15, 13, 0),
    allDay: false,
    colorId: 'grape',
    localId: 'loc-3',
    localName: 'ARYES',
    status: 'confirmed',
    attendees: [
      { email: 'rodrigo.alarcon@locales.com', name: 'Rodrigo Alarcón', role: 'admin', status: 'accepted' },
    ],
    reminders: [
      { id: 'rem-13', type: 'email', minutesBefore: 60, sent: false },
      { id: 'rem-14', type: 'notification', minutesBefore: 15, sent: false },
    ],
    createdBy: 'Rodrigo Alarcón',
    updatedAt: '2026-09-14T15:20:00Z',
  },
  {
    id: 'evt-09',
    title: 'Cena Fiestas Patrias y Conteo Especial',
    description: 'Reserva exclusiva corporativa de 80 comensales.',
    startDate: formatDateTime(15, 20, 0),
    endDate: formatDateTime(15, 23, 45),
    allDay: false,
    colorId: 'peacock',
    localId: 'loc-1',
    localName: 'VILLA SANTIAGO',
    status: 'confirmed',
    attendees: [
      { email: 'carlos.mendoza@locales.com', name: 'Carlos Mendoza', role: 'admin', status: 'accepted' },
      { email: 'kevin.zambrano.inteligencia@gmail.com', name: 'Kevin Zambrano', role: 'editor', status: 'accepted' },
    ],
    reminders: [
      { id: 'rem-15', type: 'email', minutesBefore: 180, sent: false },
    ],
    createdBy: 'Carlos Mendoza',
    updatedAt: '2026-09-14T16:00:00Z',
  },

  // Wednesday 16
  {
    id: 'evt-10',
    title: 'Desfile y Turno Especial Feriado',
    description: 'Operación con menú festivo y doble plantilla de baristas.',
    startDate: formatDateTime(16, 10, 0),
    endDate: formatDateTime(16, 18, 0),
    allDay: false,
    colorId: 'peacock',
    localId: 'loc-1',
    localName: 'VILLA SANTIAGO',
    status: 'confirmed',
    attendees: [
      { email: 'carlos.mendoza@locales.com', name: 'Carlos Mendoza', role: 'admin', status: 'accepted' },
    ],
    reminders: [
      { id: 'rem-16', type: 'notification', minutesBefore: 30, sent: false },
    ],
    createdBy: 'Carlos Mendoza',
    updatedAt: '2026-09-14T16:10:00Z',
  },
  {
    id: 'evt-11',
    title: 'Sesión Fotográfica para Nueva Campaña Digital',
    description: 'Fotógrafo profesional capturando platos estrella y ambientación de terraza.',
    startDate: formatDateTime(16, 15, 30),
    endDate: formatDateTime(16, 18, 30),
    allDay: false,
    colorId: 'grape',
    localId: 'loc-3',
    localName: 'ARYES',
    status: 'confirmed',
    attendees: [
      { email: 'rodrigo.alarcon@locales.com', name: 'Rodrigo Alarcón', role: 'admin', status: 'accepted' },
    ],
    reminders: [
      { id: 'rem-17', type: 'email', minutesBefore: 60, sent: false },
    ],
    createdBy: 'Rodrigo Alarcón',
    updatedAt: '2026-09-14T16:30:00Z',
  },

  // Thursday 17
  {
    id: 'evt-12',
    title: 'Reunión de Gerentes de Zona y Balance Semanal',
    description: 'Análisis de ventas cruzadas, costes por ración y tiempos de servicio.',
    startDate: formatDateTime(17, 9, 0),
    endDate: formatDateTime(17, 11, 30),
    allDay: false,
    colorId: 'tangerine',
    localId: 'loc-4',
    localName: 'GLADIOLOS',
    status: 'confirmed',
    attendees: [
      { email: 'elena.morales@locales.com', name: 'Elena Morales', role: 'admin', status: 'accepted' },
      { email: 'carlos.mendoza@locales.com', name: 'Carlos Mendoza', role: 'editor', status: 'accepted' },
      { email: 'valeria.soto@locales.com', name: 'Valeria Soto', role: 'editor', status: 'accepted' },
      { email: 'kevin.zambrano.inteligencia@gmail.com', name: 'Kevin Zambrano', role: 'admin', status: 'accepted' },
    ],
    reminders: [
      { id: 'rem-18', type: 'email', minutesBefore: 60, sent: false },
      { id: 'rem-19', type: 'notification', minutesBefore: 15, sent: false },
    ],
    createdBy: 'Elena Morales',
    updatedAt: '2026-09-14T17:00:00Z',
  },
  {
    id: 'evt-13',
    title: 'Prueba de Sonido y Montaje Acústico',
    description: 'Instalación de bocinas de bajo consumo y ecualización de terraza.',
    startDate: formatDateTime(17, 16, 0),
    endDate: formatDateTime(17, 18, 0),
    allDay: false,
    colorId: 'blueberry',
    localId: 'loc-5',
    localName: 'ESTELAR',
    status: 'pending',
    attendees: [
      { email: 'santiago.ramos@locales.com', name: 'Santiago Ramos', role: 'admin', status: 'accepted' },
    ],
    reminders: [
      { id: 'rem-20', type: 'notification', minutesBefore: 30, sent: false },
    ],
    createdBy: 'Santiago Ramos',
    updatedAt: '2026-09-14T17:30:00Z',
  },

  // Friday 18
  {
    id: 'evt-14',
    title: 'Viernes After Office & Happy Hour Local',
    description: 'Promoción 2x1 en barra seleccionada con DJ invitado.',
    startDate: formatDateTime(18, 17, 0),
    endDate: formatDateTime(18, 22, 0),
    allDay: false,
    colorId: 'tangerine',
    localId: 'loc-4',
    localName: 'GLADIOLOS',
    status: 'confirmed',
    attendees: [
      { email: 'elena.morales@locales.com', name: 'Elena Morales', role: 'admin', status: 'accepted' },
    ],
    reminders: [
      { id: 'rem-21', type: 'email', minutesBefore: 120, sent: false },
    ],
    createdBy: 'Elena Morales',
    updatedAt: '2026-09-14T18:00:00Z',
  },
  {
    id: 'evt-15',
    title: 'Cierre Contable y Arqueo Semanal de Cajas',
    description: 'Auditoría de terminales punto de venta y cierre fiscal de fin de semana.',
    startDate: formatDateTime(18, 22, 0),
    endDate: formatDateTime(18, 23, 30),
    allDay: false,
    colorId: 'sage',
    localId: 'loc-2',
    localName: 'CRISTALES',
    status: 'confirmed',
    attendees: [
      { email: 'valeria.soto@locales.com', name: 'Valeria Soto', role: 'admin', status: 'accepted' },
    ],
    reminders: [
      { id: 'rem-22', type: 'notification', minutesBefore: 15, sent: false },
    ],
    createdBy: 'Valeria Soto',
    updatedAt: '2026-09-14T18:15:00Z',
  },

  // Saturday 19
  {
    id: 'evt-16',
    title: 'Festival Gastronómico y Música en Terraza',
    description: 'Afluencia proyectada superior a 350 comensales a lo largo de la jornada.',
    startDate: formatDateTime(19, 13, 0),
    endDate: formatDateTime(19, 21, 0),
    allDay: false,
    colorId: 'blueberry',
    localId: 'loc-5',
    localName: 'ESTELAR',
    status: 'confirmed',
    attendees: [
      { email: 'santiago.ramos@locales.com', name: 'Santiago Ramos', role: 'admin', status: 'accepted' },
      { email: 'kevin.zambrano.inteligencia@gmail.com', name: 'Kevin Zambrano', role: 'editor', status: 'accepted' },
    ],
    reminders: [
      { id: 'rem-23', type: 'email', minutesBefore: 180, sent: false },
      { id: 'rem-24', type: 'notification', minutesBefore: 30, sent: false },
    ],
    createdBy: 'Santiago Ramos',
    updatedAt: '2026-09-14T18:30:00Z',
  },
];
