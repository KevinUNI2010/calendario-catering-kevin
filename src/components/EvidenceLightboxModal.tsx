import React, { useState } from 'react';
import { X, ZoomIn, ZoomOut, Download, Maximize2, FileText } from 'lucide-react';
import { useEscapeKey } from '../hooks/useEscapeKey';

interface EvidenceLightboxModalProps {
  isOpen: boolean;
  imageSrc: string | null | undefined;
  eventTitle?: string;
  onClose: () => void;
}

export const EvidenceLightboxModal: React.FC<EvidenceLightboxModalProps> = ({
  isOpen,
  imageSrc,
  eventTitle,
  onClose
}) => {
  useEscapeKey(isOpen, onClose);
  const [zoom, setZoom] = useState<number>(1);

  if (!isOpen || !imageSrc) return null;

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = imageSrc;
    a.download = `evidencia_${eventTitle ? eventTitle.replace(/\s+/g, '_') : 'evento'}.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div
      className="fixed inset-0 z-70 flex flex-col items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-lg animate-in fade-in duration-200"
      onClick={onClose}
    >
      {/* Top Bar */}
      <div 
        className="w-full max-w-5xl flex items-center justify-between pb-3 text-white"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">
              Evidencia de Cuaderno / Apuntes
            </h3>
            {eventTitle && (
              <p className="text-xs text-gray-400">{eventTitle}</p>
            )}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setZoom(prev => Math.max(0.5, prev - 0.25))}
            className="p-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition cursor-pointer"
            title="Alejar"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-xs text-gray-400 font-mono w-12 text-center">
            {Math.round(zoom * 100)}%
          </span>
          <button
            type="button"
            onClick={() => setZoom(prev => Math.min(3, prev + 0.25))}
            className="p-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition cursor-pointer"
            title="Acercar"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs font-semibold rounded-lg transition cursor-pointer"
            title="Descargar imagen"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span className="hidden sm:inline">Descargar</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="p-2 bg-gray-800 hover:bg-red-950/60 hover:text-red-400 text-gray-300 rounded-lg transition cursor-pointer"
            title="Cerrar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Image Stage */}
      <div 
        className="relative flex-1 w-full max-w-5xl flex items-center justify-center overflow-auto rounded-2xl bg-black/60 border border-gray-800 p-2 select-none"
        onClick={e => e.stopPropagation()}
      >
        <img
          src={imageSrc}
          alt="Foto de evidencia de cuaderno"
          style={{
            transform: `scale(${zoom})`,
            transition: 'transform 0.2s ease-out',
            maxHeight: '75vh',
            maxWidth: '100%',
            objectFit: 'contain',
            borderRadius: '8px',
          }}
          className="shadow-2xl"
        />
      </div>
    </div>
  );
};
