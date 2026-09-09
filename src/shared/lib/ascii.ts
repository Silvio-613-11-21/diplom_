/**
 * ASCII-таблица для панели памяти (логика из старого проекта).
 */

/** Символ по hex-коду; непечатаемые символы отображаются точкой. */
export function asciiChar(code: number): string {
  if (code < 0x20 || code > 0x7e) return '·';
  return String.fromCharCode(code);
}

/** Hex-код единичного символа (для 'H' -> 48). */
export function charToCode(char: string): number | undefined {
  if (char.length !== 1) return undefined;
  const code = char.charCodeAt(0);
  if (code > 0x7f) return undefined;
  return code;
}
