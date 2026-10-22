import React, { useState, useEffect } from 'react';
import { X, Shield, Search, RefreshCw, Mic, Image as ImageIcon, MessageSquare, Clock, User, Filter } from 'lucide-react';
import { getSupabase } from '../../lib/supabase';

interface RagAuditModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface AuditLog {
  id: string;
  user_id: string;
  user_name: string;
  user_role: string;
  prompt_text: string;
  has_audio: boolean;
  has_image: boolean;
  tokens_used: number;
  created_at: string;
}

export const RagAuditModal: React.FC<RagAuditModalProps> = ({ isOpen, onClose }) => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');

  const fetchLogs = async () => {
    setIsLoading(true);
    const supabase = getSupabase();
    if (!supabase) {
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('rag_query_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (!error && data) {
        setLogs(data as AuditLog[]);
      }
    } catch (e) {
      console.error('Error cargando auditoría RAG:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchLogs();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredLogs = logs.filter((log) => {
    const matchesSearch = 
      (log.user_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.prompt_text || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || log.user_role === filterRole;
    return matchesSearch && matchesRole;
  });

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800">Admin</span>;
      case 'dueño':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800">Dueño</span>;
      case 'cocinero':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">Cocinero</span>;
      case 'mozo':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800">Mozo</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">{role}</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-4xl max-h-[88vh] bg-white dark:bg-[#161622] rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-800 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-indigo-900 to-indigo-700 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-white shadow-inner">
              <Shield className="w-5 h-5 text-indigo-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base tracking-tight leading-none text-white">
                  Auditoría de Consultas IA
                </h3>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-white/20 text-indigo-100">
                  Kevin AI Logs
                </span>
              </div>
              <p className="text-xs text-indigo-200 mt-1">
                Registro en tiempo real de todas las preguntas realizadas por administradores, dueños, cocineros y mozos.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchLogs}
              disabled={isLoading}
              title="Refrescar auditoría"
              className="p-2 rounded-full hover:bg-white/20 transition cursor-pointer text-white/80 hover:text-white"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-white/20 transition cursor-pointer text-white/80 hover:text-white"
              title="Cerrar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Barra de Filtros y Búsqueda */}
        <div className="px-6 py-3.5 bg-gray-50 dark:bg-[#12121a] border-b border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por usuario o texto..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl text-xs bg-white dark:bg-[#1e1e2d] border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> Rol:
            </span>
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl text-xs bg-white dark:bg-[#1e1e2d] border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="all">Todos los roles</option>
              <option value="admin">Administrador</option>
              <option value="dueño">Dueño</option>
              <option value="cocinero">Cocinero</option>
              <option value="mozo">Mozo</option>
            </select>

            <span className="text-xs text-gray-400 pl-2">
              {filteredLogs.length} registro(s)
            </span>
          </div>
        </div>

        {/* Tabla / Lista de Auditoría */}
        <div className="flex-1 overflow-y-auto p-6 space-y-2.5 bg-[#fcfcfd] dark:bg-[#0f0f17]">
          {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center text-gray-400 space-y-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
              <p className="text-xs">Cargando registros de auditoría de Supabase...</p>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="py-20 flex flex-col items-center justify-center text-center text-gray-400 space-y-2">
              <MessageSquare className="w-10 h-10 text-gray-300 dark:text-gray-600" />
              <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">No se encontraron registros de auditoría</p>
              <p className="text-xs text-gray-400">Las preguntas que realicen los usuarios quedarán registradas aquí.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-800 rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-[#161622] overflow-hidden shadow-xs">
              {filteredLogs.map((log) => {
                const dateObj = new Date(log.created_at);
                const timeFormatted = dateObj.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                const dateFormatted = dateObj.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });

                return (
                  <div key={log.id} className="p-4 hover:bg-gray-50/70 dark:hover:bg-gray-800/40 transition flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-xs text-gray-900 dark:text-gray-100 flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-indigo-500" />
                          {log.user_name || log.user_id || 'Anónimo'}
                        </span>
                        {getRoleBadge(log.user_role)}
                        {log.has_audio && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400 flex items-center gap-1 border border-rose-200/60">
                            <Mic className="w-3 h-3" /> Audio
                          </span>
                        )}
                        {log.has_image && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-50 text-sky-600 dark:bg-sky-950/50 dark:text-sky-400 flex items-center gap-1 border border-sky-200/60">
                            <ImageIcon className="w-3 h-3" /> Foto
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-[#111119] p-2.5 rounded-xl border border-gray-100 dark:border-gray-800 break-words font-sans">
                        "{log.prompt_text}"
                      </p>
                    </div>

                    <div className="text-[11px] text-gray-400 shrink-0 flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-1">
                      <span className="flex items-center gap-1 text-gray-500 dark:text-gray-400 font-medium">
                        <Clock className="w-3 h-3" /> {timeFormatted}
                      </span>
                      <span className="text-[10px] text-gray-400">
                        {dateFormatted}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
