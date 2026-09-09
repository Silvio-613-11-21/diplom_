/**
 * Минимальные помощники для работы с DOM (без фреймворков).
 */

export function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className?: string,
  text?: string,
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

export function button(
  label: string,
  className: string,
  onClick: () => void,
  title?: string,
): HTMLButtonElement {
  const btn = el('button', className, label);
  btn.type = 'button';
  if (title) btn.title = title;
  btn.addEventListener('click', onClick);
  return btn;
}

export function iconButton(
  src: string,
  alt: string,
  className: string,
  onClick: () => void,
  title?: string,
): HTMLButtonElement {
  const btn = el('button', className);
  btn.type = 'button';
  if (title) btn.title = title;
  const img = el('img');
  img.src = src;
  img.alt = alt;
  btn.appendChild(img);
  btn.addEventListener('click', onClick);
  return btn;
}

export function clear(node: HTMLElement): void {
  node.replaceChildren();
}
