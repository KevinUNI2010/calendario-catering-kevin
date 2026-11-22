/**
 * Utilidad para detectar de forma amigable y limpia el dispositivo,
 * sistema operativo y navegador del usuario para auditoría de accesos.
 */

export function detectDevice(): { deviceName: string; userAgent: string } {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return { deviceName: 'Servidor / Desconocido', userAgent: '' };
  }

  const ua = navigator.userAgent || '';
  let os = 'Dispositivo';
  let browser = 'Navegador';

  // Detección de Sistema Operativo y Marca aproximada
  if (/Android/i.test(ua)) {
    if (/Samsung/i.test(ua)) os = 'Samsung';
    else if (/Xiaomi|Redmi|POCO/i.test(ua)) os = 'Xiaomi/Redmi';
    else if (/Huawei|HONOR/i.test(ua)) os = 'Honor/Huawei';
    else if (/Motorola|Moto/i.test(ua)) os = 'Motorola';
    else os = 'Android';
  } else if (/iPhone/i.test(ua)) {
    os = 'iPhone';
  } else if (/iPad/i.test(ua)) {
    os = 'iPad';
  } else if (/Windows/i.test(ua)) {
    os = 'Windows PC';
  } else if (/Macintosh|Mac OS X/i.test(ua)) {
    os = 'Mac';
  } else if (/Linux/i.test(ua)) {
    os = 'Linux';
  }

  // Detección de Navegador
  if (/Edg/i.test(ua)) {
    browser = 'Edge';
  } else if (/OPR|Opera/i.test(ua)) {
    browser = 'Opera';
  } else if (/Chrome|CriOS/i.test(ua)) {
    browser = 'Chrome';
  } else if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) {
    browser = 'Safari';
  } else if (/Firefox|FxiOS/i.test(ua)) {
    browser = 'Firefox';
  }

  const isMobile = /Mobi|Android|iPhone|iPad/i.test(ua);
  const icon = isMobile ? '📱' : '💻';

  return {
    deviceName: `${icon} ${os} · ${browser}`,
    userAgent: ua,
  };
}

let cachedIp: string | null = null;
let ipFetchPromise: Promise<string | null> | null = null;

/**
 * Obtiene la IP pública del cliente sin retrasar la navegación.
 * Con timeout estricto de 2.5s y caché local en memoria.
 */
export async function fetchClientIp(): Promise<string | null> {
  if (cachedIp) return cachedIp;
  if (ipFetchPromise) return ipFetchPromise;

  ipFetchPromise = (async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500);
      const res = await fetch('https://api.ipify.org?format=json', {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (res.ok) {
        const data = await res.json();
        if (data && data.ip) {
          cachedIp = String(data.ip);
          return cachedIp;
        }
      }
    } catch {
      // Ignorar silenciosamente si hay adblocker o falla de red
    }
    return null;
  })();

  return ipFetchPromise;
}
