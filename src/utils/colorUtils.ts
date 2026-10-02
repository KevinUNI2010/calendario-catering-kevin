import { EventColor, GOOGLE_CALENDAR_COLORS } from '../types';

const hexToRgb = (hex: string) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
};

const getTextColor = (hex: string) => {
  const rgb = hexToRgb(hex);
  if (!rgb) return '#ffffff';
  const brightness = (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
  return brightness > 155 ? '#1f2937' : '#ffffff';
};

const darkenHex = (hex: string, amount = 0.15) => {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  const r = Math.max(0, Math.floor(rgb.r * (1 - amount)));
  const g = Math.max(0, Math.floor(rgb.g * (1 - amount)));
  const b = Math.max(0, Math.floor(rgb.b * (1 - amount)));
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
};

export const getEventColor = (colorIdOrHex: string): EventColor => {
  const predefined = GOOGLE_CALENDAR_COLORS.find(c => c.id === colorIdOrHex);
  if (predefined) return predefined;

  if (colorIdOrHex.startsWith('#')) {
    return {
      id: colorIdOrHex,
      name: 'Color Personalizado',
      bg: colorIdOrHex,
      text: getTextColor(colorIdOrHex),
      border: darkenHex(colorIdOrHex, 0.2),
      dot: colorIdOrHex,
    };
  }

  return GOOGLE_CALENDAR_COLORS[0];
};
