/**
 * Сообщения эмулятора (перенесены и дополнены из старого проекта).
 * Формат «функция» позволяет подставлять номер строки и детали.
 */

export const compileMessages = {
  noCode: 'Нет кода для компиляции',
  unknownCommand: (cmd: string) => `неопознанная команда «${cmd}»`,
  commandNotAllowed: (cmd: string) => `команда «${cmd.toUpperCase()}» не разрешена в этом задании`,
  unknownRegister: (reg: string) => `неопознанный регистр «${reg}»`,
  registerNotAllowed: (reg: string) =>
    `регистр «${reg.toUpperCase()}» не разрешён в этом задании`,
  registerForbidden: (reg: string) =>
    `регистр «${reg.toUpperCase()}» запрещён условием задачи`,
  missingComma: 'отсутствует «,» между операндами',
  emptyOperand: 'пустой операнд',
  valueTooBig: 'значение превышает допустимый предел',
  wrongValue: 'неправильное значение',
  unknownLabel: (label: string) => `несуществующая метка «${label}»`,
  duplicateLabel: (label: string) => `повторяющаяся метка «${label}»`,
  noMacroEnd: 'у макроса нет конца (%endmacro)',
  macroError: 'ошибка в описании макроса',
  macroParamCount: 'неверное число параметров макроса',
  macroNotAllowed: 'макросы не доступны в этом задании',
  subroutineNotAllowed: 'подпрограммы (call/ret) не доступны в этом задании',
  memoryNotAllowed: 'обращение к памяти (byte[]/word[]) не доступно в этом задании',
  variablesNotAllowed: 'переменные и константы не доступны в этом задании',
  indexError: 'ошибка в индексе памяти',
  sizeMismatch: 'разрядность операндов не совпадает',
  memToMem: 'пересылка «память → память» запрещена',
  badShiftCount: 'счётчик сдвига должен быть числом от 0 до 31',
  pushByte: 'в стек можно помещать только 16-битные регистры (push al — нельзя)',
  ioNotAllowed: 'функции ввода-вывода прерывания 21h не доступны в этом задании',
  includeNotSupported: 'директива %include не поддерживается веб-эмулятором',
  badDirective: (text: string) => `неверная директива «${text}»`,
  badOrg: 'поддерживается только директива org 100h',
  nameClash: (name: string) => `имя «${name}» уже занято`,
  dataLabelAlone: 'в сегменте данных ожидалось определение данных (db/dw/dd/equ)',
  tooManyParams: (name: string) => `слишком много операндов у команды «${name.toUpperCase()}»`,
} as const;

export const runMessages = {
  programEnd: 'Конец программы',
  ioNotAllowed: 'функции ввода-вывода прерывания 21h не доступны в этом задании',
  unknownInterrupt: (num: number) =>
    `вызов неизвестного прерывания ${num.toString(16)}h`,
  unknownFunction: (ah: number) =>
    `неизвестная функция прерывания 21h: AH = ${ah.toString(16).toUpperCase().padStart(2, '0')}h`,
  retWithoutCall: 'команда ret без вызова call (стек пуст)',
  stackEmpty: 'стек пуст — извлекать нечего',
  stackOverflow: 'переполнение стека',
  divisionByZero: 'деление на ноль',
  infiniteLoop: 'программа зациклилась (превышен лимит выполненных команд)',
  awaitInput: 'Программа ждёт нажатия клавиши…',
} as const;

export const uiMessages = {
  compiledOk: (count: number) => `Успешная компиляция: ${count} команд`,
  compiledFail: 'Ошибка компиляции',
  noProgram: 'Нет скомпилированной программы — нажмите «Скомпилировать»',
  codeChanged: 'Код изменён — перекомпилируйте программу',
  resetDone: 'Состояние сброшено',
  started: 'Запуск программы…',
} as const;

/** Строка ошибки компиляции с номером строки. */
export function compileError(line: number, message: string): string {
  return `Строка ${line}: ${message}`;
}
