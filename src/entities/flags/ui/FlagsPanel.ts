import { el } from 'shared/lib/dom';
import type { MachineSnapshot } from 'shared/types/machine';
import { FLAG_NAMES } from 'shared/types/asm';

/** Панель флагов: OF DF IF SF ZF AF PF CF. */

export class FlagsPanel {
  readonly root: HTMLElement;
  private valueCells = new Map<string, HTMLElement>();
  private prev = new Map<string, boolean>();

  constructor() {
    this.root = el('section', 'flags');

    const namesRow = el('div', 'flags__row');
    const valuesRow = el('div', 'flags__row flags__row--values');

    for (const name of FLAG_NAMES) {
      namesRow.appendChild(el('span', 'flags__name', name.toUpperCase()));
      const value = el('span', 'flags__value', '0');
      this.valueCells.set(name, value);
      valuesRow.appendChild(value);
    }

    this.root.append(namesRow, valuesRow);
  }

  render(snapshot: MachineSnapshot): void {
    for (const name of FLAG_NAMES) {
      const value = snapshot.flags[name];
      const cell = this.valueCells.get(name)!;
      const changed = this.prev.has(name) && this.prev.get(name) !== value;
      cell.textContent = value ? '1' : '0';
      cell.classList.toggle('is-changed', changed);
      cell.classList.toggle('is-set', value);
      this.prev.set(name, value);
    }
  }

  reset(): void {
    for (const [name, cell] of this.valueCells) {
      cell.textContent = '0';
      cell.classList.remove('is-changed', 'is-set');
      this.prev.delete(name);
    }
  }
}
