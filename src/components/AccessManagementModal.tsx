import React, { useState, useEffect } from 'react';
import { X, Save, Trash2, Plus, Users, ShieldCheck, Mail } from 'lucide-react';
import { fetchSupabaseClients, upsertSupabaseClient, deleteSupabaseClient, fetchSupabaseAdmins, upsertSupabaseAdmin, deleteSupabaseAdmin } from '../lib/supabase';
import { Local } from '../types';
import { notify } from '../utils/toastHelper';

interface AccessManagementModalProps {
  onClose: () => void;
  locales: Local[];
}

export const AccessManagementModal: React.FC<AccessManagementModalProps> = ({ onClose, locales }) => {
  const [activeTab, setActiveTab] = useState<'clients' | 'admins'>('clients');
  const [clients, setClients] = useState<any[]>([]);
  const [admins, setAdmins] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // New Client State
  const [newClientName, setNewClientName] = useState('');
  const [newClientPin, setNewClientPin] = useState('');
  const [newClientLocales, setNewClientLocales] = useState<string[]>([]);

  // New Admin State
  const [newAdminEmail, setNewAdminEmail] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    const [clientsData, adminsData] = await Promise.all([
      fetchSupabaseClients(),
      fetchSupabaseAdmins()
    ]);
    setClients(clientsData);
    setAdmins(adminsData);
    setIsLoading(false);
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
    
    // Auto-generate UUID for new client
    const id = crypto.randomUUID();
    const success = await upsertSupabaseClient({
      id,
      name: newClientName.trim(),
      pin: newClientPin.trim(),
      allowed_locales: newClientLocales
    });

    if (success) {
      notify.success('Espectador creado correctamente');
      setNewClientName('');
      setNewClientPin('');
      setNewClientLocales([]);
      loadData();
    } else {
      notify.error('Error al crear el espectador');
    }
  };

  const handleDeleteClient = async (id: string) => {
    if (!window.confirm('¿Seguro que deseas eliminar este espectador?')) return;
    const success = await deleteSupabaseClient(id);
    if (success) {
      notify.success('Espectador eliminado');
      loadData();
    } else {
      notify.error('Error al eliminar');
    }
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-blue-600" />
            Accesos y Permisos
          </h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800 transition">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="flex border-b border-gray-200 dark:border-gray-800 px-4">
          <button
            onClick={() => setActiveTab('clients')}
            className={`py-3 px-4 text-sm font-semibold flex items-center gap-2 border-b-2 transition ${
              activeTab === 'clients' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Users className="w-4 h-4" />
            Espectadores (PIN)
          </button>
          <button
            onClick={() => setActiveTab('admins')}
            className={`py-3 px-4 text-sm font-semibold flex items-center gap-2 border-b-2 transition ${
              activeTab === 'admins' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Mail className="w-4 h-4" />
            Administradores (Google)
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-gray-50 dark:bg-gray-900/20">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : activeTab === 'clients' ? (
            <div className="space-y-6">
              {/* Form to create new client */}
              <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
                <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200 mb-3 flex items-center gap-2">
                  <Plus className="w-4 h-4 text-green-500" /> Nuevo Espectador
                </h3>
                <form onSubmit={handleCreateClient} className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                    <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition shadow-md">
                      Crear Espectador
                    </button>
                  </div>
                </form>
              </div>

              {/* List of existing clients */}
              <div className="space-y-2">
                <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200">Espectadores Registrados</h3>
                {clients.length === 0 ? (
                  <p className="text-sm text-gray-500">No hay espectadores registrados.</p>
                ) : (
                  clients.map(client => (
                    <div key={client.id} className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                      <div>
                        <div className="font-bold text-sm text-gray-900 dark:text-white flex items-center gap-2">
                          {client.name} <span className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded text-xs font-mono">PIN: {client.pin}</span>
                        </div>
                        <div className="text-xs text-gray-500 mt-1 flex flex-wrap gap-1">
                          {client.allowed_locales?.map((id: string) => {
                            const loc = locales.find(l => l.id === id);
                            return loc ? <span key={id} className="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded">{loc.name}</span> : null;
                          })}
                        </div>
                      </div>
                      <button onClick={() => handleDeleteClient(client.id)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition" title="Eliminar">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : (
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
                  admins.map(admin => (
                    <div key={admin.id} className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700 flex justify-between items-center">
                      <div className="font-medium text-sm text-gray-900 dark:text-white flex items-center gap-2">
                        <Mail className="w-4 h-4 text-gray-400" />
                        {admin.email}
                      </div>
                      <button onClick={() => handleDeleteAdmin(admin.id)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition" title="Eliminar">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
