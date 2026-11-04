export const MONTH_NAMES_ES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export const DAY_NAMES_SHORT = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
export const DAY_NAMES_FULL = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

/**
 * Normaliza cualquier string de fecha/hora eliminando sufijos de zona horaria UTC (+00:00 o Z)
 * para que JavaScript siempre interprete la hora exactamente como hora local de pared (wall-clock)
 * de Perú, evitando desfases de 5 horas (ej: 19:00 -> 14:00).
 */
export function normalizeLocalDateString(dateStr: string | null | undefined): string {
  if (!dateStr || typeof dateStr !== 'string') return '';
  return dateStr.replace(/(\+00:?00|Z)$/i, '').trim();
}

/**
 * Crea un objeto Date a partir de un string de fecha/hora asegurando que se interprete
 * como hora local de pared sin desfase UTC.
 */
export function parseEventDate(dateStr: string | null | undefined): Date {
  if (!dateStr) return new Date();
  const clean = normalizeLocalDateString(dateStr);
  const d = new Date(clean);
  if (isNaN(d.getTime())) return new Date();
  return d;
}

/**
 * Formatea la hora de un evento para mostrar en cards y resúmenes (ej: "7:00 p. m.")
 * garantizando que 19:00 se muestre como 7:00 p. m. sin desfases de zona horaria.
 */
export function formatEventTime(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  const clean = normalizeLocalDateString(dateStr);
  const d = new Date(clean);
  if (isNaN(d.getTime())) {
    if (clean.includes('T')) {
      const timePart = clean.split('T')[1];
      if (timePart) {
        const [hStr, mStr] = timePart.split(':');
        const h = parseInt(hStr, 10);
        const ampm = h >= 12 ? 'p. m.' : 'a. m.';
        const h12 = h % 12 || 12;
        return `${h12}:${mStr} ${ampm}`;
      }
    }
    return '';
  }
  return d.toLocaleTimeString('es-ES', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export function formatTimeHM(dateStr: string): string {
  try {
    const clean = normalizeLocalDateString(dateStr);
    if (clean.includes('T')) {
      const timePart = clean.split('T')[1];
      if (timePart) return timePart.substring(0, 5);
    }
    const d = new Date(clean);
    return d.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', hour12: false });
  } catch {
    return dateStr;
  }
}

export function formatDateShort(date: Date): string {
  return `${date.getDate()} ${MONTH_NAMES_ES[date.getMonth()].slice(0, 3)}`;
}

export function isSameDay(d1: Date, d2: Date): boolean {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

export function isToday(d: Date): boolean {
  return isSameDay(d, new Date());
}

// Generate 35 or 42 day cells for month view
export function getMonthDays(year: number, month: number): Date[] {
  const firstDay = new Date(year, month, 1);
  const startDayOfWeek = firstDay.getDay(); // 0 is Sunday
  
  const startDate = new Date(year, month, 1 - startDayOfWeek);
  const days: Date[] = [];
  
  for (let i = 0; i < 42; i++) {
    const next = new Date(startDate);
    next.setDate(startDate.getDate() + i);
    days.push(next);
  }
  
  if (days[35].getMonth() !== month) {
    if (days[28].getMonth() !== month) {
      return days.slice(0, 28);
    }
    return days.slice(0, 35);
  }
  
  return days;
}

// Get 7 days for current week containing targetDate (starting Sunday)
export function getWeekDays(targetDate: Date): Date[] {
  const dayOfWeek = targetDate.getDay();
  const start = new Date(targetDate);
  start.setDate(targetDate.getDate() - dayOfWeek);
  
  const days: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    days.push(d);
  }
  return days;
}

export function formatISO(date: Date, hours: number = 9, minutes: number = 0): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const h = String(hours).padStart(2, '0');
  const min = String(minutes).padStart(2, '0');
  return `${y}-${m}-${d}T${h}:${min}`;
}
