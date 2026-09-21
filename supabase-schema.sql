-- ==============================================================================
-- SCHEMA SUPABASE PARA CALENDARIO DE LOCALES (COMPATIBLE CON VERCEL Y TIEMPO REAL)
-- Ejecuta este script en el "SQL Editor" de tu proyecto en Supabase (https://supabase.com)
-- ==============================================================================

-- 1. Tabla de Locales
CREATE TABLE IF NOT EXISTS public.locales (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  address TEXT NOT NULL,
  manager TEXT,
  phone TEXT,
  email TEXT,
  color_id TEXT DEFAULT 'peacock',
  capacity INTEGER DEFAULT 50,
  operating_hours TEXT DEFAULT '08:00 - 22:00',
  status TEXT DEFAULT 'operativo',
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Tabla de Eventos del Calendario
CREATE TABLE IF NOT EXISTS public.events (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  local_id TEXT NOT NULL REFERENCES public.locales(id) ON DELETE CASCADE,
  local_name TEXT NOT NULL,
  color_id TEXT DEFAULT 'peacock',
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  all_day BOOLEAN DEFAULT false,
  attendees JSONB DEFAULT '[]'::jsonb,
  reminders JSONB DEFAULT '[]'::jsonb,
  notes TEXT,
  status TEXT DEFAULT 'confirmed',
  created_by TEXT DEFAULT 'kevin.zambrano.inteligencia@gmail.com',
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Tabla de Registro de Correos y Recordatorios
CREATE TABLE IF NOT EXISTS public.email_logs (
  id TEXT PRIMARY KEY,
  event_id TEXT,
  recipient TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  sent_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  trigger_type TEXT DEFAULT 'automatic'
);

-- 4. Habilitar Row Level Security (RLS)
ALTER TABLE public.locales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

-- 5. Crear Políticas de Acceso Público / Anon (Lectura y Escritura Colaborativa)
CREATE POLICY "Permitir lectura publica de locales" ON public.locales
  FOR SELECT USING (true);
CREATE POLICY "Permitir escritura publica de locales" ON public.locales
  FOR ALL USING (true);

CREATE POLICY "Permitir lectura publica de eventos" ON public.events
  FOR SELECT USING (true);
CREATE POLICY "Permitir escritura publica de eventos" ON public.events
  FOR ALL USING (true);

CREATE POLICY "Permitir lectura publica de logs" ON public.email_logs
  FOR SELECT USING (true);
CREATE POLICY "Permitir insercion publica de logs" ON public.email_logs
  FOR INSERT WITH CHECK (true);

-- 6. Habilitar Supabase Realtime (WebSockets automáticos entre todos los clientes en Vercel)
ALTER PUBLICATION supabase_realtime ADD TABLE public.locales;
ALTER PUBLICATION supabase_realtime ADD TABLE public.events;

-- 7. Datos Iniciales (Seed Data de Locales)
INSERT INTO public.locales (id, name, code, address, manager, phone, email, color_id, capacity, operating_hours, status)
VALUES
  ('loc-1', 'Local Centro Histórico', 'LC-01', 'Calle Mayor 120, Casco Antiguo', 'Carlos Mendoza', '+34 912 345 678', 'centro@locales.com', 'peacock', 80, '08:00 - 22:00', 'operativo'),
  ('loc-2', 'Local Plaza Norte', 'LC-02', 'Av. del Parque 45, Nivel 2', 'Valeria Soto', '+34 913 876 543', 'norte@locales.com', 'sage', 120, '09:00 - 23:00', 'operativo'),
  ('loc-3', 'Local Gourmet Poniente', 'LC-03', 'Paseo de la Castellana 204', 'Rodrigo Alarcón', '+34 914 555 123', 'gourmet@locales.com', 'grape', 65, '10:00 - 00:00', 'operativo'),
  ('loc-4', 'Local Sur Empresarial', 'LC-04', 'Polígono Industrial Sur, Bloque 8', 'Elena Morales', '+34 915 999 888', 'sur@locales.com', 'tangerine', 150, '07:30 - 21:00', 'operativo'),
  ('loc-5', 'Local Marina Puerto', 'LC-05', 'Dársena de Levante 12', 'Mateo Benítez', '+34 916 444 333', 'marina@locales.com', 'blueberry', 95, '08:30 - 23:30', 'operativo')
ON CONFLICT (id) DO NOTHING;
