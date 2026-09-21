import React, { useState } from 'react';
import { CalendarEvent, Local, GOOGLE_CALENDAR_COLORS, ReminderConfig, DishSelection } from '../types';
import { 
  X, 
  Clock, 
  Calendar as CalendarIcon, 
  Store, 
  MapPin, 
  AlignLeft, 
  Bell, 
  Mail, 
  Users, 
  Plus, 
  Trash2,
  Check,
  Utensils
} from 'lucide-react';

const MENU_OPTIONS = {
  proteinas: ['Pollo Enrollado', 'Pollo Mexicana', 'Pollo a la plancha'],
  ensaladas: ['Ensalada Fresca', 'Ensalada Precocida'],
  salsas: ['Salsa de Ostión', 'Salsa de Maracuya', 'Salsa Bechamel'],
  guarniciones: ['Piña Almíbar', 'Piña Glaseada', 'Papas Doradas'],
  carbohidratos: ['Arroz a la Jardinera', 'Arroz Árabe', 'Arroz Turco'],
};

interface EventModalProps {
  isOpen: boolean;
  event: Partial<CalendarEvent> | null;
  locales: Local[];
  onClose: () => void;
  onSave: (event: CalendarEvent) => void;
  onDelete?: (id: string) => void;
}

export const EventModal: React.FC<EventModalProps> = ({
  isOpen,
  event,
  locales,
  onClose,
  onSave,
  onDelete,
}) => {
  if (!isOpen || !event) return null;

  const [title, setTitle] = useState(event.title || '');
  const [localId, setLocalId] = useState(event.localId || (locales[0]?.id || ''));
  const [customLocalName, setCustomLocalName] = useState(event.localName || '');
  const [startDate, setStartDate] = useState(
    event.startDate ? event.startDate.substring(0, 16) : '2026-09-14T09:00'
  );
  const [allDay, setAllDay] = useState(event.allDay || false);
  const [description, setDescription] = useState(event.description || '');
  const [dish, setDish] = useState<DishSelection>(event.dish || {
    proteina: '',
    ensalada: '',
    salsa: '',
    guarnicion: '',
    carbohidrato: '',
  });
  
  // Default values for deleted sections
  const attendees = event.attendees || [];
  const reminders = event.reminders || [];

  const selectedColor = GOOGLE_CALENDAR_COLORS.find(c => c.id === (event.colorId || 'peacock')) || GOOGLE_CALENDAR_COLORS[0];
  const selectedLocal = locales.find(l => l.id === localId);



  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalLocalName = selectedLocal ? selectedLocal.name : (customLocalName || 'Local General');

    const updatedEvent: CalendarEvent = {
      id: event.id || 'evt-' + Date.now(),
      title: event.title || `Evento en ${finalLocalName}`,
      description,
      startDate,
      endDate: event.endDate || startDate,
      allDay,
      colorId: selectedLocal ? selectedLocal.colorId : 'peacock',
      localId: selectedLocal ? selectedLocal.id : 'loc-custom',
      localName: finalLocalName,
      status: event.status || 'confirmed',
      attendees,
      reminders,
      createdBy: event.createdBy || 'Usuario',
      updatedAt: new Date().toISOString(),
      notes: event.notes || '',
      dish,
    };

    onSave(updatedEvent);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        id="event-form-modal"
        className="w-full max-w-xl bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/40">
          <div className="flex items-center gap-3">
            <span 
              className="w-4 h-4 rounded-full shadow-xs"
              style={{ backgroundColor: selectedColor.bg }}
            />
            <h3 className="font-semibold text-gray-900 dark:text-white text-base">
              {event.id ? 'Editar Evento de Local' : 'Nuevo Evento de Local'}
            </h3>
          </div>
          <button
            type="button"
            id="modal-close-btn"
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 text-sm">
          
          {/* Local Selection */}
          <div className="bg-gray-50 dark:bg-gray-800/50 p-3.5 rounded-xl border border-gray-200 dark:border-gray-700 space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300 flex items-center gap-1.5">
              <Store className="w-4 h-4 text-blue-500" />
              Seleccionar Local Responsable
            </label>
            <select
              id="event-local-select"
              value={localId}
              onChange={(e) => {
                setLocalId(e.target.value);
                const loc = locales.find(l => l.id === e.target.value);
              }}
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            >
              {locales.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.name}
                </option>
              ))}
            </select>
          </div>

          {/* Date and Time Picker */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              Fecha y Hora de Inicio
            </label>
            <input
              id="event-start-date"
              type="datetime-local"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1 flex items-center gap-1.5">
              <AlignLeft className="w-3.5 h-3.5" />
              Descripción y detalles operativos
            </label>
            <textarea
              id="event-description-input"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Instrucciones para el personal, requerimientos de sala..."
              className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Dish Builder */}
          <div className="bg-gray-50 dark:bg-gray-800/40 p-4 rounded-xl border border-gray-200 dark:border-gray-700 space-y-4">
            <label className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 flex items-center gap-1.5 border-b border-gray-200 dark:border-gray-700 pb-2">
              <Utensils className="w-4 h-4 text-orange-500" />
              Constructor de Menú
            </label>
            
            <div className="space-y-3">
              {/* Proteinas */}
              <div>
                <span className="block text-[11px] font-semibold text-gray-500 dark:text-gray-400 mb-1.5">PROTEÍNAS</span>
                <div className="flex flex-wrap gap-1.5">
                  {MENU_OPTIONS.proteinas.map(opt => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setDish({ ...dish, proteina: dish.proteina === opt ? '' : opt })}
                      className={`px-3 py-1.5 text-[11px] font-medium rounded-full border transition cursor-pointer ${
                        dish.proteina === opt 
                          ? 'bg-orange-100 border-orange-300 text-orange-800 dark:bg-orange-900/40 dark:border-orange-700 dark:text-orange-300' 
                          : 'bg-white border-gray-200 text-gray-600 hover:border-orange-300 hover:bg-orange-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Salsas */}
              <div>
                <span className="block text-[11px] font-semibold text-gray-500 dark:text-gray-400 mb-1.5">SALSAS</span>
                <div className="flex flex-wrap gap-1.5">
                  {MENU_OPTIONS.salsas.map(opt => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setDish({ ...dish, salsa: dish.salsa === opt ? '' : opt })}
                      className={`px-3 py-1.5 text-[11px] font-medium rounded-full border transition cursor-pointer ${
                        dish.salsa === opt 
                          ? 'bg-yellow-100 border-yellow-300 text-yellow-800 dark:bg-yellow-900/40 dark:border-yellow-700 dark:text-yellow-300' 
                          : 'bg-white border-gray-200 text-gray-600 hover:border-yellow-300 hover:bg-yellow-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Carbohidratos */}
              <div>
                <span className="block text-[11px] font-semibold text-gray-500 dark:text-gray-400 mb-1.5">CARBOHIDRATOS</span>
                <div className="flex flex-wrap gap-1.5">
                  {MENU_OPTIONS.carbohidratos.map(opt => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setDish({ ...dish, carbohidrato: dish.carbohidrato === opt ? '' : opt })}
                      className={`px-3 py-1.5 text-[11px] font-medium rounded-full border transition cursor-pointer ${
                        dish.carbohidrato === opt 
                          ? 'bg-blue-100 border-blue-300 text-blue-800 dark:bg-blue-900/40 dark:border-blue-700 dark:text-blue-300' 
                          : 'bg-white border-gray-200 text-gray-600 hover:border-blue-300 hover:bg-blue-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Guarniciones */}
              <div>
                <span className="block text-[11px] font-semibold text-gray-500 dark:text-gray-400 mb-1.5">GUARNICIONES</span>
                <div className="flex flex-wrap gap-1.5">
                  {MENU_OPTIONS.guarniciones.map(opt => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setDish({ ...dish, guarnicion: dish.guarnicion === opt ? '' : opt })}
                      className={`px-3 py-1.5 text-[11px] font-medium rounded-full border transition cursor-pointer ${
                        dish.guarnicion === opt 
                          ? 'bg-purple-100 border-purple-300 text-purple-800 dark:bg-purple-900/40 dark:border-purple-700 dark:text-purple-300' 
                          : 'bg-white border-gray-200 text-gray-600 hover:border-purple-300 hover:bg-purple-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Ensaladas */}
              <div>
                <span className="block text-[11px] font-semibold text-gray-500 dark:text-gray-400 mb-1.5">ENSALADAS</span>
                <div className="flex flex-wrap gap-1.5">
                  {MENU_OPTIONS.ensaladas.map(opt => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setDish({ ...dish, ensalada: dish.ensalada === opt ? '' : opt })}
                      className={`px-3 py-1.5 text-[11px] font-medium rounded-full border transition cursor-pointer ${
                        dish.ensalada === opt 
                          ? 'bg-green-100 border-green-300 text-green-800 dark:bg-green-900/40 dark:border-green-700 dark:text-green-300' 
                          : 'bg-white border-gray-200 text-gray-600 hover:border-green-300 hover:bg-green-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

            </div>
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-800">
            {event.id && onDelete ? (
              <button
                type="button"
                id="modal-delete-btn"
                onClick={() => {
                  if (confirm('¿Seguro que deseas eliminar este evento?')) {
                    onDelete(event.id!);
                    onClose();
                  }
                }}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                Eliminar
              </button>
            ) : <div />}

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium rounded-lg border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                id="save-event-submit-btn"
                className="flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition cursor-pointer"
              >
                <Check className="w-4 h-4" />
                Guardar Evento
              </button>
            </div>
          </div>

        </form>
      </div>
    </div>
  );
};
