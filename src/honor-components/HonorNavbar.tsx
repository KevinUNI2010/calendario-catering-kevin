import React from 'react';
import { ViewMode } from '../types';
import { MONTH_NAMES_ES } from '../utils/dateUtils';
import { 
  Menu, 
  ChevronLeft, 
  ChevronRight, 
  Search, 
  Plus,
  BarChart2
} from 'lucide-react';

interface NavbarProps {
  currentDate: Date;
  onPrevDate: () => void;
  onNextDate: () => void;
  onToday: () => void;
  viewMode: ViewMode;
  onChangeViewMode: (mode: ViewMode) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onToggleSidebar: () => void;
  onWeeklySummary: () => void;
}

export const HonorNavbar: React.FC<NavbarProps> = ({
  currentDate,
  onPrevDate,
  onNextDate,
  onToday,
  viewMode,
  onChangeViewMode,
  searchQuery,
  onSearchChange,
  onToggleSidebar,
  onWeeklySummary,
}) => {
  const monthName = MONTH_NAMES_ES[currentDate.getMonth()];
  const year = currentDate.getFullYear();

  return (
    <header className="h-16 bg-[#f7f8fa] dark:bg-[#0c0c0c] px-3 sm:px-6 flex items-center justify-between gap-3 shrink-0 select-none z-30 pt-2 pb-1 overflow-x-auto scrollbar-none">
      
      {/* Left section: Hamburger, Logo, Title, Navigation */}
      <div className="flex items-center gap-2 sm:gap-4 shrink-0">
        <button
          type="button"
          id="sidebar-toggle-btn"
          onClick={onToggleSidebar}
          className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 transition"
          title="Menú principal"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Brand */}
        <div className="hidden sm:flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-[#2b6de3] flex items-center justify-center shadow-[0_2px_10px_rgba(43,109,227,0.3)] text-white">
            <span className="font-bold text-sm font-sans">31</span>
          </div>
          <div className="hidden md:block">
            <div className="flex items-center gap-1.5 leading-none">
              <span className="text-lg font-bold text-gray-800 dark:text-gray-100 tracking-tight">Catering Kevin</span>
            </div>
          </div>
        </div>

        {/* Today & Date Changers */}
        <div className="flex items-center gap-1 sm:gap-2 ml-0 sm:ml-4">
          <button
            type="button"
            id="today-btn"
            onClick={onToday}
            className="px-2.5 sm:px-4 py-1 sm:py-1.5 text-xs sm:text-sm font-medium rounded-full bg-white dark:bg-[#1a1a1a] shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)] text-gray-700 dark:text-gray-200 transition-all cursor-pointer"
          >
            Hoy
          </button>
          <div className="flex items-center">
            <button
              type="button"
              id="prev-date-btn"
              onClick={onPrevDate}
              className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 transition"
              title="Anterior"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              type="button"
              id="next-date-btn"
              onClick={onNextDate}
              className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 transition"
              title="Siguiente"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
          <h1 className="text-base sm:text-lg lg:text-[20px] font-bold text-gray-900 dark:text-white capitalize whitespace-nowrap ml-1 sm:ml-2">
            {monthName} {year}
          </h1>
        </div>
      </div>

      {/* Middle section: Search bar */}
      <div className="hidden lg:flex items-center flex-1 max-w-md mx-4">
        <div className="relative w-full">
          <Search className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            id="calendar-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar turnos, eventos o locales..."
            className="w-full pl-11 pr-4 py-2 text-sm rounded-full bg-white dark:bg-[#1a1a1a] shadow-[0_2px_8px_rgba(0,0,0,0.03)] border-none focus:ring-2 focus:ring-[#2b6de3]/30 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none transition-all"
          />
        </div>
      </div>

      {/* Right section: View Mode, Create Button */}
      <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
        
        <button
          type="button"
          onClick={onWeeklySummary}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-orange-100 text-orange-700 hover:bg-orange-200 dark:bg-orange-900/40 dark:text-orange-300 dark:hover:bg-orange-900/60 transition cursor-pointer"
        >
          <BarChart2 className="w-4 h-4" />
          <span className="hidden sm:inline">Resumen Semanal</span>
        </button>

        {/* View Mode Dropdown */}
        <select
          id="view-mode-selector"
          value={viewMode}
          onChange={(e) => onChangeViewMode(e.target.value as ViewMode)}
          className="px-2 sm:px-4 py-1.5 text-xs sm:text-sm font-medium rounded-full bg-white dark:bg-[#1a1a1a] shadow-[0_2px_8px_rgba(0,0,0,0.04)] border-none text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-[#2b6de3]/30 cursor-pointer transition-all"
        >
          <option value="month">Mes</option>
          <option value="week">Semana</option>
          <option value="day">Día</option>
          <option value="agenda">Agenda</option>
        </select>

      </div>
    </header>
  );
};
