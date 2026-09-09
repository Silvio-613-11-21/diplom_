import type { FlagsState, Reg8Name, Reg16Name, SegRegName } from './asm';

/**
 * Снимок состояния машины на текущий момент.
 * Плоские данные без методов: ядро отдаёт снимок, интерфейс — рисует.
 */
export interface MachineSnapshot {
  /** Значения 16-битных регистров (ax..sp). */
  regs: Record<Reg16Name, number>;
  /** Значения сегментных регистров. */
  segRegs: Record<SegRegName, number>;
  /** Значения 8-битных половинок. */
  halfRegs: Record<Reg8Name, number>;
  /** Флаги. */
  flags: FlagsState;
  /** Память данных (256 байт, копия). */
  memory: Uint8Array;
  /** Содержимое стека: первый элемент — вершина. */
  stack: number[];
  /** Текущее значение SP. */
  sp: number;
  /** Индекс текущей инструкции (для подсветки строки в листинге). */
  ip: number;
  /** Программа завершена (int 21h / AH=4Ch). */
  halted: boolean;
  /** Ожидается нажатие клавиши (int 21h / AH=01h). */
  awaitingInput: boolean;
}

/** Система счисления для отображения значений в интерфейсе. */
export type DisplayBase = 16 | 10 | 2;
