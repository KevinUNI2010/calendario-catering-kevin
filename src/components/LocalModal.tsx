import React, { useState } from 'react';
import { Local, GOOGLE_CALENDAR_COLORS } from '../types';
import { X, Store, Check, Palette } from 'lucide-react';

interface LocalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (local: Local) => void;
}

export const LocalModal: React.FC<LocalModalProps> = ({ isOpen, onClose, onSave }) => {
  if (!isOpen) return null;

  const [name, setName] = useState('');
  const [colorId, setColorId] = useState(GOOGLE_CALENDAR_COLORS[0].id);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newLocal: Local = {
      id: `loc-${Date.now()}`,
      name: name.trim(),
      colorId,
    };

    onSave(newLocal);
    setName('');
    setColorId(GOOGLE_CALENDAR_COLORS[0].id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/40">
          <div className="flex items-center gap-3">
            <Store className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            <h3 className="font-semibold text-gray-900 dark:text-white text-base">
              Añadir Nuevo Local
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 text-sm">
          {/* Name */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">
              Nombre del Local
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: SUCURSAL CENTRO"
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase"
              required
              autoFocus
            />
          </div>

          {/* Color Selection */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5 flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5" />
              Color del Local
            </label>
            <div className="grid grid-cols-5 gap-2">
              {GOOGLE_CALENDAR_COLORS.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setColorId(c.id)}
                  className={`w-full h-8 rounded-lg flex items-center justify-center transition-all cursor-pointer shadow-sm hover:scale-105 ${
                    colorId === c.id ? 'ring-2 ring-offset-2 ring-gray-400 dark:ring-offset-gray-900' : ''
                  }`}
                  style={{ backgroundColor: c.bg }}
                  title={c.name}
                >
                  {colorId === c.id && <Check className="w-4 h-4 text-white" />}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-gray-200 dark:border-gray-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium rounded-lg border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-sm transition cursor-pointer"
            >
              <Check className="w-4 h-4" />
              Guardar Local
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
