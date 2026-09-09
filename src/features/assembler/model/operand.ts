import type { Operand, Reg8Name, RegName } from '../../../shared/types/asm';
import { REG16_NAMES, REG8_NAMES, SEG_REG_NAMES } from '../../../shared/types/asm';
import type { EmulatorFeatures } from '../../../shared/types/restrictions';
import { compileMessages } from '../../../shared/config/messages';
import { parseCharLiteral, parseNumberLiteral } from './literals';
import type { SymbolTable } from './symbols';
import { squeezeSpacings } from './source';

/**
 * Разбор одного операнда команды.
 * Возвращает Operand либо текст ошибки (без номера строки — его добавит парсер).
 */

export type OperandResult = { ok: true; operand: Operand } | { ok: false; message: string };

const SIGNS = ['+', '-', '*', '/'] as const;
type Sign = (typeof SIGNS)[number];

export function parseOperand(
  raw: string,
  symbols: SymbolTable,
  features: EmulatorFeatures,
): OperandResult {
  const text = squeezeSpacings(raw);
  if (text.length === 0) return { ok: false, message: compileMessages.emptyOperand };

  const lower = text.toLowerCase();

  // --- регистр ------------------------------------------------------------
  const reg = tryParseRegister(lower);
  if (reg) return { ok: true, operand: reg };

  // --- память: byte[…] / word[…] -------------------------------------------
  const mem = tryParseMemory(text, lower, symbols, features);
  if (mem) return mem;

  // --- символьный литерал: 'H' / 'el' --------------------------------------
  const char = parseCharLiteral(text);
  if (char) {
    let value = 0;
    for (let i = char.chars.length - 1; i >= 0; i--) {
      value = (value << 8) | char.chars.charCodeAt(i);
    }
    return { ok: true, operand: { kind: 'imm', value, text } };
  }

  // --- число ---------------------------------------------------------------
  const number = parseNumberLiteral(text);
  if (number !== null) {
    return { ok: true, operand: { kind: 'imm', value: number, text } };
  }

  // --- имя переменной/константы (с возможным ±смещением) --------------------
  const named = tryParseNamed(text, lower, symbols, features);
  if (named) return named;

  return { ok: false, message: compileMessages.wrongValue };
}

// ---------------------------------------------------------------------------

function tryParseRegister(lower: string): Operand | null {
  if (REG16_NAMES.includes(lower as never) || SEG_REG_NAMES.includes(lower as never)) {
    return { kind: 'reg', name: lower as RegName, size: 2 };
  }
  if (REG8_NAMES.includes(lower as never)) {
    return { kind: 'reg', name: lower as Reg8Name, size: 1 };
  }
  return null;
}

function tryParseMemory(
  text: string,
  lower: string,
  symbols: SymbolTable,
  features: EmulatorFeatures,
): OperandResult | null {
  const match = /^(byte|word)\[(.+)\]$/.exec(lower);
  if (!match) return null;

  if (!features.memory) {
    return { ok: false, message: compileMessages.memoryNotAllowed };
  }

  const size: 1 | 2 = match[1] === 'byte' ? 1 : 2;
  const index = resolveIndexExpression(match[2], symbols, features);
  if (!index.ok) return index;

  return {
    ok: true,
    operand: {
      kind: 'mem',
      size,
      useSi: index.useSi,
      useBx: index.useBx,
      offset: index.offset,
      text,
    },
  };
}

function tryParseNamed(
  text: string,
  lower: string,
  symbols: SymbolTable,
  features: EmulatorFeatures,
): OperandResult | null {
  // имя (+/- смещение)?  например: MYSTR, MYSTR+1
  const match = /^([a-z_][a-z0-9_]*)(?:([+-])([0-9]+[hbdi]?|0x[0-9a-f]+))?$/.exec(lower);
  if (!match) return null;

  const name = match[1];
  let value: number;

  if (symbols.constants.has(name)) {
    value = symbols.constants.get(name)!;
  } else if (symbols.variables.has(name)) {
    // переменная как операнд-источник — это её адрес (mov dx, MYSTR)
    if (!features.variables) {
      return { ok: false, message: compileMessages.variablesNotAllowed };
    }
    value = symbols.variables.get(name)!.address;
  } else {
    return null; // не имя — на выходе будет «неправильное значение»
  }

  if (match[2]) {
    const offset = parseNumberLiteral(match[3]);
    if (offset === null) return null;
    value = match[2] === '+' ? value + offset : value - offset;
  }

  return { ok: true, operand: { kind: 'imm', value, text } };
}

