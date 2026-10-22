-- ==============================================================================
-- SCHEMA SUPABASE PARA CALENDARIO DE LOCALES (CON SEGURIDAD RLS Y VERIFICACIÓN RPC)
-- Ejecuta este script en el "SQL Editor" de tu proyecto en Supabase (https://supabase.com)
-- ==============================================================================

-- 0. Habilitar extensión criptográfica
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Tabla de Locales
CREATE TABLE IF NOT EXISTS public.locales (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  color_id TEXT DEFAULT 'peacock',
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Asegurar columnas en caso de que la tabla ya existía con esquema previo
ALTER TABLE public.locales ADD COLUMN IF NOT EXISTS color_id TEXT DEFAULT 'peacock';
ALTER TABLE public.locales ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now());

-- 2. Tabla de Eventos del Calendario
CREATE TABLE IF NOT EXISTS public.events (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  local_id TEXT REFERENCES public.locales(id) ON DELETE CASCADE,
  local_name TEXT NOT NULL,
  color_id TEXT DEFAULT 'peacock',
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  all_day BOOLEAN DEFAULT false,
  attendees JSONB DEFAULT '[]'::jsonb,
  reminders JSONB DEFAULT '[]'::jsonb,
  notes TEXT,
  dish JSONB,
  status TEXT DEFAULT 'confirmed',
  created_by TEXT DEFAULT 'kevin.zambrano.inteligencia@gmail.com',
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Asegurar columnas en caso de que la tabla events ya existía previamente
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS dish JSONB;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS attendees JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS reminders JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'confirmed';
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS created_by TEXT DEFAULT 'kevin.zambrano.inteligencia@gmail.com';
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now());

-- 3. Tabla de Opciones de Menú
CREATE TABLE IF NOT EXISTS public.menu_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Tabla de Lista Blanca de Administradores
CREATE TABLE IF NOT EXISTS public.admin_emails (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Tabla de Clientes / Espectadores con PIN
CREATE TABLE IF NOT EXISTS public.clients (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  pin TEXT NOT NULL,
  allowed_locales JSONB DEFAULT '[]'::jsonb,
  role TEXT DEFAULT 'dueño',
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Asegurar columnas en caso de que la tabla clients ya existía
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS allowed_locales JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'dueño';

-- 6. Tabla de Registro de Correos y Recordatorios
CREATE TABLE IF NOT EXISTS public.email_logs (
  id TEXT PRIMARY KEY,
  event_id TEXT,
  recipient TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  sent_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  trigger_type TEXT DEFAULT 'automatic'
);

-- 7. Funciones de Seguridad y Helper RLS
-- Verifica si el usuario actual autenticado con Google es administrador mediante la tabla protegida
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_emails
    WHERE LOWER(email) = LOWER(COALESCE(auth.jwt() ->> 'email', ''))
  );
$$;

-- RPC Seguro para Validar PIN con protección anti-fuerza bruta
CREATE OR REPLACE FUNCTION public.verify_client_pin(p_pin TEXT)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_client RECORD;
  v_clean_pin TEXT;
BEGIN
  v_clean_pin := trim(COALESCE(p_pin, ''));
  IF length(v_clean_pin) < 4 OR length(v_clean_pin) > 12 THEN
    PERFORM pg_sleep(0.3); -- Retardo intencional contra escaneo automatizado
    RETURN NULL;
  END IF;

  SELECT id, name, role, allowed_locales
  INTO v_client
  FROM public.clients
  WHERE pin = v_clean_pin
     OR pin = encode(digest(v_clean_pin, 'sha256'), 'hex')
  LIMIT 1;

  IF FOUND THEN
    RETURN json_build_object(
      'id', v_client.id,
      'name', v_client.name,
      'role', COALESCE(v_client.role, 'dueño'),
      'allowed_locales', COALESCE(v_client.allowed_locales, '[]'::jsonb)
    )::jsonb;
  ELSE
    PERFORM pg_sleep(0.3); -- Retardo intencional ante intento fallido
    RETURN NULL;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.verify_client_pin(TEXT) TO anon, authenticated;

-- RPC Seguro Multi-inquilino: Retorna ÚNICAMENTE los eventos de los locales asignados al cliente
CREATE OR REPLACE FUNCTION public.get_events_for_client(p_pin TEXT)
RETURNS SETOF public.events
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_client RECORD;
  v_clean_pin TEXT;
BEGIN
  v_clean_pin := trim(COALESCE(p_pin, ''));
  IF length(v_clean_pin) < 4 THEN
    PERFORM pg_sleep(0.2);
    RETURN;
  END IF;

  SELECT id, allowed_locales
  INTO v_client
  FROM public.clients
  WHERE pin = v_clean_pin
     OR pin = encode(digest(v_clean_pin, 'sha256'), 'hex')
  LIMIT 1;

  IF NOT FOUND THEN
    PERFORM pg_sleep(0.3);
    RETURN;
  END IF;

  -- Devolver únicamente los eventos de los locales permitidos
  RETURN QUERY
  SELECT * FROM public.events
  WHERE local_id = ANY(ARRAY(SELECT jsonb_array_elements_text(v_client.allowed_locales)))
  ORDER BY start_date ASC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_events_for_client(TEXT) TO anon, authenticated;

-- 8. Habilitar Row Level Security (RLS) en todas las tablas
ALTER TABLE public.locales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

-- 9. Políticas RLS seguras

-- Locales: lectura pública para que la app cargue; edición exclusiva de admins
DROP POLICY IF EXISTS "Permitir lectura publica de locales" ON public.locales;
DROP POLICY IF EXISTS "Permitir escritura publica de locales" ON public.locales;
DROP POLICY IF EXISTS "locales_select_all" ON public.locales;
DROP POLICY IF EXISTS "locales_admin_modify" ON public.locales;
CREATE POLICY "locales_select_all" ON public.locales FOR SELECT USING (true);
CREATE POLICY "locales_admin_modify" ON public.locales FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Eventos: administradores tienen acceso completo directo.
-- Los clientes con PIN obtienen sus eventos filtrados mediante la función RPC segura get_events_for_client(p_pin).
-- Esto previene la fuga masiva de datos (BOLA / OWASP API1) entre locales diferentes.
DROP POLICY IF EXISTS "Permitir lectura publica de eventos" ON public.events;
DROP POLICY IF EXISTS "Permitir escritura publica de eventos" ON public.events;
DROP POLICY IF EXISTS "events_select_all" ON public.events;
DROP POLICY IF EXISTS "events_admin_modify" ON public.events;
DROP POLICY IF EXISTS "events_admin_all" ON public.events;
CREATE POLICY "events_admin_all" ON public.events FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Menú: lectura pública; modificación exclusiva de administradores
DROP POLICY IF EXISTS "menu_items_select_all" ON public.menu_items;
DROP POLICY IF EXISTS "menu_items_admin_modify" ON public.menu_items;
CREATE POLICY "menu_items_select_all" ON public.menu_items FOR SELECT USING (true);
CREATE POLICY "menu_items_admin_modify" ON public.menu_items FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Admin Emails: un usuario autenticado puede leer si es admin o si es su propio correo; modificación solo por admin
DROP POLICY IF EXISTS "admin_emails_select" ON public.admin_emails;
DROP POLICY IF EXISTS "admin_emails_admin_modify" ON public.admin_emails;
CREATE POLICY "admin_emails_select" ON public.admin_emails FOR SELECT 
  USING (public.is_admin() OR LOWER(email) = LOWER(COALESCE(auth.jwt() ->> 'email', '')));
CREATE POLICY "admin_emails_admin_modify" ON public.admin_emails FOR ALL 
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Clientes con PIN: TOTALMENTE PROTEGIDO de consultas anónimas.
-- Solo administradores autenticados pueden ver o gestionar la tabla.
-- Los clientes normales se autentican usando verify_client_pin(p_pin).
DROP POLICY IF EXISTS "clients_admin_all" ON public.clients;
CREATE POLICY "clients_admin_all" ON public.clients FOR ALL 
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Logs de Correos: restringido a administradores
DROP POLICY IF EXISTS "Permitir lectura publica de logs" ON public.email_logs;
DROP POLICY IF EXISTS "Permitir insercion publica de logs" ON public.email_logs;
DROP POLICY IF EXISTS "email_logs_admin_all" ON public.email_logs;
CREATE POLICY "email_logs_admin_all" ON public.email_logs FOR ALL 
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- 10. Habilitar Supabase Realtime
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'locales') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.locales;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'events') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.events;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'menu_items') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.menu_items;
  END IF;
END $$;

-- 11. Datos Iniciales de Administrador
INSERT INTO public.admin_emails (email)
SELECT 'kevin.zambrano.inteligencia@gmail.com'
WHERE NOT EXISTS (
  SELECT 1 FROM public.admin_emails WHERE LOWER(email) = 'kevin.zambrano.inteligencia@gmail.com'
);
