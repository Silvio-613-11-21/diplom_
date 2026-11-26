import { describe, it, expect } from 'vitest';
import { run, reg, memText } from '../helpers/run';

/**
 * Интеграционные тесты: настоящие программы проходят полный путь -
 * проверка ограничений, разбор, выполнение, чтение результата.
 */

describe('Задачи Л/Р 3 - работа с памятью', () => {
    it('3.0 - надпись «Hello, World!» с адреса 45h', () => {
        const r = run(`mov word[45h], 'He'
mov word[47h], 'll'
mov word[49h], 'o,'
mov word[4Bh], ' W'
mov word[4Dh], 'or'
mov word[4Fh], 'ld'
mov byte[51h], '!'
int 21h`, 3, 0);

        expect(r.error).toBeUndefined();
        expect(memText(r.dbg!, 0x45, 0x52)).toBe('Hello, World!');
    });

    it('3.0 - запрещает регистр BX по условию задачи', () => {
        const r = run(`mov bx, 5
int 21h`, 3, 0);

        expect(r.error).toBe('Регистр запрещён условием задачи');
    });

    it('3.7 - копирует фрагмент через промежуточный регистр', () => {
        const r = run(`mov byte[20h], 'A'
mov byte[21h], 'B'
mov al, byte[20h]
mov byte[30h], al
int 21h`, 3, 7);

        expect(r.error).toBeUndefined();
        expect(memText(r.dbg!, 0x20, 0x22)).toBe('AB');
        expect(memText(r.dbg!, 0x30, 0x31)).toBe('A');
    });
});

describe('Регресс Л/Р 1 и Л/Р 2', () => {
    it('1.3 - маска AND выделяет нужные разряды', () => {
        const r = run(`mov ax, 56E8h
and ax, 00F0h
int 21h`, 1, 3);

        expect(r.error).toBeUndefined();
        expect(reg(r.dbg!, 'ax')).toBe('00E0');
    });

    it('2.0 - универсальный макрос заполняет регистры', () => {
        const r = run(`%macro initregs 4
mov ax, %1
mov bx, %2
mov cx, %3
mov dx, %4
%endmacro

initregs 1, 2, 3, 4
int 21h`, 2, 0);

        expect(r.error).toBeUndefined();
        expect(reg(r.dbg!, 'ax')).toBe('0001');
        expect(reg(r.dbg!, 'bx')).toBe('0002');
        expect(reg(r.dbg!, 'cx')).toBe('0003');
        expect(reg(r.dbg!, 'dx')).toBe('0004');
    });
});
