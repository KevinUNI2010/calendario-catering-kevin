import React from 'react';
import { ViewMode } from '../types';
import { MONTH_NAMES_ES } from '../utils/dateUtils';
import { 
  Menu, 
  ChevronLeft, 
  ChevronRight, 
  Search, 
  Plus
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
}

export const Navbar: React.FC<NavbarProps> = ({
  currentDate,
  onPrevDate,
  onNextDate,
  onToday,
  viewMode,
  onChangeViewMode,
  searchQuery,
  onSearchChange,
  onToggleSidebar,
}) => {
  const monthName = MONTH_NAMES_ES[currentDate.getMonth()];
  const year = currentDate.getFullYear();

  return (
    <header className="h-16 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-3 sm:px-5 flex items-center justify-between gap-3 shrink-0 select-none z-30">
      
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
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center shadow-xs text-white">
            <span className="font-bold text-lg font-mono">31</span>
          </div>
          <div className="hidden md:block">
            <div className="flex items-center gap-1.5 leading-none">
              <span className="text-lg font-medium text-gray-800 dark:text-gray-200">Calendario</span>
              <span className="text-xs px-1.5 py-0.5 rounded-md bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 font-bold uppercase tracking-wider">
                Locales
              </span>
            </div>
          </div>
        </div>

        {/* Today & Date Changers */}
        <div className="flex items-center gap-1 sm:gap-2 ml-1 sm:ml-4">
          <button
            type="button"
            id="today-btn"
            onClick={onToday}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200 transition cursor-pointer"
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
          <h1 className="text-base sm:text-lg font-semibold text-gray-800 dark:text-gray-100 capitalize whitespace-nowrap ml-1 sm:ml-2">
            {monthName} {year}
          </h1>
        </div>
      </div>

      {/* Middle section: Search bar */}
      <div className="hidden lg:flex items-center flex-1 max-w-md mx-4">
        <div className="relative w-full">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            id="calendar-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar turnos, eventos o locales..."
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl bg-gray-100 dark:bg-gray-800/80 border border-transparent focus:border-blue-500 focus:bg-white dark:focus:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-hidden transition"
          />
        </div>
      </div>

      {/* Right section: View Mode, Create Button */}
      <div className="flex items-center gap-1.5 sm:gap-2.5">
        
        {/* View Mode Dropdown */}
        <select
          id="view-mode-selector"
          value={viewMode}
          onChange={(e) => onChangeViewMode(e.target.value as ViewMode)}
          className="px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500 cursor-pointer"
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
