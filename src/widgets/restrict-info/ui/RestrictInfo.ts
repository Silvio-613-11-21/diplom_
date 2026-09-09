import './RestrictInfo.css';

import { el } from 'shared/lib/dom';
import type { TaskRestricts } from 'shared/types/restrictions';

/**
 * Информационная панель ограничений: какие команды, регистры и возможности
 * доступны в текущем задании (по ссылке ?lab=N&z=K).
 */

const FEATURE_LABELS: { key: keyof TaskRestricts['features']; label: string }[] = [
  { key: 'macros', label: 'макросы' },
  { key: 'subroutines', label: 'подпрограммы (call/ret)' },
  { key: 'memory', label: 'память (byte[]/word[])' },
  { key: 'variables', label: 'переменные (db/dw/equ)' },
  { key: 'io', label: 'ввод-вывод (int 21h)' },
];

export class RestrictInfo {
  readonly root: HTMLElement;

  constructor(restricts: TaskRestricts | undefined) {
    this.root = el('section', 'restrict-info');

    const icon = el('img', 'restrict-info__icon');
    icon.src = '/icons/attention.svg';
    icon.alt = '';
    const body = el('div', 'restrict-info__body');

    if (!restricts) {
      body.appendChild(el('div', 'restrict-info__title', 'Свободный режим'));
      body.appendChild(
        el(
          'div',
          'restrict-info__text',
          'Ограничения не установлены — доступны все команды, регистры и возможности эмулятора.',
        ),
      );
      body.appendChild(
        el(
          'div',
          'restrict-info__text restrict-info__text--dim',
          'Задание можно выбрать ссылкой: ?lab=1..5&z=номер задачи',
        ),
      );
    } else {
      body.appendChild(
        el('div', 'restrict-info__title', `Лабораторная №${restricts.lab}, задача ${restricts.task}`),
      );

      if (restricts.allowCmd) {
        body.appendChild(this.chipsLine('Команды:', restricts.allowCmd.map((c) => c.toUpperCase())));
      } else {
        body.appendChild(
          el('div', 'restrict-info__text', 'Команды: не ограничены (в задании нет явного перечня)'),
        );
      }

      if (restricts.denyRegs) {
        body.appendChild(
          this.chipsLine('Запрещены регистры:', restricts.denyRegs.map((r) => r.toUpperCase()), true),
        );
      }
      if (restricts.allowRegs) {
        body.appendChild(this.chipsLine('Регистры:', restricts.allowRegs.map((r) => r.toUpperCase())));
      } else if (!restricts.denyRegs) {
        body.appendChild(el('div', 'restrict-info__text', 'Регистры: не ограничены'));
      }

      const enabled = FEATURE_LABELS.filter((f) => restricts.features[f.key]);
      if (enabled.length > 0) {
        body.appendChild(this.chipsLine('Доступно:', enabled.map((f) => f.label)));
      }
    }

    this.root.append(icon, body);
  }

  private chipsLine(label: string, values: string[], warn = false): HTMLElement {
    const line = el('div', 'restrict-info__line');
    line.appendChild(el('span', 'restrict-info__line-label', label));
    for (const value of values) {
      line.appendChild(el('span', `restrict-info__chip${warn ? ' restrict-info__chip--warn' : ''}`, value));
    }
    return line;
  }
}
