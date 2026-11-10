import { Registers } from "src/entities/Registers";

/**
 * Размер сегмента данных (16 строк по 16 байт)
 */
export const MEMORY_SIZE = 256;

/**
 * Разбор адресного выражения в памяти (Л/Р 3).
 *
 * Поддерживаются все формы, которые допускает IndexResolve:
 *   5          - прямой адрес
 *   1Ah        - прямой адрес в 16-ричной системе
 *   si         - косвенный адрес по регистру
 *   si+1       - регистр со смещением
 *   bx+si      - база + индекс
 *   bx+si+1    - база + индекс + смещение
 */
export function resolveAddress(address: string, registers: Registers): number | undefined {
    const expr = address.toLowerCase().trim();

    if (expr === '') {
        return undefined;
    }

    // Разбираем выражение на слагаемые/вычитаемые, подставляя значения регистров
    const tokens = expr.match(/[+-]?[^+-]+/g);

    if (!tokens) {
        return undefined;
    }

    let result = 0;

    for (let token of tokens) {
        let sign = 1;

        if (token[0] === '+') {
            token = token.slice(1);
        }
        else if (token[0] === '-') {
            sign = -1;
            token = token.slice(1);
        }

        token = token.trim();

        const regValue = registers.getNumberByName(token);

        if (regValue !== undefined) {
            result += sign * regValue;
            continue;
        }

        const numValue = parseNumber(token);

        if (numValue === undefined) {
            return undefined;
        }

        result += sign * numValue;
    }

    // адресация 16-битная: смещение -1 пришло из IndexResolve как 0FFFFh
    result = ((result % 0x10000) + 0x10000) % 0x10000;

    // Адресное пространство сегмента данных ограничено (256 байт: 0..FF)
    const maxAddress = MEMORY_SIZE - 1;

    if (result > maxAddress) {
        return undefined;
    }

    return result;
}

/**
 * Число в любой из систем счисления ассемблера: 10, 0Ah, 1010b
 */
export function parseNumber(value: string): number | undefined {
    value = value.toLowerCase().trim();

    if (value === '') {
        return undefined;
    }

    if (/^[0-9a-f]+h$/.test(value)) {
        return parseInt(value.slice(0, -1), 16);
    }

    if (/^[01]+b$/.test(value)) {
        return parseInt(value.slice(0, -1), 2);
    }

    // после разбора индекса (IndexResolve) все числа уже приведены к 16-ричной системе
    if (/^[0-9a-f]+$/.test(value)) {
        return parseInt(value, 16);
    }

    return undefined;
}
