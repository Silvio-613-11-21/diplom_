import type {
  AsmInstruction, FlagsState, ImmOperand, JumpMnemonic, MemOperand,
  OneOpMnemonic, Operand, Reg16Name, Reg8Name, RegName, SegRegName, TwoOpMnemonic,
} from '../../shared/types/asm';
import { HALF_PARENT, REG16_NAMES, REG8_NAMES, SEG_REG_NAMES } from '../../shared/types/asm';
import type { EmulatorFeatures } from '../../shared/types/restrictions';
import type { MachineSnapshot } from '../../shared/types/machine';
import { runMessages } from '../../shared/config/messages';
import { arithFlags, emptyFlags, incDecFlags, logicFlags } from './model/flags';

/**
 * Виртуальная машина: исполняет внутреннее представление программы.
 *
 * Машина полностью изолирована от интерфейса:
 *  - на вход принимает программу и параметры,
 *  - наружу отдаёт результат шага и снимок состояния (snapshot).
 *
 * Модель памяти — 256 байт (дамп 16×16, как в дебаггере из лабораторных).
 */

export const MEMORY_SIZE = 256;
const STACK_CAPACITY = 64;

export type StepStatus = 'ok' | 'halted' | 'error' | 'input-needed';

export interface StepResult {
  status: StepStatus;
  /** Сообщение для консоли. */
  message?: string;
  /** Номер строки исходника, к которой относится сообщение. */
  line?: number;
}

export interface EmulatorDeps {
  program: AsmInstruction[];
  labelIndex: Map<string, number>;
  initialMemory: Uint8Array;
  features: EmulatorFeatures;
}

type RegsMap = Record<Reg16Name, number>;
type SegRegsMap = Record<SegRegName, number>;
type HalfRegsMap = Record<Reg8Name, number>;

export class Emulator {
  readonly program: AsmInstruction[];
  private readonly labelIndex: Map<string, number>;
  private readonly initialMemory: Uint8Array;
  private readonly features: EmulatorFeatures;

  private regs: RegsMap;
  private segRegs: SegRegsMap;
  private flags: FlagsState;
  private memory: Uint8Array;
  /** Стек: слова; конец массива — вершина. */
  private stack: number[] = [];
  private outputQueue: string[] = [];
  /** Скан-код расширенной клавиши, ожидающей второго чтения (int 21h/01h). */
  private pendingExtended: number | null = null;

  /** Индекс текущей инструкции. */
  ip = 0;
  halted = false;
  awaitingInput = false;

  constructor(deps: EmulatorDeps) {
    this.program = deps.program;
    this.labelIndex = deps.labelIndex;
    this.initialMemory = deps.initialMemory;
    this.features = deps.features;
    this.regs = makeRegs();
    this.segRegs = makeSegRegs();
    this.flags = emptyFlags();
    this.memory = new Uint8Array(MEMORY_SIZE);
    this.reset();
  }

  /** Сброс машины в начальное состояние. */
  reset(): void {
    this.regs = makeRegs();
    this.segRegs = makeSegRegs();
    this.flags = emptyFlags();
    this.memory = new Uint8Array(this.initialMemory);
    this.stack = [];
    this.outputQueue = [];
    this.pendingExtended = null;
    this.ip = 0;
    this.halted = false;
    this.awaitingInput = false;
  }

  /**
   * Выполнить одну инструкцию.
   * Метки пропускаются (ip движется дальше).
   */
  step(): StepResult {
    if (this.halted) return { status: 'halted', message: runMessages.programEnd };
    if (this.awaitingInput) return { status: 'input-needed', message: runMessages.awaitInput };

    if (this.ip < 0 || this.ip >= this.program.length) {
      this.halted = true;
      return { status: 'error', message: 'выполнение вышло за пределы программы' };
    }

    const instr = this.program[this.ip];

    switch (instr.kind) {
      case 'label':
        this.ip++;
        return { status: 'ok' };

      case 'two': {
        const error = this.executeTwo(instr.mnemonic, instr.dst, instr.src);
        return this.finishStep(error, instr.line);
      }
      case 'one': {
        const error = this.executeOne(instr.mnemonic, instr.op);
        return this.finishStep(error, instr.line);
      }
      case 'jump': {
        const result = this.executeJump(instr.mnemonic, instr.label);
        if (typeof result === 'string') return this.failStep(result, instr.line);
        if (!result.jumped) this.ip++; // переход не состоялся — идём дальше
        return { status: 'ok', line: instr.line };
      }
      case 'ret': {
        if (this.stack.length === 0) {
          return this.failStep(runMessages.retWithoutCall, instr.line);
        }
        this.ip = this.stack.pop()!;
        this.sp += 2;
        return { status: 'ok' };
      }
      case 'int': {
        return this.executeInt(instr.number, instr.line);
      }
    }
  }

