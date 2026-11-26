import { describe, it, expect } from 'vitest';
import { run, reg, memText } from '../helpers/run';

/**
 * Интеграционные тесты подпрограмм (call / ret).
 *
 * Адреса возврата хранятся в стеке Emulator.callStack, поэтому подпрограмма
 * может вызывать другую подпрограмму, и возврат всегда идёт в правильное место.
 * Эти тесты проверяют именно вложенность - раньше на этом месте был баг.
 */

describe('Базовый вызов', () => {
    it('call выполняет подпрограмму и возвращается', () => {
        const r = run(`mov ax, 1
call sub
mov dx, 2
int 21h
sub:
mov bx, 3
ret`, 2, 5);

        expect(r.error).toBeUndefined();
        expect(reg(r.dbg!, 'bx')).toBe('0003');
        // после возврата выполнилась следующая команда
        expect(reg(r.dbg!, 'dx')).toBe('0002');
    });

    it('пустая подпрограмма (только ret) ничего не ломает', () => {
        const r = run(`mov ax, 5
call empty
int 21h
empty:
ret`, 2, 1);

        expect(r.error).toBeUndefined();
        expect(reg(r.dbg!, 'ax')).toBe('0005');
    });

    it('подпрограмма вызывается несколько раз', () => {
        const r = run(`mov ax, 0
call addone
call addone
call addone
int 21h
addone:
add ax, 1
ret`, 2, 5);

        expect(reg(r.dbg!, 'ax')).toBe('0003');
    });
});

describe('Вложенные вызовы', () => {
    it('подпрограмма вызывает другую подпрограмму', () => {
        const r = run(`mov ax, 0
call level1
int 21h
level1:
add ax, 1
call level2
ret
level2:
add ax, 1
ret`, 2, 5);

        expect(r.error).toBeUndefined();
        expect(reg(r.dbg!, 'ax')).toBe('0002');
    });

    it('вложенность в три уровня', () => {
        const r = run(`mov ax, 0
call a
int 21h
a:
inc ax
call b
ret
b:
inc ax
call c
ret
c:
inc ax
ret`, 3, -1);

        expect(r.error).toBeUndefined();
        // все три подпрограммы отработали
        expect(reg(r.dbg!, 'ax')).toBe('0003');
    });

    it('после вложенного вызова управление возвращается на нужное место', () => {
        const r = run(`mov ax, 0
call a
mov dx, 7
int 21h
a:
mov bx, 1
call b
mov cx, 2
ret
b:
mov si, 3
ret`, 3, -1);

        expect(r.error).toBeUndefined();
        expect(reg(r.dbg!, 'bx')).toBe('0001');
        expect(reg(r.dbg!, 'cx')).toBe('0002'); // выполнилось после возврата из b
        expect(reg(r.dbg!, 'dx')).toBe('0007'); // выполнилось после возврата из a
    });

    it('подпрограмма с двумя вызовами внутри', () => {
        const r = run(`mov ax, 0
call outer
int 21h
outer:
call leaf
call leaf
ret
leaf:
add ax, 1
ret`, 2, 5);

        expect(reg(r.dbg!, 'ax')).toBe('0002');
    });
});

describe('Подпрограммы и память', () => {
    it('подпрограмма пишет в память по переданному указателю', () => {
        const r = run(`mov si, 10h
call putA
mov si, 20h
call putA
int 21h
putA:
mov byte[si], 'A'
ret`, 3, -1);

        expect(memText(r.dbg!, 0x10, 0x11)).toBe('A');
        expect(memText(r.dbg!, 0x20, 0x21)).toBe('A');
    });

    it('подпрограмма затирает область памяти', () => {
        const r = run(`mov byte[0], 'X'
mov byte[1], 'Y'
mov si, 0
mov cx, 2
call wipe
int 21h
wipe:
wloop:
mov byte[si], '^'
inc si
loop wloop
ret`, 3, -1);

        expect(memText(r.dbg!, 0, 2)).toBe('^^');
    });
});

describe('Подпрограммы и регистры', () => {
    it('подпрограмма сохраняет и меняет регистры', () => {
        const r = run(`mov ax, 1
mov bx, 2
call swap
int 21h
swap:
mov cx, ax
mov ax, bx
mov bx, cx
ret`, 2, 5);

        expect(reg(r.dbg!, 'ax')).toBe('0002');
        expect(reg(r.dbg!, 'bx')).toBe('0001');
    });

    it('полурегистры работают внутри подпрограмм', () => {
        const r = run(`mov dx, 0
call setdl
int 21h
setdl:
mov dl, 5
ret`, 2, 5);

        expect(reg(r.dbg!, 'dx')).toBe('0005');
    });
});

describe('Ошибки подпрограмм', () => {
    it('вызов несуществующей метки', () => {
        const r = run(`call nowhere
int 21h`, 2, 5);

        expect(r.error).toBeDefined();
    });
});
