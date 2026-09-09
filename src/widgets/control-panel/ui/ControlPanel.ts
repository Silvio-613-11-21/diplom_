import './ControlPanel.css';

import { button, el } from 'shared/lib/dom';
import type { TaskRestricts } from 'shared/types/restrictions';
import { uiMessages } from 'shared/config/messages';
import { parseProgram } from 'features/assembler/parser';
import { Emulator } from 'features/emulator/emulator';
import type { StepResult } from 'features/emulator/emulator';
import type { Debugger } from 'widgets/debugger';
import type { Editor } from 'widgets/editor';

/**
 * Панель управления: «Скомпилировать / Запустить / Анимация / Шаг / Сброс».
 *
 * Это единственное место, где интерфейс работает с ядром эмулятора:
 * редактор отдаёт текст, парсер превращает его в программу,
 * машина выполняет, отладчик — показывает снимки состояния.
 */

const ANIMATION_DELAY = 350;

export class ControlPanel {
  readonly root: HTMLElement;

  private compileBtn: HTMLButtonElement;
  private runBtn: HTMLButtonElement;
  private animateBtn: HTMLButtonElement;
  private stepBtn: HTMLButtonElement;
  private resetBtn: HTMLButtonElement;

  private machine: Emulator | null = null;
  private animating = false;
  private animationTimer: ReturnType<typeof setInterval> | null = null;
  /** Продолжать автозапуск после ввода клавиши. */
  private resumeAfterInput: 'run' | 'animate' | null = null;

  private editor: Editor;
  private debuggerWidget: Debugger;
  private restricts: TaskRestricts | undefined;

  constructor(editor: Editor, debuggerWidget: Debugger, restricts: TaskRestricts | undefined) {
    this.editor = editor;
    this.debuggerWidget = debuggerWidget;
    this.restricts = restricts;
    this.root = el('section', 'control-panel');

    this.compileBtn = button('Скомпилировать', 'control-panel__btn control-panel__btn--compile', () => this.compile(), 'Проверить программу (парсер + ограничения задания)');
    this.runBtn = button('Запустить', 'control-panel__btn control-panel__btn--run', () => this.runAll(), 'Выполнить программу целиком');
    this.animateBtn = button('Анимация', 'control-panel__btn control-panel__btn--animate', () => this.runAnimated(), 'Пошаговое выполнение с задержкой');
    this.stepBtn = button('Шаг', 'control-panel__btn control-panel__btn--step', () => this.runStep(), 'Выполнить одну команду');
    this.resetBtn = button('Сброс', 'control-panel__btn control-panel__btn--reset', () => this.reset(), 'Сбросить состояние эмулятора');

    const group = el('div', 'control-panel__group');
    group.append(this.compileBtn, this.runBtn, this.animateBtn, this.stepBtn, this.resetBtn);
    this.root.appendChild(group);

    this.updateButtons();

    // ввод с «клавиатуры» для int 21h (AH=01h)
    this.debuggerWidget.onInput = (code, extended) => this.handleInput(code, extended);
  }

  // ==========================================================================
  // Компиляция
  // ==========================================================================

  compile(): void {
    this.stopAnimation();
    const parsed = parseProgram(this.editor.getText(), this.restricts);

    if (!parsed.ok) {
      this.machine = null;
      this.debuggerWidget.consoleShow(`${uiMessages.compiledFail}: ${parsed.error}`, 'error');
      this.debuggerWidget.reset();
      this.updateButtons();
      return;
    }

    this.machine = new Emulator({
      program: parsed.instructions,
      labelIndex: parsed.labelIndex,
      initialMemory: parsed.memory,
      features: this.restricts?.features ?? {
        macros: true, subroutines: true, memory: true, variables: true, io: true,
      },
    });

    this.debuggerWidget.showProgram(parsed.instructions);
    this.debuggerWidget.showVariables(parsed.variables);
    this.debuggerWidget.consoleLog(uiMessages.compiledOk(parsed.instructions.length), 'ok');
    this.debuggerWidget.switchTab('debug');
    this.debuggerWidget.renderSnapshot(this.machine.snapshot());
    this.updateButtons();
  }

  // ==========================================================================
  // Запуск
  // ==========================================================================

