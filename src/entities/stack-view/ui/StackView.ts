import { el } from 'shared/lib/dom';
import type { MachineSnapshot } from 'shared/types/machine';
import { hexWord } from 'shared/lib/numbers';

/**
 * Окно стека: вершина и несколько элементов ниже (как в дебаггере).
 * call кладёт адрес возврата, push — значение регистра.
 */

const VISIBLE = 6;

export class StackView {
  readonly root: HTMLElement;
  private body: HTMLElement;

  constructor() {
    this.root = el('section', 'stack-view');
    this.root.appendChild(el('div', 'stack-view__head', 'Стек'));
    this.body = el('div', 'stack-view__body');
    this.root.appendChild(this.body);
    this.showEmpty();
  }

  render(snapshot: MachineSnapshot): void {
    this.body.replaceChildren();

    if (snapshot.stack.length === 0) {
      this.showEmpty();
      return;
    }

    const table = el('div', 'stack-view__table');
    for (let i = 0; i < Math.min(VISIBLE, snapshot.stack.length); i++) {
      const address = (snapshot.sp + i * 2) & 0xffff;
      const row = el('div', 'stack-view__row');
      row.appendChild(el('span', 'stack-view__addr', hexWord(address)));
      row.appendChild(el('span', 'stack-view__value', hexWord(snapshot.stack[i])));
      if (i === 0) row.classList.add('stack-view__row--top');
      table.appendChild(row);
    }
    this.body.appendChild(table);

    if (snapshot.stack.length > VISIBLE) {
      this.body.appendChild(el('div', 'stack-view__more', `… ещё ${snapshot.stack.length - VISIBLE}`));
    }
  }

  reset(): void {
    this.body.replaceChildren();
    this.showEmpty();
  }

  private showEmpty(): void {
    this.body.appendChild(el('div', 'stack-view__empty', 'пусто'));
  }
}
