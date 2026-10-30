import React, { useState } from 'react';
import { X, ZoomIn, ZoomOut, Download, Maximize2, FileText } from 'lucide-react';
import { useEscapeKey } from '../hooks/useEscapeKey';

interface EvidenceLightboxModalProps {
  isOpen: boolean;
  imageSrc: string | null | undefined;
  localName?: string;
  eventDate?: string | Date;
  eventTitle?: string;
  onClose: () => void;
}

const formatDateSafe = (dateInput?: string | Date): string => {
  if (!dateInput) return '';
  const months = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  if (dateInput instanceof Date) {
    if (isNaN(dateInput.getTime())) return '';
    return `${dateInput.getDate()} de ${months[dateInput.getMonth()]}`;
  }

  const str = String(dateInput).trim();
  if (str.includes('T')) {
    const d = new Date(str);
    if (!isNaN(d.getTime())) {
      return `${d.getDate()} de ${months[d.getMonth()]}`;
    }
  }

  if (str.includes('-')) {
    const parts = str.split('-');
    if (parts.length >= 3) {
      const day = parseInt(parts[2], 10);
      const monthIdx = parseInt(parts[1], 10) - 1;
      if (!isNaN(day) && monthIdx >= 0 && monthIdx < 12) {
        return `${day} de ${months[monthIdx]}`;
      }
    }
  }

  const d = new Date(str);
  if (!isNaN(d.getTime())) {
    return `${d.getDate()} de ${months[d.getMonth()]}`;
  }

  return '';
};

export const EvidenceLightboxModal: React.FC<EvidenceLightboxModalProps> = ({
  isOpen,
  imageSrc,
  localName,
  eventDate,
  eventTitle,
  onClose
}) => {
  useEscapeKey(isOpen, onClose);
  const [zoom, setZoom] = useState<number>(1);

  React.useEffect(() => {
    if (isOpen) {
      setZoom(1);
    }
  }, [isOpen, imageSrc]);

  const formattedHeader = React.useMemo(() => {
    if (localName || eventDate) {
      const parts: string[] = [];
      if (localName) parts.push(localName.toUpperCase().trim());
      const dateStr = formatDateSafe(eventDate);
      if (dateStr) parts.push(dateStr);
      return parts.join(' • ');
    }
    return eventTitle || 'Evidencia';
  }, [localName, eventDate, eventTitle]);

  if (!isOpen || !imageSrc) return null;

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = imageSrc;
    a.download = `evidencia_${formattedHeader.replace(/[^a-zA-Z0-9]/g, '_')}.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div
      className="fixed inset-0 z-70 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-[360px] sm:max-w-4xl max-h-[85vh] sm:max-h-[90vh] bg-gray-900/95 border border-gray-800 rounded-3xl p-3 sm:p-5 shadow-2xl flex flex-col space-y-3"
        onClick={e => e.stopPropagation()}
      >
        {/* Top Bar */}
        <div className="flex items-center justify-between text-white gap-2">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div className="p-1.5 sm:p-2 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30 shrink-0">
              <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-xs sm:text-sm font-bold text-white truncate">
                {formattedHeader}
              </h3>
            </div>
          </div>

          {/* Action Controls */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setZoom(prev => Math.max(0.5, prev - 0.25))}
              className="p-1.5 sm:p-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition cursor-pointer"
              title="Alejar"
            >
              <ZoomOut className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
            <span className="text-[10px] sm:text-xs text-gray-400 font-mono w-9 sm:w-12 text-center">
              {Math.round(zoom * 100)}%
            </span>
            <button
              type="button"
              onClick={() => setZoom(prev => Math.min(3, prev + 0.25))}
              className="p-1.5 sm:p-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition cursor-pointer"
              title="Acercar"
            >
              <ZoomIn className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
            <button
              type="button"
              onClick={handleDownload}
              className="p-1.5 sm:px-3 sm:py-2 bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs font-semibold rounded-lg transition cursor-pointer flex items-center gap-1.5"
              title="Descargar imagen"
            >
              <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" />
              <span className="hidden sm:inline">Descargar</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 sm:p-2 bg-gray-800 hover:bg-red-950/60 hover:text-red-400 text-gray-300 rounded-lg transition cursor-pointer"
              title="Cerrar"
            >
              <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          </div>
        </div>

        {/* Main Image Stage */}
        <div 
          className="relative flex-1 min-h-0 flex items-center justify-center overflow-auto rounded-2xl bg-black/70 border border-gray-800/80 p-2 select-none"
        >
          <img
            src={imageSrc}
            alt="Foto de evidencia de cuaderno"
            style={{
              transform: `scale(${zoom})`,
              transition: 'transform 0.2s ease-out',
            }}
            className="max-h-[46vh] sm:max-h-[72vh] max-w-full object-contain rounded-lg shadow-2xl"
          />
        </div>
      </div>
    </div>
  );
};
