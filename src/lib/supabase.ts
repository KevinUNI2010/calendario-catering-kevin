import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { CalendarEvent, Local, UserSession } from '../types';
import { normalizeLocalDateString } from '../utils/dateUtils';

// Supabase Client and Sync helpers for Vercel & Supabase
const env = (import.meta as any).env || {};
const supabaseUrl = env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY as string | undefined;

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (client) return client;
  if (supabaseUrl && supabaseAnonKey && supabaseUrl.startsWith('http')) {
    try {
      client = createClient(supabaseUrl, supabaseAnonKey);
    } catch (e) {
      console.warn('Failed to initialize Supabase client:', e);
      return null;
    }
  }
  return client;
}

export function isSupabaseConfigured(): boolean {
  return Boolean(
    supabaseUrl &&
    supabaseAnonKey &&
    supabaseUrl.startsWith('http') &&
    !supabaseUrl.includes('xyzcompany')
  );
}

// Convert DB snake_case row to CalendarEvent
export function mapRowToEvent(row: any): CalendarEvent {
  const cleanStartDate = normalizeLocalDateString(row.start_date);
  const cleanEndDate = normalizeLocalDateString(row.end_date || row.start_date);

  // Reconstruir objeto dish si vino desde la consulta ligera de campos aplanados
  let dish = row.dish;
  if (!dish && (row.proteina || row.salsa || row.carbohidrato || row.ensalada || row.guarnicion || row.platosContratadosFormula || row.cantidadPlatos !== undefined)) {
    dish = {
      proteina: row.proteina || '',
      salsa: row.salsa || '',
      carbohidrato: row.carbohidrato || '',
      ensalada: row.ensalada || '',
      guarnicion: row.guarnicion || '',
      servilleta: row.servilleta || '',
      servilletas: Array.isArray(row.servilletas) ? row.servilletas : (row.servilleta ? [row.servilleta] : []),
      cantidadPlatos: typeof row.cantidadPlatos === 'number' ? row.cantidadPlatos : (typeof row.platosContratados === 'number' ? row.platosContratados : 0),
      platosContratados: row.platosContratados,
      platosContratadosFormula: row.platosContratadosFormula || '',
      isTimePending: Boolean(row.isTimePending),
      isDatePending: Boolean(row.isDatePending),
      evidencePhoto: row.evidencePhoto || undefined,
    };
  }

  const evidencePhoto = row.dish?.evidencePhoto || row.evidencePhoto || row.evidence_photo || undefined;
  const hasEvidencePhoto = Boolean(row.hasEvidencePhoto || evidencePhoto);

  return {
    id: row.id,
    title: row.title,
    description: row.description || '',
    localId: row.local_id,
    localName: row.local_name,
    colorId: row.color_id || 'peacock',
    startDate: cleanStartDate,
    endDate: cleanEndDate,
    allDay: Boolean(row.all_day),
    attendees: Array.isArray(row.attendees) ? row.attendees : [],
    reminders: Array.isArray(row.reminders) ? row.reminders : [],
    notes: row.notes || '',
    dish: dish || undefined,
    evidencePhoto,
    hasEvidencePhoto,
    status: row.status || 'confirmed',
    createdBy: row.created_by || 'kevin.zambrano.inteligencia@gmail.com',
    updatedAt: row.updated_at || new Date().toISOString(),
    isTimePending: Boolean(row.is_time_pending ?? dish?.isTimePending ?? row.isTimePending),
    isDatePending: Boolean(row.is_date_pending ?? dish?.isDatePending ?? row.isDatePending),
  };
}

// Convert CalendarEvent to DB snake_case row
export function mapEventToRow(event: CalendarEvent): any {
  const isTimePending = Boolean(event.isTimePending ?? event.dish?.isTimePending);
  const isDatePending = Boolean(event.isDatePending ?? event.dish?.isDatePending);
  const dishData = event.dish ? {
    ...event.dish,
    isTimePending,
    isDatePending,
    evidencePhoto: event.evidencePhoto || event.dish.evidencePhoto || undefined,
  } : {
    isTimePending,
    isDatePending,
    evidencePhoto: event.evidencePhoto || undefined,
  };

  return {
    id: event.id,
    title: event.title,
    description: event.description,
    local_id: (event.localId && event.localId.length === 36) ? event.localId : null,
    local_name: event.localName,
    color_id: event.colorId,
    start_date: normalizeLocalDateString(event.startDate),
    end_date: normalizeLocalDateString(event.endDate || event.startDate),
    all_day: event.allDay,
    attendees: event.attendees,
    reminders: event.reminders,
    notes: event.notes,
    dish: dishData,
    status: event.status,
    created_by: event.createdBy,
    updated_at: new Date().toISOString(),
  };
}

export function mapRowToLocal(row: any): Local {
  return {
    id: row.id,
    name: row.name,
    colorId: row.color_id || 'peacock',
  };
}

