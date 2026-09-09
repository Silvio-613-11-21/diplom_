/**
 * Ограничения, которые ссылка (?lab=N&z=K) накладывает на эмулятор.
 *
 * allowCmd / allowRegs / denyRegs, равные undefined, означают «не ограничено».
 * Так устроены задания, в тексте которых нет явного перечня разрешённого.
 */

/** Возможности эмулятора, включающиеся по мере прохождения лабораторных. */
export interface EmulatorFeatures {
  /** %macro / %endmacro и вызовы макросов (л.р. 2+). */
  macros: boolean;
  /** call / ret — подпрограммы (л.р. 2+). */
  subroutines: boolean;
  /** Обращения к памяти byte[…] / word[…] (л.р. 3+). */
  memory: boolean;
  /** Переменные и константы: db / dw / dd / equ / align / times (л.р. 4+). */
  variables: boolean;
  /** Прерывания ввода-вывода: int 21h функции 01h/02h/09h (л.р. 5+). */
  io: boolean;
}

export const ALL_FEATURES: EmulatorFeatures = {
  macros: true,
  subroutines: true,
  memory: true,
  variables: true,
  io: true,
};

export const NO_EXTRA_FEATURES: EmulatorFeatures = {
  macros: false,
  subroutines: false,
  memory: false,
  variables: false,
  io: false,
};

export interface TaskRestricts {
  /** Номер лабораторной работы (1..5). */
  lab: number;
  /** Номер задачи, как в ссылке (?z=3 или ?z=00). */
  task: string;
  /** Разрешённые команды; undefined — разрешено всё, что умеет эмулятор. */
  allowCmd?: readonly string[];
  /** Разрешённые 16-битные регистры; undefined — разрешены все. */
  allowRegs?: readonly string[];
  /** Явно запрещённые регистры («регистры BX и SI использовать нельзя»). */
  denyRegs?: readonly string[];
  /** Возможности эмулятора для этой лабораторной. */
  features: EmulatorFeatures;
}
