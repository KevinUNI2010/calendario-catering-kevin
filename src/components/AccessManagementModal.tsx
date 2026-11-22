import { useEscapeKey } from '../hooks/useEscapeKey';
import React, { useState, useEffect } from 'react';
import { 
  X, Save, Trash2, Plus, Users, ShieldCheck, Mail, Edit2, 
  ClipboardList, RefreshCw, CheckCircle2, AlertTriangle, Search, 
  Smartphone, Laptop, Globe, Clock, ShieldAlert 
} from 'lucide-react';
import { 
  fetchSupabaseClients, upsertSupabaseClient, deleteSupabaseClient, 
  fetchSupabaseAdmins, upsertSupabaseAdmin, deleteSupabaseAdmin,
  fetchLoginAuditLogs, fetchLatestClientLogins
} from '../lib/supabase';
import { Local, UserRole, LoginAuditLog } from '../types';
import { notify } from '../utils/toastHelper';

interface AccessManagementModalProps {
  onClose: () => void;
  locales: Local[];
}

function formatAuditTime(isoString: string): string {
  try {
    const d = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });

    if (diffMinutes < 1) return 'Hace unos segundos';
    if (diffMinutes < 60) return `Hace ${diffMinutes} min (${timeStr})`;
    if (diffHours < 24 && d.getDate() === now.getDate()) return `Hoy a las ${timeStr}`;
    if (diffDays === 1) return `Ayer a las ${timeStr}`;
    return `${d.toLocaleDateString([], { day: '2-digit', month: 'short' })}, ${timeStr}`;
  } catch {
    return isoString;
  }
}

