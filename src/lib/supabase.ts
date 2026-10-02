import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { CalendarEvent, Local } from '../types';

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
  return {
    id: row.id,
    title: row.title,
    description: row.description || '',
    localId: row.local_id,
    localName: row.local_name,
    colorId: row.color_id || 'peacock',
    startDate: row.start_date,
    endDate: row.end_date,
    allDay: Boolean(row.all_day),
    attendees: Array.isArray(row.attendees) ? row.attendees : [],
    reminders: Array.isArray(row.reminders) ? row.reminders : [],
    notes: row.notes || '',
    dish: row.dish || undefined,
    status: row.status || 'confirmed',
    createdBy: row.created_by || 'kevin.zambrano.inteligencia@gmail.com',
    updatedAt: row.updated_at || new Date().toISOString(),
  };
}

// Convert CalendarEvent to DB snake_case row
export function mapEventToRow(event: CalendarEvent): any {
  return {
    id: event.id,
    title: event.title,
    description: event.description,
    local_id: (event.localId && event.localId.length === 36) ? event.localId : null,
    local_name: event.localName,
    color_id: event.colorId,
    start_date: event.startDate,
    end_date: event.endDate,
    all_day: event.allDay,
    attendees: event.attendees,
    reminders: event.reminders,
    notes: event.notes,
    dish: event.dish,
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

export async function fetchSupabaseEvents(): Promise<CalendarEvent[] | null> {
  const sb = getSupabase();
  if (!sb) return null;
  try {
    const { data, error } = await sb.from('events').select('*').order('start_date', { ascending: true });
    if (error) throw error;
    if (!data) return [];
    return data.map(mapRowToEvent);
  } catch (err) {
    console.warn('Supabase fetch events failed:', err);
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
  try {
    const { data, error } = await sb.from('clients').select('*').eq('pin', pin).single();
    if (error) throw error;
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
      allowed_locales: client.allowed_locales
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
