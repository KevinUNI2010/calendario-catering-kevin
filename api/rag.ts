import type { VercelRequest, VercelResponse } from '@vercel/node';
import { processRagQuery } from '../src/server/ragHandler';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Solo permitir solicitudes POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido. Se requiere POST.' });
  }

  try {
    const { prompt, audioBase64, audioMimeType, imageBase64, imageMimeType, session, events } = req.body || {};

    if (!session) {
      return res.status(401).json({ error: 'No autorizado. Se requiere sesión.' });
    }

    const userId = session.id || session.name || session.role || 'anon';
    const userName = session.name || 'Usuario';
    const userRole = session.role || 'dueño';

    // 1. Verificar y descontar cuota en Supabase
    let remainingQuota = userRole === 'admin' ? 999999 : 10;
    if (supabaseUrl && supabaseKey) {
      try {
        const sb = createClient(supabaseUrl, supabaseKey);
        const { data: quotaData, error: quotaError } = await sb.rpc('get_rag_remaining_quota', {
          p_user_id: userId,
          p_role: userRole
        });

        if (!quotaError && typeof quotaData === 'number') {
          remainingQuota = quotaData;
          if (userRole !== 'admin' && remainingQuota <= 0) {
            return res.status(429).json({
              answer: 'Has alcanzado tu límite de 10 consultas diarias. Tu cuota se renovará mañana a las 00:00.',
              remainingQuota: 0,
              chart: null,
            });
          }
        }
      } catch (e) {
        console.warn('Advertencia verificando cuota en Supabase:', e);
      }
    }

    // 2. Procesar la consulta con Gemini 3.8 Flash
    const result = await processRagQuery({
      prompt,
      audioBase64,
      audioMimeType,
      imageBase64,
      imageMimeType,
      session,
      events: events || []
    });

    // 3. Registrar en Supabase la auditoría de la consulta
    if (supabaseUrl && supabaseKey) {
      try {
        const sb = createClient(supabaseUrl, supabaseKey);
        const { data: logResult } = await sb.rpc('log_rag_query', {
          p_user_id: userId,
          p_user_name: userName,
          p_user_role: userRole,
          p_prompt: prompt || (audioBase64 ? '[Audio de voz]' : '[Imagen adjunta]'),
          p_response: result.answer,
          p_has_chart: Boolean(result.chart),
          p_chart_data: result.chart || null
        });

        if (logResult && typeof logResult.remaining === 'number') {
          remainingQuota = logResult.remaining;
        }
      } catch (logErr) {
        console.warn('Advertencia registrando log de auditoría:', logErr);
      }
    }

    return res.status(200).json({
      answer: result.answer,
      chart: result.chart || null,
      remainingQuota: userRole === 'admin' ? 999999 : Math.max(0, remainingQuota),
      error: result.error
    });
  } catch (error: any) {
    console.error('Error en endpoint /api/rag:', error);
    return res.status(500).json({
      answer: 'Ocurrió un error en el servidor al procesar la solicitud.',
      error: error.message || String(error)
    });
  }
}
