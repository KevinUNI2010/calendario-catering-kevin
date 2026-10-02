export const MONTH_NAMES_ES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export const DAY_NAMES_SHORT = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
export const DAY_NAMES_FULL = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

export function formatTimeHM(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: false });
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