export const AccessManagementModal: React.FC<AccessManagementModalProps> = ({ onClose, locales }) => {
  useEscapeKey(onClose);

  const [activeTab, setActiveTab] = useState<'clients' | 'admins' | 'audit'>('clients');
  const [clients, setClients] = useState<any[]>([]);
  const [admins, setAdmins] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Auditoría State
  const [auditLogs, setAuditLogs] = useState<LoginAuditLog[]>([]);
  const [latestLoginsMap, setLatestLoginsMap] = useState<Record<string, LoginAuditLog>>({});
  const [isAuditLoading, setIsAuditLoading] = useState(false);
  const [auditSearch, setAuditSearch] = useState('');
  const [auditFilterStatus, setAuditFilterStatus] = useState<'all' | 'success' | 'failed'>('all');

  const [newClientName, setNewClientName] = useState('');
  const [newClientPin, setNewClientPin] = useState('');
  const [newClientLocales, setNewClientLocales] = useState<string[]>([]);
  const [newClientRole, setNewClientRole] = useState<UserRole>('dueño');
  const [activeRoleTab, setActiveRoleTab] = useState<UserRole>('dueño');
  const [editingClientId, setEditingClientId] = useState<string | null>(null);

  // New Admin State
  const [newAdminEmail, setNewAdminEmail] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    const [clientsData, adminsData, latestMap, auditData] = await Promise.all([
      fetchSupabaseClients(),
      fetchSupabaseAdmins(),
      fetchLatestClientLogins(),
      fetchLoginAuditLogs(100)
    ]);
    setClients(clientsData);
    setAdmins(adminsData);
    setLatestLoginsMap(latestMap);
    setAuditLogs(auditData);
    setIsLoading(false);
  };

  const loadAuditData = async () => {
    setIsAuditLoading(true);
    const [latestMap, auditData] = await Promise.all([
      fetchLatestClientLogins(),
      fetchLoginAuditLogs(150)
    ]);
    setLatestLoginsMap(latestMap);
    setAuditLogs(auditData);
    setIsAuditLoading(false);
  };

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientName.trim() || !newClientPin.trim() || newClientLocales.length === 0) {
      notify.error('Completa el nombre, PIN y selecciona al menos un local');
      return;
    }
    if (newClientPin.length < 4) {
      notify.error('El PIN debe tener al menos 4 caracteres');
      return;
    }
    
    const id = editingClientId || crypto.randomUUID();
    const success = await upsertSupabaseClient({
      id,
      name: newClientName.trim(),
      pin: newClientPin.trim(),
      allowed_locales: newClientLocales,
      role: newClientRole
    });

    if (success) {
      notify.success(editingClientId ? 'Espectador actualizado correctamente' : 'Espectador creado correctamente');
      setNewClientName('');
      setNewClientPin('');
      setNewClientLocales([]);
      setNewClientRole('dueño');
      setEditingClientId(null);
      loadData();
    } else {
      notify.error('Error al guardar el espectador');
    }
  };

  const handleDeleteClient = async (id: string) => {
    if (!window.confirm('¿Seguro que deseas eliminar este espectador?')) return;
    const success = await deleteSupabaseClient(id);
    if (success) {
      notify.success('Espectador eliminado');
      if (editingClientId === id) cancelEdit();
      loadData();
    } else {
      notify.error('Error al eliminar');
    }
  };

  const handleEditClient = (client: any) => {
    setEditingClientId(client.id);
    setNewClientName(client.name);
    setNewClientPin(client.pin);
    setNewClientLocales(client.allowed_locales || []);
    setNewClientRole(client.role || 'dueño');
    setActiveTab('clients');
    setActiveRoleTab(client.role || 'dueño');
  };

  const cancelEdit = () => {
    setEditingClientId(null);
    setNewClientName('');
    setNewClientPin('');
    setNewClientLocales([]);
    setNewClientRole('dueño');
  };

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminEmail.trim() || !newAdminEmail.includes('@')) {
      notify.error('Ingresa un correo electrónico válido');
      return;
    }

    const success = await upsertSupabaseAdmin(newAdminEmail.trim());
    if (success) {
      notify.success('Administrador añadido correctamente');
      setNewAdminEmail('');
      loadData();
    } else {
      notify.error('Error al añadir administrador (quizás ya existe)');
    }
  };

  const handleDeleteAdmin = async (id: string) => {
    if (!window.confirm('¿Seguro que deseas eliminar este administrador? Perderá su acceso.')) return;
    const success = await deleteSupabaseAdmin(id);
    if (success) {
      notify.success('Administrador eliminado');
      loadData();
    } else {
      notify.error('Error al eliminar administrador');
    }
  };

  const toggleLocalForNewClient = (localId: string) => {
    setNewClientLocales(prev => 
      prev.includes(localId) ? prev.filter(id => id !== localId) : [...prev, localId]
    );
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={onClose}>
      <div 
        className={`w-full ${activeTab === 'audit' ? 'max-w-4xl' : 'max-w-2xl'} bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] transition-all duration-300`} 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              Accesos, Permisos y Auditoría
            </h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800 transition">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="flex border-b border-gray-200 dark:border-gray-800 px-4 overflow-x-auto">
          <button
            onClick={() => setActiveTab('clients')}
            className={`py-3 px-4 text-sm font-semibold flex items-center gap-2 border-b-2 whitespace-nowrap transition ${
              activeTab === 'clients' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Users className="w-4 h-4" />
            Espectadores (PIN)
          </button>
          <button
            onClick={() => setActiveTab('admins')}
            className={`py-3 px-4 text-sm font-semibold flex items-center gap-2 border-b-2 whitespace-nowrap transition ${
              activeTab === 'admins' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Mail className="w-4 h-4" />
            Administradores (Google)
          </button>
          <button
            onClick={() => {
              setActiveTab('audit');
              loadAuditData();
            }}
            className={`py-3 px-4 text-sm font-semibold flex items-center gap-2 border-b-2 whitespace-nowrap transition ${
              activeTab === 'audit' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <ClipboardList className="w-4 h-4" />
            Auditoría de Accesos
            {auditLogs.some(l => l.status === 'failed') && (
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" title="Hay intentos fallidos registrados"></span>
            )}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-gray-50 dark:bg-gray-900/20">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : activeTab === 'clients' ? (
            <div className="space-y-6">
              {/* Form to create/edit new client */}
              <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 transition-all">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                    {editingClientId ? <Edit2 className="w-4 h-4 text-orange-500" /> : <Plus className="w-4 h-4 text-green-500" />}
                    {editingClientId ? 'Editar Espectador' : 'Nuevo Espectador'}
                  </h3>
                  {editingClientId && (
                    <button onClick={cancelEdit} className="text-xs text-gray-500 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded">
                      Cancelar Edición
                    </button>
                  )}
                </div>
                <form onSubmit={handleCreateClient} className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <input
                      type="text"
                      placeholder="Nombre (ej. Cliente VIP)"
                      value={newClientName}
                      onChange={(e) => setNewClientName(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-sm focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="text"
                      placeholder="PIN Secreto (ej. 1234)"
                      value={newClientPin}
                      onChange={(e) => setNewClientPin(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-sm focus:ring-2 focus:ring-blue-500"
                    />
                    <select
                      value={newClientRole}
                      onChange={(e) => setNewClientRole(e.target.value as UserRole)}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-sm focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="dueño">Dueño de Local</option>
                      <option value="cocinero">Cocinero</option>
                      <option value="mozo">Mozo</option>
                    </select>
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-gray-500 block mb-2">Locales permitidos:</span>
                    <div className="flex flex-wrap gap-2">
                      {locales.map(loc => (
                        <button
                          type="button"
                          key={loc.id}
                          onClick={() => toggleLocalForNewClient(loc.id)}
                          className={`px-2.5 py-1 text-xs rounded-full border transition ${
                            newClientLocales.includes(loc.id)
                              ? 'bg-blue-100 border-blue-300 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300'
                              : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600'
                          }`}
                        >
                          {loc.name}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex justify-end pt-2">
                    <button type="submit" className={`px-4 py-2 text-white text-sm font-semibold rounded-lg transition shadow-md ${editingClientId ? 'bg-orange-600 hover:bg-orange-700' : 'bg-blue-600 hover:bg-blue-700'}`}>
                      {editingClientId ? 'Actualizar Espectador' : 'Crear Espectador'}
                    </button>
                  </div>
                </form>
              </div>

              {/* List of existing clients by Role Tabs */}
              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200">Espectadores Registrados</h3>
                </div>
                
                {/* Role Tabs */}
                <div className="flex p-1 bg-gray-100 dark:bg-gray-800/50 rounded-lg overflow-x-auto hide-scrollbar">
                  {(['dueño', 'cocinero', 'mozo'] as UserRole[]).map((role) => (
                    <button
                      key={role}
                      onClick={() => setActiveRoleTab(role)}
                      className={`flex-1 min-w-[100px] py-1.5 px-3 text-xs font-semibold rounded-md transition capitalize ${
                        activeRoleTab === role
                          ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                          : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-200/50 dark:hover:bg-gray-700/50'
                      }`}
                    >
                      {role === 'dueño' ? 'Dueños de Local' : role + 's'}
                    </button>
                  ))}
                </div>

                <div className="space-y-2">
                  {clients.filter(c => (c.role || 'dueño') === activeRoleTab).length === 0 ? (
                    <p className="text-sm text-gray-500 py-4 text-center bg-gray-50 dark:bg-gray-800/20 rounded-lg border border-dashed border-gray-200 dark:border-gray-700">
                      No hay espectadores con este rol.
                    </p>
                  ) : (
                    clients
                      .filter(c => (c.role || 'dueño') === activeRoleTab)
                      .map(client => {
                        const latestLogin = latestLoginsMap[client.id] || latestLoginsMap[client.name];
                        return (
                          <div key={client.id} className="bg-white dark:bg-gray-800 p-3.5 rounded-xl border border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 hover:border-gray-300 dark:hover:border-gray-600 transition shadow-xs">
                            <div className="flex-1">
                              <div className="font-bold text-sm text-gray-900 dark:text-white flex items-center gap-2 flex-wrap">
                                {client.name} 
                                <span className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded text-xs font-mono font-semibold">
                                  PIN: {client.pin}
                                </span>
                              </div>
                              <div className="text-xs text-gray-500 mt-1 flex flex-wrap gap-1">
                                {client.allowed_locales?.map((id: string) => {
                                  const loc = locales.find(l => l.id === id);
                                  return loc ? (
                                    <span key={id} className="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded text-[11px] font-medium">
                                      {loc.name}
                                    </span>
                                  ) : null;
                                })}
                              </div>
                              {/* Indicador de Último Acceso */}
                              {latestLogin ? (
                                <div className="mt-1.5 flex items-center gap-1.5 text-[11.5px] text-emerald-600 dark:text-emerald-400 font-medium">
                                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
                                  <span>Último acceso: {formatAuditTime(latestLogin.created_at)}</span>
                                  <span className="text-gray-300 dark:text-gray-600">·</span>
                                  <span className="text-gray-500 dark:text-gray-400 text-[11px] truncate max-w-[220px]" title={latestLogin.device || ''}>
                                    {latestLogin.device || 'Navegador Web'}
                                  </span>
                                </div>
                              ) : (
                                <div className="mt-1.5 flex items-center gap-1.5 text-[11.5px] text-gray-400 dark:text-gray-500">
                                  <span className="w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-gray-600 shrink-0"></span>
                                  <span>Nunca ha ingresado</span>
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <button onClick={() => handleEditClient(client)} className="p-2 text-gray-400 hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-lg transition" title="Editar">
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button onClick={() => handleDeleteClient(client.id)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition" title="Eliminar">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        );
                      })
                  )}
                </div>
              </div>
            </div>
          ) : activeTab === 'admins' ? (
            <div className="space-y-6">
              {/* Form to create new admin */}
              <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
                <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200 mb-3 flex items-center gap-2">
                  <Plus className="w-4 h-4 text-green-500" /> Nuevo Administrador
                </h3>
                <form onSubmit={handleCreateAdmin} className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="email"
                    placeholder="Correo de Gmail"
                    value={newAdminEmail}
                    onChange={(e) => setNewAdminEmail(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-sm focus:ring-2 focus:ring-blue-500"
                  />
                  <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition shadow-md whitespace-nowrap">
                    Añadir a Lista Blanca
                  </button>
                </form>
              </div>

              {/* List of existing admins */}
              <div className="space-y-2">
                <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200">Administradores Registrados</h3>
                {admins.length === 0 ? (
                  <p className="text-sm text-gray-500">No hay administradores registrados.</p>
                ) : (
                  admins.map(admin => {
                    const latestAdminLogin = latestLoginsMap[admin.email];
                    return (
                      <div key={admin.id} className="bg-white dark:bg-gray-800 p-3.5 rounded-xl border border-gray-200 dark:border-gray-700 flex justify-between items-center gap-3 shadow-xs">
                        <div>
                          <div className="font-medium text-sm text-gray-900 dark:text-white flex items-center gap-2">
                            <Mail className="w-4 h-4 text-gray-400" />
                            {admin.email}
                          </div>
                          {latestAdminLogin ? (
                            <div className="mt-1 flex items-center gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                              <span>Último acceso: {formatAuditTime(latestAdminLogin.created_at)}</span>
                              <span className="text-gray-300 dark:text-gray-600">·</span>
                              <span className="text-gray-500 dark:text-gray-400 text-[10.5px]">
                                {latestAdminLogin.device || 'Web'}
                              </span>
                            </div>
                          ) : (
                            <div className="mt-1 flex items-center gap-1.5 text-[11px] text-gray-400 dark:text-gray-500">
                              <span className="w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-gray-600"></span>
                              <span>Sin registros recientes</span>
                            </div>
                          )}
                        </div>
                        <button onClick={() => handleDeleteAdmin(admin.id)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition" title="Eliminar">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          ) : (
            /* TAB: AUDITORÍA DE ACCESOS */
            <div className="space-y-4">
              {/* Resumen de Métricas */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-white dark:bg-gray-800 p-3 rounded-xl border border-gray-200 dark:border-gray-700 shadow-xs">
                  <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider block">Total Inicios</span>
                  <span className="text-xl font-extrabold text-gray-900 dark:text-white">{auditLogs.length}</span>
                </div>
                <div className="bg-white dark:bg-gray-800 p-3 rounded-xl border border-gray-200 dark:border-gray-700 shadow-xs">
                  <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">Exitosos</span>
                  <span className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400">
                    {auditLogs.filter(l => l.status === 'success').length}
                  </span>
                </div>
                <div className="bg-white dark:bg-gray-800 p-3 rounded-xl border border-gray-200 dark:border-gray-700 shadow-xs">
                  <span className="text-[11px] font-bold text-red-600 dark:text-red-400 uppercase tracking-wider block">Intentos Fallidos</span>
                  <span className="text-xl font-extrabold text-red-600 dark:text-red-400">
                    {auditLogs.filter(l => l.status === 'failed').length}
                  </span>
                </div>
                <div className="bg-white dark:bg-gray-800 p-3 rounded-xl border border-gray-200 dark:border-gray-700 shadow-xs flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider block">Actualizar</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">Tiempo real</span>
                  </div>
                  <button
                    onClick={loadAuditData}
                    disabled={isAuditLoading}
                    className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition disabled:opacity-50"
                    title="Recargar historial"
                  >
                    <RefreshCw className={`w-4 h-4 ${isAuditLoading ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </div>

              {/* Barra de Filtros y Búsqueda */}
              <div className="bg-white dark:bg-gray-800 p-3 rounded-xl border border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row gap-2 justify-between items-stretch sm:items-center shadow-xs">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Buscar por nombre, PIN, IP o dispositivo..."
                    value={auditSearch}
                    onChange={(e) => setAuditSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-xs sm:text-sm text-gray-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex gap-1">
                  <button
                    onClick={() => setAuditFilterStatus('all')}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                      auditFilterStatus === 'all'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
                    }`}
                  >
                    Todos
                  </button>
                  <button
                    onClick={() => setAuditFilterStatus('success')}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                      auditFilterStatus === 'success'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
                    }`}
                  >
                    Exitosos
                  </button>
                  <button
                    onClick={() => setAuditFilterStatus('failed')}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                      auditFilterStatus === 'failed'
                        ? 'bg-red-600 text-white shadow-xs'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
                    }`}
                  >
                    Fallidos
                  </button>
                </div>
              </div>

              {/* Lista de Registros */}
              <div className="space-y-2">
                {(() => {
                  const filtered = auditLogs.filter(log => {
                    if (auditFilterStatus === 'success' && log.status !== 'success') return false;
                    if (auditFilterStatus === 'failed' && log.status !== 'failed') return false;
                    if (auditSearch.trim()) {
                      const q = auditSearch.toLowerCase();
                      const matchName = log.client_name?.toLowerCase().includes(q);
                      const matchRole = log.role?.toLowerCase().includes(q);
                      const matchDevice = log.device?.toLowerCase().includes(q);
                      const matchIp = log.ip_address?.toLowerCase().includes(q);
                      const matchReason = log.failure_reason?.toLowerCase().includes(q);
                      return matchName || matchRole || matchDevice || matchIp || matchReason;
                    }
                    return true;
                  });

                  if (isAuditLoading && auditLogs.length === 0) {
                    return (
                      <div className="flex justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      </div>
                    );
                  }

                  if (filtered.length === 0) {
                    return (
                      <div className="bg-white dark:bg-gray-800 p-8 rounded-xl border border-dashed border-gray-200 dark:border-gray-700 text-center">
                        <ClipboardList className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                        <p className="text-sm text-gray-500 font-medium">No se encontraron registros de auditoría.</p>
                        <p className="text-xs text-gray-400 mt-1">Los ingresos con PIN o Google se registrarán de forma automática.</p>
                      </div>
                    );
                  }

                  return filtered.map((log) => {
                    const isSuccess = log.status === 'success';
                    return (
                      <div 
                        key={log.id} 
                        className={`p-3.5 rounded-xl border transition-all ${
                          isSuccess 
                            ? 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-xs' 
                            : 'bg-red-50/70 dark:bg-red-950/20 border-red-200 dark:border-red-900/40 shadow-xs'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex items-start gap-3">
                            <div className={`p-2 rounded-lg mt-0.5 shrink-0 ${
                              isSuccess 
                                ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' 
                                : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                            }`}>
                              {isSuccess ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                            </div>
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-bold text-sm text-gray-900 dark:text-white">
                                  {log.client_name}
                                </span>
                                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                                  log.role === 'admin'
                                    ? 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
                                    : log.role === 'dueño'
                                    ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                                    : log.role === 'invitado'
                                    ? 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800'
                                    : 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                                }`}>
                                  {log.role}
                                </span>
                                <span className="text-[10.5px] font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">
                                  {log.method === 'google' ? 'Google OAuth' : 'PIN'}
                                </span>
                              </div>

                              {/* Mensaje de error si falló */}
                              {log.failure_reason && (
                                <p className="text-xs text-red-600 dark:text-red-400 font-semibold mt-1 flex items-center gap-1">
                                  <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                                  {log.failure_reason}
                                </p>
                              )}

                              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mt-1 flex-wrap">
                                <span className="flex items-center gap-1" title={log.device || ''}>
                                  {log.device || 'Navegador Web'}
                                </span>
                                {log.ip_address && (
                                  <>
                                    <span>·</span>
                                    <span className="font-mono text-[11px] bg-gray-100 dark:bg-gray-700/60 px-1.5 py-0.2 rounded" title="IP del cliente">
                                      IP: {log.ip_address}
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="text-left sm:text-right shrink-0 pl-11 sm:pl-0">
                            <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 block">
                              {formatAuditTime(log.created_at)}
                            </span>
                            <span className="text-[10px] text-gray-400 block" title={log.created_at}>
                              {new Date(log.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
