import { describe, it, expect } from 'vitest';
import { run, compile, memText, reg } from '../helpers/run';

/**
 * Интеграционные тесты макросов (Л/Р 2).
 *
 * Макрос - это шаблон кода с параметрами %1..%N. Перед разбором парсер
 * подставляет аргументы вызова и вставляет строки шаблона на место вызова.
 * Эти тесты проверяют и сам механизм подстановки, и его крайние случаи.
 */

describe('Базовый макрос', () => {
    it('подставляет один параметр', () => {
        const r = run(`%macro m 1
mov ax, %1
%endmacro
m 5
int 21h`, 3, -1);

        expect(r.error).toBeUndefined();
        expect(reg(r.dbg!, 'ax')).toBe('0005');
    });

    it('подставляет несколько параметров', () => {
        const r = run(`%macro pair 2
mov ax, %1
mov bx, %2
%endmacro
pair 1, 2
int 21h`, 3, -1);

        expect(reg(r.dbg!, 'ax')).toBe('0001');
        expect(reg(r.dbg!, 'bx')).toBe('0002');
    });

    it('вызывается несколько раз с разными аргументами', () => {
        const r = run(`%macro m 1
mov ax, %1
%endmacro
m 1
m 2
int 21h`, 3, -1);

        // остаётся результат последнего вызова
        expect(reg(r.dbg!, 'ax')).toBe('0002');
    });

    it('работает без параметров', () => {
        const r = run(`%macro hello 0
mov ax, 7
%endmacro
hello
int 21h`, 3, -1);

        expect(r.error).toBeUndefined();
        expect(reg(r.dbg!, 'ax')).toBe('0007');
    });

    it('макрос может не содержать команд вообще (только данные)', () => {
        const r = run(`%macro put 1
mov byte[%1], 'X'
%endmacro
put 10h
int 21h`, 3, -1);

        expect(memText(r.dbg!, 0x10, 0x11)).toBe('X');
    });
});

describe('Универсальный макрос Л/Р 2.0', () => {
    it('initregs заполняет регистры и вызывает подпрограмму', () => {
        const r = run(`%macro initregs 5
mov ax, %1
mov bx, %2
mov cx, %3
mov dx, %4
call %5
%endmacro
sd:
initregs 1,2,3,4,sd
int 21h`, 2, 0);

        expect(r.error).toBeUndefined();
        expect(reg(r.dbg!, 'ax')).toBe('0001');
        expect(reg(r.dbg!, 'bx')).toBe('0002');
        expect(reg(r.dbg!, 'cx')).toBe('0003');
        expect(reg(r.dbg!, 'dx')).toBe('0004');
    });

    it('пятый параметр макроса - имя подпрограммы', () => {
        // подпрограмма перезаписывает BX - значит вызов реально произошёл.
        // набор задачи 2.0 содержит только mov, поэтому тело подпрограммы - mov
        const r = run(`%macro initregs 5
mov ax, %1
call %5
%endmacro
sd:
initregs 10h,0,0,0,target
int 21h
target:
mov bx, 99
ret`, 2, 0);

        expect(r.error).toBeUndefined();
        expect(reg(r.dbg!, 'ax')).toBe('0010'); // 10h
        expect(reg(r.dbg!, 'bx')).toBe('0063'); // 99 десятичное = 63h
    });

    it('подпрограмма без тела (только ret) не ломает программу', () => {
        const r = run(`%macro initregs 5
mov ax, %1
call %5
%endmacro
sd:
initregs 1,0,0,0,empty
int 21h
empty:
ret`, 2, 0);

        expect(r.error).toBeUndefined();
        expect(reg(r.dbg!, 'ax')).toBe('0001');
    });
});

describe('Вложенные макросы', () => {
    it('макрос вызывает другой макрос', () => {
        // 42h с суффиксом, иначе число трактуется как десятичное (42 = 2Ah)
        const r = run(`%macro inner 1
mov ax, %1
%endmacro
%macro outer 1
inner %1
%endmacro
outer 42h
int 21h`, 3, -1);

        expect(r.error).toBeUndefined();
        expect(reg(r.dbg!, 'ax')).toBe('0042');
    });

    it('число без суффикса в макросе - десятичное', () => {
        const r = run(`%macro m 1
mov ax, %1
%endmacro
m 42
int 21h`, 3, -1);

        expect(reg(r.dbg!, 'ax')).toBe('002A'); // 42 = 2Ah
    });

    it('вложенность в три уровня', () => {
        const r = run(`%macro a 0
b
%endmacro
%macro b 0
c
%endmacro
%macro c 0
mov ax, 9
%endmacro
a
int 21h`, 3, -1);

        expect(r.error).toBeUndefined();
        expect(reg(r.dbg!, 'ax')).toBe('0009');
    });

    it('вложенный макрос работает и в обратном порядке объявления', () => {
        const r = run(`%macro outer 1
inner %1
%endmacro
%macro inner 1
mov bx, %1
%endmacro
outer 3
int 21h`, 3, -1);

        expect(reg(r.dbg!, 'bx')).toBe('0003');
    });
});

describe('Защита от рекурсии', () => {
    it('самовызывающийся макрос не вешает парсер', () => {
        const res = compile(`%macro rec 0
rec
%endmacro
rec`, 3, -1);

        expect(typeof res).toBe('string');
        expect(res).toContain('вложенность');
    });

    it('взаимная рекурсия двух макросов тоже отлавливается', () => {
        const res = compile(`%macro a 0
b
%endmacro
%macro b 0
a
%endmacro
a`, 3, -1);

        expect(typeof res).toBe('string');
    });
});

describe('Ошибки при работе с макросами', () => {
    it('неверное число параметров', () => {
        const res = compile(`%macro m 2
mov ax, %1
%endmacro
m 5`, 3, -1);

        expect(res).toBe('Ошибка в числе параметров');
    });

    it('нет закрывающего %endmacro', () => {
        const res = compile(`%macro m 1
mov ax, %1`, 3, -1);

        expect(res).toBe('У макроса нет конца');
    });

    it('пустое имя не считается макросом', () => {
        const res = compile(`mov ax, 5
int 21h`, 3, -1);

        expect(typeof res).not.toBe('string');
    });
});

describe('Макрос и строковые параметры', () => {
    it('передаёт символ в параметре', () => {
        const r = run(`%macro put 2
mov byte[%1], %2
%endmacro
put 10h, 'Z'
int 21h`, 3, -1);

        expect(memText(r.dbg!, 0x10, 0x11)).toBe('Z');
    });

    it('сохраняет регистр буквы в параметре', () => {
        const r = run(`%macro put 1
mov byte[10h], %1
%endmacro
put 'Q'
int 21h`, 3, -1);

        expect(memText(r.dbg!, 0x10, 0x11)).toBe('Q');
    });
});
