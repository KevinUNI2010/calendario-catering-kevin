export interface ParsedPlateFormula {
  total: number;
  isValid: boolean;
  explanation: string;
}

/**
 * Parsea de manera segura fórmulas de platos (ej: "23x8", "23*8", "20*8 + 5", "150")
 * sin usar eval.
 */
export function parsePlateFormula(rawInput: string | number | undefined | null): ParsedPlateFormula {
  if (rawInput === undefined || rawInput === null) {
    return { total: 0, isValid: false, explanation: '' };
  }

  const str = String(rawInput).trim();
  if (!str) {
    return { total: 0, isValid: false, explanation: '' };
  }

  // Número entero directo
  if (/^\d+$/.test(str)) {
    const num = parseInt(str, 10);
    return {
      total: num,
      isValid: num > 0,
      explanation: num > 0 ? `${num} platos` : ''
    };
  }

  // Separar por sumas ('+')
  const terms = str.split('+').map(t => t.trim()).filter(Boolean);
  if (terms.length === 0) {
    return { total: 0, isValid: false, explanation: '' };
  }

  let grandTotal = 0;
  const termExplanations: string[] = [];
  let allValid = true;

  for (const term of terms) {
    // Si contiene multiplicadores ('x', 'X', '*', '×', '·')
    if (/[xX*×·]/.test(term)) {
      const factors = term.split(/[xX*×·]/).map(f => f.trim());
      if (factors.length < 2) {
        allValid = false;
        break;
      }
      let product = 1;
      let validFactors = true;
      for (const f of factors) {
        const val = parseFloat(f);
        if (isNaN(val) || val < 0) {
          validFactors = false;
          break;
        }
        product *= val;
      }
      if (!validFactors) {
        allValid = false;
        break;
      }
      product = Math.round(product);
      grandTotal += product;
      termExplanations.push(`${factors.join(' × ')} = ${product}`);
    } else {
      const val = parseFloat(term);
      if (isNaN(val) || val < 0) {
        allValid = false;
        break;
      }
      const rounded = Math.round(val);
      grandTotal += rounded;
      termExplanations.push(`${rounded}`);
    }
  }

  if (!allValid || isNaN(grandTotal) || grandTotal <= 0) {
    return {
      total: 0,
      isValid: false,
      explanation: 'Formato: ej. 23x8, 23*8 o 150'
    };
  }

  let explanation = '';
  if (terms.length === 1 && termExplanations[0].includes('=')) {
    explanation = `${termExplanations[0]} raciones`;
  } else if (terms.length > 1) {
    explanation = `${termExplanations.join(' + ')} = ${grandTotal} raciones`;
  } else {
    explanation = `${grandTotal} raciones`;
  }

  return {
    total: grandTotal,
    isValid: true,
    explanation
  };
}

/**
 * Retorna la cantidad efectiva de platos con cascada de prioridad:
 * 1. Platos Servidos (conteo final de sala) si existe y > 0
 * 2. Si no hay servidos: toma Platos Confirmados (asume que no aumentaron en sala)
 * 3. Si no hay confirmados: toma Platos Contratados (asume contrato inicial sin cambios)
 * 4. Fallback a cantidadPlatos previa
 */
export function getEffectivePlateCount(dish?: {
  cantidadPlatos?: number;
  platosContratados?: number;
  platosConfirmados?: number;
  platosServidos?: number;
}): number {
  if (!dish) return 0;
  if (dish.platosServidos !== undefined && dish.platosServidos > 0) {
    return dish.platosServidos;
  }
  if (dish.platosConfirmados !== undefined && dish.platosConfirmados > 0) {
    return dish.platosConfirmados;
  }
  if (dish.platosContratados !== undefined && dish.platosContratados > 0) {
    return dish.platosContratados;
  }
  return dish.cantidadPlatos || 0;
}
