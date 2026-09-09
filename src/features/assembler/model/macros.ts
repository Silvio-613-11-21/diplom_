import type { EmulatorFeatures } from '../../../shared/types/restrictions';
import { compileMessages } from '../../../shared/config/messages';
import type { SourceLine } from './source';

/**
 * Макросы NASM: %macro Имя N … %endmacro.
 * Вызов подставляет тело макроса с заменой %1..%N на аргументы
 * (логика macrosTransformer из старого проекта).
 */

export interface MacroDef {
  name: string;
  paramCount: number;
  /** Строки тела макроса (без %macro/%endmacro). */
  body: SourceLine[];
}

export interface MacroPassResult {
  ok: true;
  lines: SourceLine[];
}

export interface MacroPassError {
  ok: false;
  line: number;
  message: string;
}

/** Раскрыть макросы в списке строк. Описание должно идти до вызова. */
export function expandMacros(
  lines: SourceLine[],
  features: EmulatorFeatures,
): MacroPassResult | MacroPassError {
  const macros: MacroDef[] = [];

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];

    // ---- начало описания макроса -------------------------------------
    const macroStart = /^%macro\s+([a-z_][a-z0-9_]*)\s+([0-9]+)$/i.exec(line.text);
    if (macroStart) {
      if (!features.macros) {
        return { ok: false, line: line.number, message: compileMessages.macroNotAllowed };
      }

      const name = macroStart[1].toLowerCase();
      const paramCount = parseInt(macroStart[2], 10);
      if (macros.some((m) => m.name === name)) {
        return { ok: false, line: line.number, message: compileMessages.nameClash(name) };
      }

      // ищем %endmacro
      let end = -1;
      for (let j = i + 1; j < lines.length; j++) {
        if (/^%endmacro$/i.test(lines[j].text)) {
          end = j;
          break;
        }
      }
      if (end === -1) {
        return { ok: false, line: line.number, message: compileMessages.noMacroEnd };
      }

      const body = lines.slice(i + 1, end);
      if (body.length === 0) {
        return { ok: false, line: line.number, message: compileMessages.macroError };
      }

      macros.push({ name, paramCount, body });
      lines.splice(i, end - i + 1); // убираем описание из потока
      continue;
    }

    if (/^%endmacro$/i.test(line.text)) {
      return { ok: false, line: line.number, message: compileMessages.noMacroEnd };
    }

    if (/^%include\b/i.test(line.text)) {
      return { ok: false, line: line.number, message: compileMessages.includeNotSupported };
    }

    // ---- вызов макроса ------------------------------------------------
    const callName = firstWord(line.text);
    if (callName !== null) {
      const macro = macros.find((m) => m.name === callName);
      if (macro) {
        const expansion = expandCall(line, macro);
        if (!expansion.ok) return expansion;
        lines.splice(i, 1, ...expansion.lines);
        i += expansion.lines.length;
        continue;
      }
    }

    i++;
  }

  return { ok: true, lines };
}

// ---------------------------------------------------------------------------

function firstWord(text: string): string | null {
  const match = /^([a-z_][a-z0-9_]*)/i.exec(text);
  return match ? match[1].toLowerCase() : null;
}

function expandCall(
  callLine: SourceLine,
  macro: MacroDef,
): { ok: true; lines: SourceLine[] } | { ok: false; line: number; message: string } {
  const argsText = callLine.text.slice(macro.name.length).trim();
  const args = argsText.length === 0 ? [] : splitMacroArgs(argsText);

  if (args.length !== macro.paramCount) {
    return { ok: false, line: callLine.number, message: compileMessages.macroParamCount };
  }

  const result: SourceLine[] = [];
  for (const bodyLine of macro.body) {
    let text = bodyLine.text;
    for (let p = macro.paramCount; p >= 1; p--) {
      // %N заменяется на аргумент (в обратном порядке, чтобы %10 не ломал %1)
      text = text.replace(new RegExp(`%${p}\\b`, 'g'), args[p - 1]);
    }
    result.push({ number: bodyLine.number, text });
  }
  return { ok: true, lines: result };
}

/** Аргументы вызова: запятые внутри {фигурных скобок} не разделяют аргументы. */
function splitMacroArgs(text: string): string[] {
  const parts: string[] = [];
  let current = '';
  let depth = 0;
  let quote: string | null = null;
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
    if (ch === '{') depth++;
    if (ch === '}') depth--;
    if (ch === ',' && depth === 0) {
      parts.push(current.trim());
      current = '';
      continue;
    }
    current += ch;
  }
  parts.push(current.trim());

  // {AX, BX} -> AX, BX  (снимаем фигурные скобки целиком)
  return parts.map((part) => {
    if (part.startsWith('{') && part.endsWith('}')) {
      return part.slice(1, -1).trim();
    }
    return part;
  });
}