  /**
   * Выполнять программу до завершения / ошибки / ожидания ввода.
   * Защищено от зацикливания лимитом шагов.
   */
  run(maxSteps = 100_000): StepResult {
    for (let i = 0; i < maxSteps; i++) {
      const result = this.step();
      if (result.status !== 'ok') return result;
    }
    return { status: 'error', message: runMessages.infiniteLoop };
  }

  /** Ответ на ожидание клавиши (int 21h, функция 01h). */
  provideInput(code: number, extended: boolean): void {
    if (!this.awaitingInput) return;

    if (extended && this.pendingExtended === null) {
      // первый байт расширенной клавиши — ноль, второй — скан-код
      this.setReg('al', 0);
      this.pendingExtended = code & 0xff;
    } else if (!extended && this.pendingExtended !== null) {
      this.setReg('al', this.pendingExtended);
      this.pendingExtended = null;
    } else if (extended && this.pendingExtended !== null) {
      this.setReg('al', code & 0xff);
      this.pendingExtended = null;
    } else {
      this.setReg('al', code & 0xff);
    }

    this.awaitingInput = false;
    this.ip++;
  }

  /** Забрать накопленный вывод (символы для «экрана»). */
  takeOutput(): string {
    if (this.outputQueue.length === 0) return '';
    const text = this.outputQueue.join('');
    this.outputQueue = [];
    return text;
  }

  /** Снимок состояния для отрисовки интерфейсом. */
  snapshot(): MachineSnapshot {
    const halfRegs = {} as HalfRegsMap;
    for (const name of REG8_NAMES) {
      halfRegs[name] = this.getReg(name);
    }
    const memory = new Uint8Array(this.memory);
    return {
      regs: { ...this.regs },
      segRegs: { ...this.segRegs },
      halfRegs,
      flags: { ...this.flags },
      memory,
      stack: [...this.stack].reverse(),
      sp: this.sp,
      ip: this.ip,
      halted: this.halted,
      awaitingInput: this.awaitingInput,
    };
  }

  private get sp(): number {
    return this.regs.sp;
  }

  private set sp(value: number) {
    this.regs.sp = value & 0xffff;
  }

  // ==========================================================================
  // Работа с регистрами
  // ==========================================================================

  private getReg(name: RegName): number {
    if (isReg8(name)) {
      const parent = this.regs[HALF_PARENT[name]];
      return name.endsWith('h') ? (parent >> 8) & 0xff : parent & 0xff;
    }
    if (isSegReg(name)) return this.segRegs[name];
    return this.regs[name];
  }

  private setReg(name: RegName, value: number): void {
    const masked = value & 0xffff;
    if (isReg8(name)) {
      const parent = HALF_PARENT[name];
      const current = this.regs[parent];
      this.regs[parent] = name.endsWith('h')
        ? ((masked & 0xff) << 8) | (current & 0xff)
        : (current & 0xff00) | (masked & 0xff);
      return;
    }
    if (isSegReg(name)) {
      this.segRegs[name] = masked;
      return;
    }
    this.regs[name] = masked;
  }

  // ==========================================================================
  // Работа с памятью
  // ==========================================================================

  private memAddress(op: MemOperand): number {
    let address = op.offset;
    if (op.useSi) address += this.regs.si;
    if (op.useBx) address += this.regs.bx;
    return address & 0xff; // дамп 256 байт — адрес заворачивается
  }

  private readMem(address: number, size: 1 | 2): number {
    if (size === 1) return this.memory[address & 0xff];
    const low = this.memory[address & 0xff];
    const high = this.memory[(address + 1) & 0xff];
    return low | (high << 8); // little-endian
  }

  private writeMem(address: number, size: 1 | 2, value: number): void {
    this.memory[address & 0xff] = value & 0xff;
    if (size === 2) {
      this.memory[(address + 1) & 0xff] = (value >> 8) & 0xff;
    }
  }

  // ==========================================================================
  // Операнды
  // ==========================================================================

  private operandSize(op: Operand): 1 | 2 {
    if (op.kind === 'imm') {
      return op.value <= 0xff && op.value >= -0x80 ? 1 : 2;
    }
    return op.size;
  }

  private readOperand(op: Operand): number {
    switch (op.kind) {
      case 'reg': return this.getReg(op.name);
      case 'imm': return op.value;
      case 'mem': return this.readMem(this.memAddress(op), op.size);
    }
  }

  private writeOperand(op: Operand, value: number): void {
    switch (op.kind) {
      case 'reg': this.setReg(op.name, value); return;
      case 'imm': return; // проверено парсером — не бывает
      case 'mem': this.writeMem(this.memAddress(op), op.size, value); return;
    }
  }

