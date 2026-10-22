import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// Interfaces tipadas directamente para evitar problemas de resolución de módulos relativos en Vercel
interface UserSession {
  role: 'admin' | 'dueño' | 'cocinero' | 'mozo' | 'viewer';
  name?: string;
  allowedLocales?: string[];
  id?: string;
}

interface DishSelection {
  proteina?: string;
  ensalada?: string;
  salsa?: string;
  guarnicion?: string;
  carbohidrato?: string;
  servilleta?: string;
  servilletas?: string[];
  cantidadPlatos?: number;
  platosContratados?: number;
  platosConfirmados?: number;
  platosServidos?: number;
}

interface CalendarEvent {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  localId: string;
  localName: string;
  status: string;
  dish?: DishSelection;
  notes?: string;
  description?: string;
}

interface RagChartItem {
  label: string;
  value: number;
  secondaryLabel?: string;
}

interface RagChartData {
  type: 'bar';
  title: string;
  subtitle?: string;
  unit?: string;
  data: RagChartItem[];
}

interface RagEventCardItem {
  id?: string;
  title: string;
  localName: string;
  timeString: string;
  dateString?: string;
  proteina?: string;
  salsa?: string;
  carbohidrato?: string;
  guarnicion?: string;
  ensalada?: string;
  servilletas?: string[];
  platosContratados?: number | string;
  platosConfirmados?: number | string;
  platosServidos?: number | string;
  notes?: string;
}

interface RagCardsContainer {
  dateTitle: string;
  subtitle?: string;
  cards: RagEventCardItem[];
}

interface RagRequestParams {
  prompt?: string;
  audioBase64?: string;
  audioMimeType?: string;
  imageBase64?: string;
  imageMimeType?: string;
  session: UserSession;
  events: CalendarEvent[];
}

interface RagResponseResult {
  answer: string;
  chart?: RagChartData | null;
  cards?: RagCardsContainer | null;
  remainingQuota?: number;
  createdEvent?: CalendarEvent | null;
  error?: string;
}

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

