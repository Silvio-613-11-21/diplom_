/**
 * Общие типы «внутреннего представления» ассемблерной программы.
 *
 * Эти типы — контракт между ядром эмулятора (features/assembler, features/emulator)
 * и интерфейсом (entities, widgets). Ядро не знает про DOM, интерфейс не знает
 * про то, как выполняются команды.
 */

/** 16-битные регистры общего назначения и указателей. */
export const REG16_NAMES = ['ax', 'bx', 'cx', 'dx', 'si', 'di', 'bp', 'sp'] as const;

/** Сегментные регистры (в COM-программе все равны). */
export const SEG_REG_NAMES = ['cs', 'ds', 'es', 'ss'] as const;

/** 8-битные половинки регистров общего назначения. */
export const REG8_NAMES = ['ah', 'al', 'bh', 'bl', 'ch', 'cl', 'dh', 'dl'] as const;

export type Reg16Name = (typeof REG16_NAMES)[number];
export type SegRegName = (typeof SEG_REG_NAMES)[number];
export type Reg8Name = (typeof REG8_NAMES)[number];
export type RegName = Reg16Name | SegRegName | Reg8Name;

/** Родительский 16-битный регистр для 8-битной половинки (ah -> ax). */
export const HALF_PARENT: Record<Reg8Name, Reg16Name> = {
  ah: 'ax', al: 'ax',
  bh: 'bx', bl: 'bx',
  ch: 'cx', cl: 'cx',
  dh: 'dx', dl: 'dx',
};

/** Имена флагов (в порядке, привычном по дебаггеру). */
export const FLAG_NAMES = ['of', 'df', 'if', 'sf', 'zf', 'af', 'pf', 'cf'] as const;
export type FlagName = (typeof FLAG_NAMES)[number];
export type FlagsState = Record<FlagName, boolean>;

// ============================================================================
// Переменные сегмента данных
// ============================================================================

export interface VariableInfo {
  name: string;
  address: number;
  /** Размер в байтах. */
  size: number;
}

// ============================================================================
// Операнды
// ============================================================================

export interface RegOperand {
  kind: 'reg';
  /** Имя регистра в нижнем регистре: ax, bh, si, ds… */
  name: RegName;
  /** Размер в байтах: 1 — 8-битная половинка, 2 — 16-битный регистр. */
  size: 1 | 2;
}

export interface ImmOperand {
  kind: 'imm';
  /** Числовое значение (для символов — ASCII-код). */
  value: number;
  /** Исходный текст операнда — для отображения в листинге. */
  text: string;
}

export interface MemOperand {
  kind: 'mem';
  /** Размер обращения: 1 — byte, 2 — word. */
  size: 1 | 2;
  /** Участвует ли регистр SI в вычислении адреса. */
  useSi: boolean;
  /** Участвует ли регистр BX в вычислении адреса. */
  useBx: boolean;
  /** Константное смещение (может быть отрицательным). */
  offset: number;
  /** Исходный текст операнда — для отображения в листинге. */
  text: string;
}

export type Operand = RegOperand | ImmOperand | MemOperand;

// ============================================================================
// Инструкции
// ============================================================================

/** Команды с двумя операндами. */
export type TwoOpMnemonic =
  | 'mov' | 'xchg'
  | 'add' | 'sub'
  | 'and' | 'or' | 'xor'
  | 'cmp' | 'test'
  | 'shl' | 'shr';

/** Команды с одним операндом. */
export type OneOpMnemonic = 'push' | 'pop' | 'inc' | 'dec' | 'neg' | 'not';

/** Переходы (безусловные, условные, цикл и вызов подпрограммы). */
export type JumpMnemonic =
  | 'jmp'
  | 'js' | 'jns'
  | 'jz' | 'je' | 'jnz' | 'jne'
  | 'ja' | 'jae' | 'jb' | 'jbe'
  | 'jl' | 'jge' | 'jg' | 'jle'
  | 'loop'
  | 'call';

export interface BaseInstruction {
  /** Номер строки исходного текста (с единицы). */
  line: number;
  /** Очищенный исходный текст строки — для листинга. */
  source: string;
}

export interface TwoOpInstruction extends BaseInstruction {
  kind: 'two';
  mnemonic: TwoOpMnemonic;
  dst: Operand;
  src: Operand;
}

export interface OneOpInstruction extends BaseInstruction {
  kind: 'one';
  mnemonic: OneOpMnemonic;
  op: Operand;
}

export interface JumpInstruction extends BaseInstruction {
  kind: 'jump';
  mnemonic: JumpMnemonic;
  label: string;
}

export interface IntInstruction extends BaseInstruction {
  kind: 'int';
  /** Номер прерывания (33 = 21h). */
  number: number;
}

export interface RetInstruction extends BaseInstruction {
  kind: 'ret';
}

export interface LabelInstruction extends BaseInstruction {
  kind: 'label';
  name: string;
}

export type AsmInstruction =
  | TwoOpInstruction
  | OneOpInstruction
  | JumpInstruction
  | IntInstruction
  | RetInstruction
  | LabelInstruction;

/** Все мнемоники, поддерживаемые эмулятором. */
export const ALL_MNEMONICS: readonly string[] = [
  'mov', 'xchg', 'push', 'pop',
  'add', 'sub', 'inc', 'dec', 'neg',
  'and', 'or', 'xor', 'not', 'shl', 'shr', 'cmp', 'test',
  'jmp', 'js', 'jns', 'jz', 'je', 'jnz', 'jne',
  'ja', 'jae', 'jb', 'jbe', 'jl', 'jge', 'jg', 'jle',
  'loop', 'call', 'ret', 'retf', 'int',
];