  // ==========================================================================
  // Команды
  // ==========================================================================

  private executeTwo(mnemonic: TwoOpMnemonic, dst: Operand, src: Operand): string | null {
    const size = dst.kind === 'imm' ? 2 : this.operandSize(dst);

    switch (mnemonic) {
      case 'mov': {
        this.writeOperand(dst, this.readOperand(src));
        return null;
      }
      case 'xchg': {
        const a = this.readOperand(dst);
        const b = this.readOperand(src);
        this.writeOperand(dst, b);
        this.writeOperand(src, a);
        return null;
      }
      case 'add':
      case 'sub': {
        const a = this.readOperand(dst);
        const b = this.readOperand(src);
        const raw = mnemonic === 'add' ? a + b : a - b;
        const result = raw & (size === 1 ? 0xff : 0xffff);
        this.writeOperand(dst, result);
        arithFlags(this.flags, size, a, b, raw, mnemonic === 'add' ? 'add' : 'sub');
        return null;
      }
      case 'cmp': {
        const a = this.readOperand(dst);
        const b = this.readOperand(src);
        const raw = a - b;
        arithFlags(this.flags, size, a, b, raw, 'sub');
        return null;
      }
      case 'and':
      case 'or':
      case 'xor':
      case 'test': {
        const a = this.readOperand(dst);
        const b = this.readOperand(src);
        const result =
          mnemonic === 'and' || mnemonic === 'test' ? a & b
          : mnemonic === 'or' ? a | b
          : a ^ b;
        if (mnemonic !== 'test') this.writeOperand(dst, result);
        logicFlags(this.flags, size, result & (size === 1 ? 0xff : 0xffff));
        return null;
      }
      case 'shl':
      case 'shr': {
        const count = (src as ImmOperand).value;
        if (count === 0) return null; // флаги не меняются
        const a = this.readOperand(dst);
        const bits = size * 8;
        const mask = size === 1 ? 0xff : 0xffff;
        let result: number;
        let cf: boolean;

        if (mnemonic === 'shl') {
          const shifted = a << count;
          result = shifted & mask;
          cf = count <= bits ? ((a >> (bits - count)) & 1) === 1 : false;
          if (count === 1) {
            const msb = (result & (size === 1 ? 0x80 : 0x8000)) !== 0;
            this.flags.of = cf !== msb;
          }
        } else {
          const unsigned = a & mask;
          result = unsigned >>> count;
          cf = ((unsigned >> (count - 1)) & 1) === 1;
          if (count === 1) {
            this.flags.of = (unsigned & (size === 1 ? 0x80 : 0x8000)) !== 0;
          }
        }

        this.writeOperand(dst, result);
        this.flags.cf = cf;
        this.flags.zf = result === 0;
        this.flags.sf = (result & (size === 1 ? 0x80 : 0x8000)) !== 0;
        this.flags.pf = evenParity(result & 0xff);
        return null;
      }
    }
  }

  private executeOne(mnemonic: OneOpMnemonic, op: Operand): string | null {
    const size = this.operandSize(op);

    switch (mnemonic) {
      case 'push': {
        if (this.stack.length >= STACK_CAPACITY) return runMessages.stackOverflow;
        this.stack.push(this.readOperand(op));
        this.sp -= 2;
        return null;
      }
      case 'pop': {
        if (this.stack.length === 0) return runMessages.stackEmpty;
        const value = this.stack.pop()!;
        this.sp += 2;
        this.writeOperand(op, value);
        return null;
      }
      case 'inc':
      case 'dec': {
        const a = this.readOperand(op);
        const raw = mnemonic === 'inc' ? a + 1 : a - 1;
        const result = raw & (size === 1 ? 0xff : 0xffff);
        this.writeOperand(op, result);
        incDecFlags(this.flags, size, a, result, mnemonic);
        return null;
      }
      case 'neg': {
        const a = this.readOperand(op);
        const result = (-a) & (size === 1 ? 0xff : 0xffff);
        this.writeOperand(op, result);
        arithFlags(this.flags, size, 0, a, -a, 'sub');
        this.flags.cf = a !== 0;
        return null;
      }
      case 'not': {
        const a = this.readOperand(op);
        this.writeOperand(op, ~a & (size === 1 ? 0xff : 0xffff));
        return null;
      }
    }
  }

