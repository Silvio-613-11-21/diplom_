import './Header.css';

import { el, iconButton } from 'shared/lib/dom';

/** Ссылки на задания лабораторных работ (как в шапке старого проекта). */
const LAB_LINKS: { label: string; url: string }[] = [
  { label: 'Л/Р 1', url: 'http://magicurl.ru/evm/lab1/' },
  { label: 'Л/Р 2', url: 'http://magicurl.ru/evm/lab2/' },
  { label: 'Л/Р 3', url: 'http://magicurl.ru/evm/lab3-/' },
  { label: 'Л/Р 4', url: 'http://magicurl.ru/evm/lab4zzzz-A/' },
  { label: 'Л/Р 5', url: 'http://magicurl.ru/evm/lab5zzzz/' },
];

const EXTRA_LINKS: { label: string; url: string }[] = [
  { label: 'Пример', url: 'https://schweigi.github.io/assembler-simulator/' },
  { label: 'NASM', url: 'https://www.nasm.us/xdoc/2.07/nasmdoc0.php' },
];

const THEME_KEY = 'asm-emulator-theme';

/** Шапка: логотип, название, ссылки на лабораторные, переключатель темы. */

export class Header {
  readonly root: HTMLElement;
  private themeButton: HTMLButtonElement;

  constructor() {
    this.root = el('header', 'app-header');

    const left = el('div', 'app-header__left');
    const logo = el('img', 'app-header__logo');
    logo.src = '/icons/assembly.svg';
    logo.alt = 'Логотип';
    const title = el('div', 'app-header__title');
    title.appendChild(el('span', 'app-header__name', 'Asm-emulator'));
    title.appendChild(el('span', 'app-header__sub', '/ for laboratory works'));
    left.append(logo, title);

    const nav = el('nav', 'app-header__nav');
    for (const link of LAB_LINKS) {
      nav.appendChild(this.makeLink(link.label, link.url, 'Задания лабораторной работы'));
    }
    for (const link of EXTRA_LINKS) {
      nav.appendChild(this.makeLink(link.label, link.url, 'Внешний ресурс'));
    }

    const right = el('div', 'app-header__right');
    this.themeButton = iconButton(
      '/icons/light.svg',
      'Сменить тему',
      'app-header__theme-btn',
      () => this.toggleTheme(),
      'Светлая / тёмная тема',
    );
    right.appendChild(this.themeButton);

    this.root.append(left, nav, right);
    this.applyTheme(this.loadTheme());
  }

  private makeLink(label: string, url: string, title: string): HTMLElement {
    const link = el('a', 'app-header__link', label);
    link.href = url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.title = title;
    return link;
  }

  private loadTheme(): 'light' | 'dark' {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === 'dark' || saved === 'light') return saved;
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  private applyTheme(theme: 'light' | 'dark'): void {
    document.documentElement.dataset.theme = theme;
    const img = this.themeButton.querySelector('img');
    if (img) img.src = theme === 'dark' ? '/icons/dark.svg' : '/icons/light.svg';
  }

  private toggleTheme(): void {
    const current = document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
    const next = current === 'dark' ? 'light' : 'dark';
    localStorage.setItem(THEME_KEY, next);
    this.applyTheme(next);
  }
}
