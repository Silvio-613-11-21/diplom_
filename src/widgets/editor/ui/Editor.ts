import './Editor.css';

import { el, iconButton } from 'shared/lib/dom';

/** Шаблон-заготовка программы (как в методичке). */
export const DEFAULT_PROGRAM = `;=== [ Начало сегмента кода ] ==============
mycode: segment .code
org 100h
start:
  ; ... здесь должно быть тело программы

  ;--- [ Стандартное завершение программы ]---
  mov ax, 4C00h
  int 21h
`;

/**
 * Редактор кода: contenteditable с номерами строк, поддержкой Tab
 * и скачиванием файла (логика редактора из старого проекта).
 */

export class Editor {
  readonly root: HTMLElement;

  private numbers: HTMLElement;
  private textArea: HTMLElement;
  private onChange: (text: string) => void;

  constructor(onChange: (text: string) => void) {
    this.onChange = onChange;
    this.root = el('section', 'editor');

    const head = el('div', 'editor__head');
    head.appendChild(el('span', 'editor__file-name', 'program.asm'));
    const actions = el('div', 'editor__actions');
    actions.appendChild(
      iconButton(
        '/icons/download.svg',
        'Скачать файл',
        'editor__icon-btn',
        () => this.download(),
        'Скачать program.asm',
      ),
    );
    head.appendChild(actions);

    const body = el('div', 'editor__body');
    this.numbers = el('div', 'editor__numbers');
    this.textArea = el('div', 'editor__text-area');
    this.textArea.contentEditable = 'true';
    this.textArea.spellcheck = false;
    this.textArea.textContent = DEFAULT_PROGRAM;

    body.append(this.numbers, this.textArea);

    this.root.append(head, body);

    this.textArea.addEventListener('input', () => this.handleInput());
    this.textArea.addEventListener('keydown', (event) => {
      if (event.key === 'Tab') {
        event.preventDefault();
        document.execCommand('insertText', false, '\t');
        this.handleInput();
      }
    });
    // вставка только простого текста
    this.textArea.addEventListener('paste', (event) => {
      event.preventDefault();
      const text = event.clipboardData?.getData('text/plain') ?? '';
      document.execCommand('insertText', false, text);
      this.handleInput();
    });
    // прокрутка номеров строк вместе с текстом
    this.textArea.addEventListener('scroll', () => {
      this.numbers.scrollTop = this.textArea.scrollTop;
    });

    this.updateNumbers();
  }

  getText(): string {
    return this.textArea.innerText;
  }

  setText(text: string): void {
    this.textArea.textContent = text;
    this.updateNumbers();
  }

  private handleInput(): void {
    this.updateNumbers();
    this.onChange(this.getText());
  }

  private updateNumbers(): void {
    const count = this.getText().split('\n').length;
    if (this.numbers.childElementCount !== count) {
      this.numbers.replaceChildren();
      for (let i = 1; i <= count; i++) {
        this.numbers.appendChild(el('div', 'editor__number', String(i)));
      }
    }
  }

  private download(): void {
    const blob = new Blob([this.getText()], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = el('a') as HTMLAnchorElement;
    link.href = url;
    link.download = 'program.asm';
    link.click();
    URL.revokeObjectURL(url);
  }
}
