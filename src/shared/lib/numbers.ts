/**
 * Работа с системами счисления.
 * Логика перенесена из старого проекта (Convertor), но оперирует числами,
 * а не строками, и не завязана на DOM.
 */

export type NumBase = 2 | 10 | 16;

/** Допустимый диапазон 16-битного беззнакового значения. */
export const WORD_MAX = 0xffff;
export const BYTE_MAX = 0xff;

/** Форматирование числа в заданной системе с выравниванием по разрядности. */
export function formatValue(value: number, base: NumBase, size: 1 | 2): string {
  const masked = size === 1 ? value & BYTE_MAX : value & WORD_MAX;
  switch (base) {
    case 16:
      return masked.toString(16).toUpperCase().padStart(size * 2, '0');
    case 10:
      return masked.toString(10).padStart(size === 1 ? 3 : 5, '0');
    case 2:
      return masked.toString(2).padStart(size * 8, '0');
  }
}

/** Перевод отрицательного числа в дополнительный код (16 бит). */
export function toTwosComplement(value: number, size: 1 | 2): number {
  const mask = size === 1 ? BYTE_MAX : WORD_MAX;
  return value & mask;
}

/** Читаемое представление байта памяти: две hex-цифры. */
export function hexByte(value: number): string {
  return (value & BYTE_MAX).toString(16).toUpperCase().padStart(2, '0');
}

/** Читаемое представление слова: четыре hex-цифры. */
export function hexWord(value: number): string {
  return (value & WORD_MAX).toString(16).toUpperCase().padStart(4, '0');
}