  /**
   * Выполнить переход. Сама функция ip не двигает:
   * при состоявшемся переходе jumpTo уже установил ip,
   * иначе step() сделает ip++.
   */
  private executeJump(
    mnemonic: JumpMnemonic,
    label: string,
  ): { jumped: boolean } | string {
    // loop — цикл со счётчиком CX
    if (mnemonic === 'loop') {
      const cx = (this.regs.cx - 1) & 0xffff;
      this.regs.cx = cx;
      if (cx !== 0) {
        this.jumpTo(label);
        return { jumped: true };
      }
      return { jumped: false };
    }

    // call — адрес возврата в стек, переход всегда
    if (mnemonic === 'call') {
      if (this.stack.length >= STACK_CAPACITY) return runMessages.stackOverflow;
      this.stack.push(this.ip + 1);
      this.sp -= 2;
      this.jumpTo(label);
      return { jumped: true };
    }

    if (this.jumpTaken(mnemonic)) {
      this.jumpTo(label);
      return { jumped: true };
    }
    return { jumped: false };
  }

  private jumpTaken(mnemonic: JumpMnemonic): boolean {
    const f = this.flags;
    switch (mnemonic) {
      case 'jmp': return true;
      case 'js': return f.sf;
      case 'jns': return !f.sf;
      case 'jz': case 'je': return f.zf;
      case 'jnz': case 'jne': return !f.zf;
      // беззнаковые сравнения
      case 'ja': return !f.cf && !f.zf;
      case 'jae': return !f.cf;
      case 'jb': return f.cf;
      case 'jbe': return f.cf || f.zf;
      // знаковые сравнения
      case 'jl': return f.sf !== f.of;
      case 'jge': return f.sf === f.of;
      case 'jg': return !f.zf && f.sf === f.of;
      case 'jle': return f.zf || f.sf !== f.of;
      default: return true;
    }
  }

  private jumpTo(label: string): void {
    const target = this.labelIndex.get(label);
    if (target === undefined) {
      // проверено парсером; защита от рассинхронизации
      this.ip++;
      return;
    }
    this.ip = target;
  }

  // ==========================================================================
  // Прерывания
  // ==========================================================================

  private executeInt(number: number, line: number): StepResult {
    if (number !== 0x21) {
      return this.failStep(runMessages.unknownInterrupt(number), line);
    }

    const ah = this.getReg('ah');

    // 4Ch (и 00h) — завершение программы
    if (ah === 0x4c || ah === 0x00) {
      this.halted = true;
      this.ip++;
      return { status: 'halted', message: runMessages.programEnd, line };
    }

    // 01h — чтение клавиши
    if (ah === 0x01) {
      if (!this.features.io) return this.failStep(runMessages.ioNotAllowed, line);
      this.awaitingInput = true;
      return { status: 'input-needed', message: runMessages.awaitInput, line };
    }

    // 02h — вывод символа из DL
    if (ah === 0x02) {
      if (!this.features.io) return this.failStep(runMessages.ioNotAllowed, line);
      this.outputQueue.push(String.fromCharCode(this.getReg('dl') & 0xff));
      this.ip++;
      return { status: 'ok' };
    }

    // 09h — вывод строки из памяти по адресу в DX до символа '$'
    if (ah === 0x09) {
      if (!this.features.io) return this.failStep(runMessages.ioNotAllowed, line);
      const start = this.getReg('dx');
      let address = start & 0xff;
      let text = '';
      for (let i = 0; i < MEMORY_SIZE; i++) {
        const byte = this.memory[address];
        if (byte === 0x24) break; // '$'
        text += String.fromCharCode(byte);
        address = (address + 1) & 0xff;
      }
      this.outputQueue.push(text);
      this.ip++;
      return { status: 'ok' };
    }

    return this.failStep(runMessages.unknownFunction(ah), line);
  }

  // ==========================================================================
  // Служебное
  // ==========================================================================

  private finishStep(error: string | null, line: number): StepResult {
    if (error) return this.failStep(error, line);
    this.ip++; // обычные команды двигают указатель на следующую
    return { status: 'ok', line };
  }

  private failStep(message: string, line: number): StepResult {
    this.halted = true;
    return { status: 'error', message, line };
  }
}

// ===========================================================================

function makeRegs(): RegsMap {
  const regs = {} as RegsMap;
  for (const name of REG16_NAMES) {
    regs[name] = name === 'sp' ? 0xfffe : 0;
  }
  return regs;
}

function makeSegRegs(): SegRegsMap {
  // COM-программа: все сегментные регистры указывают на один сегмент
  const regs = {} as SegRegsMap;
  for (const name of SEG_REG_NAMES) {
    regs[name] = 0x0100;
  }
  return regs;
}

function isReg8(name: RegName): name is Reg8Name {
  return (REG8_NAMES as readonly string[]).includes(name);
}

function isSegReg(name: RegName): name is SegRegName {
  return (SEG_REG_NAMES as readonly string[]).includes(name);
}

function evenParity(value: number): boolean {
  let byte = value & 0xff;
  let bits = 0;
  while (byte) {
    bits += byte & 1;
    byte >>= 1;
  }
  return bits % 2 === 0;
}
