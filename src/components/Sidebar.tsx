import React from 'react';
import { Local, GOOGLE_CALENDAR_COLORS } from '../types';
import { MONTH_NAMES_ES, DAY_NAMES_SHORT, getMonthDays, isSameDay, isToday } from '../utils/dateUtils';
import { 
  Plus, 
  Store, 
  ChevronLeft, 
  ChevronRight, 
  CheckSquare, 
  Square, 
  Users, 
  Download, 
  Smartphone,
  ShieldCheck,
  X
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface SidebarProps {
  isOpen: boolean;
  currentDate: Date;
  onSelectDate: (date: Date) => void;
  locales: Local[];
  selectedLocalIds: string[];
  onToggleLocal: (id: string) => void;
  onOpenCreateModal: () => void;
  onClose?: () => void;
  onAddLocal: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  currentDate,
  onSelectDate,
  locales,
  selectedLocalIds,
  onToggleLocal,
  onOpenCreateModal,
  onClose,
  onAddLocal,
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [miniDate, setMiniDate] = React.useState(new Date(currentDate));
  const [showIOSModal, setShowIOSModal] = React.useState(false);

  // Sync mini date with main date
  React.useEffect(() => {
    setMiniDate(new Date(currentDate));
  }, [currentDate]);

  if (!isOpen) return null;

  const miniDays = getMonthDays(miniDate.getFullYear(), miniDate.getMonth());
  const miniMonth = miniDate.getMonth();

  const handleMiniPrev = () => {
    setMiniDate(new Date(miniDate.getFullYear(), miniDate.getMonth() - 1, 1));
  };

  const handleMiniNext = () => {
    setMiniDate(new Date(miniDate.getFullYear(), miniDate.getMonth() + 1, 1));
  };

  return (
    <>
      {/* Mobile backdrop overlay */}
      <div 
        onClick={onClose}
        className="fixed inset-0 bg-black/40 backdrop-blur-xs z-40 md:hidden animate-in fade-in duration-200"
        aria-hidden="true"
      />

      <aside className="fixed md:static inset-y-0 left-0 z-50 md:z-auto w-72 md:w-64 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex flex-col h-full overflow-y-auto shrink-0 select-none p-4 space-y-6 shadow-2xl md:shadow-none animate-in slide-in-from-left duration-200">
        
        {/* Mobile Header with close button */}
        <div className="flex items-center justify-between md:hidden pb-1 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-xs">
              31
            </div>
            <span className="font-bold text-sm text-gray-800 dark:text-gray-200">Filtros de Locales</span>
          </div>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 transition"
              title="Cerrar panel"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Google Calendar "+ Crear" FAB button */}
      <div>
        <button
          type="button"
          id="sidebar-create-btn"
          onClick={onOpenCreateModal}
          className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-2xl bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 shadow-md hover:shadow-lg border border-gray-200 dark:border-gray-700 transition-all font-semibold text-sm cursor-pointer active:scale-95 group"
        >
          <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white shadow-xs group-hover:rotate-90 transition-transform duration-200">
            <Plus className="w-5 h-5" />
          </div>
          <span>Crear Evento</span>
        </button>
      </div>

      {/* Mini Calendar Widget */}
      <div className="bg-gray-50/60 dark:bg-gray-800/30 p-3 rounded-2xl border border-gray-100 dark:border-gray-800">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-gray-700 dark:text-gray-300 capitalize">
            {MONTH_NAMES_ES[miniDate.getMonth()]} {miniDate.getFullYear()}
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleMiniPrev}
              className="p-1 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleMiniNext}
              className="p-1 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Mini Day Headers */}
        <div className="grid grid-cols-7 text-center text-[10px] font-semibold text-gray-400 mb-1">
          {DAY_NAMES_SHORT.map((d) => (
            <div key={d}>{d[0]}</div>
          ))}
        </div>

        {/* Mini Days Grid */}
        <div className="grid grid-cols-7 text-center text-[11px] gap-y-0.5">
          {miniDays.slice(0, 35).map((d, idx) => {
            const isSelected = isSameDay(d, currentDate);
            const isTodayDate = isToday(d);
            const isCurrentM = d.getMonth() === miniMonth;

            return (
              <button
                key={idx}
                type="button"
                onClick={() => onSelectDate(d)}
                className={`w-6 h-6 mx-auto rounded-full flex items-center justify-center text-[10px] transition cursor-pointer ${
                  isSelected
                    ? 'bg-blue-600 text-white font-bold'
                    : isTodayDate
                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300 font-bold'
                    : isCurrentM
                    ? 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                    : 'text-gray-300 dark:text-gray-600'
                }`}
              >
                {d.getDate()}
              </button>
            );
          })}
        </div>
      </div>

      {/* Locales Filter Section */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
            <Store className="w-3.5 h-3.5" />
            Mis Locales ({locales.length})
          </h3>
          <button
            type="button"
            onClick={onAddLocal}
            className="p-1 text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-md transition cursor-pointer"
            title="Añadir nuevo local"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-1">
          {locales.map((loc) => {
            const isChecked = selectedLocalIds.includes(loc.id);
            const colorDef = GOOGLE_CALENDAR_COLORS.find(c => c.id === loc.colorId) || GOOGLE_CALENDAR_COLORS[0];

            return (
              <button
                key={loc.id}
                type="button"
                onClick={() => onToggleLocal(loc.id)}
                className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs hover:bg-gray-100 dark:hover:bg-gray-800/80 transition cursor-pointer text-left group"
              >
                <div className="flex items-center gap-2 truncate">
                  <span
                    className="w-3 h-3 rounded-md shrink-0 transition-opacity"
                    style={{
                      backgroundColor: isChecked ? colorDef.bg : 'transparent',
                      borderColor: colorDef.bg,
                      borderWidth: '2px',
                    }}
                  />
                  <span className={`truncate font-medium ${isChecked ? 'text-gray-900 dark:text-gray-100' : 'text-gray-400 line-through'}`}>
                    {loc.name}
                  </span>
                </div>
                <span className="text-[10px] text-gray-400 font-mono shrink-0">
                  {loc.code}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* PWA In-App Install Prompt */}
      {!isInstalled && (
        <div className="pt-2 border-t border-gray-200 dark:border-gray-800">
          {isInstallable && (
            <button
              type="button"
              id="pwa-install-sidebar-btn"
              onClick={install}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-gray-900 text-white dark:bg-white dark:text-gray-900 text-xs font-semibold shadow-xs hover:opacity-90 transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              Instalar App PWA
            </button>
          )}

          {isIOS && (
            <>
              <button
                type="button"
                onClick={() => setShowIOSModal(true)}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl border border-gray-300 dark:border-gray-700 text-xs font-medium hover:bg-gray-100 dark:hover:bg-gray-800 transition cursor-pointer"
              >
                <Smartphone className="w-3.5 h-3.5" />
                Instalar en iPhone / iPad
              </button>

              {showIOSModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                  <div className="w-full max-w-sm rounded-xl bg-white p-5 shadow-xl dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white">Instalar en iOS</h3>
                    <p className="mt-2 text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                      1. Pulsa el botón <strong>Compartir</strong> en la barra de Safari.<br />
                      2. Desplázate hacia abajo y pulsa <strong>Añadir a pantalla de inicio</strong>.
                    </p>
                    <button
                      type="button"
                      onClick={() => setShowIOSModal(false)}
                      className="mt-4 w-full rounded-lg bg-gray-100 dark:bg-gray-800 py-1.5 text-xs font-semibold text-gray-800 dark:text-gray-200"
                    >
                      Cerrar
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

    </aside>
    </>
  );
};
