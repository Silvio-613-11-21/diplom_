import { el } from 'shared/lib/dom';
import type { MachineSnapshot, DisplayBase } from 'shared/types/machine';
import type { Reg16Name, Reg8Name, SegRegName } from 'shared/types/asm';
import { formatValue } from 'shared/lib/numbers';

/**
 * Панель регистров: AX..DX, SI..SP, сегментные и полурегистры.
 * Рисуется из снимка машины; изменившиеся значения подсвечиваются
 * «бирюзовым», как в дебаггере из лабораторных работ.
 */

const GROUPS: { title: string; names: readonly string[]; size: 1 | 2 }[] = [
  { title: 'Основные', names: ['ax', 'bx', 'cx', 'dx'], size: 2 },
  { title: 'Указатели', names: ['si', 'di', 'bp', 'sp'], size: 2 },
  { title: 'Сегментные', names: ['cs', 'ds', 'es', 'ss'], size: 2 },
  { title: 'Половинки', names: ['ah', 'al', 'bh', 'bl', 'ch', 'cl', 'dh', 'dl'], size: 1 },
];

export class RegistersPanel {
  readonly root: HTMLElement;
  private valueCells = new Map<string, HTMLElement>();
  private prev = new Map<string, string>();

  constructor() {
    this.root = el('section', 'registers');

    for (const group of GROUPS) {
      const block = el('div', 'registers__group');
      const title = el('div', 'registers__group-title', group.title);
      const table = el('div', 'registers__table');

      for (const name of group.names) {
        const row = el('div', 'registers__row');
        const label = el('span', 'registers__name', name.toUpperCase());
        const value = el('span', 'registers__value', formatValue(0, 16, group.size));
        this.valueCells.set(name, value);
        row.append(label, value);
        table.appendChild(row);
      }

      block.append(title, table);
      this.root.appendChild(block);
    }
  }

  render(snapshot: MachineSnapshot, base: DisplayBase): void {
    for (const group of GROUPS) {
      for (const name of group.names) {
        const value = this.readValue(snapshot, name);
        const text = formatValue(value, base, group.size);
        const cell = this.valueCells.get(name)!;

        const changed = this.prev.get(name) !== undefined && this.prev.get(name) !== text;
        cell.textContent = text;
        cell.classList.toggle('is-changed', changed);
        this.prev.set(name, text);
      }
    }
  }

  reset(): void {
    for (const [name, cell] of this.valueCells) {
      const group = GROUPS.find((g) => g.names.includes(name))!;
      cell.textContent = formatValue(0, 16, group.size);
      cell.classList.remove('is-changed');
      this.prev.delete(name);
    }
  }

  private readValue(snapshot: MachineSnapshot, name: string): number {
    if (name in snapshot.regs) return snapshot.regs[name as Reg16Name];
    if (name in snapshot.segRegs) return snapshot.segRegs[name as SegRegName];
    return snapshot.halfRegs[name as Reg8Name];
  }
}