  runAll(): void {
    if (!this.requireMachine()) return;
    this.stopAnimation();
    this.machine!.reset();
    this.debuggerWidget.screenClear();
    this.debuggerWidget.switchTab('debug');
    this.debuggerWidget.consoleLog(uiMessages.started, 'info');

    const result = this.machine!.run();
    this.afterExecution(result, 'run');
  }

  runAnimated(): void {
    if (this.animating) {
      this.stopAnimation();
      return;
    }
    if (!this.requireMachine()) return;

    this.animating = true;
    this.animateBtn.classList.add('is-active');
    this.machine!.reset();
    this.debuggerWidget.screenClear();
    this.debuggerWidget.switchTab('debug');
    this.debuggerWidget.renderSnapshot(this.machine!.snapshot());
    this.updateButtons();

    this.animationTimer = setInterval(() => {
      const result = this.machine!.step();
      this.afterExecution(result, 'animate');
      if (result.status !== 'ok') {
        this.stopAnimation();
      }
    }, ANIMATION_DELAY);
  }

  runStep(): void {
    if (!this.requireMachine()) return;
    if (this.animating) return;

    if (this.machine!.ip === 0 && !this.machine!.halted) {
      this.debuggerWidget.screenClear();
    }

    const result = this.machine!.step();
    this.afterExecution(result, 'step');
  }

  reset(): void {
    this.stopAnimation();
    this.machine = null; // как в старой логике: после сброса нужна повторная компиляция
    this.debuggerWidget.reset();
    this.debuggerWidget.screenClear();
    this.debuggerWidget.setAwaitingInput(false);
    this.debuggerWidget.consoleLog(uiMessages.resetDone, 'info');
    this.updateButtons();
  }

  // ==========================================================================
  // Ввод с клавиатуры (int 21h, AH=01h)
  // ==========================================================================

  private handleInput(code: number, extended: boolean): void {
    if (!this.machine) return;
    this.machine.provideInput(code, extended);
    this.drainOutput();
    this.debuggerWidget.renderSnapshot(this.machine.snapshot());

    // продолжить автозапуск, если программа выполнялась целиком/анимацией
    if (this.resumeAfterInput === 'run') {
      this.resumeAfterInput = null;
      const result = this.machine.run();
      this.afterExecution(result, 'run');
    } else if (this.resumeAfterInput === 'animate') {
      this.resumeAfterInput = null;
      // анимация продолжится своим таймером
    }
  }

  // ==========================================================================
  // Служебное
  // ==========================================================================

  private afterExecution(result: StepResult, mode: 'run' | 'animate' | 'step'): void {
    const machine = this.machine;
    if (!machine) return;

    this.drainOutput();
    this.debuggerWidget.renderSnapshot(machine.snapshot());

    if (result.status === 'halted') {
      this.debuggerWidget.consoleLog(result.message ?? uiMessages.resetDone, 'ok');
    } else if (result.status === 'error') {
      const line = result.line ? ` (строка ${result.line})` : '';
      this.debuggerWidget.consoleShow(`${result.message ?? 'ошибка'}${line}`, 'error');
    } else if (result.status === 'input-needed') {
      this.debuggerWidget.setAwaitingInput(true);
      this.resumeAfterInput = mode === 'step' ? null : mode;
      if (mode === 'step') {
        this.debuggerWidget.consoleLog(result.message ?? '', 'warn');
      }
    }
  }

  private drainOutput(): void {
    const text = this.machine?.takeOutput();
    if (text) this.debuggerWidget.screenWrite(text);
  }

  private requireMachine(): boolean {
    if (this.machine) return true;
    this.debuggerWidget.consoleShow(uiMessages.noProgram, 'warn');
    return false;
  }

  private stopAnimation(): void {
    this.animating = false;
    this.animateBtn.classList.remove('is-active');
    if (this.animationTimer !== null) {
      clearInterval(this.animationTimer);
      this.animationTimer = null;
    }
    this.updateButtons();
  }

  private updateButtons(): void {
    const has = this.machine !== null;
    this.runBtn.disabled = !has || this.animating;
    this.stepBtn.disabled = !has || this.animating;
    this.animateBtn.disabled = !has && !this.animating;
    this.resetBtn.disabled = false;
    this.animateBtn.textContent = this.animating ? 'Стоп' : 'Анимация';
  }
}
