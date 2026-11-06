import React, { useRef, useState } from 'react';
import { CalendarEvent, Local } from '../types';
import { getMonthDays, isSameDay, isToday, DAY_NAMES_SHORT, parseEventDate } from '../utils/dateUtils';
import { getEventColor } from '../utils/colorUtils';
import { soundManager } from '../utils/soundEffects';
import { Plus } from 'lucide-react';

interface MonthViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  onSelectEvent: (e: React.MouseEvent, event: CalendarEvent) => void;
  onCreateEventOnDate: (date: Date) => void;
  onShowDaySummary?: (date: Date, events: CalendarEvent[]) => void;
  role?: string;
  locales?: Local[];
  onPrevDate?: () => void;
  onNextDate?: () => void;
}

export const HonorMonthView: React.FC<MonthViewProps> = ({
  currentDate,
  events,
  onSelectEvent,
  onCreateEventOnDate,
  onShowDaySummary,
  role,
  locales = [],
  onPrevDate,
  onNextDate,
}) => {
  const days = getMonthDays(currentDate.getFullYear(), currentDate.getMonth());
  const currentMonth = currentDate.getMonth();

  // Soporte de Slide táctil interactivo y natural para mobile y tablets
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const touchStartTime = useRef<number>(0);
  const isHorizontalSwipe = useRef<boolean | null>(null);
  const isSwipingActive = useRef<boolean>(false);

  const [dragOffset, setDragOffset] = useState<number>(0);
  const [dragOpacity, setDragOpacity] = useState<number>(1);
  const [transitionStyle, setTransitionStyle] = useState<string>('none');
  const [isTransitioning, setIsTransitioning] = useState<boolean>(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (isTransitioning) return;
    if (e.touches.length === 1) {
      touchStartX.current = e.touches[0].clientX;
      touchStartY.current = e.touches[0].clientY;
      touchStartTime.current = Date.now();
      isHorizontalSwipe.current = null;
      isSwipingActive.current = true;
      setTransitionStyle('none');
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isSwipingActive.current || touchStartX.current === null || touchStartY.current === null || isTransitioning) return;

    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const diffX = currentX - touchStartX.current;
    const diffY = currentY - touchStartY.current;

    // Detectar intención del gesto en los primeros 8 píxeles
    if (isHorizontalSwipe.current === null) {
      if (Math.abs(diffX) > 8 || Math.abs(diffY) > 8) {
        if (Math.abs(diffX) > Math.abs(diffY) * 1.1) {
          isHorizontalSwipe.current = true;
        } else {
          isHorizontalSwipe.current = false;
        }
      }
    }

    // Si es desplazamiento horizontal, la cuadrícula sigue el dedo en tiempo real (1:1)
    if (isHorizontalSwipe.current === true) {
      const offset = diffX * 0.95;
      setDragOffset(offset);
      const screenW = typeof window !== 'undefined' ? window.innerWidth : 380;
      const progress = Math.min(1, Math.abs(offset) / screenW);
      setDragOpacity(Math.max(0.35, 1 - progress * 0.65));
    }
  };

  const handleTouchEnd = () => {
    if (!isSwipingActive.current || touchStartX.current === null || isTransitioning) {
      isSwipingActive.current = false;
      return;
    }

    isSwipingActive.current = false;
    const isHorizontal = isHorizontalSwipe.current === true;
    const currentOffset = dragOffset;
    const duration = Date.now() - touchStartTime.current;
    const velocity = Math.abs(currentOffset) / Math.max(1, duration);

    touchStartX.current = null;
    touchStartY.current = null;
    isHorizontalSwipe.current = null;

    if (!isHorizontal) {
      setDragOffset(0);
      setDragOpacity(1);
      return;
    }

    // Umbral de activación natural: 55px o deslizamiento rápido (> 0.45 px/ms)
    const threshold = 55;
    const shouldChange = (Math.abs(currentOffset) >= threshold || velocity > 0.45) && duration < 800;

    if (shouldChange) {
      setIsTransitioning(true);
      const isNext = currentOffset < 0; // Deslizó a la izquierda -> Siguiente mes
      const screenW = typeof window !== 'undefined' ? window.innerWidth : 380;
      const exitTarget = isNext ? -screenW * 0.8 : screenW * 0.8;

      // 1. Deslizar con inercia hacia afuera
      setTransitionStyle('transform 180ms cubic-bezier(0.2, 0.9, 0.4, 1), opacity 180ms ease-out');
      setDragOffset(exitTarget);
      setDragOpacity(0.15);

      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        try { navigator.vibrate(12); } catch {}
      }
      soundManager.playQuickClick();

      setTimeout(() => {
        // 2. Cambiar de mes
        if (isNext) {
          if (onNextDate) onNextDate();
        } else {
          if (onPrevDate) onPrevDate();
        }

        // 3. Posicionar el nuevo mes en el lado opuesto sin animación
        const enterOrigin = isNext ? screenW * 0.5 : -screenW * 0.5;
        setTransitionStyle('none');
        setDragOffset(enterOrigin);
        setDragOpacity(0.3);

        // 4. Deslizar suavemente hacia el centro con efecto elástico
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            setTransitionStyle('transform 240ms cubic-bezier(0.16, 1, 0.3, 1), opacity 240ms ease-out');
            setDragOffset(0);
            setDragOpacity(1);
            setTimeout(() => {
              setIsTransitioning(false);
              setTransitionStyle('none');
            }, 250);
          });
        });
      }, 190);
    } else {
      // Si no superó el umbral, regresar elásticamente al centro
      setTransitionStyle('transform 220ms cubic-bezier(0.175, 0.885, 0.32, 1.15), opacity 200ms ease-out');
      setDragOffset(0);
      setDragOpacity(1);
      setTimeout(() => {
        setTransitionStyle('none');
      }, 230);
    }
  };

  const handleTouchCancel = () => {
    isSwipingActive.current = false;
    touchStartX.current = null;
    touchStartY.current = null;
    isHorizontalSwipe.current = null;
    setTransitionStyle('transform 200ms ease-out, opacity 200ms ease-out');
    setDragOffset(0);
    setDragOpacity(1);
    setTimeout(() => setTransitionStyle('none'), 210);
  };

  return (
    <div 
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchCancel}
      className="flex flex-col h-full bg-[#f7f8fa] dark:bg-[#0c0c0c] select-none overflow-y-auto p-1.5 sm:p-4 gap-2 touch-pan-y overflow-x-hidden"
    >
      {/* Day of Week Headers */}
      <div className="grid grid-cols-7 mb-1 sticky top-0 z-10 shrink-0 bg-[#f7f8fa] dark:bg-[#0c0c0c] py-1">
        {DAY_NAMES_SHORT.map((day, idx) => (
          <div
            key={day}
            className={`py-1 sm:py-2 text-center text-[10px] sm:text-xs font-semibold uppercase tracking-wider ${
              idx === 0 || idx === 6 ? 'text-gray-400 dark:text-gray-500' : 'text-gray-600 dark:text-gray-300'
            }`}
          >
            <span className="hidden sm:inline">{day}</span>
            <span className="sm:hidden">{day[0]}</span>
          </div>
        ))}
      </div>

      {/* Days Grid con deslizamiento interactivo en tiempo real (1:1 con el dedo) */}
      <div 
        style={{
          transform: `translate3d(${dragOffset}px, 0, 0)`,
          opacity: dragOpacity,
          transition: transitionStyle,
          willChange: dragOffset !== 0 ? 'transform, opacity' : 'auto',
        }}
        className="grid grid-cols-7 flex-1 auto-rows-fr gap-1 sm:gap-3 pb-20 sm:pb-0"
      >
        {days.map((day, idx) => {
          const isCurrMonth = day.getMonth() === currentMonth;
          const dayEvents = events.filter((e) => {
            const start = parseEventDate(e.startDate);
            return isSameDay(start, day);
          });
          const today = isToday(day);

          return (
            <div
              key={idx}
              onClick={() => {
                if (Math.abs(dragOffset) > 6 || isTransitioning) return;
                if (onShowDaySummary) {
                  onShowDaySummary(day, dayEvents);
                }
              }}
              className={`min-h-[65px] sm:min-h-[100px] p-0.5 sm:p-1 flex flex-col group relative rounded-xl sm:rounded-2xl transition-all duration-300 cursor-pointer ${
                isCurrMonth 
                  ? 'bg-white dark:bg-[#1a1a1a] shadow-[0_2px_12px_rgba(0,0,0,0.02)] hover:shadow-[0_4px_20px_rgba(0,0,0,0.06)] hover:scale-[1.01] dark:shadow-none' 
                  : 'bg-gray-200/50 dark:bg-gray-800/40 text-gray-400 dark:text-gray-600 opacity-80'
              }`}
            >
              {/* Day Number Header */}
              <div className="flex items-center justify-start gap-0.5 sm:gap-1 mb-0.5 sm:mb-1 w-full min-w-0">
                <span
                  className={`text-[11px] sm:text-xs font-bold shrink-0 ${
                    today
                      ? 'w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-[#2b6de3] text-white shadow-xs inline-flex items-center justify-center'
                      : isCurrMonth
                      ? 'text-gray-800 dark:text-gray-200 pl-0.5 pr-0.5'
                      : 'text-gray-400 dark:text-gray-600 pl-0.5 pr-0.5'
                  }`}
                >
                  {day.getDate()}
                </span>
              </div>

              {/* Event Badges */}
              <div className="flex-1 mt-1 overflow-y-auto scrollbar-none min-h-[40px] flex flex-col gap-1">
                {dayEvents.map((event) => {
                  const color = getEventColor(event.colorId);
                  const isPostponed = event.status === 'postponed';
                  const isCancelled = event.status === 'cancelled';
                  const stateColor = isPostponed ? '#f59e0b' : isCancelled ? '#ef4444' : null;

                  return (
                    <div 
                      key={event.id} 
                      onClick={(e) => {
                        e.stopPropagation();
                        if (Math.abs(dragOffset) > 6 || isTransitioning) return;
                        if (role !== 'admin') {
                          if (onShowDaySummary) {
                            onShowDaySummary(day, dayEvents);
                          }
                        } else {
                          onSelectEvent(e, event);
                        }
                      }}
                      className="relative w-full rounded py-[3px] px-1 text-[8px] sm:text-[10px] leading-none font-bold shadow-sm whitespace-nowrap overflow-hidden text-clip cursor-pointer hover:opacity-90 active:scale-[0.98] transition-transform text-center flex items-center justify-center"
                      style={{ backgroundColor: color.bg, color: color.text || '#fff' }}
                      title={`${event.localName}${isPostponed ? ' (Postergado)' : isCancelled ? ' (Cancelado)' : ''}`}
                    >
                      <span className="truncate block w-full select-none">{event.localName || 'Evento'}</span>

                      {(isPostponed || isCancelled) && (
                        <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-10 overflow-hidden select-none">
                          <svg className="w-full h-full drop-shadow-[0_1px_1px_rgba(0,0,0,0.6)]" viewBox="0 0 100 100" preserveAspectRatio="none">
                            <line x1="4" y1="8" x2="96" y2="92" stroke={stateColor!} strokeWidth="7" strokeLinecap="round" />
                            <line x1="96" y1="8" x2="4" y2="92" stroke={stateColor!} strokeWidth="7" strokeLinecap="round" />
                          </svg>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
