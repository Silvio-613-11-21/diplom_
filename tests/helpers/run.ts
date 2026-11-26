/**
 * Вспомогательные функции для интеграционных тестов.
 *
 * Позволяют записать программу на "ассемблере", прогнать её через настоящий
 * парсер и настоящий эмулятор и прочитать результат - регистры и память.
 */
import { parser } from 'src/features/parser/parser';
import { Emulator } from 'src/features/emulator/ui/emularor';
import { Debugger } from 'src/widgets/Debugger/ui/Debugger';
import { getRestrists } from 'src/shared/Restricts/getRestricts';

/** Предел шагов, чтобы тест не завис на бесконечном цикле */
const MAX_STEPS = 20000;

export interface RunResult {
    /** Сообщение об ошибке компиляции, если программа не собралась */
    error?: string;
    /** Отладчик (регистры, флаги, память) */
    dbg?: Debugger;
    /** Количество полученных инструкций */
    instructions?: number;
}

/**
 * Собрать и выполнить программу в ограничениях задачи.
 *
 * @param code   текст программы (многострочный)
 * @param lab    номер лабораторной
 * @param z      номер задачи
 */
export function run(code: string, lab: number, z: number): RunResult {
    const restr = getRestrists(lab, z);

    if (!restr) {
        return { error: `нет ограничений для lab=${lab}, z=${z}` };
    }

    const lines = code.split('\n');

    const parsed = parser(
        lines,
        restr.lab,
        restr.cmd,
        restr.rl,
        restr.indexRegs,
        restr.forbiddenRegs
    );

    // парсер возвращает строку, если программа некорректна
    if (typeof parsed === 'string') {
        return { error: parsed };
    }

    const app = document.createElement('div');
    document.body.appendChild(app);

    const dbg = new Debugger(app);

    let i = 0;
    let steps = 0;

    while (i < parsed.length && steps < MAX_STEPS) {
        Emulator.emulate(parsed, dbg, i);

        if (Emulator.breakFl) {
            break;
        }

        i = Emulator.trFl ? Emulator.step : i + 1;
        steps++;
    }

    return { dbg, instructions: parsed.length, error: undefined };
}

/** Только скомпилировать программу, без выполнения */
export function compile(code: string, lab: number, z: number) {
    const restr = getRestrists(lab, z);

    if (!restr) {
        return `нет ограничений для lab=${lab}, z=${z}`;
    }

    return parser(
        code.split('\n'),
        restr.lab,
        restr.cmd,
        restr.rl,
        restr.indexRegs,
        restr.forbiddenRegs
    );
}

/** Значение регистра (в виде строки из 4 hex-цифр) */
export function reg(dbg: Debugger, name: string): string | undefined {
    return dbg.reg.getValueByName(name);
}

/** Текст, записанный в память с адреса from до to (непечатаемые - точкой) */
export function memText(dbg: Debugger, from: number, to: number): string {
    let res = '';

    for (let addr = from; addr < to; addr++) {
        res += dbg.dataSegment.getChar(addr);
    }

    return res;
}

/** Сообщения, выведенные в консоль отладчика */
export function consoleText(): string {
    return document.querySelector('.console-content')?.textContent?.trim() ?? '';
}
