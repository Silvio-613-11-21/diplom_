import './Debugger.css';

import { el } from 'shared/lib/dom';
import type { MachineSnapshot, DisplayBase } from 'shared/types/machine';
import type { AsmInstruction, VariableInfo } from 'shared/types/asm';
import { RegistersPanel } from 'entities/registers';
import { FlagsPanel } from 'entities/flags';
import { CodeListing } from 'entities/code-listing';
import { MemoryDump } from 'entities/memory-dump';
import { StackView } from 'entities/stack-view';

export type ConsoleType = 'info' | 'ok' | 'error' | 'warn';
export type DebuggerTab = 'debug' | 'console' | 'screen';

/**
 * Правая панель: вкладки «Отладчик», «Консоль», «Экран».
 * Содержит сущности (регистры, флаги, стек, листинг, память)
 * и «чёрный экран» для вывода прерываний int 21h.
 */

export class Debugger {
  readonly root: HTMLElement;

  private tabDebug: HTMLButtonElement;
  private tabConsole: HTMLButtonElement;
  private tabScreen: HTMLButtonElement;
  private debugContent: HTMLElement;
  private consoleContent: HTMLElement;
  private screenContent: HTMLElement;

  private baseSelect: HTMLSelectElement;
  private base: DisplayBase = 16;

  private codeListing = new CodeListing();
  private registers = new RegistersPanel();
  private flags = new FlagsPanel();
  private stack = new StackView();
  private memoryDump = new MemoryDump();

  private consoleLogBox: HTMLElement;
  private screenBox: HTMLElement;
  private screenLines: string[] = [''];
  private screenCaret = 0;
  private inputHint: HTMLElement;

  private lastSnapshot: MachineSnapshot | null = null;

  /** Реакция на нажатие клавиши при ожидании ввода (int 21h, AH=01h). */
  onInput: ((code: number, extended: boolean) => void) | null = null;

  private keyListener = (event: KeyboardEvent) => {
    if (!this.awaitingInput || !this.onInput) return;
    event.preventDefault();
    event.stopPropagation();

    const extended = event.key.length !== 1;
    const code = extended ? event.keyCode & 0xff : event.key.charCodeAt(0);
    this.setAwaitingInput(false);
    this.onInput(code, extended);
  };

  private awaitingInput = false;

  constructor() {
    this.root = el('section', 'debugger');

    // ------- шапка с вкладками ------------------------------------------------
    const head = el('div', 'debugger__head');
    const tabs = el('div', 'debugger__tabs');
    this.tabDebug = el('button', 'debugger__tab is-active', 'Отладчик');
    this.tabDebug.type = 'button';
    this.tabConsole = el('button', 'debugger__tab', 'Консоль');
    this.tabConsole.type = 'button';
    this.tabScreen = el('button', 'debugger__tab', 'Экран');
    this.tabScreen.type = 'button';
    tabs.append(this.tabDebug, this.tabConsole, this.tabScreen);

    const baseBox = el('div', 'debugger__base');
    baseBox.appendChild(el('span', 'debugger__base-label', 'Система:'));
    this.baseSelect = el('select', 'debugger__base-select') as HTMLSelectElement;
    for (const [value, label] of [['16', 'HEX'], ['10', 'DEC'], ['2', 'BIN']] as const) {
      const option = el('option', '', label) as HTMLOptionElement;
      option.value = value;
      this.baseSelect.appendChild(option);
    }
    this.baseSelect.addEventListener('change', () => {
      this.base = parseInt(this.baseSelect.value, 10) as DisplayBase;
      if (this.lastSnapshot) this.renderSnapshot(this.lastSnapshot);
    });
    baseBox.appendChild(this.baseSelect);

    head.append(tabs, baseBox);

    // ------- отладчик -----------------------------------------------------------
    this.debugContent = el('div', 'debugger__content debugger__content--debug');

    const right = el('div', 'debugger__right');
    right.append(
      this.registers.root,
      this.flags.root,
      this.stack.root,
    );

    this.debugContent.append(this.codeListing.root, right, this.memoryDump.root);

    // ------- консоль ----------------------------------------------------------------
    this.consoleContent = el('div', 'debugger__content debugger__content--console');
    this.consoleLogBox = el('div', 'console-log');
    this.consoleContent.appendChild(this.consoleLogBox);
    this.consoleLog('Эмулятор готов к работе', 'info');

    // ------- экран ---------------------------------------------------------------------
    this.screenContent = el('div', 'debugger__content debugger__content--screen');
    const screen = el('div', 'screen');
    this.screenBox = el('div', 'screen__text');
    this.inputHint = el('div', 'screen__hint', 'Программа ждёт нажатия клавиши…');
    this.inputHint.hidden = true;
    screen.append(this.screenBox, this.inputHint);
    this.screenContent.appendChild(screen);

    this.root.append(head, this.debugContent, this.consoleContent, this.screenContent);
    this.switchTab('debug');

    this.tabDebug.addEventListener('click', () => this.switchTab('debug'));
    this.tabConsole.addEventListener('click', () => this.switchTab('console'));
    this.tabScreen.addEventListener('click', () => this.switchTab('screen'));

    document.addEventListener('keydown', this.keyListener);
  }