export async function processRagQuery(params: RagRequestParams): Promise<RagResponseResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return {
      answer: 'Error: No se ha configurado la clave GEMINI_API_KEY en las variables de entorno.',
    };
  }

  const { session, prompt = '', audioBase64, audioMimeType, imageBase64, imageMimeType, events = [] } = params;
  const userRole = session?.role || 'dueño';
  const userName = session?.name || 'Usuario';
  const allowedLocales = session?.allowedLocales || [];

  // 1. Filtrado de seguridad multi-inquilino (BOLA protection)
  const accessibleEvents = userRole === 'admin' 
    ? events 
    : events.filter(e => allowedLocales.includes(e.localId));

  // 2. Resumir los eventos en un formato de contexto conciso
  const eventsContext = accessibleEvents.map(e => {
    const dish: Partial<DishSelection> = e.dish || {};
    return {
      id: e.id,
      titulo: e.title,
      local: e.localName,
      localId: e.localId,
      inicio: e.startDate,
      fin: e.endDate,
      estado: e.status,
      platosContratados: dish.platosContratados || dish.cantidadPlatos || 0,
      platosConfirmados: dish.platosConfirmados || 0,
      platosServidos: dish.platosServidos || 0,
      platosEfectivos: dish.platosServidos || dish.platosConfirmados || dish.platosContratados || dish.cantidadPlatos || 0,
      menu: {
        proteina: dish.proteina || 'Sin definir',
        salsa: dish.salsa || 'Sin definir',
        carbohidrato: dish.carbohidrato || 'Sin definir',
        guarnicion: dish.guarnicion || 'Sin definir',
        ensalada: dish.ensalada || 'Sin definir',
        servilletas: dish.servilletas || (dish.servilleta ? [dish.servilleta] : ['Por confirmar']),
      },
      notas: e.notes || e.description || '',
    };
  });

  const todayIso = new Date().toISOString().split('T')[0];

  const systemInstruction = `
Eres "Kevin AI", el asistente inteligente oficial del sistema de gestión de Catering.
Tu misión es asistir al equipo (administradores, dueños de locales, cocineros y mozos) respondiendo preguntas sobre la programación del calendario, menús, horarios, cantidades de platos servidos y estadísticas de eventos.

INFORMACIÓN DEL USUARIO ACTUAL:
- Nombre: "${userName}"
- Rol: "${userRole}"
- Fecha actual del sistema: ${todayIso}

REGLAS DE SEGURIDAD Y PRIVACIDAD MULTI-INQUILINO:
1. Solo tienes acceso a los eventos listados en el bloque de CONTEXTO. No inventes eventos ni asumas que existen si no están en la lista.
2. POLÍTICA DE CREACIÓN / MODIFICACIÓN DE EVENTOS:
   - Solo el rol "admin" puede crear o modificar eventos.
   - Si el rol actual NO es "admin" y pide crear, reprogramar, editar o borrar eventos, responde EXACTAMENTE:
     "Lo siento, solo el Administrador tiene autorización para crear o modificar eventos en el sistema. Por favor comunícate con Kevin para programarlo."
   - Si el rol ES "admin" y solicita crear un evento, extrae la información y confirma los detalles en tu respuesta.

CONTEXTO DE EVENTOS DISPONIBLES EN BASE DE DATOS:
${JSON.stringify(eventsContext, null, 2)}

INSTRUCCIONES DE FORMATO DE RESPUESTA:
- Debes responder OBLIGATORIAMENTE en formato JSON con la siguiente estructura:
{
  "answer": "Texto de la respuesta en español claro y conciso, usando formato Markdown para resaltar fechas, locales o platos en negrita.",
  "chart": null, // O un objeto de gráfica si el usuario preguntó por cantidades, comparativas de días o totales
  "cards": null // O un objeto con las tarjetas estructuradas de los eventos
}

CUÁNDO GENERAR EL OBJETO "chart":
- Si el usuario solicita cantidades de platos, estadísticas o comparaciones entre fechas (ej: "dame las cantidades de los días 12 y 14 de octubre", "cuántos platos se sirvieron", "gráfica comparativa"), genera el objeto "chart" con este formato:
{
  "type": "bar",
  "title": "Título descriptivo del gráfico",
  "subtitle": "Subtítulo de rango o local",
  "unit": "platos",
  "data": [
    { "label": "Nombre/Fecha", "value": 450, "secondaryLabel": "Local" }
  ]
}

CUÁNDO GENERAR EL OBJETO "cards":
- Si el usuario pide ver eventos de una fecha o rango (ej: "¿Qué eventos tengo para el 3 de octubre?", "¿Qué hay para el 1 de octubre?"), O SI EL USUARIO PIDE EXPLÍCITAMENTE "cards", "tarjetas", "imagen", "como la imagen", "ficha de cocina", "resumen visual", DEBES OBLIGATORIAMENTE generar el objeto "cards" con los eventos correspondientes estructurados así:
{
  "dateTitle": "Sábado, 3 de Octubre de 2026", // Día de la semana y fecha legible
  "subtitle": "1 evento programado", // Conteo de eventos en texto
  "cards": [
    {
      "title": "Evento en CRISTALES",
      "localName": "CRISTALES",
      "timeString": "09:00 a. m.",
      "proteina": "Pollo Enrollado",
      "salsa": "Salsa de Maracuyá",
      "carbohidrato": "Arroz Árabe",
      "guarnicion": "Puré de papas",
      "ensalada": "Ensalada Rusa",
      "servilletas": ["Amarillo"],
      "platosContratados": 208,
      "platosConfirmados": 250,
      "platosServidos": 321,
      "notes": "Notas del evento"
    }
  ]
}
- Si no hay eventos para la fecha o local solicitado, "cards" debe ser null, e indícalo claramente con amabilidad.
`;

  try {
    const parts: any[] = [];

    if (prompt && prompt.trim()) {
      parts.push({ text: prompt.trim() });
    }

    if (audioBase64) {
      parts.push({
        inlineData: {
          mimeType: audioMimeType || 'audio/webm',
          data: audioBase64
        }
      });
    }

    if (imageBase64) {
      parts.push({
        inlineData: {
          mimeType: imageMimeType || 'image/jpeg',
          data: imageBase64
        }
      });
    }

    if (parts.length === 0) {
      return { answer: 'Por favor envía un mensaje de texto, nota de voz o imagen para consultar.' };
    }

    const payload = {
      systemInstruction: {
        parts: [{ text: systemInstruction }]
      },
      contents: [
        {
          role: 'user',
          parts
        }
      ],
      generationConfig: {
        responseMimeType: 'application/json',
      }
    };

    let rawText = '';
    let lastError: any = null;
    const modelCandidates = ['gemini-3.5-flash', 'gemini-3.5-flash-lite', 'gemini-3.8-flash'];

    for (const modelName of modelCandidates) {
      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
          const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });

          if (res.ok) {
            const json: any = await res.json();
            rawText = json?.candidates?.[0]?.content?.parts?.[0]?.text || '';
            if (rawText) break;
          } else {
            const errData: any = await res.json().catch(() => ({}));
            lastError = errData?.error || new Error(`HTTP ${res.status}`);
            if ((res.status === 503 || res.status === 429) && attempt < 2) {
              await new Promise(r => setTimeout(r, 800));
              continue;
            }
            break;
          }
        } catch (e: any) {
          lastError = e;
          if (attempt < 2) {
            await new Promise(r => setTimeout(r, 800));
            continue;
          }
          break;
        }
      }
      if (rawText) break;
    }

    if (!rawText) {
      throw lastError || new Error('No se pudo obtener respuesta de ningún modelo de IA');
    }

    let parsed: any = {};
    try {
      parsed = JSON.parse(rawText);
    } catch {
      parsed = { answer: rawText, chart: null };
    }

    return {
      answer: parsed.answer || 'No pude procesar la respuesta adecuadamente.',
      chart: parsed.chart || null,
      cards: parsed.cards || null,
    };
  } catch (err: any) {
    console.error('Error llamando a Gemini RAG:', err);
    return {
      answer: 'Hubo un inconveniente al conectar con el asistente de IA. Por favor intenta nuevamente en unos momentos.',
      error: err.message || String(err)
    };
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Manejo de CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Solo permitir solicitudes POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido. Se requiere POST.' });
  }

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch {
        body = {};
      }
    }
    const { prompt, audioBase64, audioMimeType, imageBase64, imageMimeType, session, events } = body || {};

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
            return res.status(200).json({
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

    // 2. Procesar la consulta con Gemini
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
        await sb.rpc('log_rag_query', {
          p_user_id: userId,
          p_user_name: userName,
          p_user_role: userRole,
          p_prompt: prompt || (audioBase64 ? '[Audio de voz]' : '[Imagen adjunta]'),
          p_response: result.answer,
          p_has_chart: Boolean(result.chart),
          p_chart_data: result.chart || null
        });
      } catch (logErr) {
        console.warn('Advertencia registrando log de auditoría:', logErr);
      }
    }

    return res.status(200).json({
      answer: result.answer,
      chart: result.chart || null,
      cards: result.cards || null,
      remainingQuota: userRole === 'admin' ? 999999 : Math.max(0, remainingQuota),
      error: result.error
    });
  } catch (error: any) {
    console.error('Error en endpoint /api/rag:', error);
    return res.status(200).json({
      answer: 'Ocurrió un error en el servidor al procesar la solicitud. Por favor intenta nuevamente.',
      error: error.message || String(error)
    });
  }
}
