import React, { useState, useEffect } from 'react';
import { X, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { getMonthDays, isSameDay, MONTH_NAMES_ES } from '../utils/dateUtils';

interface SummaryConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (start: Date, end: Date) => void;
  initialDate?: Date;
}

export const SummaryConfigModal: React.FC<SummaryConfigModalProps> = ({
  isOpen,
  onClose,
  onGenerate,
  initialDate = new Date()
}) => {
  const [currentMonth, setCurrentMonth] = useState(() => new Date(initialDate.getFullYear(), initialDate.getMonth(), 1));
  const [startDate, setStartDate] = useState<Date | null>(initialDate);
  const [endDate, setEndDate] = useState<Date | null>(initialDate);
  const [hoverDate, setHoverDate] = useState<Date | null>(null);

  useEffect(() => {
    if (isOpen) {
      setCurrentMonth(new Date(initialDate.getFullYear(), initialDate.getMonth(), 1));
      setStartDate(initialDate);
      setEndDate(initialDate);
      setHoverDate(null);
    }
  }, [isOpen, initialDate]);

  if (!isOpen) return null;

  const handlePrevMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const handleDayClick = (date: Date) => {
    if (!startDate || (startDate && endDate)) {
      setStartDate(date);
      setEndDate(null);
    } else {
      if (date < startDate) {
        setStartDate(date);
      } else {
        setEndDate(date);
      }
    }
  };

  const handleGenerateClick = () => {
    if (startDate) {
      const actualEnd = endDate || startDate;
      const startOfDay = new Date(startDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(actualEnd);
      endOfDay.setHours(23, 59, 59, 999);
      onGenerate(startOfDay, endOfDay);
      onClose();
    }
  };

  const days = getMonthDays(currentMonth.getFullYear(), currentMonth.getMonth());
  const monthName = MONTH_NAMES_ES[currentMonth.getMonth()].toUpperCase();
  const year = currentMonth.getFullYear();

  const dayNames = ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa'];

  const getDayClasses = (date: Date) => {
    const isCurrentMonth = date.getMonth() === currentMonth.getMonth();
    const isStart = startDate && isSameDay(date, startDate);
    const isEnd = endDate && isSameDay(date, endDate);
    
    let inRange = false;
    if (startDate && endDate) {
      inRange = date > startDate && date < endDate;
    } else if (startDate && hoverDate && !endDate) {
      if (hoverDate > startDate) {
        inRange = date > startDate && date <= hoverDate;
      } else {
        inRange = date >= hoverDate && date < startDate;
      }
    }

    let classes = "w-9 h-9 flex items-center justify-center text-sm rounded-full transition-colors cursor-pointer select-none mx-auto relative ";
    
    if (isStart || isEnd) {
      classes += "bg-blue-600 text-white font-bold shadow-md z-10 ";
    } else if (inRange) {
      classes += "bg-blue-50 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 font-medium z-0 rounded-none ";
    } else if (!isCurrentMonth) {
      classes += "text-gray-300 dark:text-gray-600 ";
    } else {
      classes += "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 ";
    }

    return classes;
  };

  const getWrapperClasses = (date: Date) => {
    const isStart = startDate && isSameDay(date, startDate);
    const isEnd = endDate && isSameDay(date, endDate);
    
    let inRange = false;
    if (startDate && endDate) {
      inRange = date > startDate && date < endDate;
    } else if (startDate && hoverDate && !endDate) {
      inRange = (date > startDate && date <= hoverDate) || (date >= hoverDate && date < startDate);
    }

    let classes = "relative flex justify-center py-0.5 ";
    if (inRange || isStart || isEnd) {
      if (startDate && (endDate || hoverDate)) {
        const actualEnd = endDate || hoverDate!;
        const actStart = startDate < actualEnd ? startDate : actualEnd;
        const actEnd = startDate > actualEnd ? startDate : actualEnd;

        if (isSameDay(date, actStart) && !isSameDay(actStart, actEnd)) {
          classes += "before:absolute before:inset-y-0.5 before:right-0 before:w-1/2 before:bg-blue-50 dark:before:bg-blue-900/40 ";
        } else if (isSameDay(date, actEnd) && !isSameDay(actStart, actEnd)) {
          classes += "before:absolute before:inset-y-0.5 before:left-0 before:w-1/2 before:bg-blue-50 dark:before:bg-blue-900/40 ";
        } else if (inRange) {
          classes += "bg-blue-50 dark:bg-blue-900/40 ";
        }
      }
    }

    return classes;
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-[340px] bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
          <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 text-sm tracking-wide">
            <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-500" />
            Rango de Fechas
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Calendar Body */}
        <div className="p-5 select-none bg-white dark:bg-gray-900">
          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="font-bold text-gray-800 dark:text-gray-100 text-[13px] tracking-widest uppercase">
              {monthName} {year}
            </div>
            <button
              onClick={handleNextMonth}
              className="p-1.5 text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Week Days */}
          <div className="grid grid-cols-7 mb-2">
            {dayNames.map(d => (
              <div key={d} className="text-center text-[11px] font-bold text-gray-400 dark:text-gray-500 pb-2">
                {d}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7">
            {days.map((d, i) => (
              <div key={i} className={getWrapperClasses(d)}>
                <div
                  className={getDayClasses(d)}
                  onClick={() => handleDayClick(d)}
                  onMouseEnter={() => setHoverDate(d)}
                  onMouseLeave={() => setHoverDate(null)}
                >
                  {d.getDate()}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50 flex flex-col gap-2">
          {startDate && endDate && (
            <div className="text-center text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
              Del {startDate.getDate()} {MONTH_NAMES_ES[startDate.getMonth()].slice(0,3)} al {endDate.getDate()} {MONTH_NAMES_ES[endDate.getMonth()].slice(0,3)}
            </div>
          )}
          <button
            onClick={handleGenerateClick}
            disabled={!startDate}
            className="w-full py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:dark:bg-gray-800 disabled:text-gray-500 rounded-xl shadow-md transition disabled:shadow-none"
          >
            Generar Resumen
          </button>
        </div>
      </div>
    </div>
  );
};
