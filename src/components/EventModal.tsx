import React, { useState, useEffect } from 'react';
import { CalendarEvent, Local, ReminderConfig, DishSelection, MenuOptions } from '../types';
import { getEventColor } from '../utils/colorUtils';
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

interface EventModalProps {
  isOpen: boolean;
  event: Partial<CalendarEvent> | null;
  locales: Local[];
  menuOptions: MenuOptions;
  onClose: () => void;
  onSave: (event: CalendarEvent) => void;
  onDelete?: (id: string) => void;
}

export const EventModal: React.FC<EventModalProps> = ({
  isOpen,
  event,
  locales,
  menuOptions,
  onClose,
  onSave,
  onDelete,
}) => {
  if (!isOpen || !event) return null;

  const [title, setTitle] = useState(event.title || '');
  const [localId, setLocalId] = useState(event.localId || (locales[0]?.id || ''));
  const [customLocalName, setCustomLocalName] = useState(event.localName || '');
  // Helper to format today's date for datetime-local
  const getFormattedNow = () => {
    const now = new Date();
    // Offset by local timezone to get correct YYYY-MM-DDTHH:mm
    const localNow = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
    return localNow.toISOString().substring(0, 16);
  };

  const [startDate, setStartDate] = useState(
    event.startDate ? event.startDate.substring(0, 16) : getFormattedNow()
  );
  const [allDay, setAllDay] = useState(event.allDay || false);
  const [description, setDescription] = useState(event.description || '');
  const [dish, setDish] = useState<DishSelection>(event.dish || {
    proteina: '',
    ensalada: '',
    salsa: '',
    guarnicion: '',
    carbohidrato: '',
    servilleta: '',
    cantidadPlatos: 0,
  });

  useEffect(() => {
    if (isOpen && event) {
      setTitle(event.title || '');
      setLocalId(event.localId || (locales[0]?.id || ''));
      setCustomLocalName(event.localName || '');
      setStartDate(event.startDate ? event.startDate.substring(0, 16) : getFormattedNow());
      setAllDay(event.allDay || false);
      setDescription(event.description || '');
      setDish(event.dish || {
        proteina: '',
        ensalada: '',
        salsa: '',
        guarnicion: '',
        carbohidrato: '',
        servilleta: '',
        cantidadPlatos: 0,
      });
    }
  }, [isOpen, event, locales]);
  
  // Default values for deleted sections
  const attendees = event.attendees || [];
  const reminders = event.reminders || [];

  const selectedColor = getEventColor(event.colorId || 'peacock');
  const selectedLocal = locales.find(l => l.id === localId);



  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalLocalName = selectedLocal ? selectedLocal.name : (customLocalName || 'Local General');

    const updatedEvent: CalendarEvent = {
      id: event.id || crypto.randomUUID(),
      title: title.trim() || `Evento en ${finalLocalName}`,
      description,
      startDate,
      endDate: event.endDate || startDate,
      allDay,
      colorId: selectedLocal ? selectedLocal.colorId : 'peacock',
      localId: selectedLocal ? selectedLocal.id : '',
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
        className="w-full max-w-4xl bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden flex flex-col max-h-[92vh]"
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
          
          {/* 2x2 Grid for main fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Título del Evento */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5 flex items-center gap-1.5">
                <AlignLeft className="w-3.5 h-3.5 text-blue-500" />
                Título del Evento
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Opcional. Ej: Boda de Pérez"
                className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition-shadow"
              />
            </div>

            {/* Local Selection */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5 flex items-center gap-1.5">
                <Store className="w-3.5 h-3.5 text-blue-500" />
                Local Responsable
              </label>
              <select
                id="event-local-select"
                value={localId}
                onChange={(e) => {
                  setLocalId(e.target.value);
                  const loc = locales.find(l => l.id === e.target.value);
                }}
                className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition-shadow"
              >
                {locales.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Time Picker */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-blue-500" />
                Hora del Evento
              </label>
              <select
                id="event-start-time"
                value={startDate.substring(11, 13) + ':00'}
                onChange={(e) => setStartDate(startDate.substring(0, 11) + e.target.value)}
                className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition-shadow"
                required
              >
                {Array.from({ length: 24 }).map((_, i) => {
                  const hour = String(i).padStart(2, '0');
                  return (
                    <option key={hour} value={`${hour}:00`}>
                      {hour}:00
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5 flex items-center gap-1.5">
                <AlignLeft className="w-3.5 h-3.5 text-blue-500" />
                Descripción operativa
              </label>
              <textarea
                id="event-description-input"
                rows={1}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Requerimientos de sala..."
                className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 resize-none transition-shadow"
              />
            </div>

          </div>

          {/* Split Layout: Menu Builder (Left) & Details (Right) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
            
            {/* Left: MENU BUILDER */}
            <div className="md:col-span-2 bg-gray-50/50 dark:bg-gray-800/20 p-5 rounded-2xl border border-gray-200 dark:border-gray-700">
              <label className="text-xs font-bold uppercase tracking-widest text-gray-800 dark:text-gray-200 flex items-center gap-2 border-b border-gray-200 dark:border-gray-700 pb-3 mb-4">
                <Utensils className="w-4 h-4 text-orange-500" />
                CONSTRUCTOR DE MENÚ
              </label>
              
              <div className="space-y-4">
                {/* Proteinas */}
                <div>
                  <span className="block text-[10px] font-bold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">Proteínas</span>
                  <div className="flex flex-wrap gap-2">
                    {menuOptions.proteinas.map(opt => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setDish({ ...dish, proteina: dish.proteina === opt ? '' : opt })}
                        className={`px-3 py-1.5 text-xs font-medium rounded-full border transition cursor-pointer shadow-xs ${
                          dish.proteina === opt 
                            ? 'bg-orange-100 border-orange-300 text-orange-800 dark:bg-orange-900/40 dark:border-orange-700 dark:text-orange-300' 
                            : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Salsas */}
                <div>
                  <span className="block text-[10px] font-bold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">Salsas</span>
                  <div className="flex flex-wrap gap-2">
                    {menuOptions.salsas.map(opt => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setDish({ ...dish, salsa: dish.salsa === opt ? '' : opt })}
                        className={`px-3 py-1.5 text-xs font-medium rounded-full border transition cursor-pointer shadow-xs ${
                          dish.salsa === opt 
                            ? 'bg-yellow-100 border-yellow-300 text-yellow-800 dark:bg-yellow-900/40 dark:border-yellow-700 dark:text-yellow-300' 
                            : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Carbohidratos */}
                <div>
                  <span className="block text-[10px] font-bold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">Carbohidratos</span>
                  <div className="flex flex-wrap gap-2">
                    {menuOptions.carbohidratos.map(opt => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setDish({ ...dish, carbohidrato: dish.carbohidrato === opt ? '' : opt })}
                        className={`px-3 py-1.5 text-xs font-medium rounded-full border transition cursor-pointer shadow-xs ${
                          dish.carbohidrato === opt 
                            ? 'bg-blue-100 border-blue-300 text-blue-800 dark:bg-blue-900/40 dark:border-blue-700 dark:text-blue-300' 
                            : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Guarniciones */}
                <div>
                  <span className="block text-[10px] font-bold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">Guarniciones</span>
                  <div className="flex flex-wrap gap-2">
                    {menuOptions.guarniciones.map(opt => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setDish({ ...dish, guarnicion: dish.guarnicion === opt ? '' : opt })}
                        className={`px-3 py-1.5 text-xs font-medium rounded-full border transition cursor-pointer shadow-xs ${
                          dish.guarnicion === opt 
                            ? 'bg-purple-100 border-purple-300 text-purple-800 dark:bg-purple-900/40 dark:border-purple-700 dark:text-purple-300' 
                            : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Ensaladas */}
                <div>
                  <span className="block text-[10px] font-bold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">Ensaladas</span>
                  <div className="flex flex-wrap gap-2">
                    {menuOptions.ensaladas.map(opt => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setDish({ ...dish, ensalada: dish.ensalada === opt ? '' : opt })}
                        className={`px-3 py-1.5 text-xs font-medium rounded-full border transition cursor-pointer shadow-xs ${
                          dish.ensalada === opt 
                            ? 'bg-green-100 border-green-300 text-green-800 dark:bg-green-900/40 dark:border-green-700 dark:text-green-300' 
                            : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Right: DETAILS */}
            <div className="md:col-span-1 bg-gray-50/50 dark:bg-gray-800/20 p-5 rounded-2xl border border-gray-200 dark:border-gray-700 space-y-6">
              <label className="text-xs font-bold uppercase tracking-widest text-gray-800 dark:text-gray-200 flex items-center gap-2 border-b border-gray-200 dark:border-gray-700 pb-3">
                <AlignLeft className="w-4 h-4 text-gray-400" />
                DETALLES
              </label>

              {/* Servilletas with explicit color coding */}
              <div>
                <span className="block text-[10px] font-bold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">Servilletas</span>
                <div className="flex flex-wrap gap-2">
                  {menuOptions.servilletas?.map(opt => {
                    // Match specific napkin colors to Tailwind classes
                    let colorClasses = 'bg-white border-gray-200 text-gray-700';
                    const name = opt.toLowerCase();
                    if (name.includes('rojo') || name.includes('red')) colorClasses = 'bg-red-100 border-red-200 text-red-800';
                    else if (name.includes('verde') || name.includes('green')) colorClasses = 'bg-green-100 border-green-200 text-green-800';
                    else if (name.includes('naranja') || name.includes('orange')) colorClasses = 'bg-orange-100 border-orange-200 text-orange-800';
                    else if (name.includes('azul') || name.includes('blue')) colorClasses = 'bg-blue-100 border-blue-200 text-blue-800';
                    else if (name.includes('amarillo') || name.includes('yellow')) colorClasses = 'bg-yellow-100 border-yellow-200 text-yellow-800';
                    else if (name.includes('dorado') || name.includes('gold')) colorClasses = 'bg-amber-100 border-amber-200 text-amber-800';
                    else if (name.includes('rosa') || name.includes('pink')) colorClasses = 'bg-pink-100 border-pink-200 text-pink-800';
                    
                    const isSelected = dish.servilleta === opt;
                    
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setDish({ ...dish, servilleta: dish.servilleta === opt ? '' : opt })}
                        className={`px-3 py-1.5 text-xs font-medium rounded-full border transition cursor-pointer shadow-xs ${colorClasses} ${isSelected ? 'ring-2 ring-offset-1 ring-gray-400' : 'opacity-80 hover:opacity-100'}`}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Cantidad de Platos */}
              <div>
                <span className="block text-[10px] font-bold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">Cantidad de Platos</span>
                <input
                  type="number"
                  min="0"
                  value={dish.cantidadPlatos || ''}
                  onChange={(e) => setDish({ ...dish, cantidadPlatos: parseInt(e.target.value) || 0 })}
                  placeholder="Ej. 150"
                  className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl px-3 py-2.5 text-sm text-gray-900 dark:text-gray-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition-shadow shadow-xs"
                />
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
