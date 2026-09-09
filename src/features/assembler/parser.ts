import type {
  AsmInstruction, ImmOperand, JumpMnemonic, LabelInstruction,
  OneOpMnemonic, Operand, Reg8Name, RegOperand, TwoOpMnemonic,
} from '../../shared/types/asm';
import { ALL_MNEMONICS, HALF_PARENT } from '../../shared/types/asm';
import type { TaskRestricts } from '../../shared/types/restrictions';
import { ALL_FEATURES } from '../../shared/types/restrictions';
import { compileError, compileMessages } from '../../shared/config/messages';
import type { SourceLine } from './model/source';
import { prepareLines, splitOperands } from './model/source';
import { expandMacros } from './model/macros';
import { collectSymbols, type SymbolTable } from './model/symbols';
import type { VariableInfo } from '../../shared/types/asm';
import { parseOperand } from './model/operand';
import { parseNumberLiteral } from './model/literals';

/**
 * Парсер ассемблера: исходный текст -> внутреннее представление программы.
 * Полностью отделён от интерфейса: принимает строку и ограничения,
 * возвращает программу или сообщение об ошибке.
 */

export interface ParseSuccess {
  ok: true;
  instructions: AsmInstruction[];
  /** Метка -> индекс инструкции (для переходов). */
  labelIndex: Map<string, number>;
  /** Начальная память данных (256 байт). */
  memory: Uint8Array;
  /** Переменные сегмента данных (для легенды под дампом памяти). */
  variables: VariableInfo[];
}

export type ParseResult =
  | ParseSuccess
  | { ok: false; error: string };

const ONE_OP: readonly string[] = ['push', 'pop', 'inc', 'dec', 'neg', 'not'];
const JUMPS: readonly string[] = [
  'jmp', 'js', 'jns', 'jz', 'je', 'jnz', 'jne',
  'ja', 'jae', 'jb', 'jbe', 'jl', 'jge', 'jg', 'jle',
  'loop', 'call',
];

export function parseProgram(source: string, restricts?: TaskRestricts): ParseResult {
  // 1. Подготовка строк: комментарии, пустые строки, «метка: команда»
  let lines = prepareLines(source);
  lines = splitLabelLines(lines);
  if (lines.length === 0) {
    return { ok: false, error: compileMessages.noCode };
  }

  // 2. Раскрытие макросов (%macro … %endmacro)
  // без ограничений (свободный режим) доступно всё
  const macroPass = expandMacros(lines, restricts?.features ?? ALL_FEATURES);
  if (!macroPass.ok) {
    return { ok: false, error: compileError(macroPass.line, macroPass.message) };
  }
  lines = macroPass.lines;
  if (lines.length === 0) {
    return { ok: false, error: compileMessages.noCode };
  }

  // 3. Сбор символов: переменные, константы, метки + память данных
  const symbolPass = collectSymbols(lines, restricts?.features ?? ALL_FEATURES);
  if (!symbolPass.ok) {
    return { ok: false, error: compileError(symbolPass.line, symbolPass.message) };
  }
  const symbols = symbolPass.symbols;

  // 4. Разбор команд
  const instructions: AsmInstruction[] = [];
  const labelIndex = new Map<string, number>();

  for (const line of lines) {
    if (isSkippedDirective(line.text)) continue;

    const label = /^([a-z_][a-z0-9_]*)\s*:$/i.exec(line.text);
    if (label) {
      labelIndex.set(label[1].toLowerCase(), instructions.length);
      instructions.push(makeLabel(line, label[1].toLowerCase()));
      continue;
    }

    const instr = parseInstructionLine(line, symbols, restricts);
    if (typeof instr === 'string') {
      return { ok: false, error: compileError(line.number, instr) };
    }
    if (instr !== null) instructions.push(instr);
  }

  // 5. Проверка существования меток у переходов
  for (const instr of instructions) {
    if (instr.kind === 'jump' && !labelIndex.has(instr.label)) {
      return { ok: false, error: compileError(instr.line, compileMessages.unknownLabel(instr.label)) };
    }
  }

  return {
    ok: true,
    instructions,
    labelIndex,
    memory: symbols.memory,
    variables: [...symbols.variables.values()],
  };
}

// ===========================================================================
// Вспомогательные проходы
// ===========================================================================

/** «метка: команда» на одной строке -> две отдельные строки. */
function splitLabelLines(lines: SourceLine[]): SourceLine[] {
  const result: SourceLine[] = [];
  for (const line of lines) {
    const match = /^([a-z_][a-z0-9_]*\s*):\s*(.+)$/i.exec(line.text);
    if (match && !/^segment\b/i.test(match[2])) {
      result.push({ number: line.number, text: `${match[1]}:` });
      result.push({ number: line.number, text: match[2] });
    } else {
      result.push(line);
    }
  }
  return result;
}

