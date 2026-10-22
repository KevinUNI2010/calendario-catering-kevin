import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  Send, 
  Mic, 
  Square, 
  Image as ImageIcon, 
  Sparkles, 
  Trash2, 
  Clock, 
  Bot, 
  User, 
  ChevronRight,
  AlertCircle
} from 'lucide-react';
import { UserSession, CalendarEvent, RagMessage, RagChartData } from '../../types';
import { RagBarChart } from './RagBarChart';
import { RagEventCards } from './RagEventCards';
import { notify } from '../../utils/toastHelper';

interface RagChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: UserSession;
  events: CalendarEvent[];
}

export const RagChatModal: React.FC<RagChatModalProps> = ({
  isOpen,
  onClose,
  session,
  events,
}) => {
  const [messages, setMessages] = useState<RagMessage[]>([
    {
      id: 'welcome-msg',
      sender: 'assistant',
      text: `¡Hola **${session.name || 'amigo'}**! Soy **Kevin AI**, tu asistente inteligente del calendario.\n\nPuedes preguntarme por texto o nota de voz sobre eventos, horarios, menús o comparativas con gráficas.`,
      timestamp: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [remainingQuota, setRemainingQuota] = useState<number>(session.role === 'admin' ? 999999 : 10);

  // Audio recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<any>(null);

  // Image attachment state
  const [selectedImage, setSelectedImage] = useState<{ file: File; base64: string; preview: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  // Clean recording timer on unmount
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, []);

  if (!isOpen) return null;

  // Handle Quick Prompts
  const handleQuickPrompt = (promptText: string) => {
    setInputText(promptText);
    sendMessage(promptText);
  };

  // Start Audio Recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingSeconds(0);

      timerIntervalRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      console.error('Error al acceder al micrófono:', err);
      if (err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError') {
        notify.error('Permiso de micrófono bloqueado', 'Haz clic en el ícono de ajustes/candado a la izquierda del enlace para permitir el micrófono.');
      } else {
        notify.error('Micrófono no disponible', 'Verifica que tu dispositivo tenga un micrófono conectado y activo.');
      }
    }
  };

  // Stop Recording and Send
  const stopRecordingAndSend = () => {
    if (!mediaRecorderRef.current) return;

    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    mediaRecorderRef.current.onstop = async () => {
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      // Stop all audio tracks to turn off the microphone
      mediaRecorderRef.current?.stream.getTracks().forEach((t) => t.stop());
      setIsRecording(false);
      setRecordingSeconds(0);

      if (audioBlob.size < 100) return; // Too short or empty

      // Convert audio blob to base64
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64Data = (reader.result as string).split(',')[1];
        const audioUrl = URL.createObjectURL(audioBlob);
        sendMessage('', base64Data, 'audio/webm', audioUrl);
      };
      reader.readAsDataURL(audioBlob);
    };

    mediaRecorderRef.current.stop();
  };

  // Cancel Recording
  const cancelRecording = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stream.getTracks().forEach((t) => t.stop());
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    setRecordingSeconds(0);
    audioChunksRef.current = [];
  };

  // Handle Image Selection
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      notify.error('Imagen muy grande', 'Por favor selecciona una imagen menor a 10MB.');
      return;
    }

    const preview = URL.createObjectURL(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = (reader.result as string).split(',')[1];
      setSelectedImage({ file, base64, preview });
    };
    reader.readAsDataURL(file);
  };

  // Send Message function
  const sendMessage = async (
    textToSend?: string,
    audioB64?: string,
    audioMime?: string,
    audioPreviewUrl?: string
  ) => {
    const text = textToSend !== undefined ? textToSend : inputText.trim();
    if (!text && !audioB64 && !selectedImage) return;

    if (session.role !== 'admin' && remainingQuota <= 0) {
      notify.error('Cuota alcanzada', 'Has alcanzado tu límite de 10 consultas por hoy.');
      return;
    }

    // Optimistic user message
    const userMsg: RagMessage = {
      id: 'msg-' + Date.now(),
      sender: 'user',
      text: text || (audioB64 ? '🎙️ [Nota de voz]' : '📷 [Imagen adjunta]'),
      audioUrl: audioPreviewUrl,
      imageUrl: selectedImage?.preview,
      timestamp: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    const imagePayload = selectedImage ? { ...selectedImage } : null;
    setSelectedImage(null);
    setIsLoading(true);

    try {
      const response = await fetch('/api/rag', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: text,
          audioBase64: audioB64,
          audioMimeType: audioMime,
          imageBase64: imagePayload?.base64,
          imageMimeType: imagePayload?.file.type,
          session,
          events,
        }),
      });

      let data: any = {};
      try {
        data = await response.json();
      } catch {
        data = { answer: 'Hubo un error de conexión con el servidor (código ' + response.status + ').' };
      }

      if (data.remainingQuota !== undefined) {
        setRemainingQuota(data.remainingQuota);
      }

      const assistantMsg: RagMessage = {
        id: 'msg-' + Date.now() + '-reply',
        sender: 'assistant',
        text: data.answer || 'No obtuve una respuesta adecuada.',
        chart: data.chart || null,
        cards: data.cards || null,
        timestamp: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      console.error('Error enviando consulta RAG:', err);
      const errorMsg: RagMessage = {
        id: 'msg-' + Date.now() + '-err',
        sender: 'assistant',
        text: 'Lo siento, ocurrió un error al comunicar con el asistente. Por favor intenta de nuevo.',
        timestamp: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[110] flex items-end sm:items-center justify-end sm:justify-end p-0 sm:p-6 bg-black/30 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="w-full sm:w-[460px] h-[92vh] sm:h-[680px] max-h-[95vh] bg-white dark:bg-[#161622] rounded-t-3xl sm:rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-800 flex flex-col overflow-hidden animate-in slide-in-from-bottom-8 duration-300"
      >
        {/* Header Estilo Asistente Inteligente */}
        <div className="px-5 py-4 bg-gradient-to-r from-[#4f46e5] to-[#7c3aed] text-white flex items-center justify-between shrink-0 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shadow-inner">
                <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 border-2 border-indigo-700" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-extrabold text-sm sm:text-base tracking-tight leading-none">
                  Kevin AI
                </h3>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-white/20 text-indigo-100">
                  RAG
                </span>
              </div>
              <p className="text-[11px] text-indigo-200 mt-0.5 flex items-center gap-1">
                <span>Asistente de Catering</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Cuota de Consultas */}
            <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-white/15 backdrop-blur-md text-white border border-white/20 shadow-xs">
              {session.role === 'admin' ? '👑 Ilimitado' : `💡 ${remainingQuota}/10 hoy`}
            </span>

            <button 
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-white/20 transition cursor-pointer text-white/80 hover:text-white"
              title="Cerrar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Mensajes del Chat */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 bg-[#f8f9fe] dark:bg-[#0f0f17]">
          {messages.map((msg) => {
            const isUser = msg.sender === 'user';

            return (
              <div 
                key={msg.id} 
                className={`flex gap-2.5 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-7 h-7 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div className={`max-w-[85%] sm:max-w-[82%] space-y-1.5 ${isUser ? 'items-end' : 'items-start'}`}>
                  <div 
                    className={`p-3.5 rounded-2xl text-xs sm:text-[13px] leading-relaxed shadow-xs ${
                      isUser 
                        ? 'bg-[#4f46e5] text-white rounded-br-xs font-medium' 
                        : 'bg-white dark:bg-[#1a1a24] text-gray-800 dark:text-gray-100 border border-gray-100 dark:border-gray-800 rounded-bl-xs'
                    }`}
                  >
                    {/* Render Image thumbnail if present */}
                    {msg.imageUrl && (
                      <div className="mb-2 overflow-hidden rounded-xl border border-white/20 max-h-48">
                        <img src={msg.imageUrl} alt="Adjunto" className="w-full object-cover" />
                      </div>
                    )}

                    {/* Audio Player if present */}
                    {msg.audioUrl && (
                      <div className="mb-2">
                        <audio controls src={msg.audioUrl} className="w-full h-8" />
                      </div>
                    )}

                    {/* Text content with simple bold & linebreaks */}
                    <div className="whitespace-pre-wrap">
                      {msg.text.split('\n').map((line, i) => (
                        <p key={i} className={i > 0 ? 'mt-1' : ''}>
                          {line.split('**').map((chunk, j) => 
                            j % 2 === 1 ? <strong key={j} className="font-extrabold">{chunk}</strong> : chunk
                          )}
                        </p>
                      ))}
                    </div>

                    {/* Render Chart if available */}
                    {msg.chart && (
                      <RagBarChart chart={msg.chart} />
                    )}

                    {/* Render Event Cards (Ficha de Cocina) if available */}
                    {msg.cards && msg.cards.cards && msg.cards.cards.length > 0 && (
                      <RagEventCards cardsData={msg.cards} />
                    )}
                  </div>

                  <span className={`block text-[10px] text-gray-400 px-1 ${isUser ? 'text-right' : 'text-left'}`}>
                    {msg.timestamp}
                  </span>
                </div>

                {isUser && (
                  <div className="w-7 h-7 rounded-xl bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-200 flex items-center justify-center shrink-0 mt-0.5">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            );
          })}

          {/* Typing Indicator */}
          {isLoading && (
            <div className="flex gap-2.5 items-center">
              <div className="w-7 h-7 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div className="px-4 py-3 rounded-2xl bg-white dark:bg-[#1a1a24] border border-gray-100 dark:border-gray-800 shadow-xs flex items-center gap-1.5 text-xs text-indigo-600 font-medium">
                <span className="w-2 h-2 rounded-full bg-indigo-600 animate-bounce" />
                <span className="w-2 h-2 rounded-full bg-indigo-600 animate-bounce [animation-delay:0.2s]" />
                <span className="w-2 h-2 rounded-full bg-indigo-600 animate-bounce [animation-delay:0.4s]" />
                <span className="ml-1 text-gray-500 text-[11px]">Consultando datos...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Prompts Sugeridos si solo hay 1 mensaje */}
        {messages.length <= 1 && (
          <div className="px-4 py-2 bg-[#f8f9fe] dark:bg-[#0f0f17] border-t border-gray-100 dark:border-gray-800 flex flex-wrap gap-1.5 shrink-0">
            <button
              onClick={() => handleQuickPrompt('¿Qué eventos tengo para el 30 de octubre?')}
              className="px-2.5 py-1 text-[11px] font-semibold bg-white dark:bg-[#1a1a24] hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-gray-700 dark:text-gray-300 rounded-xl border border-gray-200 dark:border-gray-800 shadow-2xs transition cursor-pointer text-left"
            >
              📅 ¿Qué eventos tengo para el 30 de octubre?
            </button>
            <button
              onClick={() => handleQuickPrompt('Dame las cantidades de platos servidos con gráfica')}
              className="px-2.5 py-1 text-[11px] font-semibold bg-white dark:bg-[#1a1a24] hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-gray-700 dark:text-gray-300 rounded-xl border border-gray-200 dark:border-gray-800 shadow-2xs transition cursor-pointer text-left"
            >
              📊 Comparar platos servidos con gráfica
            </button>
          </div>
        )}

        {/* Input Footer */}
        <div className="p-3 sm:p-4 bg-white dark:bg-[#161622] border-t border-gray-100 dark:border-gray-800 shrink-0">
          {/* Previsualización de imagen adjunta si hay una seleccionada */}
          {selectedImage && (
            <div className="relative inline-block mb-2 rounded-xl overflow-hidden border border-indigo-200 dark:border-indigo-800 shadow-sm">
              <img src={selectedImage.preview} alt="Vista previa" className="h-16 w-24 object-cover" />
              <button
                type="button"
                onClick={() => setSelectedImage(null)}
                className="absolute top-1 right-1 p-0.5 rounded-full bg-black/60 text-white hover:bg-black/80 transition"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Modo Grabando Audio */}
          {isRecording ? (
            <div className="flex items-center justify-between gap-3 bg-red-50 dark:bg-red-950/40 p-2.5 rounded-2xl border border-red-200 dark:border-red-900/50 animate-pulse">
              <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-xs font-bold pl-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
                <span>Grabando audio: {Math.floor(recordingSeconds / 60)}:{('0' + (recordingSeconds % 60)).slice(-2)}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={cancelRecording}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-300 transition"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={stopRecordingAndSend}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-700 text-white shadow-xs transition flex items-center gap-1"
                >
                  <Square className="w-3.5 h-3.5 fill-current" />
                  <span>Enviar</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-end gap-2">
              {/* Botón Adjuntar Foto */}
              <input 
                type="file" 
                ref={fileInputRef} 
                accept="image/*" 
                onChange={handleImageChange} 
                className="hidden" 
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading}
                title="Adjuntar foto de comanda o libreta"
                className="p-2.5 rounded-2xl bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition cursor-pointer shrink-0"
              >
                <ImageIcon className="w-5 h-5" />
              </button>

              {/* Botón Micrófono */}
              <button
                type="button"
                onClick={startRecording}
                disabled={isLoading}
                title="Grabar nota de voz"
                className="p-2.5 rounded-2xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 transition cursor-pointer shrink-0"
              >
                <Mic className="w-5 h-5" />
              </button>

              {/* Textarea */}
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={session.role !== 'admin' && remainingQuota <= 0 ? 'Límite de consultas diarias alcanzado' : 'Escribe o pregunta por voz...'}
                disabled={isLoading || (session.role !== 'admin' && remainingQuota <= 0)}
                rows={1}
                className="flex-1 max-h-24 py-2.5 px-3.5 text-xs sm:text-sm rounded-2xl bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 border-none focus:outline-none focus:ring-2 focus:ring-indigo-500/40 resize-none transition"
              />

              {/* Botón Enviar */}
              <button
                type="button"
                onClick={() => sendMessage()}
                disabled={isLoading || (!inputText.trim() && !selectedImage) || (session.role !== 'admin' && remainingQuota <= 0)}
                className="p-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:hover:bg-indigo-600 text-white shadow-md transition cursor-pointer shrink-0"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