  // ==========================================================================
  // Вкладки
  // ==========================================================================

  switchTab(tab: DebuggerTab): void {
    this.tabDebug.classList.toggle('is-active', tab === 'debug');
    this.tabConsole.classList.toggle('is-active', tab === 'console');
    this.tabScreen.classList.toggle('is-active', tab === 'screen');
    this.debugContent.hidden = tab !== 'debug';
    this.consoleContent.hidden = tab !== 'console';
    this.screenContent.hidden = tab !== 'screen';
  }

  // ==========================================================================
  // Отрисовка состояния
  // ==========================================================================

  showProgram(instructions: AsmInstruction[] | null): void {
    this.codeListing.render(instructions);
  }

  /** Легенда переменных сегмента данных под дампом памяти. */
  showVariables(variables: VariableInfo[]): void {
    this.memoryDump.renderLegend(variables);
  }

  renderSnapshot(snapshot: MachineSnapshot): void {
    this.lastSnapshot = snapshot;
    this.registers.render(snapshot, this.base);
    this.flags.render(snapshot);
    this.stack.render(snapshot);
    this.memoryDump.render(snapshot);
    this.codeListing.setStep(snapshot.ip);
  }

  reset(): void {
    this.lastSnapshot = null;
    this.registers.reset();
    this.flags.reset();
    this.stack.reset();
    this.memoryDump.reset();
    this.codeListing.reset();
  }

  // ==========================================================================
  // Консоль
  // ==========================================================================

  consoleLog(message: string, type: ConsoleType = 'info'): void {
    const time = new Date().toLocaleTimeString('ru-RU');
    const entry = el('div', `console-log__entry console-log__entry--${type}`);
    entry.appendChild(el('span', 'console-log__time', time));
    entry.appendChild(el('span', 'console-log__text', message));
    this.consoleLogBox.appendChild(entry);
    this.consoleLogBox.scrollTop = this.consoleLogBox.scrollHeight;
  }

  consoleClear(): void {
    this.consoleLogBox.replaceChildren();
  }

  /** Показать сообщение и переключиться на вкладку «Консоль». */
  consoleShow(message: string, type: ConsoleType = 'info'): void {
    this.consoleLog(message, type);
    this.switchTab('console');
  }

  // ==========================================================================
  // Экран
  // ==========================================================================

  screenWrite(text: string): void {
    for (const ch of text) {
      if (ch === '\n') {
        this.screenLines.push('');
        this.screenCaret = 0;
      } else if (ch === '\r') {
        this.screenCaret = 0;
      } else {
        const line = this.screenLines[this.screenLines.length - 1];
        this.screenLines[this.screenLines.length - 1] =
          line.slice(0, this.screenCaret) + ch + line.slice(this.screenCaret + 1);
        this.screenCaret++;
      }
    }
    this.renderScreen();
  }

  screenClear(): void {
    this.screenLines = [''];
    this.screenCaret = 0;
    this.renderScreen();
  }

  /** Режим ожидания клавиши: подсказка на «экране». */
  setAwaitingInput(awaiting: boolean): void {
    this.awaitingInput = awaiting;
    this.inputHint.hidden = !awaiting;
    if (awaiting) {
      this.switchTab('screen');
      this.renderScreen();
    }
  }

  private renderScreen(): void {
    this.screenBox.replaceChildren();
    for (let i = 0; i < this.screenLines.length; i++) {
      const isLast = i === this.screenLines.length - 1;
      const line = el('div', 'screen__line', this.screenLines[i] || (isLast ? '' : ' '));
      if (isLast) {
        const caret = el('span', 'screen__caret', '▌');
        line.appendChild(caret);
      }
      this.screenBox.appendChild(line);
    }
    this.screenBox.scrollTop = this.screenBox.scrollHeight;
  }
}
