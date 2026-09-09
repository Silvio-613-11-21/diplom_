import type { EmulatorFeatures } from '../../../shared/types/restrictions';
import { compileMessages } from '../../../shared/config/messages';
import {
  ALL_MNEMONICS, REG16_NAMES, REG8_NAMES, SEG_REG_NAMES,
} from '../../../shared/types/asm';
import type { VariableInfo } from '../../../shared/types/asm';
import { parseCharLiteral, parseNumberLiteral } from './literals';
import type { SourceLine } from './source';

/**
 * Сегмент данных: переменные (db/dw/dd), константы (equ),
 * выравнивание (align) и повторение (times).
 * Память модели — 256 байт (дамп 16×16, как в дебаггере).
 */

export const MEMORY_SIZE = 256;

export interface SymbolTable {
  /** Начальное содержимое памяти данных. */
  memory: Uint8Array;
  /** Переменные: имя -> адрес. */
  variables: Map<string, VariableInfo>;
  /** Константы equ: имя -> значение. */
  constants: Map<string, number>;
  /** Имена меток кода (собираются отдельно). */
  labels: Set<string>;
}

export type SymbolPassResult =
  | { ok: true; symbols: SymbolTable }
  | { ok: false; line: number; message: string };

/**
 * Пройти по строкам и собрать все символы (переменные, константы, метки),
 * выделив память под данные. Директивы данных из потока не удаляются —
 * основной проход пропустит их сам.
 */
export function collectSymbols(
  lines: SourceLine[],
  features: EmulatorFeatures,
): SymbolPassResult {
  const memory = new Uint8Array(MEMORY_SIZE);
  const variables = new Map<string, VariableInfo>();
  const constants = new Map<string, number>();
  const labels = new Set<string>();
  let address = 0;

  for (const line of lines) {
    const text = line.text;

    // --- директива сегмента: name: segment .code / segment .data ------
    const segment = /^(?:([a-z_][a-z0-9_]*)\s*:\s*)?segment\s*\.(code|data)$/i.exec(text);
    if (segment) continue;

    // --- org 100h ------------------------------------------------------
    const org = /^org\s+(.+)$/i.exec(text);
    if (org) {
      const value = parseNumberLiteral(org[1]);
      if (value === null || value !== 0x100) {
        return { ok: false, line: line.number, message: compileMessages.badOrg };
      }
      continue;
    }

    // --- align N[, db X] -----------------------------------------------
    const align = /^align\s+([0-9]+[hbdi]?)\s*(?:,\s*(.+))?$/i.exec(text);
    if (align) {
      if (!features.variables) {
        return { ok: false, line: line.number, message: compileMessages.variablesNotAllowed };
      }
      const step = parseNumberLiteral(align[1]);
      if (step === null || step <= 0) {
        return { ok: false, line: line.number, message: compileMessages.badDirective(text) };
      }
      // за запятой идёт «db <байт>» — префикс db опускаем
      const fillerRaw = align[2] ? align[2].replace(/^db\s+/i, '') : null;
      const filler = fillerRaw ? parseDataValue(fillerRaw, 1) : null;
      if (fillerRaw !== null && (filler === null || filler.bytes.length !== 1)) {
        return { ok: false, line: line.number, message: compileMessages.wrongValue };
      }
      while (address % step !== 0) {
        if (address >= MEMORY_SIZE) {
          return { ok: false, line: line.number, message: compileMessages.valueTooBig };
        }
        memory[address] = filler ? filler.bytes[0] : 0;
        address++;
      }
      continue;
    }

    // --- [name] times N db X ----------------------------------------------
    const times = /^(?:([a-z_][a-z0-9_]*)\s+)?times\s+([0-9]+[hbdi]?)\s+(db|dw)\s+(.+)$/i.exec(text);
    if (times) {
      if (!features.variables) {
        return { ok: false, line: line.number, message: compileMessages.variablesNotAllowed };
      }
      const name = times[1] ? times[1].toLowerCase() : null;
      if (name) {
        const clash = checkClash(name, variables, constants, labels);
        if (clash) return { ok: false, line: line.number, message: clash };
      }
      const count = parseNumberLiteral(times[2]);
      if (count === null || count < 0) {
        return { ok: false, line: line.number, message: compileMessages.badDirective(text) };
      }
      const size = times[3].toLowerCase() === 'db' ? 1 : 2;
      const value = parseDataValue(times[4], size);
      if (value === null) {
        return { ok: false, line: line.number, message: compileMessages.wrongValue };
      }
      const startAddress = address;
      for (let i = 0; i < count; i++) {
        const placed = placeBytes(memory, address, value.bytes);
        if (!placed.ok) {
          return { ok: false, line: line.number, message: compileMessages.valueTooBig };
        }
        address = placed.next;
      }
      if (name) {
        variables.set(name, { name, address: startAddress, size: address - startAddress });
      }
      continue;
    }

    // --- name equ значение ----------------------------------------------
    const equ = /^([a-z_][a-z0-9_]*)\s+equ\s+(.+)$/i.exec(text);
    if (equ) {
      if (!features.variables) {
        return { ok: false, line: line.number, message: compileMessages.variablesNotAllowed };
      }
      const name = equ[1].toLowerCase();
      const clash = checkClash(name, variables, constants, labels);
      if (clash) return { ok: false, line: line.number, message: clash };
      const value = parseEquValue(equ[2]);
      if (value === null) {
        return { ok: false, line: line.number, message: compileMessages.wrongValue };
      }
      constants.set(name, value);
      continue;
    }

    // --- [name] db|dw|dd значения ----------------------------------------
    const data = /^(?:([a-z_][a-z0-9_]*)\s+)?(db|dw|dd)\s+(.+)$/i.exec(text);
    if (data) {
      if (!features.variables) {
        return { ok: false, line: line.number, message: compileMessages.variablesNotAllowed };
      }
      const name = data[1] ? data[1].toLowerCase() : null;
      const directive = data[2].toLowerCase();
      const size = directive === 'db' ? 1 : directive === 'dw' ? 2 : 4;
      if (name) {
        const clash = checkClash(name, variables, constants, labels);
        if (clash) return { ok: false, line: line.number, message: clash };
      }
      const startAddress = address;
      const values = splitDataValues(data[3]);
      for (const raw of values) {
        const value = parseDataValue(raw, size);
        if (value === null) {
          return { ok: false, line: line.number, message: compileMessages.wrongValue };
        }
        const placed = placeBytes(memory, address, value.bytes);
        if (!placed.ok) {
          return { ok: false, line: line.number, message: compileMessages.valueTooBig };
        }
        address = placed.next;
      }

      if (name) {
        variables.set(name, { name, address: startAddress, size: address - startAddress });
      }
      continue;
    }

    // --- метка кода: name: ------------------------------------------------
    const label = /^([a-z_][a-z0-9_]*)\s*:$/i.exec(text);
    if (label) {
      const name = label[1].toLowerCase();
      if (labels.has(name)) {
        return { ok: false, line: line.number, message: compileMessages.duplicateLabel(name) };
      }
      if (variables.has(name) || constants.has(name)) {
        return { ok: false, line: line.number, message: compileMessages.nameClash(name) };
      }
      if (isReservedName(name)) {
        return { ok: false, line: line.number, message: compileMessages.nameClash(name) };
      }
      labels.add(name);
      continue;
    }
  }

  return { ok: true, symbols: { memory, variables, constants, labels } };
}

