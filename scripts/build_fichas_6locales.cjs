const { createClient } = require('@supabase/supabase-js');
const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');

const envFile = fs.readFileSync(path.join(ROOT_DIR, '.env'), 'utf-8');
const env = {};
envFile.split('\n').forEach(line => {
  const [k, ...v] = line.split('=');
  if (k && v.length) env[k.trim()] = v.join('=').trim().replace(/^['"]|['"]$/g, '');
});

const sb = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

const LOCAL_COLORS = {
  'VILLA SANTIAGO': '#ED1C24',
  'CRISTALES': '#0072BC',
  'GLADIOLOS': '#4FB3F6',
  'ESTELAR': '#8E44AD',
  'ARYES': '#00A651',
  'PEDREGAL': '#F39C12',
};

const DEFAULT_COLOR = '#0284C7';

function getLocalColor(name) {
  if (!name) return DEFAULT_COLOR;
  const upper = name.toUpperCase().trim();
  for (const [k, v] of Object.entries(LOCAL_COLORS)) {
    if (upper.includes(k)) return v;
  }
  return DEFAULT_COLOR;
}

const DAYS_OF_WEEK = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

function formatLongDate(dateStr) {
  // dateStr: YYYY-MM-DD
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  const dayName = DAYS_OF_WEEK[date.getDay()];
  const monthName = MONTHS[m - 1];
  return `${dayName}, ${d} de ${monthName}`;
}

function formatShortDate(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return `${d} Nov`;
}

function renderTimeBadge(dateIso, isTimePending) {
  const isInvalid = Boolean(isTimePending || !dateIso || dateIso.length < 16);
  if (isInvalid) {
    return `
      <span class="badge-time-writebox" title="Escribir hora">
        <span class="time-icon">🕒</span>
        <span class="write-box write-box-time"></span>
      </span>
    `;
  }
  const timePart = dateIso.substring(11, 16);
  let [h, min] = timePart.split(':').map(Number);
  if (isNaN(h)) {
    return `
      <span class="badge-time-writebox" title="Escribir hora">
        <span class="time-icon">🕒</span>
        <span class="write-box write-box-time"></span>
      </span>
    `;
  }
  const ampm = h >= 12 ? 'p. m.' : 'a. m.';
  h = h % 12;
  h = h ? h : 12;
  const minStr = min < 10 ? `0${min}` : min;
  return `<span class="badge-time">🕒 ${h}:${minStr} ${ampm}</span>`;
}

// SVGs for the 4 menu categories
const ICONS = {
  salsa: `<svg width="15" height="15" viewBox="0 0 32 32" fill="none"><path d="M5 13C5 20.1797 10.3726 25 17 25C23.6274 25 29 20.1797 29 13H5Z" fill="currentColor" fill-opacity="0.18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M12 25L10 27H24L22 25" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M6 13C9 14.5 13 14.5 17 13C21 11.5 25 13 28 13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M20 15L25 5C25.3 4.4 26 4.1 26.6 4.4C27.2 4.7 27.5 5.4 27.2 6L22.5 16" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  carbohidrato: `<svg width="15" height="15" viewBox="0 0 32 32" fill="none"><path d="M7 16C7 11.5 11 8 16 8C21 8 25 11.5 25 16H7Z" fill="currentColor" fill-opacity="0.18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M13 11C14 11 14.5 12 14.5 12M18 10.5C18.5 11.2 18 12 18 12M10.5 13.5C11.2 13.5 11.5 14 11.5 14M21 13.5C21.5 14 21 14.5 21 14.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M6 16C6 22 10.5 25 16 25C21.5 25 26 22 26 16H6Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M11 25L10 27H22L21 25" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  guarnicion: `<svg width="15" height="15" viewBox="0 0 32 32" fill="none"><path d="M16 4C14 7 13 9 14 11C12 8 10 9 11 12C9 9 7 11 9 13C12 13 15 13 16 13C17 13 20 13 23 13C25 11 23 9 21 12C22 9 20 8 18 11C19 9 18 7 16 4Z" fill="currentColor" fill-opacity="0.18" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/><ellipse cx="16" cy="21" rx="7.5" ry="9" fill="currentColor" fill-opacity="0.14" stroke="currentColor" stroke-width="2"/><path d="M11 17L21 25M21 17L11 25M16 13V29" stroke="currentColor" stroke-width="1.25" stroke-linecap="round"/></svg>`,
  ensalada: `<svg width="15" height="15" viewBox="0 0 32 32" fill="none"><path d="M6 16C6 21.5228 10.4772 26 16 26C21.5228 26 26 21.5228 26 16H6Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M11 26L10 28H22L21 26" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M10 16C9 13 10.5 10 13.5 10C15 10 16 11 16 12C16 11 17 10 18.5 10C21.5 10 23 13 22 16" fill="currentColor" fill-opacity="0.18" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"/><circle cx="16" cy="14" r="1.5" fill="currentColor"/></svg>`
};

function renderServilletas(dish) {
  const servs = [];
  if (Array.isArray(dish?.servilletas) && dish.servilletas.length > 0) {
    dish.servilletas.forEach(s => {
      if (typeof s === 'string') {
        const [name, color] = s.split('|');
        const cleanName = (name || '').trim();
        if (cleanName && cleanName !== '?' && !cleanName.includes('❓') && cleanName.toLowerCase() !== 'por confirmar') {
          servs.push({ name: cleanName, color: color || '#64748b' });
        }
      }
    });
  } else if (dish?.servilleta && typeof dish.servilleta === 'string' && dish.servilleta.trim()) {
    const [name, color] = dish.servilleta.split('|');
    const cleanName = (name || '').trim();
    if (cleanName && cleanName !== '?' && !cleanName.includes('❓') && cleanName.toLowerCase() !== 'por confirmar') {
      servs.push({ name: cleanName, color: color || '#64748b' });
    }
  }

  if (servs.length === 0) {
    // Cuadrado / casilla en blanco para escribir después a mano
    return `<span class="write-box write-box-servilleta" title="Escribir color de servilleta"></span>`;
  }

  return servs.map(s => `
    <span class="serv-val">
      <span class="dot" style="background-color: ${s.color};"></span>
      ${s.name}
    </span>
  `).join(' ');
}

function renderPlatesBox(dish) {
  if (!dish) return '';
  const contrForm = dish.platosContratadosFormula;
  const contrNum = dish.platosContratados || (contrForm && !isNaN(Number(contrForm)) ? Number(contrForm) : dish.cantidadPlatos);
  let displayContr = '';
  if (contrForm) {
    const clean = contrForm.trim().toLowerCase();
    if (clean.includes('=') || !/[x*×·+]/.test(clean)) {
      displayContr = clean;
    } else {
      displayContr = `${clean} = ${contrNum}`;
    }
  } else if (contrNum) {
    displayContr = String(contrNum);
  }

  const pedForm = dish.platosConfirmadosFormula;
  const pedNum = dish.platosConfirmados;
  let displayPed = '';
  if (pedForm) {
    const clean = pedForm.trim().toLowerCase();
    if (clean.includes('=') || !/[x*×·+]/.test(clean)) {
      displayPed = clean;
    } else {
      displayPed = `${clean} = ${pedNum}`;
    }
  } else if (pedNum) {
    displayPed = String(pedNum);
  }

  const servForm = dish.platosServidosFormula;
  const servNum = dish.platosServidos;
  let displayServ = '';
  if (servForm) {
    const clean = servForm.trim().toLowerCase();
    if (clean.includes('=') || !/[x*×·+]/.test(clean)) {
      displayServ = clean;
    } else {
      displayServ = `${clean} = ${servNum}`;
    }
  } else if (servNum) {
    displayServ = String(servNum);
  }

  if (!displayContr && !displayPed && !displayServ) return '';

  return `
    <div class="plates-box">
      <span class="plates-title">N.º DE PLATOS</span>
      <div class="plates-list">
        ${displayContr ? `<span class="plate-deg">Degustación: ${displayContr}</span>` : ''}
        ${displayPed ? `<span class="plate-ped">Pedidos: ${displayPed}</span>` : ''}
        ${displayServ ? `<span class="plate-serv">Servidos: ${displayServ}</span>` : ''}
      </div>
    </div>
  `;
}

function isPendingOrEmpty(val) {
  if (val === undefined || val === null) return true;
  const str = String(val).trim();
  if (!str) return true;
  const lower = str.toLowerCase();
  if (
    lower === '?' ||
    lower === 'por confirmar' ||
    lower === 'por definir' ||
    lower === 'pendiente' ||
    lower === 'sin asignar' ||
    lower === 'none' ||
    lower === 'null' ||
    lower === 'proteína por confirmar' ||
    lower === 'proteina por confirmar' ||
    lower.includes('por confirmar') ||
    lower.includes('por definir') ||
    lower.startsWith('sin salsa') ||
    lower.startsWith('sin carbohidrato') ||
    lower.startsWith('sin guarnici') ||
    lower.startsWith('sin ensalada')
  ) {
    return true;
  }
  return false;
}

function renderCard(event, dateStr) {
  const localColor = getLocalColor(event.local_name);
  const dish = event.dish || (event.menu_items && event.menu_items[0]) || {};
  const isTimePending = Boolean(dish.isTimePending || event.isTimePending);
  const timeBadge = renderTimeBadge(event.start_date, isTimePending);
  const shortDate = formatShortDate(dateStr);

  const isProteinBlank = isPendingOrEmpty(dish.proteina);
  const proteinText = isProteinBlank ? '' : dish.proteina.toUpperCase().trim();

  const isSalsaBlank = isPendingOrEmpty(dish.salsa);
  const isCarbBlank = isPendingOrEmpty(dish.carbohidrato);
  const isGuarnBlank = isPendingOrEmpty(dish.guarnicion);
  const isEnsaladaBlank = isPendingOrEmpty(dish.ensalada);

  return `
    <div class="card" style="--local-color: ${localColor};">
      <!-- Formas orgánicas / Blobs de fondo con color dinámico -->
      <svg class="blob-tl" viewBox="0 0 200 200" fill="none">
        <path d="M45.7,-78.3C58.9,-71.1,69.1,-58.5,76.5,-44.6C83.9,-30.7,88.5,-15.3,87.7,-0.5C86.8,14.4,80.5,28.8,72.4,41.9C64.3,55,54.4,66.8,41.9,74.5C29.4,82.2,14.7,85.8,-0.1,86C-14.9,86.2,-29.8,83,-43.3,75.7C-56.8,68.4,-68.9,57,-76.7,43.2C-84.5,29.4,-88,14.7,-86.6,0.8C-85.2,-13.1,-78.9,-26.2,-70.7,-38.7C-62.5,-51.2,-52.4,-63.1,-39.8,-70.6C-27.2,-78.1,-13.6,-81.2,0.8,-82.6C15.2,-84,32.5,-85.5,45.7,-78.3Z" transform="translate(100 100)" fill="${localColor}" fill-opacity="0.13" />
      </svg>
      <svg class="blob-br" viewBox="0 0 200 200" fill="none">
        <path d="M42.7,-72.8C55.2,-66.4,65.2,-54.6,72.8,-41.3C80.4,-28,85.6,-14,84.9,-0.4C84.2,13.2,77.6,26.4,69.5,38.6C61.4,50.8,51.8,62,39.8,69.7C27.8,77.4,13.9,81.6,-0.5,82.4C-14.9,83.3,-29.8,80.8,-42.6,73.5C-55.4,66.2,-66.1,54.1,-73.4,40.5C-80.7,26.9,-84.6,13.5,-83.4,0.7C-82.2,-12.1,-75.9,-24.2,-67.7,-34.9C-59.5,-45.6,-49.4,-54.9,-37.9,-61.8C-26.4,-68.7,-13.2,-73.2,0.7,-74.4C14.6,-75.6,30.2,-79.2,42.7,-72.8Z" transform="translate(100 100)" fill="${localColor}" fill-opacity="0.10" />
      </svg>

      <div class="card-inner">
        <!-- 1. Cabecera: Local badge + Fecha corta + Hora -->
        <div class="card-header">
          <span class="badge-local" style="background-color: ${localColor}20; color: ${localColor}; border: 1.5px solid ${localColor}55;">
            ${(event.local_name || 'LOCAL GENERAL').toUpperCase()}
          </span>
          <div class="card-header-right">
            <span class="badge-date-pill">${shortDate}</span>
            ${timeBadge}
          </div>
        </div>

        <!-- 2. Título de Evento -->
        <div class="event-title">
          ${event.title || 'Evento'}
        </div>

        <!-- 3. Recuadro Proteína Principal (En blanco limpio si está por confirmar) -->
        <div class="protein-box ${isProteinBlank ? 'is-blank' : ''}">
          <span class="protein-text">${proteinText || '&nbsp;'}</span>
        </div>

        <!-- 4. Menú de 4 platos con íconos ilustrados (En blanco limpio si está por confirmar) -->
        <div class="menu-list">
          <div class="menu-item">
            <div class="icon-avatar" style="background-color: ${localColor}18; border: 1px solid ${localColor}30; color: ${localColor};">
              ${ICONS.salsa}
            </div>
            <span class="item-name ${isSalsaBlank ? 'is-blank' : ''}">${isSalsaBlank ? '&nbsp;' : dish.salsa}</span>
          </div>
          <div class="menu-item">
            <div class="icon-avatar" style="background-color: ${localColor}18; border: 1px solid ${localColor}30; color: ${localColor};">
              ${ICONS.carbohidrato}
            </div>
            <span class="item-name ${isCarbBlank ? 'is-blank' : ''}">${isCarbBlank ? '&nbsp;' : dish.carbohidrato}</span>
          </div>
          <div class="menu-item">
            <div class="icon-avatar" style="background-color: ${localColor}18; border: 1px solid ${localColor}30; color: ${localColor};">
              ${ICONS.guarnicion}
            </div>
            <span class="item-name ${isGuarnBlank ? 'is-blank' : ''}">${isGuarnBlank ? '&nbsp;' : dish.guarnicion}</span>
          </div>
          <div class="menu-item">
            <div class="icon-avatar" style="background-color: ${localColor}18; border: 1px solid ${localColor}30; color: ${localColor};">
              ${ICONS.ensalada}
            </div>
            <span class="item-name ${isEnsaladaBlank ? 'is-blank' : ''}">${isEnsaladaBlank ? '&nbsp;' : dish.ensalada}</span>
          </div>
        </div>

        <!-- 5. Pie de Tarjeta: Servilleta al costado + N.º DE PLATOS -->
        <div class="card-footer">
          <div class="servilleta-box">
            <span class="serv-label">Servilleta:</span>
            ${renderServilletas(dish)}
          </div>
          ${renderPlatesBox(dish)}
        </div>
      </div>
    </div>
  `;
}

function renderEmptySlot() {
  return `<div class="empty-slot"></div>`;
}

async function buildAll() {
  console.log('1. Conectando a Supabase para descargar eventos actualizados del 20 al 30 de Noviembre...');
  const { data: events, error } = await sb
    .from('events')
    .select('*')
    .gte('start_date', '2026-11-20T00:00:00')
    .lte('start_date', '2026-11-30T23:59:59')
    .order('start_date', { ascending: true });

  if (error) {
    console.error('Error fetching events:', error);
    process.exit(1);
  }

  console.log(`Eventos recuperados: ${events.length}`);

  const byDate = {};
  for (let day = 20; day <= 30; day++) {
    const dateStr = `2026-11-${day}`;
    byDate[dateStr] = [];
  }

  for (const ev of events) {
    const d = ev.start_date.substring(0, 10);
    if (byDate[d]) {
      byDate[d].push(ev);
    }
  }

  const dateKeys = Object.keys(byDate).sort();
  const totalPages = dateKeys.length;

  console.log('2. Generando HTML con cuadrícula de 6 recuadros por página (calce exacto A4)...');

  let pagesHtml = '';
  let pillsHtml = '';

  dateKeys.forEach((dateStr, idx) => {
    const pageNum = idx + 1;
    const dayEvents = byDate[dateStr];
    const eventCount = dayEvents.length;
    const longDate = formatLongDate(dateStr);
    const shortDay = dateStr.substring(8, 10);

    pillsHtml += `<a href="#page-${dateStr}" class="day-pill-btn ${eventCount > 0 ? 'has-events' : ''}">📅 ${shortDay} Nov (${eventCount})</a>`;

    // Exactamente 6 recuadros por página
    let cardsHtml = '';
    dayEvents.slice(0, 6).forEach(ev => {
      cardsHtml += renderCard(ev, dateStr);
    });

    const emptyCount = Math.max(0, 6 - dayEvents.length);
    for (let i = 0; i < emptyCount; i++) {
      cardsHtml += renderEmptySlot();
    }

    pagesHtml += `
      <div class="a4-wrapper" id="page-${dateStr}">
        <div class="a4-page">
          <!-- CABECERA DE LA PÁGINA IMPRIMIBLE CON LA FECHA -->
          <div class="sheet-header">
            <div class="sheet-header-left">
              <span class="sheet-cal-icon">📅</span>
              <span class="sheet-date-text">${longDate}</span>
              <span class="sheet-count-tag">${eventCount} ${eventCount === 1 ? 'evento' : 'eventos'}</span>
            </div>
          </div>

          <!-- CUADRÍCULA DE 6 RECUADROS (2 COLUMNAS X 3 FILAS) -->
          <div class="cards-grid">
            ${cardsHtml}
          </div>
        </div>
      </div>
    `;
  });

  const fullHtml = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Fichas de Cocina A4 - 20 al 30 de Noviembre (6 por Hoja)</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;600;700;800;900&display=swap" rel="stylesheet">
  <style>
    @page {
      size: 210mm 297mm;
      margin: 0;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    html, body {
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: #f1f5f9;
      color: #0f172a;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
      width: 210mm;
      margin: 0 auto;
      padding: 0;
    }

    /* BARRA SUPERIOR DE ACCIONES (NO SE IMPRIME) */
    .no-print {
      width: 210mm;
      margin: 16px auto 20px;
      padding: 14px 20px;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.06);
      display: flex;
      flex-direction: column;
      gap: 12px;
      box-sizing: border-box;
    }

    .no-print-row {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
    }

    .no-print-info h1 {
      font-size: 16px;
      font-weight: 800;
      color: #0f172a;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .no-print-info p {
      font-size: 12px;
      color: #64748b;
      margin-top: 3px;
    }

    .controls-group {
      display: flex;
      align-items: center;
      gap: 6px;
      flex-wrap: wrap;
    }

    .day-pill-btn {
      background: #ffffff;
      border: 1px solid #cbd5e1;
      padding: 4px 10px;
      border-radius: 8px;
      font-size: 11px;
      font-weight: 700;
      color: #334155;
      text-decoration: none;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 4px;
      transition: all 0.15s ease;
      font-family: inherit;
    }

    .day-pill-btn:hover {
      background: #e2e8f0;
      color: #0f172a;
    }

    .day-pill-btn.has-events {
      background: #e0f2fe;
      border-color: #7dd3fc;
      color: #0369a1;
      font-weight: 800;
    }

    .btn-print {
      background: #059669;
      color: #ffffff;
      border: none;
      padding: 8px 20px;
      font-size: 12.5px;
      font-weight: 800;
      border-radius: 9px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-family: inherit;
      box-shadow: 0 2px 8px rgba(5,150,105,0.25);
      transition: all 0.15s ease;
    }

    .btn-print:hover {
      background: #047857;
    }

    /* CONTENEDOR DE CADA HOJA A4 FÍSICA */
    .a4-wrapper {
      width: 210mm;
      height: 297mm;
      max-height: 297mm;
      margin: 0 auto 28px;
      display: flex;
      justify-content: center;
      box-sizing: border-box;
      page-break-after: always;
      break-after: page;
      page-break-inside: avoid;
      break-inside: avoid;
    }

    .a4-wrapper:last-child {
      page-break-after: avoid;
      break-after: avoid;
      margin-bottom: 0;
    }

    .a4-page {
      width: 210mm;
      height: 297mm;
      max-height: 297mm;
      background: #ffffff;
      padding: 6mm 7mm 6mm 7mm;
      box-shadow: 0 8px 30px rgba(0,0,0,0.12);
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      overflow: hidden;
      box-sizing: border-box;
      position: relative;
    }

    @media print {
      html, body {
        width: 210mm !important;
        height: 297mm !important;
        margin: 0 !important;
        padding: 0 !important;
        background: #ffffff !important;
      }
      .no-print {
        display: none !important;
      }
      .a4-wrapper {
        width: 210mm !important;
        height: 297mm !important;
        max-height: 297mm !important;
        margin: 0 !important;
        padding: 0 !important;
        box-shadow: none !important;
        page-break-after: always !important;
        break-after: page !important;
        page-break-inside: avoid !important;
        break-inside: avoid !important;
        display: block !important;
        box-sizing: border-box !important;
      }
      .a4-wrapper:last-child {
        page-break-after: avoid !important;
        break-after: avoid !important;
      }
      .a4-page {
        width: 210mm !important;
        height: 297mm !important;
        max-height: 297mm !important;
        padding: 6mm 7mm 6mm 7mm !important;
        box-shadow: none !important;
        page-break-inside: avoid !important;
        break-inside: avoid !important;
        box-sizing: border-box !important;
        display: flex !important;
        flex-direction: column !important;
        justify-content: space-between !important;
      }
    }

    /* CABECERA DE LA HOJA IMPRIMIBLE */
    .sheet-header {
      display: flex;
      align-items: center;
      justify-content: flex-start;
      padding-bottom: 3px;
      margin-bottom: 3mm;
      border-bottom: 1.5px solid #cbd5e1;
      height: 26px;
      flex-shrink: 0;
      box-sizing: border-box;
    }

    .sheet-header-left {
      display: flex;
      align-items: center;
      gap: 7px;
    }

    .sheet-cal-icon {
      font-size: 18px;
      line-height: 1;
    }

    .sheet-date-text {
      font-size: 16.5px;
      font-weight: 900;
      color: #0f172a;
      letter-spacing: -0.01em;
    }

    .sheet-count-tag {
      font-size: 12px;
      font-weight: 700;
      color: #475569;
      background: #f1f5f9;
      border: 1px solid #cbd5e1;
      padding: 2px 8px;
      border-radius: 9999px;
      margin-left: 4px;
    }

    /* CUADRÍCULA DE 2 COLUMNAS X 3 FILAS (6 RECUADROS - OCUPACIÓN 100% TOTAL A4) */
    .cards-grid {
      display: grid !important;
      grid-template-columns: repeat(2, 1fr) !important;
      grid-template-rows: repeat(3, 1fr) !important;
      gap: 4.5mm !important;
      flex: 1 !important;
      width: 100% !important;
      height: calc(297mm - 12mm - 26px - 3mm) !important;
      max-height: calc(297mm - 12mm - 26px - 3mm) !important;
      box-sizing: border-box !important;
    }

    /* TARJETA INDIVIDUAL (CALCE 100% EXACTO A4) */
    .card {
      position: relative;
      background: #ffffff;
      border: 1.5px solid #cbd5e1;
      border-radius: 14px;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 12px 14px 11px 14px;
      height: 100% !important;
      min-height: 87mm !important;
      box-sizing: border-box !important;
    }

    /* Blobs / Formas orgánicas de fondo con color dinámico */
    .blob-tl {
      position: absolute;
      top: -30px;
      left: -30px;
      width: 140px;
      height: 140px;
      pointer-events: none;
      z-index: 0;
    }

    .blob-br {
      position: absolute;
      bottom: -30px;
      right: -30px;
      width: 160px;
      height: 160px;
      pointer-events: none;
      z-index: 0;
    }

    .card-inner {
      position: relative;
      z-index: 1;
      display: flex;
      flex-direction: column;
      height: 100%;
      justify-content: space-between;
    }

    /* 1. Cabecera de la ficha */
    .card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 6px;
      margin-bottom: 2px;
    }

    .badge-local {
      display: inline-flex;
      align-items: center;
      padding: 3px 10px;
      border-radius: 9999px;
      font-size: 15px; /* bajado 1px (de 16px a 15px) */
      font-weight: 900;
      letter-spacing: 0.03em;
      text-transform: uppercase;
      white-space: nowrap;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    }

    .card-header-right {
      display: flex;
      align-items: center;
      gap: 5px;
    }

    .badge-date-pill {
      display: inline-flex;
      align-items: center;
      padding: 2.5px 9px;
      border-radius: 9999px;
      font-size: 13px;
      font-weight: 800;
      background-color: #f1f5f9;
      color: #475569;
      border: 1px solid #cbd5e1;
    }

    .badge-time {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 2.5px 9px;
      border-radius: 9999px;
      font-size: 13px;
      font-weight: 800;
      background-color: #e0f2fe;
      color: #0369a1;
      border: 1px solid #bae6fd;
    }

    .badge-time-writebox {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 2px 7px;
      border-radius: 9999px;
      font-size: 13px;
      font-weight: 800;
      background-color: #f8fafc;
      border: 1.2px solid #cbd5e1;
    }

    .badge-time-writebox .time-icon {
      font-size: 13px;
      line-height: 1;
    }

    /* CASILLAS / CUADRADOS EN BLANCO PARA ESCRIBIR A MANO */
    .write-box {
      display: inline-block;
      background: #ffffff;
      border: 1.5px solid #64748b;
      border-radius: 4px;
      box-sizing: border-box;
      vertical-align: middle;
    }

    .write-box-time {
      width: 56px;
      height: 20px;
    }

    .write-box-servilleta {
      width: 80px;
      height: 21px;
      margin-left: 2px;
    }

    /* 2. Título del evento */
    .event-title {
      font-size: 13px; /* bajado 1px (de 14px a 13px) */
      font-weight: 700;
      color: #475569;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      margin: 3px 0 8px 1px;
      line-height: 1.25;
    }

    /* 3. Recuadro de Proteína Principal */
    .protein-box {
      border: 1.8px solid var(--local-color, #2563eb);
      background: #eff6ff;
      border-radius: 9px;
      padding: 7px 10px;
      text-align: center;
      margin-bottom: 8px;
      min-height: 38px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-sizing: border-box;
    }

    .protein-box.is-blank {
      background: #ffffff; /* fondo blanco limpio para escribir a mano */
    }

    .protein-text {
      font-size: 15.5px;
      font-weight: 900;
      color: var(--local-color, #1e3a8a);
      letter-spacing: 0.03em;
      text-transform: uppercase;
      display: block;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      min-height: 19px;
      line-height: 1.2;
    }

    /* 4. Menú de 4 platos */
    .menu-list {
      display: flex;
      flex-direction: column;
      gap: 7px;
      border-top: 1.2px solid #f1f5f9;
      padding-top: 8px;
      margin-bottom: 6px;
    }

    .menu-item {
      display: flex;
      align-items: center;
      gap: 9px;
      font-size: 15px; /* aumentado 1px (de 14px a 15px) */
      font-weight: 750;
      color: #1e293b;
      line-height: 1.35;
      min-height: 26px;
    }

    .icon-avatar {
      width: 26px;
      height: 26px;
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .item-name {
      font-size: 15px; /* aumentado 1px */
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      flex: 1;
    }

    .item-name.is-blank {
      /* Espacio en blanco limpio para escribir a mano */
      display: inline-block;
      min-height: 18px;
    }

    /* 5. Pie de Tarjeta: Servilleta al costado + N.º DE PLATOS */
    .card-footer {
      display: flex;
      align-items: flex-end;
      justify-content: space-between;
      border-top: 1.2px solid #f1f5f9;
      padding-top: 7px;
      gap: 6px;
    }

    .servilleta-box {
      display: flex;
      align-items: center;
      gap: 5px;
      font-size: 13.5px;
    }

    .serv-label {
      color: #64748b;
      font-size: 12.5px;
      font-weight: 600;
    }

    .serv-val {
      font-weight: 800;
      color: #0f172a;
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 13.5px;
    }

    .dot {
      width: 9px;
      height: 9px;
      border-radius: 9999px;
      display: inline-block;
      border: 1px solid rgba(0,0,0,0.18);
    }

    .badge-pending {
      font-size: 12.5px;
      font-weight: 800;
      color: #b45309;
      background: #fef3c7;
      border: 1px solid #fde68a;
      padding: 2px 7px;
      border-radius: 5px;
    }

    .plates-box {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 2px;
    }

    .plates-title {
      font-size: 10.5px;
      font-weight: 800;
      color: #64748b;
      letter-spacing: 0.05em;
      text-transform: uppercase;
    }

    .plates-list {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 2px;
    }

    .plate-deg {
      font-size: 13.5px;
      font-weight: 800;
      color: #1d4ed8;
      background: #eff6ff;
      border: 1.2px solid #bfdbfe;
      padding: 2.5px 8px;
      border-radius: 5px;
      white-space: nowrap;
    }

    .plate-ped {
      font-size: 13.5px;
      font-weight: 900;
      color: #c2410c;
      background: #fff7ed;
      border: 1.2px solid #fed7aa;
      padding: 2.5px 8px;
      border-radius: 5px;
      white-space: nowrap;
    }

    .plate-serv {
      font-size: 12.5px;
      font-weight: 800;
      color: #047857;
      background: #ecfdf5;
      border: 1.2px solid #a7f3d0;
      padding: 2.5px 8px;
      border-radius: 5px;
      white-space: nowrap;
    }

    /* RECUADRO EN BLANCO (CALCE A4) */
    .empty-slot {
      border: 1.8px dashed #cbd5e1;
      border-radius: 14px;
      background: #ffffff;
      height: 100% !important;
      min-height: 87mm !important;
      box-sizing: border-box !important;
    }
  </style>
</head>
<body>

  <!-- BARRA DE ACCIONES (NO SE IMPRIME) -->
  <div class="no-print">
    <div class="no-print-row">
      <div class="no-print-info">
        <h1>
          <span>📋 Fichas de Cocina A4 (20 al 30 de Noviembre)</span>
        </h1>
        <p>${events.length} eventos distribuidos en 11 días. Cuadrícula de 6 recuadros por hoja (calce exacto A4 con mayor tamaño y legibilidad).</p>
      </div>
      <div class="controls-group">
        <button class="btn-print" onclick="window.print()">
          🖨️ Imprimir Todas las Hojas (PDF - 11 Págs)
        </button>
      </div>
    </div>

    <!-- ACCESO RÁPIDO A CADA DÍA -->
    <div class="no-print-row">
      <div class="controls-group">
        <span style="font-size: 11px; font-weight: 800; color: #475569;">Ir al día:</span>
        ${pillsHtml}
      </div>
    </div>
  </div>

  <!-- TODAS LAS HOJAS A4 DEL RANGO (20 AL 30 DE NOVIEMBRE) -->
  ${pagesHtml}

</body>
</html>`;

  // Write HTML files
  const htmlPathPlantillas = path.join(ROOT_DIR, 'plantillas_impresion', 'Fichas_Cocina_20_al_30_Noviembre.html');
  const htmlPathPublic = path.join(ROOT_DIR, 'public', 'fichas-cocina.html');
  const htmlPathPublicLong = path.join(ROOT_DIR, 'public', 'Fichas_Cocina_20_al_30_Noviembre.html');
  const htmlPathDist = path.join(ROOT_DIR, 'dist', 'fichas-cocina.html');
  const htmlPathDistLong = path.join(ROOT_DIR, 'dist', 'Fichas_Cocina_20_al_30_Noviembre.html');

  fs.writeFileSync(htmlPathPlantillas, fullHtml, 'utf-8');
  fs.writeFileSync(htmlPathPublic, fullHtml, 'utf-8');
  fs.writeFileSync(htmlPathPublicLong, fullHtml, 'utf-8');
  if (fs.existsSync(path.join(ROOT_DIR, 'dist'))) {
    fs.writeFileSync(htmlPathDist, fullHtml, 'utf-8');
    fs.writeFileSync(htmlPathDistLong, fullHtml, 'utf-8');
  }

  console.log('3. Generando PDF A4 de 11 páginas con Puppeteer...');
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 1800 });
  await page.goto('file:///' + htmlPathPlantillas.replace(/\\/g, '/'), { waitUntil: 'networkidle0' });

  const pdfPathPlantillas = path.join(ROOT_DIR, 'plantillas_impresion', 'Fichas_Cocina_20_al_30_Noviembre.pdf');
  const pdfPathPublic = path.join(ROOT_DIR, 'public', 'fichas-cocina.pdf');
  const pdfPathPublicLong = path.join(ROOT_DIR, 'public', 'Fichas_Cocina_20_al_30_Noviembre.pdf');
  const pdfPathDist = path.join(ROOT_DIR, 'dist', 'fichas-cocina.pdf');
  const pdfPathDistLong = path.join(ROOT_DIR, 'dist', 'Fichas_Cocina_20_al_30_Noviembre.pdf');

  await page.pdf({
    path: pdfPathPlantillas,
    format: 'A4',
    printBackground: true,
    margin: { top: '0mm', right: '0mm', bottom: '0mm', left: '0mm' }
  });

  fs.copyFileSync(pdfPathPlantillas, pdfPathPublic);
  fs.copyFileSync(pdfPathPlantillas, pdfPathPublicLong);
  if (fs.existsSync(path.join(ROOT_DIR, 'dist'))) {
    fs.copyFileSync(pdfPathPlantillas, pdfPathDist);
    fs.copyFileSync(pdfPathPlantillas, pdfPathDistLong);
  }
  console.log('PDF generado exitosamente en plantillas_impresion y public.');

  console.log('4. Generando capturas PNG de vista previa de las hojas...');
  // Screenshot of Sábado 28 de Noviembre (id: page-2026-11-28)
  const page28Nov = await page.$('#page-2026-11-28 .a4-page');
  if (page28Nov) {
    const png28PathPlantillas = path.join(ROOT_DIR, 'plantillas_impresion', 'Fichas_Cocina_28_Noviembre_P4.png');
    const png28PathPublic = path.join(ROOT_DIR, 'public', 'fichas-cocina-28nov.png');
    const png28PathDist = path.join(ROOT_DIR, 'dist', 'fichas-cocina-28nov.png');
    await page28Nov.screenshot({ path: png28PathPlantillas });
    fs.copyFileSync(png28PathPlantillas, png28PathPublic);
    if (fs.existsSync(path.join(ROOT_DIR, 'dist'))) {
      fs.copyFileSync(png28PathPlantillas, png28PathDist);
    }
    console.log('Captura de 28 Noviembre (6 locales/recuadros) guardada.');
  }

  // Screenshot of Viernes 20 de Noviembre
  const page20Nov = await page.$('#page-2026-11-20 .a4-page');
  if (page20Nov) {
    const png20PathPlantillas = path.join(ROOT_DIR, 'plantillas_impresion', 'Fichas_Cocina_20_Noviembre_P1.png');
    const png20PathPublic = path.join(ROOT_DIR, 'public', 'fichas-cocina-20nov.png');
    const png20PathDist = path.join(ROOT_DIR, 'dist', 'fichas-cocina-20nov.png');
    await page20Nov.screenshot({ path: png20PathPlantillas });
    fs.copyFileSync(png20PathPlantillas, png20PathPublic);
    if (fs.existsSync(path.join(ROOT_DIR, 'dist'))) {
      fs.copyFileSync(png20PathPlantillas, png20PathDist);
    }
    console.log('Captura de 20 Noviembre guardada.');
  }

  // Screenshot of Sábado 21 de Noviembre (Cristales - Rousbell)
  const page21Nov = await page.$('#page-2026-11-21 .a4-page');
  if (page21Nov) {
    const png21PathPlantillas = path.join(ROOT_DIR, 'plantillas_impresion', 'Fichas_Cocina_21_Noviembre_P2.png');
    const png21PathPublic = path.join(ROOT_DIR, 'public', 'fichas-cocina-21nov.png');
    const png21PathDist = path.join(ROOT_DIR, 'dist', 'fichas-cocina-21nov.png');
    await page21Nov.screenshot({ path: png21PathPlantillas });
    fs.copyFileSync(png21PathPlantillas, png21PathPublic);
    if (fs.existsSync(path.join(ROOT_DIR, 'dist'))) {
      fs.copyFileSync(png21PathPlantillas, png21PathDist);
    }
    console.log('Captura de 21 Noviembre (Cristales) guardada.');
  }

  // Screenshot of Domingo 22 de Noviembre (Berthol - Villa Santiago)
  const page22Nov = await page.$('#page-2026-11-22 .a4-page');
  if (page22Nov) {
    const png22Path = path.join(ROOT_DIR, 'plantillas_impresion', 'Fichas_Cocina_22_Noviembre_Berthol.png');
    const png22Public = path.join(ROOT_DIR, 'public', 'fichas-cocina-22nov.png');
    const png22Dist = path.join(ROOT_DIR, 'dist', 'fichas-cocina-22nov.png');
    await page22Nov.screenshot({ path: png22Path });
    fs.copyFileSync(png22Path, png22Public);
    if (fs.existsSync(path.join(ROOT_DIR, 'dist'))) {
      fs.copyFileSync(png22Path, png22Dist);
    }
    console.log('Captura de 22 Noviembre (Berthol) guardada.');
  }

  // Screenshot of Viernes 27 de Noviembre (Villa Santiago - Inst Ciber)
  const page27Nov = await page.$('#page-2026-11-27 .a4-page');
  if (page27Nov) {
    const png27PathPlantillas = path.join(ROOT_DIR, 'plantillas_impresion', 'Fichas_Cocina_27_Noviembre_P3.png');
    const png27PathPublic = path.join(ROOT_DIR, 'public', 'fichas-cocina-27nov.png');
    const png27PathDist = path.join(ROOT_DIR, 'dist', 'fichas-cocina-27nov.png');
    await page27Nov.screenshot({ path: png27PathPlantillas });
    fs.copyFileSync(png27PathPlantillas, png27PathPublic);
    if (fs.existsSync(path.join(ROOT_DIR, 'dist'))) {
      fs.copyFileSync(png27PathPlantillas, png27PathDist);
    }
    console.log('Captura de 27 Noviembre (Villa Santiago) guardada.');
  }

  await browser.close();
  console.log('>>> TODO COMPLETADO CON ÉXITO: 6 LOCALES POR HOJA A4 <<<');
}

buildAll().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
