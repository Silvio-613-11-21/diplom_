/**
 * Подготовка строк исходного текста: удаление комментариев, обрезка пробелов.
 */

export interface SourceLine {
  /** Номер строки в исходнике (с единицы) — для сообщений об ошибках. */
  number: number;
  /** Текст без комментария и краевых пробелов (регистр сохранён!). */
  text: string;
}

/** Удалить комментарий («;» до конца строки), не трогая содержимое кавычек. */
export function stripComment(line: string): string {
  let quote: string | null = null;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (quote) {
      if (ch === quote) quote = null;
    } else if (ch === "'" || ch === '"') {
      quote = ch;
    } else if (ch === ';') {
      return line.slice(0, i);
    }
  }
  return line;
}

/** Разбить исходный текст на подготовленные строки. */
export function prepareLines(source: string): SourceLine[] {
  const result: SourceLine[] = [];
  const rawLines = source.split(/\r?\n/);
  for (let i = 0; i < rawLines.length; i++) {
    const text = stripComment(rawLines[i]).trim();
    if (text.length > 0) {
      result.push({ number: i + 1, text });
    }
  }
  return result;
}

/**
 * Разбить текст операндов по запятым верхнего уровня.
 * Запятые внутри '…', "…" и […] не считаются разделителями.
 */
export function splitOperands(text: string): string[] {
  const parts: string[] = [];
  let current = '';
  let quote: string | null = null;
  let depth = 0;
  for (const ch of text) {
    if (quote) {
      current += ch;
      if (ch === quote) quote = null;
      continue;
    }
    if (ch === "'" || ch === '"') {
      quote = ch;
      current += ch;
      continue;
    }
    if (ch === '[') depth++;
    if (ch === ']') depth--;
    if (ch === ',' && depth === 0) {
      parts.push(current.trim());
      current = '';
      continue;
    }
    current += ch;
  }
  parts.push(current.trim());
  return parts;
}

/** Убрать все пробелы вне кавычек (для нормализации операндов). */
export function squeezeSpacings(text: string): string {
  let result = '';
  let quote: string | null = null;
  for (const ch of text) {
    if (quote) {
      result += ch;
      if (ch === quote) quote = null;
      continue;
    }
    if (ch === "'" || ch === '"') {
      quote = ch;
      result += ch;
      continue;
    }
    if (!/\s/.test(ch)) result += ch;
  }
  return result;
}
