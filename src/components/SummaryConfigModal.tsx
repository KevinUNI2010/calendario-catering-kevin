import { useEscapeKey } from '../hooks/useEscapeKey';
import React, { useState, useEffect } from 'react';
import { X, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { MONTH_NAMES_ES } from '../utils/dateUtils';

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
  useEscapeKey(onClose, isOpen);

  const [currentMonth, setCurrentMonth] = useState(() => new Date(initialDate.getFullYear(), initialDate.getMonth(), 1));

  useEffect(() => {
    if (isOpen) {
      setCurrentMonth(new Date(initialDate.getFullYear(), initialDate.getMonth(), 1));
    }
  }, [isOpen, initialDate]);

  if (!isOpen) return null;

  const handlePrevMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const handleGenerateClick = () => {
    const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1, 0, 0, 0, 0);
    const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0, 23, 59, 59, 999);
    onGenerate(startOfMonth, endOfMonth);
    onClose();
  };

  const monthName = MONTH_NAMES_ES[currentMonth.getMonth()].toUpperCase();
  const year = currentMonth.getFullYear();

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200" onClick={onClose}>
      <div className="w-[340px] bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
          <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 text-sm tracking-wide">
            <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-500" />
            Mes de Producción
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-8 select-none bg-white dark:bg-gray-900 flex flex-col items-center justify-center min-h-[160px]">
          <div className="flex items-center justify-between w-full">
            <button
              onClick={handlePrevMonth}
              className="p-3 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 rounded-full hover:bg-blue-50 dark:hover:bg-blue-900/30 transition shadow-sm border border-transparent hover:border-blue-100 dark:hover:border-blue-800"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <div className="flex flex-col items-center">
              <div className="text-2xl font-black text-gray-800 dark:text-white tracking-widest uppercase mb-1">
                {monthName}
              </div>
              <div className="text-sm font-bold text-gray-400 dark:text-gray-500">
                {year}
              </div>
            </div>
            <button
              onClick={handleNextMonth}
              className="p-3 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 rounded-full hover:bg-blue-50 dark:hover:bg-blue-900/30 transition shadow-sm border border-transparent hover:border-blue-100 dark:hover:border-blue-800"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50 flex flex-col gap-2">
          <button
            onClick={handleGenerateClick}
            className="w-full py-3 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md transition hover:shadow-lg active:scale-[0.98]"
          >
            Generar Resumen de {monthName}
          </button>
        </div>
      </div>
    </div>
  );
};
