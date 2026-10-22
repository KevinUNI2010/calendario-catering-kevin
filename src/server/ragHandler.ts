import { CalendarEvent, UserSession, RagChartData, DishSelection } from '../types';

export interface RagRequestParams {
  prompt?: string;
  audioBase64?: string;
  audioMimeType?: string;
  imageBase64?: string;
  imageMimeType?: string;
  session: UserSession;
  events: CalendarEvent[];
}

export interface RagResponseResult {
  answer: string;
  chart?: RagChartData | null;
  remainingQuota?: number;
  createdEvent?: CalendarEvent | null;
  error?: string;
}

export async function processRagQuery(params: RagRequestParams): Promise<RagResponseResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return {
      answer: 'Lo siento, la clave de API de Gemini no está configurada en las variables de entorno.',
      error: 'GEMINI_API_KEY_MISSING'
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

  // 2. Resumir los eventos en un formato de contexto conciso para el LLM
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
Eres "Kevin AI", el Asistente Inteligente oficial del sistema de eventos y catering "Catering Kevin".
Tu misión es asistir de forma rápida, precisa, ejecutiva y amigable en la gestión de eventos, turnos, menús de cocina y conteos de platos.
Hoy es: ${todayIso}.

REGLAS DE SEGURIDAD Y PERMISOS ESTRICTAS:
1. ROL DEL USUARIO ACTUAL: "${userRole}".
2. LOCALES PERMITIDOS DEL USUARIO: ${userRole === 'admin' ? 'TODOS LOS LOCALES (ADMINISTRADOR TOTAL)' : JSON.stringify(allowedLocales)}.
3. Si el usuario NO es administrador (${userRole !== 'admin'}) y pregunta sobre un local ajeno a sus locales permitidos, responde de manera cortés pero firme que no tiene autorización para acceder a información de locales ajenos.
4. CREACIÓN / EDICIÓN / ELIMINACIÓN DE EVENTOS:
   - Solo el rol "admin" puede crear o modificar eventos.
   - Si el rol actual NO es "admin" y pide crear, reprogramar, editar o borrar eventos, responde:
     "Lo siento, solo el Administrador tiene autorización para crear o modificar eventos en el sistema. Por favor comunícate con Kevin para programarlo."
   - Si el rol ES "admin" y solicita crear un evento, extrae la información y confirma los detalles en tu respuesta.

CONTEXTO DE EVENTOS DISPONIBLES EN BASE DE DATOS:
${JSON.stringify(eventsContext, null, 2)}

INSTRUCCIONES DE FORMATO DE RESPUESTA:
- Debes responder OBLIGATORIAMENTE en formato JSON con la siguiente estructura:
{
  "answer": "Texto de la respuesta en español claro y conciso, usando formato Markdown para resaltar fechas, locales o platos en negrita.",
  "chart": null // O un objeto de gráfica si el usuario preguntó por cantidades, comparativas de días o totales
}

CUÁNDO GENERAR EL OBJETO "chart":
- Si el usuario solicita cantidades de platos, estadísticas o comparaciones entre fechas (ej: "dame las cantidades de los días 12 y 14 de octubre", "cuántos platos se sirvieron esta semana", "comparativa de platos por día"), genera el objeto "chart" con este formato:
{
  "type": "bar",
  "title": "Título descriptivo del gráfico (ej: Platos Servidos - Aryes)",
  "subtitle": "Subtítulo opcional de rango o local",
  "unit": "platos",
  "data": [
    { "label": "12 Oct", "value": 450, "secondaryLabel": "Aryes" },
    { "label": "14 Oct", "value": 520, "secondaryLabel": "Aryes" }
  ]
}
- Si la pregunta es solo informativa o descriptiva (ej: "¿Qué eventos tengo para el 30 de octubre?"), "chart" debe ser null, y "answer" debe detallar cada evento con su hora, local, menú y notas.
- Si no hay eventos para la fecha o local solicitado, indícalo claramente con amabilidad.
`;

  try {
    const parts: any[] = [];

    // Prompt en texto
    if (prompt && prompt.trim()) {
      parts.push({ text: prompt.trim() });
    }

    // Audio de voz
    if (audioBase64) {
      parts.push({
        inlineData: {
          mimeType: audioMimeType || 'audio/webm',
          data: audioBase64
        }
      });
    }

    // Imagen adjunta (comanda, libreta o foto)
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
    };
  } catch (err: any) {
    console.error('Error llamando a Gemini RAG:', err);
    return {
      answer: 'Hubo un inconveniente al conectar con el asistente de IA. Por favor intenta nuevamente en unos momentos.',
      error: err.message || String(err)
    };
  }
}
