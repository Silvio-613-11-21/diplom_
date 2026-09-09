import type { EmulatorFeatures, TaskRestricts } from '../types/restrictions';

/**
 * Таблица ограничений по лабораторным работам и задачам.
 *
 * Источник ограничений — текст заданий (magicurl.ru/evm/labN).
 * Если у задачи нет явного перечня «Разрешено использовать только команды…»,
 * то ограничения не ставятся — оставлена заглушка (функция, возвращающая
 * «задание без явных ограничений»), чтобы их легко было добавить позже.
 */

// ---------------------------------------------------------------------------
// Возможности эмулятора по лабораторным
// ---------------------------------------------------------------------------

function featuresForLab(lab: number): EmulatorFeatures {
  switch (lab) {
    case 1: // Команды, регистры и флаги
      return { macros: false, subroutines: false, memory: false, variables: false, io: false };
    case 2: // Подпрограммы, макросы, библиотеки
      return { macros: true, subroutines: true, memory: false, variables: false, io: false };
    case 3: // Работа с памятью (+ память)
      return { macros: true, subroutines: true, memory: true, variables: false, io: false };
    case 4: // Переменные и константы (+ db/dw/dd/equ)
      return { macros: true, subroutines: true, memory: true, variables: true, io: false };
    case 5: // Прерывания (+ функции ввода-вывода)
      return { macros: true, subroutines: true, memory: true, variables: true, io: true };
    default:
      return { macros: true, subroutines: true, memory: true, variables: true, io: true };
  }
}

// ---------------------------------------------------------------------------
// Лабораторная 1: «Команды, регистры и флаги»
// ---------------------------------------------------------------------------

const LAB1_REGS = ['ax', 'bx', 'cx', 'dx'];

function lab1Task(task: string): TaskRestricts {
  const base = { lab: 1, task, features: featuresForLab(1) };

  switch (task) {
    case '1': // Умножение на степени двойки через сдвиг
      return { ...base, allowCmd: ['mov', 'shl'], allowRegs: ['ax', 'bx'] };
    case '2': // Умножение на произвольные константы
      return { ...base, allowCmd: ['mov', 'shl', 'add', 'sub'], allowRegs: ['cx', 'dx'] };
    case '3': // Выделение hex-цифры маской
      return { ...base, allowCmd: ['mov', 'and'], allowRegs: ['ax'] };
    case '4': // Выделение hex-цифры и перемещение её через сдвиги
      return { ...base, allowCmd: ['mov', 'shl', 'shr', 'and'], allowRegs: ['ax'] };
    case '5': // Выражение через сложение и вычитание
    case '6': // Выражение сложнее
      return {
        ...base,
        allowCmd: ['mov', 'shr', 'shl', 'add', 'sub'],
        allowRegs: LAB1_REGS,
      };
    case '7': // Перестановка hex-цифр местами
      return {
        ...base,
        allowCmd: ['mov', 'shr', 'shl', 'add', 'xor', 'or', 'and'],
        allowRegs: LAB1_REGS,
      };
    case '8': // Цикл: картинка из единичных битов
      return {
        ...base,
        allowCmd: ['mov', 'loop', 'shl', 'inc'],
        allowRegs: LAB1_REGS, // cx занят счётчиком цикла
      };
    case '9': // Двойной условный оператор
    case '10': // Условный оператор с составным условием
      return {
        ...base,
        allowCmd: [
          'mov', 'cmp', 'jmp', 'js', 'jns', 'jz', 'jnz', 'je', 'jne',
          'ja', 'jb', 'jl', 'jg', 'jle', 'jge', 'add', 'sub', 'inc', 'dec',
        ],
        allowRegs: LAB1_REGS,
      };
    case '-1': // Весь набор команд л.р. 1 без ограничений
      return noRestrictsTask(1, task);
    default:
      // Неизвестный номер задачи — ограничений нет (заглушка).
      return noRestrictsTask(1, task);
  }
}

// ---------------------------------------------------------------------------
// Лабораторная 2: «Подпрограммы, макросы, библиотеки»
// ---------------------------------------------------------------------------

function lab2Task(task: string): TaskRestricts {
  const features = featuresForLab(2);

  // Задачи 2.1–2.10 переделывают задачи 1.1–1.1.0: наследуют их ограничения,
  // плюс к ним добавляются call/ret и макросы (возможности л.р. 2).
  const inherited = lab1Task(task);
  if (task >= '1' && task <= '10') {
    return {
      lab: 2,
      task,
      allowCmd: [...(inherited.allowCmd ?? []), 'call', 'ret'],
      allowRegs: inherited.allowRegs,
      features,
    };
  }

  // 2.0, 2.00, 2.11, 2.12 и остальные — без явных ограничений (заглушка).
  return { ...noRestrictsTask(2, task), features };
}

// ---------------------------------------------------------------------------
// Лабораторная 3: «Работа с памятью»
// ---------------------------------------------------------------------------

function lab3Task(task: string): TaskRestricts {
  const features = featuresForLab(3);

  if (task === '0') {
    // Задача 3.0: «Регистры BX и SI использовать нельзя!»
    return {
      lab: 3,
      task,
      denyRegs: ['bx', 'si', 'bl', 'bh'],
      features,
    };
  }

  // 3.00–3.8 — без явных ограничений (заглушка).
  return { ...noRestrictsTask(3, task), features };
}

// ---------------------------------------------------------------------------
// Лабораторные 4 и 5: «Переменные и константы», «Прерывания»
// ---------------------------------------------------------------------------

function lab4Task(task: string): TaskRestricts {
  // В тексте задач л.р. 4 явных ограничений нет — заглушка.
  return { ...noRestrictsTask(4, task), features: featuresForLab(4) };
}

function lab5Task(task: string): TaskRestricts {
  // В тексте задач л.р. 5 явных ограничений нет — заглушка.
  return { ...noRestrictsTask(5, task), features: featuresForLab(5) };
}

// ---------------------------------------------------------------------------
// Заглушка: задание без явных ограничений
// ---------------------------------------------------------------------------

/**
 * Задание, для которого в условии нет перечня разрешённых команд и регистров.
 * Ограничения не ставятся; при необходимости их легко добавить,
 * дописав allowCmd / allowRegs у конкретного номера задачи выше.
 */
function noRestrictsTask(lab: number, task: string): TaskRestricts {
  return { lab, task, features: featuresForLab(lab) };
}

// ---------------------------------------------------------------------------
// Публичное API
// ---------------------------------------------------------------------------

/**
 * Ограничения по номеру лабораторной и задачи.
 * z передаётся строкой: '1'..'10', '0', '00' (задачи вида 2.00), '-1'.
 * Возвращает undefined, если номер лабораторной не распознан
 * (свободный режим без ограничений).
 */
export function getTaskRestricts(lab: number, task: string): TaskRestricts | undefined {
  switch (lab) {
    case 1: return lab1Task(task);
    case 2: return lab2Task(task);
    case 3: return lab3Task(task);
    case 4: return lab4Task(task);
    case 5: return lab5Task(task);
    default: return undefined;
  }
}
