import { el } from 'shared/lib/dom';
import type { AsmInstruction } from 'shared/types/asm';

/**
 * Сегмент кода: листинг скомпилированной программы с номерами строк.
 * Текущая инструкция подсвечивается (как в дебаггере по F7/F8).
 */

export class CodeListing {
  readonly root: HTMLElement;
  private numbers: HTMLElement;
  private linesBox: HTMLElement;
  private lineElems: HTMLElement[] = [];
  private currentElem: HTMLElement | null = null;

  constructor() {
    this.root = el('section', 'code-listing');

    const head = el('div', 'code-listing__head', 'Сегмент кода');
    const body = el('div', 'code-listing__body');
    this.numbers = el('div', 'code-listing__numbers');
    this.linesBox = el('div', 'code-listing__lines');
    body.append(this.numbers, this.linesBox);

    this.root.append(head, body);

    const empty = el('div', 'code-listing__empty', 'Программа не скомпилирована');
    this.linesBox.appendChild(empty);
  }

  /** Показать программу (или очистить, если не передана). */
  render(instructions: AsmInstruction[] | null): void {
    this.linesBox.replaceChildren();
    this.numbers.replaceChildren();
    this.lineElems = [];
    this.currentElem = null;

    if (!instructions) {
      this.linesBox.appendChild(el('div', 'code-listing__empty', 'Программа не скомпилирована'));
      return;
    }

    instructions.forEach((instr, index) => {
      const number = el('div', 'code-listing__number', String(index + 1));
      this.numbers.appendChild(number);

      const line = el('div', 'code-listing__line');
      const isLabel = instr.kind === 'label';
      if (isLabel) line.classList.add('code-listing__line--label');
      line.textContent = instr.source;
      this.linesBox.appendChild(line);
      this.lineElems.push(line);
    });

    this.setStep(0);
  }

  /** Подсветить инструкцию с индексом step. */
  setStep(step: number): void {
    if (this.currentElem) {
      this.currentElem.classList.remove('is-active');
    }
    const line = this.lineElems[step];
    if (line) {
      line.classList.add('is-active');
      line.scrollIntoView({ block: 'nearest' });
    }
    this.currentElem = line ?? null;
  }

  reset(): void {
    this.render(null);
  }
}