// ---------------------------------------------------------------------------
// Индексное выражение: si, bx, числа и имена переменных со знаками + - * /
// (логика IndexResolve из старого проекта: si/bx — по одному и только со «+»,
// числовая часть вычисляется с приоритетом умножения и деления)
// ---------------------------------------------------------------------------

export type IndexResult =
  | { ok: true; useSi: boolean; useBx: boolean; offset: number }
  | { ok: false; message: string };

interface IndexTerm {
  sign: Sign;
  /** 'si' | 'bx' для регистровых термов. */
  register?: 'si' | 'bx';
  /** Числовое значение для чисел и адресов переменных. */
  value?: number;
}

function resolveIndexExpression(
  expr: string,
  symbols: SymbolTable,
  features: EmulatorFeatures,
): IndexResult {
  if (expr.length === 0) return { ok: false, message: compileMessages.indexError };

  const terms: IndexTerm[] = [];
  let i = 0;

  while (i < expr.length) {
    let sign: Sign = '+';
    if (SIGNS.includes(expr[i] as Sign)) {
      sign = expr[i] as Sign;
      i++;
      if (i >= expr.length) return { ok: false, message: compileMessages.indexError };
    }

    // выделяем очередной терм (до следующего знака)
    let raw = '';
    while (i < expr.length && !SIGNS.includes(expr[i] as Sign)) {
      raw += expr[i];
      i++;
    }
    if (raw.length === 0) return { ok: false, message: compileMessages.indexError };

    const lowerRaw = raw.toLowerCase();
    if (lowerRaw === 'si' || lowerRaw === 'bx') {
      terms.push({ sign, register: lowerRaw });
      continue;
    }

    if (symbols.variables.has(lowerRaw)) {
      if (!features.variables) {
        return { ok: false, message: compileMessages.variablesNotAllowed };
      }
      terms.push({ sign, value: symbols.variables.get(lowerRaw)!.address });
      continue;
    }

    const num = parseNumberLiteral(lowerRaw);
    if (num === null) return { ok: false, message: compileMessages.indexError };
    terms.push({ sign, value: num });
  }

  // --- правила для si/bx ---------------------------------------------------
  let useSi = false;
  let useBx = false;
  for (let k = 0; k < terms.length; k++) {
    const term = terms[k];
    if (!term.register) continue;

    if (term.sign !== '+') return { ok: false, message: compileMessages.indexError };
    const prev = terms[k - 1];
    const next = terms[k + 1];
    if (prev && (prev.sign === '*' || prev.sign === '/')) {
      return { ok: false, message: compileMessages.indexError };
    }
    if (next && (next.sign === '*' || next.sign === '/')) {
      return { ok: false, message: compileMessages.indexError };
    }

    if (term.register === 'si') {
      if (useSi) return { ok: false, message: compileMessages.indexError };
      useSi = true;
    } else {
      if (useBx) return { ok: false, message: compileMessages.indexError };
      useBx = true;
    }
  }

  // --- числовая часть -------------------------------------------------------
  const numeric: { sign: Sign; value: number }[] = [];
  for (const term of terms) {
    if (term.register) continue;
    numeric.push({ sign: term.sign, value: term.value! });
  }

  const folded = foldArithmetic(numeric);
  if (folded === null) return { ok: false, message: compileMessages.indexError };

  if (folded > 0xffff || folded < -0xffff) {
    return { ok: false, message: compileMessages.indexError };
  }

  return { ok: true, useSi, useBx, offset: folded };
}

/** Вычислить числовое выражение с приоритетом умножения и деления. */
function foldArithmetic(items: { sign: Sign; value: number }[]): number | null {
  if (items.length === 0) return 0;

  // умножение и деление — раньше сложения и вычитания
  let i = 1;
  while (i < items.length) {
    if (items[i].sign === '*' || items[i].sign === '/') {
      const prev = items[i - 1];
      const cur = items[i];
      let result: number;
      if (cur.sign === '*') {
        result = prev.value * cur.value;
      } else {
        if (cur.value === 0) return null;
        result = Math.floor(prev.value / cur.value);
      }
      items.splice(i - 1, 2, { sign: prev.sign, value: result });
    } else {
      i++;
    }
  }

  // сложение и вычитание
  let total = items[0].value * (items[0].sign === '-' ? -1 : 1);
  for (let k = 1; k < items.length; k++) {
    if (items[k].sign === '+') total += items[k].value;
    else if (items[k].sign === '-') total -= items[k].value;
    else return null; // * или / в неположенном месте
  }
  return total;
}
