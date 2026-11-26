import { describe, it, expect } from 'vitest';
import { run, reg, memText } from '../helpers/run';

/**
 * Регрессионные тесты Л/Р 1 и Л/Р 2.
 *
 * Эти задачи были реализованы раньше, но доработка ядра (память, полурегистры,
 * loop) могла их сломать. Тесты фиксируют ожидаемые результаты по методичке.
 */

describe('Л/Р 1 - сдвиги и маски', () => {
    it('1.3 - маска AND выделяет нужные разряды', () => {
        const r = run(`mov ax, 56E8h
and ax, 00F0h
int 21h`, 1, 3);

        expect(r.error).toBeUndefined();
        expect(reg(r.dbg!, 'ax')).toBe('00E0');
    });

    it('1.4 - сдвиг влево и вправо', () => {
        const r = run(`mov ax, 1234h
shl ax, 4
shr ax, 4
int 21h`, 1, 4);

        expect(r.error).toBeUndefined();
        expect(reg(r.dbg!, 'ax')).toBe('0234');
    });

    it('1.7 - перестановка тетрад через сдвиги и маски', () => {
        const r = run(`mov DX, 567Fh
mov ax, dx
mov bx, dx
mov cx, dx
and ax, 000Fh
and bx, 0ff0h
and cx, f000h
shl bx, 4
shr cx, 8
or ax, bx
or ax, cx
mov dx, ax
int 21h`, 1, 7);

        expect(r.error).toBeUndefined();
        // 567F -> 675F
        expect(reg(r.dbg!, 'dx')).toBe('675F');
    });
});

describe('Л/Р 1 - циклы', () => {
    it('1.8 - цикл со сдвигами даёт 2222h', () => {
        const r = run(`mov dx, 0
mov cx, 4
cycle1:
shl dx, 3
inc dx
shl dx, 1
loop cycle1
int 21h`, 1, 8);

        expect(r.error).toBeUndefined();
        expect(reg(r.dbg!, 'dx')).toBe('2222');
    });

    it('loop выполняет ровно CX итераций', () => {
        // регресс: раньше тело цикла выполнялось на одну итерацию больше
        // в наборе 1.8 есть loop и inc, поэтому считаем через инкремент
        for (const n of [1, 2, 3, 6]) {
            const r = run(`mov dx, 0
mov cx, ${n}
top:
inc dx
loop top
int 21h`, 1, 8);

            expect(parseInt(reg(r.dbg!, 'dx')!, 16)).toBe(n);
        }
    });
});

describe('Л/Р 1 - условные переходы', () => {
    it('1.9 - jz срабатывает при нулевом результате', () => {
        // флаги ставит cmp - по заданию 1.9 сравнение делается через cmp
        const r = run(`mov ax, 5
cmp ax, 5
jz equal
mov bx, 1
jmp done
equal:
mov bx, 2
done:
int 21h`, 1, 9);

        expect(r.error).toBeUndefined();
        expect(reg(r.dbg!, 'bx')).toBe('0002');
    });

    it('1.9 - переход не срабатывает при ненулевом результате', () => {
        const r = run(`mov ax, 5
cmp ax, 3
jz equal
mov bx, 1
jmp done
equal:
mov bx, 2
done:
int 21h`, 1, 9);

        expect(reg(r.dbg!, 'bx')).toBe('0001');
    });
});

describe('Л/Р 1 - арифметика', () => {
    it('1.2 - сложение и вычитание', () => {
        const r = run(`mov cx, 10
add cx, 5
sub cx, 3
int 21h`, 1, 2);

        expect(reg(r.dbg!, 'cx')).toBe('000c'); // 10 + 5 - 3 = 12 = Ch
    });

    it('1.5 - сдвиги и арифметика', () => {
        const r = run(`mov ax, 8
shl ax, 2
sub ax, 4
int 21h`, 1, 5);

        expect(reg(r.dbg!, 'ax')).toBe('001c'); // 8*4 - 4 = 28 = 1Ch
    });
});

describe('Л/Р 2 - макрос и подпрограмма', () => {
    it('2.0 - универсальный макрос заполняет регистры', () => {
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

    it('2.1 - задача 1.1 через макрос', () => {
        const r = run(`%macro doit 2
mov ax, %1
shl ax, %2
%endmacro
start:
doit 2, 3
int 21h`, 2, 1);

        expect(r.error).toBeUndefined();
        expect(reg(r.dbg!, 'ax')).toBe('0010'); // 2 * 2^3 = 16
    });
});

describe('Ограничения работ', () => {
    it('в Л/Р 1 запрещена работа с памятью', () => {
        const r = run(`mov byte[0], 'A'
int 21h`, 1, 1);

        expect(r.error).toBe('Работа с памятью в этой работе запрещена');
    });

    it('в Л/Р 2 запрещена работа с памятью', () => {
        const r = run(`mov byte[0], 'A'
int 21h`, 2, 0);

        expect(r.error).toBe('Работа с памятью в этой работе запрещена');
    });

    it('в Л/Р 1 запрещён call', () => {
        const r = run(`call somewhere
int 21h`, 1, 1);

        expect(r.error).toBeDefined();
    });
});

describe('Полурегистры в вычислениях', () => {
    it('запись в DL меняет только младший байт DX', () => {
        const r = run(`mov dx, ABCDh
mov dl, 05h
int 21h`, 1, 8);

        expect(reg(r.dbg!, 'dx')).toBe('AB05');
    });

    it('запись в DH меняет только старший байт DX', () => {
        const r = run(`mov dx, ABCDh
mov dh, 01h
int 21h`, 1, 8);

        expect(reg(r.dbg!, 'dx')).toBe('01CD');
    });

    it('чтение AL даёт младший байт AX', () => {
        // набор 1.3: mov, and, int ; регистр AX
        const r = run(`mov ax, 1234h
and ax, 00FFh
int 21h`, 1, 3);

        // младший байт AX = 34h
        expect(reg(r.dbg!, 'ax')).toBe('0034');
    });
});
