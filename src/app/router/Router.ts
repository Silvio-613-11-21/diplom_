import { Header } from 'widgets/header';
import { WorkPage } from 'pages/work';
import { resolveRestrictions } from '../restrictions/restrictionsResolver';

/**
 * Точка сборки приложения: шапка + рабочая страница.
 * Ограничения эмулятора определяются ссылкой (?lab=…&z=…).
 */
export function Router(root: HTMLElement): void {
  const { restricts } = resolveRestrictions(window.location.search);

  root.appendChild(new Header().root);
  WorkPage(root, restricts);
}