export async function fetchSupabaseEvents(session?: UserSession): Promise<CalendarEvent[] | null> {
  const sb = getSupabase();
  if (!sb) return null;
  try {
    // Consulta optimizada ultra ligera: descarga todos los datos del evento y menú
    // excluyendo las fotos pesadas en base64 (reduce el payload de 11.5 MB a solo ~88 KB)
    const fields = [
      'id', 'title', 'description', 'start_date', 'end_date', 'all_day',
      'color_id', 'local_id', 'local_name', 'status', 'created_by', 'notes',
      'attendees', 'reminders', 'created_at', 'updated_at',
      'dish->salsa', 'dish->ensalada', 'dish->proteina', 'dish->guarnicion',
      'dish->carbohidrato', 'dish->servilleta', 'dish->servilletas',
      'dish->cantidadPlatos', 'dish->platosContratados', 'dish->platosContratadosFormula',
      'dish->isTimePending', 'dish->isDatePending'
    ].join(',');

    let query = sb.from('events').select(fields).order('start_date', { ascending: true });
    
    // Si la sesión no es admin y tiene locales restringidos, filtrar por local_id
    if (session && session.role !== 'admin' && session.allowedLocales && session.allowedLocales.length > 0) {
      query = query.in('local_id', session.allowedLocales);
    }

    // Ejecutar en paralelo la consulta de eventos ligeros y la lista de IDs con foto (~3 KB)
    const [eventsRes, photosRes] = await Promise.all([
      query,
      sb.from('events').select('id').not('dish->evidencePhoto', 'is', null)
    ]);

    if (eventsRes.error) {
      console.warn('Lightweight query failed, fallback to standard select:', eventsRes.error.message);
      let fallbackQuery = sb.from('events').select('*').order('start_date', { ascending: true });
      if (session && session.role !== 'admin' && session.allowedLocales && session.allowedLocales.length > 0) {
        fallbackQuery = fallbackQuery.in('local_id', session.allowedLocales);
      }
      const { data, error } = await fallbackQuery;
      if (error) throw error;
      return (data || []).map(mapRowToEvent);
    }

    if (!eventsRes.data) return [];

    const photoIdSet = new Set(
      photosRes.data ? photosRes.data.map((r: any) => r.id) : []
    );

    return eventsRes.data.map((row: any) => {
      const evt = mapRowToEvent(row);
      if (photoIdSet.has(evt.id)) {
        evt.hasEvidencePhoto = true;
      }
      return evt;
    });
  } catch (err) {
    console.warn('Supabase fetch events failed:', err);
    return null;
  }
}

/**
 * Descarga bajo demanda la foto de evidencia de un evento específico (~150 KB)
 * cuando el usuario abre el modal o solicita ver la evidencia.
 */
export async function fetchSupabaseEventEvidence(eventId: string): Promise<string | null> {
  const sb = getSupabase();
  if (!sb || !eventId) return null;
  try {
    const { data, error } = await sb
      .from('events')
      .select('dish->evidencePhoto')
      .eq('id', eventId)
      .maybeSingle();

    if (error || !data) return null;
    return (data as any).evidencePhoto || null;
  } catch (err) {
    console.warn('Could not fetch single event evidence:', err);
    return null;
  }
}

export async function fetchSupabaseLocales(): Promise<Local[] | null> {
  const sb = getSupabase();
  if (!sb) return null;
  try {
    const { data, error } = await sb.from('locales').select('*').order('name', { ascending: true });
    if (error) throw error;
    if (!data) return [];
    return data.map(mapRowToLocal);
  } catch (err) {
    console.warn('Supabase fetch locales failed:', err);
    return null;
  }
}

export async function fetchSupabaseClientByPin(pin: string): Promise<any | null> {
  const sb = getSupabase();
  if (!sb) return null;
  const cleanPin = pin.trim();
  if (!cleanPin || cleanPin.length < 4) return null;

  try {
    const { data, error } = await sb
      .from('clients')
      .select('id, name, role, allowed_locales')
      .eq('pin', cleanPin)
      .maybeSingle();

    if (error) {
      console.warn('Verificación de cliente falló:', error.message);
      return null;
    }
    return data;
  } catch (err) {
    console.warn('Supabase fetch client failed:', err);
    return null;
  }
}

export async function upsertSupabaseLocal(local: Local): Promise<boolean> {
  const sb = getSupabase();
  if (!sb) return false;
  try {
    const { error } = await sb.from('locales').upsert({
      id: local.id,
      name: local.name,
      color_id: local.colorId
    });
    if (error) throw error;
    return true;
  } catch (err) {
    console.warn('Supabase upsert local failed:', err);
    return false;
  }
}

