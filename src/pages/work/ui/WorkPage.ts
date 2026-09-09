import './WorkPage.css';

import { el } from 'shared/lib/dom';
import type { TaskRestricts } from 'shared/types/restrictions';
import { Editor } from 'widgets/editor';
import { Debugger } from 'widgets/debugger';
import { ControlPanel } from 'widgets/control-panel';
import { RestrictInfo } from 'widgets/restrict-info';

/**
 * Рабочая страница: панель управления + информация об ограничениях сверху,
 * слева редактор кода, справа отладчик (как в старом проекте).
 */

export function WorkPage(root: HTMLElement, restricts: TaskRestricts | undefined): void {
  const page = el('div', 'work-page');

  const topRow = el('div', 'work-page__top');

  const debuggerWidget = new Debugger();
  const editor = new Editor(() => undefined); // изменения кода учитываются при компиляции
  const controlPanel = new ControlPanel(editor, debuggerWidget, restricts);
  const restrictInfo = new RestrictInfo(restricts);

  topRow.append(controlPanel.root, restrictInfo.root);

  const mainRow = el('div', 'work-page__main');
  mainRow.append(editor.root, debuggerWidget.root);

  page.append(topRow, mainRow);
  root.appendChild(page);
}
