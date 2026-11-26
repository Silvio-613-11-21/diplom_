import { describe, it, expect, beforeEach } from 'vitest';
import { resolveAddress, parseNumber, MEMORY_SIZE } from 'src/features/emulator/model/address/addressResolver';
import { RegistersState } from 'src/entities/Registers/model/RegistersState';
import { compile } from '../helpers/run';

/**
 * Юнит-тесты вычисления адреса памяти (Л/Р 3).
 *
 * Функция resolveAddress принимает адресное выражение из byte[...] / word[...]
 * и текущие значения регистров, а возвращает линейный адрес в сегменте данных
 * (0..FFh) либо undefined, если адрес недопустим.
 */

/** Регистры с заданными значениями - как после выполнения mov si, 10h и т.п. */
class TestRegisters extends RegistersState {
    constructor(values: Record<string, string> = {}) {
        super();

        for (const [name, value] of Object.entries(values)) {
            // setValue объявлен как protected - используем штатный путь через эмулятор не нужен
            (this as any).setValue(name, value);
        }
    }
}

const regs = (values: Record<string, string> = {}) => new TestRegisters(values) as any;

describe('resolveAddress - прямые адреса', () => {
    it('принимает шестнадцатеричный адрес', () => {
        expect(resolveAddress('45h', regs())).toBe(0x45);
    });

    it('принимает адрес в верхнем регистре', () => {
        expect(resolveAddress('4Fh', regs())).toBe(0x4f);
    });

    it('трактует голое число без суффикса как шестнадцатеричное', () => {
        // по соглашению проекта числа без суффикса - 16-ричные
        expect(resolveAddress('10', regs())).toBe(0x10);
    });

    it('принимает двоичную запись', () => {
        expect(resolveAddress('1010b', regs())).toBe(10);
    });

    it('принимает граничные адреса сегмента', () => {
        expect(resolveAddress('0', regs())).toBe(0);
        expect(resolveAddress('FFh', regs())).toBe(MEMORY_SIZE - 1);
    });

    it('обрезает пробелы вокруг выражения', () => {
        expect(resolveAddress('  20h  ', regs())).toBe(0x20);
    });
});

describe('resolveAddress - косвенная адресация', () => {
    it('берёт адрес из регистра SI', () => {
        expect(resolveAddress('si', regs({ si: '0010' }))).toBe(0x10);
    });

    it('берёт адрес из регистра BX', () => {
        expect(resolveAddress('bx', regs({ bx: '0040' }))).toBe(0x40);
    });

    it('складывает регистр со смещением', () => {
        expect(resolveAddress('si+2', regs({ si: '0010' }))).toBe(0x12);
    });

    it('складывает базу и индекс', () => {
        expect(resolveAddress('bx+si', regs({ bx: '0010', si: '0005' }))).toBe(0x15);
    });

    it('складывает базу, индекс и смещение', () => {
        expect(resolveAddress('bx+si+4', regs({ bx: '0010', si: '0005' }))).toBe(0x19);
    });

    it('понимает полурегистр как базу', () => {
        // в задачах Л/Р 3 адрес часто считают в BH/BL
        expect(resolveAddress('bh+2', regs({ bx: '1000' }))).toBe(0x12);
        expect(resolveAddress('bl+2', regs({ bx: '0005' }))).toBe(0x07);
    });

    it('вычитает смещение', () => {
        expect(resolveAddress('si-1', regs({ si: '0010' }))).toBe(0x0f);
    });
});

describe('resolveAddress - границы сегмента', () => {
    it('возвращает undefined для адреса за пределами 256 байт', () => {
        expect(resolveAddress('100h', regs())).toBeUndefined();
    });

    it('возвращает undefined, если регистр уводит адрес за границу', () => {
        expect(resolveAddress('si+10h', regs({ si: '00F5' }))).toBeUndefined();
    });

    it('возвращает undefined для пустого выражения', () => {
        expect(resolveAddress('', regs())).toBeUndefined();
        expect(resolveAddress('   ', regs())).toBeUndefined();
    });

    it('возвращает undefined для неразборчивого выражения', () => {
        expect(resolveAddress('@@@', regs())).toBeUndefined();
    });

    it('возвращает undefined для несуществующего регистра', () => {
        expect(resolveAddress('zz', regs())).toBeUndefined();
    });

    it('сам по себе принимает любой регистр (фильтрация - в IndexResolve)', () => {
        // resolveAddress - низкоуровневая функция: она просто складывает значения.
        // То, что DX нельзя использовать в адресе, проверяет уровень выше - IndexResolve,
        // который вообще не пропустит такое выражение к эмулятору.
        const r = regs({ dx: '0005' });
        expect(resolveAddress('dx+1', r)).toBe(6);

        // а вот полный конвейер разбора такую запись отклоняет
        const err = compile("mov word[dx], 'AB'\nint 21h", 3, 0);
        expect(err).toBe('Ошибка в индексе');
    });
});

describe('parseNumber - системы счисления', () => {
    it('разбирает шестнадцатеричное с суффиксом h', () => {
        expect(parseNumber('1Ah')).toBe(26);
        expect(parseNumber('FFh')).toBe(255);
    });

    it('разбирает двоичное с суффиксом b', () => {
        expect(parseNumber('1010b')).toBe(10);
    });

    it('разбирает число как шестнадцатеричное без суффикса', () => {
        expect(parseNumber('10')).toBe(16);
    });

    it('возвращает undefined для пустой строки', () => {
        expect(parseNumber('')).toBeUndefined();
        expect(parseNumber('   ')).toBeUndefined();
    });

    it('возвращает undefined для мусора', () => {
        expect(parseNumber('xyz')).toBeUndefined();
    });
});
