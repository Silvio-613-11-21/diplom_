import { el } from 'shared/lib/dom';
import type { MachineSnapshot } from 'shared/types/machine';
import type { VariableInfo } from 'shared/types/asm';
import { asciiChar } from 'shared/lib/ascii';
import { hexByte } from 'shared/lib/numbers';

/**
 * Сегмент данных: дамп памяти 16×16 байт (hex) с ASCII-строкой справа —
 * как в нижнем окне дебаггера. Изменившиеся ячейки подсвечиваются.
 * Под дампом — легенда переменных сегмента данных.
 */

export class MemoryDump {
  readonly root: HTMLElement;
  private cells: HTMLElement[] = [];
  private asciiCells: HTMLElement[] = [];
  private legend: HTMLElement;
  private prev = new Uint8Array(256);
  private hasPrev = false;

  constructor() {
    this.root = el('section', 'memory-dump');

    const head = el('div', 'memory-dump__head', 'Сегмент данных (дамп памяти, hex)');
    const scroll = el('div', 'memory-dump__scroll');
    const table = el('table', 'memory-dump__table');

    // шапка: смещение + 0..F
    const thead = el('thead');
    const headRow = el('tr');
    headRow.appendChild(el('th', 'memory-dump__corner'));
    for (let col = 0; col < 16; col++) {
      headRow.appendChild(el('th', '', col.toString(16).toUpperCase()));
    }
    headRow.appendChild(el('th', 'memory-dump__ascii-head', 'ASCII'));
    thead.appendChild(headRow);
    table.appendChild(thead);

    // строки 00..F0
    const tbody = el('tbody');
    for (let row = 0; row < 16; row++) {
      const tr = el('tr');
      tr.appendChild(el('th', 'memory-dump__row-head', (row * 16).toString(16).toUpperCase().padStart(2, '0')));
      for (let col = 0; col < 16; col++) {
        const td = el('td', '', '00');
        this.cells.push(td);
        tr.appendChild(td);
      }
      const ascii = el('td', 'memory-dump__ascii');
      this.asciiCells.push(ascii);
      tr.appendChild(ascii);
      tbody.appendChild(tr);
    }
    table.appendChild(tbody);

    this.legend = el('div', 'memory-dump__legend');

    scroll.append(table);
    this.root.append(head, scroll, this.legend);
  }

  render(snapshot: MachineSnapshot): void {
    for (let i = 0; i < 256; i++) {
      const value = snapshot.memory[i];
      const cell = this.cells[i];
      const changed = this.hasPrev && this.prev[i] !== value;
      cell.textContent = hexByte(value);
      cell.classList.toggle('is-changed', changed);
    }

    for (let row = 0; row < 16; row++) {
      let text = '';
      for (let col = 0; col < 16; col++) {
        text += asciiChar(snapshot.memory[row * 16 + col]);
      }
      this.asciiCells[row].textContent = text;
    }

    this.prev.set(snapshot.memory);
    this.hasPrev = true;
  }

  /** Легенда переменных: имя — адрес — размер. */
  renderLegend(variables: VariableInfo[]): void {
    this.legend.replaceChildren();
    if (variables.length === 0) return;

    const title = el('span', 'memory-dump__legend-title', 'Переменные:');
    this.legend.appendChild(title);
    for (const variable of variables) {
      const chip = el(
        'span',
        'memory-dump__var-chip',
        `${variable.name} = ${variable.address.toString(16).toUpperCase().padStart(2, '0')}h (${variable.size} б.)`,
      );
      this.legend.appendChild(chip);
    }
  }

  reset(): void {
    for (const cell of this.cells) {
      cell.textContent = '00';
      cell.classList.remove('is-changed');
    }
    for (const ascii of this.asciiCells) {
      ascii.textContent = '················';
    }
    this.prev.fill(0);
    this.hasPrev = false;
  }
}