export async function fetchSupabaseMenuOptions(): Promise<any | null> {
  const sb = getSupabase();
  if (!sb) return null;
  try {
    const { data, error } = await sb.from('menu_items').select('*').eq('is_active', true);
    if (error) throw error;
    
    const options: any = {
      proteinas: [],
      ensaladas: [],
      salsas: [],
      guarniciones: [],
      carbohidratos: [],
      servilletas: []
    };

    if (data) {
      data.forEach((item: any) => {
        if (options[item.category]) {
          options[item.category].push(item.name);
        }
      });
    }

    return options;
  } catch (err) {
    console.warn('Supabase fetch menu options failed:', err);
    return null;
  }
}

export async function upsertSupabaseMenuOptions(options: any): Promise<boolean> {
  const sb = getSupabase();
  if (!sb) return false;
  try {
    // Delete existing
    await sb.from('menu_items').delete().not('id', 'is', null);

    const newItems: any[] = [];
    Object.keys(options).forEach(category => {
      if (Array.isArray(options[category])) {
        options[category].forEach((name: string) => {
          newItems.push({ name, category, is_active: true });
        });
      }
    });

    if (newItems.length > 0) {
      const { error } = await sb.from('menu_items').insert(newItems);
      if (error) throw error;
    }
    return true;
  } catch (err) {
    console.warn('Supabase upsert menu options failed:', err);
    return false;
  }
}

export async function upsertSupabaseEvent(event: CalendarEvent): Promise<boolean> {
  const sb = getSupabase();
  if (!sb) return false;
  try {
    const row = mapEventToRow(event);
    const { error } = await sb.from('events').upsert(row);
    if (error) throw error;
    return true;
  } catch (err) {
    console.warn('Supabase upsert event failed:', err);
    return false;
  }
}

export async function deleteSupabaseEvent(id: string): Promise<boolean> {
  const sb = getSupabase();
  if (!sb) return false;
  try {
    const { error } = await sb.from('events').delete().eq('id', id);
    if (error) throw error;
    return true;
  } catch (err) {
    console.warn('Supabase delete event failed:', err);
    return false;
  }
}

export function subscribeSupabaseEvents(
  onInsert: (event: CalendarEvent) => void,
  onUpdate: (event: CalendarEvent) => void,
  onDelete: (id: string) => void
): (() => void) | null {
  const sb = getSupabase();
  if (!sb) return null;

  try {
    const channel = sb
      .channel('realtime:events')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'events' },
        (payload) => {
          if (payload.new) {
            onInsert(mapRowToEvent(payload.new));
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'events' },
        (payload) => {
          if (payload.new) {
            onUpdate(mapRowToEvent(payload.new));
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'events' },
        (payload) => {
          if (payload.old && payload.old.id) {
            onDelete(payload.old.id);
          }
        }
      )
      .subscribe();

    return () => {
      sb.removeChannel(channel);
    };
  } catch (err) {
    console.warn('Failed to subscribe to Supabase channel', err);
    return null;
  }
}


export async function fetchSupabaseClients() {
  const sb = getSupabase();
  if (!sb) return [];
  try {
    const { data, error } = await sb.from('clients').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  } catch (err) {
    console.warn('Supabase fetch clients failed:', err);
    return [];
  }
}

export async function upsertSupabaseClient(client: any) {
  const sb = getSupabase();
  if (!sb) return false;
  try {
    const { error } = await sb.from('clients').upsert({
      id: client.id,
      name: client.name,
      pin: client.pin,
      allowed_locales: client.allowed_locales,
      role: client.role || 'dueño'
    });
    if (error) throw error;
    return true;
  } catch (err) {
    console.warn('Supabase upsert client failed:', err);
    return false;
  }
}

export async function deleteSupabaseClient(id: string) {
  const sb = getSupabase();
  if (!sb) return false;
  try {
    const { error } = await sb.from('clients').delete().eq('id', id);
    if (error) throw error;
    return true;
  } catch (err) {
    console.warn('Supabase delete client failed:', err);
    return false;
  }
}

export async function fetchSupabaseAdmins() {
  const sb = getSupabase();
  if (!sb) return [];
  try {
    const { data, error } = await sb.from('admin_emails').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  } catch (err) {
    console.warn('Supabase fetch admins failed:', err);
    return [];
  }
}

export async function upsertSupabaseAdmin(email: string) {
  const sb = getSupabase();
  if (!sb) return false;
  try {
    const { error } = await sb.from('admin_emails').upsert({ email });
    if (error) throw error;
    return true;
  } catch (err) {
    console.warn('Supabase upsert admin failed:', err);
    return false;
  }
}

export async function deleteSupabaseAdmin(id: string) {
  const sb = getSupabase();
  if (!sb) return false;
  try {
    const { error } = await sb.from('admin_emails').delete().eq('id', id);
    if (error) throw error;
    return true;
  } catch (err) {
    console.warn('Supabase delete admin failed:', err);
    return false;
  }
}