// ---------------------------------------------------------------------------

/** Значение элемента данных: строка байтов (little-endian) или строка символов. */
function parseDataValue(text: string, size: number): { bytes: number[] } | null {
  // строка символов: 'Some Text' — в db любой длины (байт на символ),
  // в dw/dd — не длиннее разрядности
  const str = /^(['"])(.*)\1$/.exec(text);
  if (str) {
    const chars = str[2];
    if (chars.length === 0) return null;
    if (size > 1 && chars.length > size) return null;
    const bytes: number[] = [];
    for (const ch of chars) {
      const code = ch.charCodeAt(0);
      if (code > 0x7f) return null;
      bytes.push(code);
    }
    return { bytes };
  }

  const num = parseNumberLiteral(text);
  if (num === null) return null;

  const bounds: Record<number, [number, number]> = {
    1: [-0x80, 0xff],
    2: [-0x8000, 0xffff],
    4: [-0x80000000, 0xffffffff],
  };
  const [min, max] = bounds[size] ?? bounds[1];
  if (num < min || num > max) return null;

  let rest = num;
  const bytes: number[] = [];
  for (let i = 0; i < size; i++) {
    bytes.push(rest & 0xff);
    rest = Math.floor(rest / 256);
  }
  return { bytes };
}

/** Записать байты в память (little-endian) с контролем границ. */
function placeBytes(
  memory: Uint8Array,
  address: number,
  bytes: number[],
): { ok: true; next: number } | { ok: false } {
  if (address + bytes.length > MEMORY_SIZE) return { ok: false };
  for (let i = 0; i < bytes.length; i++) {
    memory[address + i] = bytes[i] & 0xff;
  }
  return { ok: true, next: address + bytes.length };
}

/** Значение equ: число или одиночный символ. */
function parseEquValue(text: string): number | null {
  const char = parseCharLiteral(text.trim());
  if (char && char.chars.length === 1) return char.chars.charCodeAt(0);
  return parseNumberLiteral(text.trim());
}

/** Разбить перечень значений db/dw/dd по запятым вне кавычек. */
function splitDataValues(text: string): string[] {
  const parts: string[] = [];
  let current = '';
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
    if (ch === ',') {
      parts.push(current.trim());
      current = '';
      continue;
    }
    current += ch;
  }
  parts.push(current.trim());
  return parts.filter((p) => p.length > 0);
}

function checkClash(
  name: string,
  variables: Map<string, VariableInfo>,
  constants: Map<string, number>,
  labels: Set<string>,
): string | null {
  if (isReservedName(name)) return compileMessages.nameClash(name);
  if (variables.has(name) || constants.has(name) || labels.has(name)) {
    return compileMessages.nameClash(name);
  }
  return null;
}

/** Имена, которые нельзя давать переменным и меткам. */
function isReservedName(name: string): boolean {
  if (REG16_NAMES.includes(name as never)) return true;
  if (REG8_NAMES.includes(name as never)) return true;
  if (SEG_REG_NAMES.includes(name as never)) return true;
  if (ALL_MNEMONICS.includes(name)) return true;
  return ['db', 'dw', 'dd', 'equ', 'align', 'times', 'org', 'segment'].includes(name);
}
