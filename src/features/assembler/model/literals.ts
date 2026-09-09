/**
 * Разбор числовых и строковых литералов языка.
 * Поддерживаются суффиксы: 1Fh (hex), 1010b (bin), 123 / 123d (dec), 0x1F,
 * а также символьные литералы 'H' и двухсимвольные 'el'.
 */

export interface CharLiteral {
  chars: string;
}

export function isCharLiteral(text: string): boolean {
  return /^(['"]).*\1$/.test(text) && text.length >= 3;
}

/** Символьный литерал: 'H' -> "H", 'el' -> "el". */
export function parseCharLiteral(text: string): CharLiteral | null {
  const match = /^(['"])(.*)\1$/.exec(text);
  if (!match) return null;
  if (match[2].length === 0 || match[2].length > 2) return null;
  for (const ch of match[2]) {
    if (ch.charCodeAt(0) > 0x7f) return null;
  }
  return { chars: match[2] };
}

/**
 * Числовой литерал (без имени переменной).
 * Возвращает число или null, если это не число.
 */
export function parseNumberLiteral(text: string): number | null {
  // 0x1F —_hex с префиксом
  let match = /^([+-]?)0x([0-9a-fA-F]+)$/.exec(text);
  if (match) {
    return signed(match[1], parseInt(match[2], 16));
  }
  // 1F4Ch — hex с суффиксом h (старший разряд обязан быть цифрой)
  match = /^([+-]?)([0-9][0-9a-fA-F]*)h$/i.exec(text);
  if (match) {
    return signed(match[1], parseInt(match[2], 16));
  }
  // 1010b — двоичное
  match = /^([+-]?)([01]+)b$/i.exec(text);
  if (match) {
    return signed(match[1], parseInt(match[2], 2));
  }
  // 123 / 123d — десятичное (d-суффикс необязателен)
  match = /^([+-]?)([0-9]+)d?$/i.exec(text);
  if (match) {
    return signed(match[1], parseInt(match[2], 10));
  }
  return null;
}

function signed(sign: string, value: number): number {
  return sign === '-' ? -value : value;
}

/** Корректное имя метки/переменной/макроса (в нижнем регистре). */
export function isValidIdentifier(text: string): boolean {
  return /^[a-z_][a-z0-9_]*$/.test(text);
}
