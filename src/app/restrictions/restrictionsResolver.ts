import type { TaskRestricts } from 'shared/types/restrictions';
import { getTaskRestricts } from 'shared/restrictions/tasks';

/**
 * Разбор ссылки: ?lab=1..5&z=номер задачи (z — строка: 1..10, 0, 00, -1).
 * Логика setRestricts из старого проекта, но z читается как строка,
 * чтобы различать задачи «2.0» и «2.00».
 */

export interface ResolvedRestrictions {
  restricts: TaskRestricts | undefined;
  lab: number | null;
  task: string | null;
}

export function resolveRestrictions(search: string): ResolvedRestrictions {
  const params = new URLSearchParams(search);

  const labRaw = params.get('lab');
  const taskRaw = params.get('z');

  if (labRaw === null) {
    return { restricts: undefined, lab: null, task: null };
  }

  const lab = parseInt(labRaw, 10);
  if (Number.isNaN(lab)) {
    return { restricts: undefined, lab: null, task: null };
  }

  // задача не указана — работают только возможности лабораторной, без списка команд
  if (taskRaw === null) {
    const restricts = getTaskRestricts(lab, '');
    return { restricts, lab, task: null };
  }

  const task = taskRaw.trim();
  const restricts = getTaskRestricts(lab, task);
  return { restricts, lab, task };
}
