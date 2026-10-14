import { DishSelection } from '../types';

export interface ParsedServilleta {
  name: string;
  color?: string;
  raw: string;
}

/**
 * Parsea un elemento individual de servilleta tipo "Rojo|#ef4444" o "Rojo"
 */
export function parseServilletaItem(item: string): ParsedServilleta {
  if (!item) return { name: '', raw: '' };
  const parts = item.split('|');
  const name = parts[0]?.trim() || '';
  const color = parts[1]?.trim() || undefined;
  return { name, color, raw: item.trim() };
}

/**
 * Obtiene la lista de servilletas seleccionadas desde un objeto DishSelection.
 * Compatible tanto con:
 * - dish.servilletas (Array de strings)
 * - dish.servilleta (String único o compuesto tipo "Lila|#803c64 + Rojo|#ef4444")
 */
export function getSelectedServilletas(dish?: DishSelection | null): ParsedServilleta[] {
  if (!dish) return [];

  // 1. Si existe el array servilletas y tiene elementos
  if (Array.isArray(dish.servilletas) && dish.servilletas.length > 0) {
    return dish.servilletas
      .filter((s): s is string => typeof s === 'string' && s.trim().length > 0)
      .map(parseServilletaItem);
  }

  // 2. Si sólo existe el string dish.servilleta
  if (dish.servilleta && typeof dish.servilleta === 'string' && dish.servilleta.trim()) {
    const raw = dish.servilleta.trim();
    // Separar por delimitadores posibles ('+', '/', ',')
    const parts = raw.includes('+')
      ? raw.split('+')
      : raw.includes('/')
        ? raw.split('/')
        : [raw];

    return parts
      .map(p => p.trim())
      .filter(p => p.length > 0)
      .map(parseServilletaItem);
  }

  return [];
}

/**
 * Formatea un arreglo de servilletas para persistir en dish:
 * Genera tanto `servilletas` (array) como `servilleta` (string unido con " + ")
 * garantizando compatibilidad con cualquier vista existente.
 */
export function formatServilletasForSave(selectedItems: string[]): {
  servilletas: string[];
  servilleta: string;
} {
  const valid = selectedItems
    .filter((s): s is string => typeof s === 'string' && s.trim().length > 0)
    .slice(0, 2); // Máximo 2 servilletas

  return {
    servilletas: valid,
    servilleta: valid.join(' + '),
  };
}