/** Директивы, не порождающие команд (обработаны в collectSymbols). */
function isSkippedDirective(text: string): boolean {
  if (/^(?:[a-z_][a-z0-9_]*\s*:\s*)?segment\s*\.(code|data)$/i.test(text)) return true;
  if (/^org\s+/i.test(text)) return true;
  if (/^align\s+/i.test(text)) return true;
  if (/^([a-z_][a-z0-9_]*\s+)?times\s+/i.test(text)) return true;
  if (/^[a-z_][a-z0-9_]*\s+equ\s+/i.test(text)) return true;
  if (/^(?:[a-z_][a-z0-9_]*\s+)?(db|dw|dd)\s+/i.test(text)) return true;
  return false;
}

function makeLabel(line: SourceLine, name: string): LabelInstruction {
  return { kind: 'label', name, line: line.number, source: line.text };
}

// ===========================================================================
// Разбор строки команды
// ===========================================================================

function parseInstructionLine(
  line: SourceLine,
  symbols: SymbolTable,
  restricts: TaskRestricts | undefined,
): AsmInstruction | null | string {
  const match = /^([a-z][a-z0-9]*)\s*(.*)$/i.exec(line.text);
  if (!match) return compileMessages.unknownCommand(line.text);

  const mnemonic = match[1].toLowerCase();
  const rest = match[2].trim();

  if (!ALL_MNEMONICS.includes(mnemonic)) {
    return compileMessages.unknownCommand(mnemonic);
  }

  // --- проверка ограничения по команде ------------------------------------
  const cmdError = checkCommandAllowed(mnemonic, restricts);
  if (cmdError) return cmdError;

  const features = restricts?.features ?? ALL_FEATURES;

  // --- ret / retf -----------------------------------------------------------
  if (mnemonic === 'ret' || mnemonic === 'retf') {
    if (rest.length > 0) return compileMessages.tooManyParams(mnemonic);
    return { kind: 'ret', line: line.number, source: line.text };
  }

  // --- int N ----------------------------------------------------------------
  if (mnemonic === 'int') {
    const value = parseNumberLiteral(squeeze(rest));
    if (value === null) return compileMessages.wrongValue;
    return { kind: 'int', number: value, line: line.number, source: line.text };
  }

  // --- переходы ---------------------------------------------------------------
  if (JUMPS.includes(mnemonic)) {
    const labelMatch = /^([a-z_][a-z0-9_]*)$/i.exec(rest);
    if (!labelMatch) return compileMessages.wrongValue;
    return {
      kind: 'jump',
      mnemonic: mnemonic as JumpMnemonic,
      label: labelMatch[1].toLowerCase(),
      line: line.number,
      source: line.text,
    };
  }

  // --- команды с одним операндом ----------------------------------------------
  if (ONE_OP.includes(mnemonic)) {
    const parts = splitOperands(rest);
    if (parts.length !== 1) {
      return parts.length === 0
        ? compileMessages.emptyOperand
        : compileMessages.tooManyParams(mnemonic);
    }
    const op = parseOperand(parts[0], symbols, features);
    if (!op.ok) return op.message;

    const semantic = checkOneOp(mnemonic as OneOpMnemonic, op.operand);
    if (semantic) return semantic;

    const regError = checkRegOperands([op.operand], restricts, null);
    if (regError) return regError;

    return { kind: 'one', mnemonic: mnemonic as OneOpMnemonic, op: op.operand, line: line.number, source: line.text };
  }

  // --- команды с двумя операндами ------------------------------------------------
  const parts = splitOperands(rest);
  if (parts.length === 1 && parts[0].length > 0) return compileMessages.missingComma;
  if (parts.length !== 2) {
    return parts.length === 0
      ? compileMessages.emptyOperand
      : compileMessages.tooManyParams(mnemonic);
  }

  const dst = parseOperand(parts[0], symbols, features);
  if (!dst.ok) return dst.message;
  const src = parseOperand(parts[1], symbols, features);
  if (!src.ok) return src.message;

  const semantic = checkTwoOp(mnemonic as TwoOpMnemonic, dst.operand, src.operand);
  if (semantic) return semantic;

  // стандартное завершение (mov ax, 4C00h / mov ah, 4Ch) — всегда разрешено
  const standardExit = isStandardExit(mnemonic, dst.operand, src.operand);
  const regError = checkRegOperands([dst.operand, src.operand], restricts, standardExit ? dst.operand : null);
  if (regError) return regError;

  return {
    kind: 'two',
    mnemonic: mnemonic as TwoOpMnemonic,
    dst: dst.operand,
    src: src.operand,
    line: line.number,
    source: line.text,
  };
}

