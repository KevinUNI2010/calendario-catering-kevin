import { useEscapeKey } from '../hooks/useEscapeKey';
import React, { useState, useEffect, useRef } from 'react';
import { CalendarEvent, Local, ReminderConfig, DishSelection, MenuOptions } from '../types';
import { getEventColor } from '../utils/colorUtils';
import { parsePlateFormula } from '../utils/plateMath';
import { ImageCropperModal } from './ImageCropperModal';
import { EvidenceLightboxModal } from './EvidenceLightboxModal';
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
  Utensils,
  Camera,
  Upload,
  Crop,
  Eye,
  FileText
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

  useEscapeKey(onClose, isOpen);

  const [title, setTitle] = useState(event?.title || '');
  const [localId, setLocalId] = useState(event?.localId || (locales[0]?.id || ''));
  const [customLocalName, setCustomLocalName] = useState(event?.localName || '');
  // Helper to format today's date for datetime-local
  const getFormattedNow = () => {
    const now = new Date();
    // Offset by local timezone to get correct YYYY-MM-DDTHH:mm
    const formatter = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Lima', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false });
    const p = formatter.formatToParts(now);
    const get = (type: string) => (p.find(x => x.type === type) || {}).value || '';
    return `${get('year')}-${get('month')}-${get('day')}T${get('hour')}:${get('minute')}`;

  };

  const [startDate, setStartDate] = useState(
    event?.startDate ? event.startDate.substring(0, 16) : getFormattedNow()
  );
  const [allDay, setAllDay] = useState(event?.allDay || false);
  const [description, setDescription] = useState(event?.description || '');
  const [dish, setDish] = useState<DishSelection>(event?.dish || {
    proteina: '',
    ensalada: '',
    salsa: '',
    guarnicion: '',
    carbohidrato: '',
    servilleta: '',
    cantidadPlatos: 0,
  });

  const [contratadosFormula, setContratadosFormula] = useState(
    event?.dish?.platosContratadosFormula ||
    (event?.dish?.platosContratados ? String(event.dish.platosContratados) : (event?.dish?.cantidadPlatos ? String(event.dish.cantidadPlatos) : ''))
  );
  const [confirmadosFormula, setConfirmadosFormula] = useState(
    event?.dish?.platosConfirmados ? String(event.dish.platosConfirmados) : ''
  );
  const [servidosFormula, setServidosFormula] = useState(
    event?.dish?.platosServidos ? String(event.dish.platosServidos) : ''
  );
  const [evidencePhoto, setEvidencePhoto] = useState<string | undefined>(
    event?.dish?.evidencePhoto || event?.evidencePhoto
  );
  const [cropperOpen, setCropperOpen] = useState(false);
  const [rawImageForCropper, setRawImageForCropper] = useState<string>('');
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setRawImageForCropper(reader.result);
          setCropperOpen(true);
        }
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

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
      setContratadosFormula(
        event.dish?.platosContratadosFormula ||
        (event.dish?.platosContratados ? String(event.dish.platosContratados) : (event.dish?.cantidadPlatos ? String(event.dish.cantidadPlatos) : ''))
      );
      setConfirmadosFormula(
        event.dish?.platosConfirmados ? String(event.dish.platosConfirmados) : ''
      );
      setServidosFormula(
        event.dish?.platosServidos ? String(event.dish.platosServidos) : ''
      );
      setEvidencePhoto(event.dish?.evidencePhoto || event.evidencePhoto);
    }
  }, [isOpen, event, locales]);

  if (!isOpen || !event) return null;
  
  // Default values for deleted sections
  const attendees = event.attendees || [];
  const reminders = event.reminders || [];

  const selectedLocal = locales.find(l => l.id === localId);
  const selectedColor = getEventColor(selectedLocal ? selectedLocal.colorId : (event.colorId || 'peacock'));

  const TIME_OPTIONS = Array.from({ length: 48 }).map((_, i) => {
    const h = String(Math.floor(i / 2)).padStart(2, '0');
    const m = i % 2 === 0 ? '00' : '30';
    return `${h}:${m}`;
  });

  const eventDate = startDate ? startDate.substring(0, 10) : '';
  const eventTime = startDate && startDate.length >= 16 ? startDate.substring(11, 16) : '09:00';

  const handleDateChange = (newDate: string) => {
    if (newDate) {
      setStartDate(`${newDate}T${eventTime}`);
    }
  };

  const handleTimeChange = (newTime: string) => {
    const curDate = eventDate || getFormattedNow().substring(0, 10);
    setStartDate(`${curDate}T${newTime}`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalLocalName = selectedLocal ? selectedLocal.name : (customLocalName || 'Local General');

    const parsedContratados = parsePlateFormula(contratadosFormula);
    const finalContratados = parsedContratados.isValid ? parsedContratados.total : 0;

    const parsedConfirmados = parsePlateFormula(confirmadosFormula);
    const finalConfirmados = parsedConfirmados.isValid && parsedConfirmados.total > 0 ? parsedConfirmados.total : undefined;

    const parsedServidos = parsePlateFormula(servidosFormula);
    const finalServidos = parsedServidos.isValid && parsedServidos.total > 0 ? parsedServidos.total : undefined;

    // Cascada definida:
    // 1. Platos Servidos (conteo final de sala)
    // 2. Si no hay servidos: toma confirmados (no aumentaron en sala)
    // 3. Si no hay confirmados: toma contratados (se mantuvo el contrato)
    const effectivePlates = (finalServidos !== undefined && finalServidos > 0)
      ? finalServidos
      : ((finalConfirmados !== undefined && finalConfirmados > 0)
        ? finalConfirmados
        : (finalContratados > 0 ? finalContratados : 0));

    const updatedDish: DishSelection = {
      ...dish,
      cantidadPlatos: effectivePlates,
      platosContratadosFormula: contratadosFormula.trim() || undefined,
      platosContratados: finalContratados > 0 ? finalContratados : undefined,
      platosConfirmados: finalConfirmados,
      platosServidos: finalServidos,
      evidencePhoto: evidencePhoto || undefined,
    };

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
      dish: updatedDish,
      evidencePhoto: evidencePhoto || undefined,
    };

    onSave(updatedEvent);
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200" onClick={onClose}>
      <div 
        id="event-form-modal"
        className="w-full max-w-4xl bg-white dark:bg-gray-900 rounded-2xl sm:rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden flex flex-col max-h-[92vh]"
       onClick={(e) => e.stopPropagation()}>
        {/* Header: Nuevo Evento en [ Aryes v ] */}
        <div className="flex items-center justify-between gap-2 px-3 sm:px-6 py-2.5 sm:py-3.5 border-b border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/40">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <span 
              className="w-3 h-3 rounded-full shadow-xs shrink-0 transition-colors"
              style={{ backgroundColor: selectedColor.bg }}
            />
            <h3 className="font-semibold text-gray-900 dark:text-white text-xs sm:text-base whitespace-nowrap shrink-0">
              {event.id ? 'Editar Evento en' : 'Nuevo Evento en'}
            </h3>
            <select
              id="event-local-select"
              value={localId}
              onChange={(e) => setLocalId(e.target.value)}
              className="px-2 py-1 text-xs sm:text-sm font-bold rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-2xs hover:border-blue-400 transition truncate max-w-[120px] sm:max-w-xs min-w-0"
            >
              {locales.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.name}
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            id="modal-close-btn"
            onClick={onClose}
            className="p-1 sm:p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition cursor-pointer shrink-0 ml-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
          <div className="p-5 sm:p-6 overflow-y-auto space-y-4 text-sm flex-1">
          
          {/* Row with 3 fields: [ Titulo ] [ DIA ] [ HORA ] */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            
            {/* Título del Evento */}
            <div className="sm:col-span-6">
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1 flex items-center gap-1.5">
                <AlignLeft className="w-3.5 h-3.5 text-blue-500" />
                Título
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Opcional. Ej: Boda de Pérez"
                className="w-full px-3 py-2 text-sm rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition-shadow"
              />
            </div>

            {/* Día (Date Picker) */}
            <div className="sm:col-span-3">
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1 flex items-center gap-1.5">
                <CalendarIcon className="w-3.5 h-3.5 text-blue-500" />
                Día
              </label>
              <input
                type="date"
                id="event-start-date"
                value={eventDate}
                onChange={(e) => handleDateChange(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition-shadow cursor-pointer"
                required
              />
            </div>

            {/* Hora (Time Picker) */}
            <div className="sm:col-span-3">
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-blue-500" />
                Hora
              </label>
              <select
                id="event-start-time"
                value={eventTime}
                onChange={(e) => handleTimeChange(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition-shadow cursor-pointer"
                required
              >
                {!TIME_OPTIONS.includes(eventTime) && eventTime && (
                  <option value={eventTime}>{eventTime}</option>
                )}
                {TIME_OPTIONS.map((time) => (
                  <option key={time} value={time}>
                    {time}
                  </option>
                ))}
              </select>
            </div>

          </div>

          {/* Split Layout: Menu Builder (Left) & Details (Right) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-1">
            
            {/* Left: MENÚ */}
            <div className="md:col-span-2 bg-gray-50/50 dark:bg-gray-800/20 p-4 sm:p-5 rounded-2xl border border-gray-200 dark:border-gray-700 flex flex-col gap-3">
              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-gray-800 dark:text-gray-200 flex items-center gap-2 border-b border-gray-200 dark:border-gray-700 pb-2.5 mb-3">
                  <Utensils className="w-4 h-4 text-orange-500" />
                  MENÚ
                </label>
              
              <div className="space-y-2.5">
                {/* Proteinas */}
                <div>
                  <span className="block text-[10px] font-bold text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider">Proteínas</span>
                  <div className="flex flex-wrap gap-1.5">
                    {menuOptions.proteinas.map(opt => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setDish({ ...dish, proteina: dish.proteina === opt ? '' : opt })}
                        className={`px-2.5 py-1 text-xs font-medium rounded-full border transition cursor-pointer shadow-xs ${
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
                  <span className="block text-[10px] font-bold text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider">Salsas</span>
                  <div className="flex flex-wrap gap-1.5">
                    {menuOptions.salsas.map(opt => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setDish({ ...dish, salsa: dish.salsa === opt ? '' : opt })}
                        className={`px-2.5 py-1 text-xs font-medium rounded-full border transition cursor-pointer shadow-xs ${
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
                  <span className="block text-[10px] font-bold text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider">Carbohidratos</span>
                  <div className="flex flex-wrap gap-1.5">
                    {menuOptions.carbohidratos.map(opt => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setDish({ ...dish, carbohidrato: dish.carbohidrato === opt ? '' : opt })}
                        className={`px-2.5 py-1 text-xs font-medium rounded-full border transition cursor-pointer shadow-xs ${
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
                  <span className="block text-[10px] font-bold text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider">Guarniciones</span>
                  <div className="flex flex-wrap gap-1.5">
                    {menuOptions.guarniciones.map(opt => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setDish({ ...dish, guarnicion: dish.guarnicion === opt ? '' : opt })}
                        className={`px-2.5 py-1 text-xs font-medium rounded-full border transition cursor-pointer shadow-xs ${
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
                  <span className="block text-[10px] font-bold text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider">Ensaladas</span>
                  <div className="flex flex-wrap gap-1.5">
                    {menuOptions.ensaladas.map(opt => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setDish({ ...dish, ensalada: dish.ensalada === opt ? '' : opt })}
                        className={`px-2.5 py-1 text-xs font-medium rounded-full border transition cursor-pointer shadow-xs ${
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

            {/* Descripción / Requerimientos de sala (dentro del panel MENÚ) */}
            <div className="pt-3 border-t border-gray-200 dark:border-gray-700/60 mt-3">
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1.5 uppercase tracking-wider">
                <AlignLeft className="w-3.5 h-3.5 text-blue-500" />
                Descripción
              </label>
              <textarea
                id="event-description-input"
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Requerimientos de sala, observaciones operativas..."
                className="w-full px-3 py-2 text-sm rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 resize-none transition-shadow"
              />
            </div>

            {/* CONTROL DE PLATOS Y RACIONES (3 ESTADOS EN UNA FILA) */}
            <div className="pt-3 border-t border-gray-200 dark:border-gray-700/60 mt-3 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="block text-xs font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wider flex items-center gap-1.5">
                  <Utensils className="w-3.5 h-3.5 text-blue-500" />
                  Control de Platos
                </span>
                <span className="text-[10px] font-medium text-gray-400 dark:text-gray-500">
                  Acepta fórmulas (ej. 23×8) o números
                </span>
              </div>

              {/* 3 Estados en una sola fila */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {/* 1. Platos Contratados (Fórmula o número) */}
                <div className="bg-white dark:bg-gray-800/90 p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-2xs flex flex-col justify-between">
                  <div>
                    <label className="text-[11px] font-bold text-gray-800 dark:text-gray-200 flex items-center gap-1.5 mb-1 whitespace-nowrap">
                      <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0"></span>
                      1. Contratados
                    </label>
                    <input
                      type="text"
                      value={contratadosFormula}
                      onChange={(e) => setContratadosFormula(e.target.value)}
                      placeholder="Ej. 23x8 o 150"
                      className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg px-2.5 py-1.5 text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  {contratadosFormula.trim() && (() => {
                    const parsed = parsePlateFormula(contratadosFormula);
                    return (
                      <div className="mt-1.5 text-[10px] leading-tight">
                        {parsed.isValid ? (
                          <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                            ✓ Total: <strong>{parsed.total}</strong> {parsed.explanation.includes('=') && `(${parsed.explanation})`}
                          </span>
                        ) : (
                          <span className="text-amber-500 dark:text-amber-400 font-medium">
                            {parsed.explanation}
                          </span>
                        )}
                      </div>
                    );
                  })()}
                </div>

                {/* 2. Platos Confirmados (Día del evento - Cocina) */}
                <div className="bg-white dark:bg-gray-800/90 p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-2xs flex flex-col justify-between">
                  <div>
                    <label className="text-[11px] font-bold text-gray-800 dark:text-gray-200 flex items-center gap-1.5 mb-1 whitespace-nowrap">
                      <span className="w-2 h-2 rounded-full bg-orange-500 shrink-0"></span>
                      2. Confirmados
                    </label>
                    <input
                      type="text"
                      value={confirmadosFormula}
                      onChange={(e) => setConfirmadosFormula(e.target.value)}
                      placeholder="Ej. 198 o 24*8"
                      className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg px-2.5 py-1.5 text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-100 focus:outline-hidden focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  {confirmadosFormula.trim() && (() => {
                    const parsed = parsePlateFormula(confirmadosFormula);
                    if (!parsed.isValid) {
                      return (
                        <div className="mt-1.5 text-[10px] text-amber-500 dark:text-amber-400 font-medium leading-tight">
                          {parsed.explanation}
                        </div>
                      );
                    }
                    const parsedContr = parsePlateFormula(contratadosFormula);
                    const diff = parsedContr.isValid ? parsed.total - parsedContr.total : 0;
                    return (
                      <div className="mt-1.5 text-[10px] flex flex-col gap-0.5 leading-tight">
                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                          ✓ Cocina: <strong>{parsed.total}</strong>
                        </span>
                        {parsedContr.isValid && (
                          diff > 0 ? (
                            <span className="text-orange-600 dark:text-orange-400 font-medium">
                              ▲ +{diff} adicionales
                            </span>
                          ) : diff < 0 ? (
                            <span className="text-gray-500 dark:text-gray-400">
                              ▼ {diff} menos
                            </span>
                          ) : (
                            <span className="text-gray-500">Igual a contratados</span>
                          )
                        )}
                      </div>
                    );
                  })()}
                </div>

                {/* 3. Platos Servidos (Final en sala - Cobro) */}
                <div className="bg-white dark:bg-gray-800/90 p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-2xs flex flex-col justify-between">
                  <div>
                    <label className="text-[11px] font-bold text-gray-800 dark:text-gray-200 flex items-center gap-1.5 mb-1 whitespace-nowrap">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
                      3. Servidos
                    </label>
                    <input
                      type="text"
                      value={servidosFormula}
                      onChange={(e) => setServidosFormula(e.target.value)}
                      placeholder="Ej. 230 o 25*8"
                      className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg px-2.5 py-1.5 text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  {servidosFormula.trim() && (() => {
                    const parsed = parsePlateFormula(servidosFormula);
                    return (
                      <div className="mt-1.5 text-[10px] leading-tight">
                        {parsed.isValid ? (
                          <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                            ✓ Servidos: <strong>{parsed.total}</strong>
                          </span>
                        ) : (
                          <span className="text-amber-500 dark:text-amber-400 font-medium">
                            {parsed.explanation}
                          </span>
                        )}
                      </div>
                    );
                  })()}
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
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Servilletas</span>
                  {dish.servilleta && (() => {
                    const [selName, selColor] = dish.servilleta.split('|');
                    return (
                      <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-800 flex items-center gap-1.5 animate-in fade-in duration-150">
                        {selColor && (
                          <span
                            className="w-2.5 h-2.5 rounded-full border border-black/10 dark:border-white/20 shrink-0"
                            style={{ backgroundColor: selColor }}
                          />
                        )}
                        <span>✓ {selName}</span>
                      </span>
                    );
                  })()}
                </div>
                <div className="flex flex-wrap gap-2">
                  {menuOptions.servilletas?.map(opt => {
                    const [name, colorHex] = opt.split('|');
                    const storedName = dish.servilleta ? dish.servilleta.split('|')[0] : '';
                    const isSelected = storedName === name;
                    const isWhite = colorHex?.toLowerCase() === '#ffffff' || colorHex?.toLowerCase() === '#fff' || name.toLowerCase() === 'blanco';
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setDish({ ...dish, servilleta: isSelected ? '' : opt })}
                        className={`flex items-stretch overflow-hidden rounded-full border transition-all duration-150 cursor-pointer ${
                          isSelected
                            ? 'border-blue-600 dark:border-blue-400 bg-blue-50 dark:bg-blue-950/70 ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-gray-900 shadow-md text-blue-900 dark:text-blue-100 font-bold scale-105 z-10'
                            : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1a1a1a] text-gray-700 dark:text-gray-300 hover:border-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 opacity-80 hover:opacity-100'
                        }`}
                      >
                        {colorHex && (
                          <div
                            className="w-6 shrink-0 flex items-center justify-center border-r border-black/10 dark:border-white/10"
                            style={{ backgroundColor: colorHex }}
                          >
                            {isSelected && (
                              <Check
                                className={`w-3.5 h-3.5 stroke-[3] drop-shadow ${isWhite ? 'text-gray-900' : 'text-white'}`}
                              />
                            )}
                          </div>
                        )}
                        <span className="px-3 py-1.5 text-xs font-semibold flex items-center gap-1">
                          {name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* EVIDENCIA / FOTO DE CUADERNO */}
              <div className="space-y-3 pt-2 border-t border-gray-200 dark:border-gray-700/60">
                <div className="flex items-center justify-between">
                  <span className="block text-[11px] font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-blue-500" />
                    Evidencia / Cuaderno Físico
                  </span>
                  {evidencePhoto && (
                    <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                      Adjuntada
                    </span>
                  )}
                </div>

                {/* Hidden file inputs */}
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                />

                {evidencePhoto ? (
                  <div className="bg-white dark:bg-gray-800/90 p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-2xs space-y-2">
                    <div 
                      onClick={() => setLightboxOpen(true)}
                      className="relative group rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-900 cursor-pointer aspect-16/10 flex items-center justify-center"
                    >
                      <img 
                        src={evidencePhoto} 
                        alt="Evidencia del cuaderno" 
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white">
                        <Eye className="w-5 h-5 drop-shadow" />
                        <span className="text-xs font-semibold drop-shadow">Ver en grande</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-1.5 pt-1">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setRawImageForCropper(evidencePhoto);
                            setCropperOpen(true);
                          }}
                          className="px-2.5 py-1.5 text-[11px] font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg flex items-center gap-1 transition cursor-pointer"
                        >
                          <Crop className="w-3.5 h-3.5 text-blue-500" />
                          Recortar
                        </button>
                        <button
                          type="button"
                          onClick={() => cameraInputRef.current?.click()}
                          className="px-2.5 py-1.5 text-[11px] font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg flex items-center gap-1 transition cursor-pointer"
                        >
                          <Camera className="w-3.5 h-3.5 text-emerald-500" />
                          Reemplazar
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => setEvidencePhoto(undefined)}
                        className="p-1.5 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition cursor-pointer"
                        title="Quitar foto"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => cameraInputRef.current?.click()}
                      className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border border-dashed border-blue-300 dark:border-blue-700/60 bg-blue-50/50 dark:bg-blue-950/20 hover:bg-blue-100/50 dark:hover:bg-blue-900/30 text-blue-700 dark:text-blue-300 transition cursor-pointer group"
                    >
                      <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Camera className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <span className="text-xs font-semibold">Tomar Foto</span>
                      <span className="text-[10px] text-gray-500 dark:text-gray-400">Cámara móvil / web</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border border-dashed border-gray-300 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/30 hover:bg-gray-100 dark:hover:bg-gray-800/50 text-gray-700 dark:text-gray-300 transition cursor-pointer group"
                    >
                      <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-800 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Upload className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                      </div>
                      <span className="text-xs font-semibold">Subir Archivo</span>
                      <span className="text-[10px] text-gray-500 dark:text-gray-400">Desde galería / PC</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
            </div>
          </div>

          {/* Modal Actions (Sticky/Pinned Footer) */}
          <div className="flex items-center justify-between px-6 py-3.5 border-t border-gray-200 dark:border-gray-800 bg-gray-50/90 dark:bg-gray-800/80 backdrop-blur-xs shrink-0">
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
                className="px-4 py-2 text-xs font-medium rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition cursor-pointer"
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

      {/* Modal de Recorte y Rotación */}
      <ImageCropperModal
        isOpen={cropperOpen}
        imageSrc={rawImageForCropper}
        onConfirm={(croppedBase64) => {
          setEvidencePhoto(croppedBase64);
          setCropperOpen(false);
        }}
        onCropComplete={(croppedBase64) => {
          setEvidencePhoto(croppedBase64);
          setCropperOpen(false);
        }}
        onClose={() => setCropperOpen(false)}
      />

      {/* Modal Lightbox a pantalla completa para inspeccionar firmas/apuntes */}
      <EvidenceLightboxModal
        isOpen={lightboxOpen}
        imageSrc={evidencePhoto || ''}
        eventTitle={title || 'Evidencia de Evento'}
        onClose={() => setLightboxOpen(false)}
      />
    </>
  );
};
