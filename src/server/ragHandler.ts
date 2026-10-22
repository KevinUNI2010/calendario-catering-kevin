import { CalendarEvent, UserSession, RagChartData, RagCardsContainer, DishSelection } from '../types';

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
  cards?: RagCardsContainer | null;
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
    const contratados = dish.platosContratados || dish.cantidadPlatos || 0;
    const confirmados = dish.platosConfirmados || 0;
    const servidos = dish.platosServidos || 0;
    const rawServilletas = dish.servilletas || (dish.servilleta ? [dish.servilleta] : ['Por confirmar']);
    const cleanServilletas = rawServilletas.map(s => s.split('|')[0].trim());

    return {
      id: e.id,
      titulo: e.title,
      local: e.localName,
      localId: e.localId,
      inicio: e.startDate,
      fin: e.endDate,
      estado: e.status,
      platosContratados: contratados,
      platosConfirmadosCocina: confirmados,
      platosServidosSala: servidos,
      platosEfectivos: confirmados > 0 ? confirmados : (contratados > 0 ? contratados : 0),
      estadoConfirmacionPlatos: contratados === 0 && confirmados === 0
        ? 'SIN_PLATOS (No tiene cantidad de platos ingresada aún)'
        : confirmados > 0
          ? `CONFIRMADO_COCINA (${confirmados} platos confirmados)`
          : `CONTRATADO_BASE (${contratados} platos pactados en contrato; pendiente de reajuste final de cocina)`,
      menu: {
        proteina: dish.proteina || 'Sin definir',
        salsa: dish.salsa || 'Sin definir',
        carbohidrato: dish.carbohidrato || 'Sin definir',
        guarnicion: dish.guarnicion || 'Sin definir',
        ensalada: dish.ensalada || 'Sin definir',
        servilletas: cleanServilletas,
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

REGLAS VITALES SOBRE PLATOS Y CONFIRMACIÓN:
1. "platosContratados" representa los platos formalmente pactados en el contrato. Por ejemplo, si en ARYES hay 469 platos contratados, ¡ESE LOCAL SÍ TIENE 469 PLATOS ASIGNADOS!
2. NUNCA digas: "ningún local ha confirmado aún la cantidad de platos" o "ningún local tiene platos" si existen platosContratados > 0.
3. Si el usuario pregunta "¿qué locales falta confirmar platos?" o "¿a qué locales les falta confirmar la cantidad de platos?":
   - Explica con precisión:
     * Menciona los locales que ya cuentan con cantidad de platos contratados (ej: "En **ARYES** ya se tienen **469 platos contratados** base, pero está pendiente el reajuste final previo para cocina").
     * Si algún evento tiene 0 contratados y 0 confirmados, indícalo como "Pendiente de ingresar cantidad de platos".
     * Si un local ya tiene platosConfirmadosCocina > 0, indícalo como confirmado para cocina.
   - Al generar tarjetas (cards), pon siempre el número de platosContratados (ej: 469) y en el subtítulo un texto claro como "Eventos del día y estado de platos".

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