function squeeze(text: string): string {
  return text.replace(/\s+/g, '');
}

// ===========================================================================
// Ограничения
// ===========================================================================

function checkCommandAllowed(mnemonic: string, restricts: TaskRestricts | undefined): string | null {
  if (!restricts) return null;

  // прерывание нужно для стандартного завершения — разрешено всегда
  if (mnemonic === 'int') return null;

  if (restricts.features.subroutines === false && (mnemonic === 'call' || mnemonic === 'ret' || mnemonic === 'retf')) {
    return compileMessages.subroutineNotAllowed;
  }

  if (restricts.allowCmd && !restricts.allowCmd.includes(mnemonic)) {
    return compileMessages.commandNotAllowed(mnemonic);
  }
  return null;
}

/** Проверить регистровые операнды по ограничениям задания. */
function checkRegOperands(
  operands: Operand[],
  restricts: TaskRestricts | undefined,
  /** Операнд стандартного завершения — проверку регистра пропускает. */
  exitReg: Operand | null,
): string | null {
  if (!restricts) return null;

  for (const operand of operands) {
    if (operand.kind !== 'reg') continue;
    if (exitReg === operand) continue;

    const reg = operand as RegOperand;
    const parent = reg.size === 1 ? HALF_PARENT[reg.name as Reg8Name] : reg.name;

    if (restricts.denyRegs) {
      if (restricts.denyRegs.includes(reg.name) || restricts.denyRegs.includes(parent)) {
        return compileMessages.registerForbidden(reg.name);
      }
    }

    if (restricts.allowRegs) {
      // при явном перечне полурегистры запрещены (условие задач л.р. 1)
      if (reg.size === 1) return compileMessages.registerNotAllowed(reg.name);
      if (!restricts.allowRegs.includes(reg.name)) {
        return compileMessages.registerNotAllowed(reg.name);
      }
    }
  }
  return null;
}

/** mov ax, 4C00h или mov ah, 4Ch — стандартное завершение программы. */
function isStandardExit(mnemonic: string, dst: Operand, src: Operand): boolean {
  if (mnemonic !== 'mov') return false;
  if (dst.kind !== 'reg' || src.kind !== 'imm') return false;
  if (dst.name === 'ax' && (src as ImmOperand).value === 0x4c00) return true;
  if (dst.name === 'ah' && (src as ImmOperand).value === 0x4c) return true;
  return false;
}

// ===========================================================================
// Семантические проверки команд
// ===========================================================================

function checkOneOp(mnemonic: OneOpMnemonic, op: Operand): string | null {
  switch (mnemonic) {
    case 'push':
    case 'pop':
      if (op.kind !== 'reg') return compileMessages.wrongValue;
      if (op.size === 1) return compileMessages.pushByte;
      return null;
    case 'inc':
    case 'dec':
    case 'neg':
    case 'not':
      if (op.kind === 'imm') return compileMessages.wrongValue;
      return null;
  }
}

function checkTwoOp(mnemonic: TwoOpMnemonic, dst: Operand, src: Operand): string | null {
  switch (mnemonic) {
    case 'shl':
    case 'shr': {
      if (dst.kind === 'imm') return compileMessages.wrongValue;
      if (src.kind !== 'imm') return compileMessages.badShiftCount;
      const count = (src as ImmOperand).value;
      if (count < 0 || count > 31) return compileMessages.badShiftCount;
      return null;
    }
    case 'mov':
    case 'xchg':
    case 'add':
    case 'sub':
    case 'and':
    case 'or':
    case 'xor':
    case 'cmp':
    case 'test': {
      if (dst.kind === 'imm') return compileMessages.wrongValue;
      if (dst.kind === 'mem' && src.kind === 'mem') return compileMessages.memToMem;

      // разрядность операндов должна совпадать
      const dstSize = operandSize(dst);
      const srcSize = operandSize(src);
      if (dstSize !== null && srcSize !== null && dstSize !== srcSize) {
        return compileMessages.sizeMismatch;
      }

      // числовой диапазон по разрядности приёмника
      if (src.kind === 'imm') {
        const value = (src as ImmOperand).value;
        const max = dstSize === 1 ? 0xff : 0xffff;
        if (value > max || value < (dstSize === 1 ? -0x80 : -0x8000)) {
          return compileMessages.valueTooBig;
        }
      }
      return null;
    }
  }
}

function operandSize(op: Operand): 1 | 2 | null {
  if (op.kind === 'reg') return op.size;
  if (op.kind === 'mem') return op.size;
  return null; // число — диапазон проверяется отдельно
}
