import type { FlagsState } from '../../../shared/types/asm';

/**
 * Вычисление флагов процессора после арифметических и логических операций.
 */

export function emptyFlags(): FlagsState {
  return { of: false, df: false, if: false, sf: false, zf: false, af: false, pf: false, cf: false };
}

function parity(value: number): boolean {
  let byte = value & 0xff;
  let bits = 0;
  while (byte) {
    bits += byte & 1;
    byte >>= 1;
  }
  return bits % 2 === 0; // PF = 1 при чётном числе единиц
}

/** Флаги после сложения/вычитания (a ± b). */
export function arithFlags(
  flags: FlagsState,
  size: 1 | 2,
  a: number,
  b: number,
  result: number,
  op: 'add' | 'sub',
): void {
  const msb = size === 1 ? 0x80 : 0x8000;
  const mask = size === 1 ? 0xff : 0xffff;

  flags.zf = (result & mask) === 0;
  flags.sf = (result & msb) !== 0;
  flags.pf = parity(result & 0xff);
  flags.af = ((a ^ b ^ result) & 0x10) !== 0;

  if (op === 'add') {
    flags.cf = result > mask;
    flags.of = (~(a ^ b) & (a ^ result) & msb) !== 0;
  } else {
    flags.cf = a < b; // заём
    flags.of = ((a ^ b) & (a ^ result) & msb) !== 0;
  }
}

/** Флаги после логической операции (and/or/xor/test): CF = OF = 0. */
export function logicFlags(flags: FlagsState, size: 1 | 2, result: number): void {
  const msb = size === 1 ? 0x80 : 0x8000;
  flags.zf = result === 0;
  flags.sf = (result & msb) !== 0;
  flags.pf = parity(result);
  flags.cf = false;
  flags.of = false;
  flags.af = false;
}

/** Флаги после inc/dec: CF не меняется. */
export function incDecFlags(
  flags: FlagsState,
  size: 1 | 2,
  a: number,
  result: number,
  op: 'inc' | 'dec',
): void {
  const msb = size === 1 ? 0x80 : 0x8000;
  flags.zf = result === 0;
  flags.sf = (result & msb) !== 0;
  flags.pf = parity(result);
  flags.af = ((a ^ 1 ^ result) & 0x10) !== 0;
  // inc: OF=1 при переходе через максимум знакового диапазона,
  // dec: OF=1 при переходе через минимум
  flags.of = op === 'inc' ? a === msb - 1 : a === msb;
}
