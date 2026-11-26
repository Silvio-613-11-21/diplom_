import { describe, it, expect } from 'vitest';
import { run, memText, reg } from '../helpers/run';

/**
 * Интеграционные тесты задач Л/Р 3 «Работа с памятью ЭВМ».
 *
 * Каждый тест - это настоящая программа на ассемблере, которая проходит
 * полный путь: проверка ограничений → разбор → выполнение → результат в памяти.
 * Программы написаны по формулировкам заданий методички.
 */

describe('3.0 - надпись «Hello, World!» с 5-й строки', () => {
    it('записывает надпись по два символа, начиная с адреса 45h', () => {
        // 5-я строка таблицы (строки по 16 байт) начинается с адреса 40h,
        // 6-я позиция в строке - это 40h + 5 = 45h
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

    it('надпись начинается именно с 45h, а не с 40h', () => {
        const r = run(`mov word[45h], 'He'
int 21h`, 3, 0);

        expect(r.dbg!.dataSegment.getChar(0x44)).not.toBe('H');
        expect(r.dbg!.dataSegment.getChar(0x45)).toBe('H');
    });

    it('запрещает регистр BX по условию задачи', () => {
        const r = run(`mov bx, 5
int 21h`, 3, 0);

        expect(r.error).toBe('Регистр запрещён условием задачи');
    });

    it('запрещает регистр SI по условию задачи', () => {
        const r = run(`mov si, 5
int 21h`, 3, 0);

        expect(r.error).toBe('Регистр запрещён условием задачи');
    });

    it('запрещает полурегистры запрещённого BX', () => {
        const r = run(`mov bh, 5
int 21h`, 3, 0);

        expect(r.error).toBe('Регистр запрещён условием задачи');
    });
});

describe('3.00 - то же самое, но через регистр SI', () => {
    it('записывает надпись по адресу из SI', () => {
        const r = run(`mov ax, 40h
mov si, ax
mov word[si], 'He'
mov word[si+2], 'll'
mov word[si+4], 'o!'
int 21h`, 3, 1);

        expect(r.error).toBeUndefined();
        expect(memText(r.dbg!, 0x40, 0x46)).toBe('Hello!');
    });

    it('позволяет менять SI и писать в разные места', () => {
        const r = run(`mov si, 10h
mov byte[si], 'A'
mov si, 20h
mov byte[si], 'B'
int 21h`, 3, 1);

        expect(memText(r.dbg!, 0x10, 0x11)).toBe('A');
        expect(memText(r.dbg!, 0x20, 0x21)).toBe('B');
    });
});

describe('3.1 - надпись с ФИО через макрос', () => {
    it('макрос, вызванный дважды, пишет две надписи', () => {
        const r = run(`%macro putfio 1
mov si, %1
mov word[si], 'Iv'
mov word[si+2], 'an'
mov word[si+4], 'ov'
%endmacro
putfio 10h
putfio 40h
int 21h`, 3, 2);

        expect(r.error).toBeUndefined();
        expect(memText(r.dbg!, 0x10, 0x16)).toBe('Ivanov');
        expect(memText(r.dbg!, 0x40, 0x46)).toBe('Ivanov');
    });

    it('подпрограмма с ФИО вызывается через call', () => {
        const r = run(`mov si, 20h
call fio
int 21h
fio:
mov word[si], 'Pe'
mov word[si+2], 'tr'
mov word[si+4], 'ov'
ret`, 3, 2);

        expect(r.error).toBeUndefined();
        expect(memText(r.dbg!, 0x20, 0x26)).toBe('Petrov');
    });
});

describe('3.2 - заполнение области символами ^', () => {
    it('заполняет с 0-й позиции по позицию из DH включительно', () => {
        const r = run(`mov dh, 5
mov si, 0
mov cx, 6
fill:
mov byte[si], '^'
inc si
loop fill
int 21h`, 3, 3);

        expect(r.error).toBeUndefined();
        expect(memText(r.dbg!, 0, 6)).toBe('^^^^^^');

        // за пределами области память не тронута
        expect(r.dbg!.dataSegment.getChar(6)).not.toBe('^');
    });

    it('значение DH управляет длиной области', () => {
        const r = run(`mov dh, 2
mov si, 0
mov cx, 3
fill:
mov byte[si], '^'
inc si
loop fill
int 21h`, 3, 3);

        expect(memText(r.dbg!, 0, 3)).toBe('^^^');
        expect(r.dbg!.dataSegment.getChar(3)).not.toBe('^');
    });
});

describe('3.3 - заполнение между позициями DH и DL', () => {
    it('заполняет область от DH до DL включительно', () => {
        const r = run(`mov dh, 5
mov dl, 10
mov si, 5
mov cx, 6
fill:
mov byte[si], '^'
inc si
loop fill
int 21h`, 3, 4);

        expect(r.error).toBeUndefined();

        // до области - пусто (неинициализированные ячейки содержат \u0000)
        expect(memText(r.dbg!, 0, 5)).toBe('\u0000\u0000\u0000\u0000\u0000');
        // область заполнена
        expect(memText(r.dbg!, 5, 11)).toBe('^^^^^^');
        // после области - пусто
        expect(r.dbg!.dataSegment.getChar(11)).not.toBe('^');
    });
});

describe('3.4 - длина надписи по закрывающую скобку', () => {
    it('находит позицию символа > в надписи', () => {
        // надпись: <=== Familia Imia Otchestvo ===>
        // ставим её в память с адреса 10h и ищем '>'
        const words = ['<=', '==', ' F', 'am', 'il', 'ia', ' I', 'mi', 'a ', 'Ot', 'ch', 'es', 'tv', 'o ', '==', '=>'];

        let code = 'mov dl, 0\nmov si, 0\n';

        words.forEach((w, i) => {
            const addr = (0x10 + i * 2).toString(16) + 'h';
            code += `mov word[${addr}], '${w}'\n`;
        });

        code += `cnt:
mov bx, 10h
mov dh, 0
add bx, dx
mov al, byte[bx]
cmp al, '>'
je done
inc dl
jmp cnt
done:
int 21h`;

        const r = run(code, 3, 5);

        expect(r.error).toBeUndefined();

        // надпись целиком на месте
        expect(memText(r.dbg!, 0x10, 0x30)).toBe('<=== Familia Imia Otchestvo ===>');

        // в DL - позиция '>' относительно начала надписи (31)
        expect(parseInt(reg(r.dbg!, 'dl')!, 16)).toBe(31);
    });
});

describe('3.5 - затирание надписи между скобками', () => {
    it('заменяет символы между < и > на ^', () => {
        const r = run(`mov si, 20h
mov word[si], '<='
mov word[si+2], 'AB'
mov word[si+4], 'C>'
mov dl, 0
wipe:
mov bx, 20h
add bx, dx
mov al, byte[bx]
cmp al, '>'
je after
mov byte[bx], '^'
inc dl
jmp wipe
after:
mov bx, 20h
add bx, dx
mov byte[bx], '^'
int 21h`, 3, 6);

        expect(r.error).toBeUndefined();
        // вся надпись вместе со скобками затёрта
        expect(memText(r.dbg!, 0x20, 0x26)).toBe('^^^^^^');
    });

    it('надпись вне области затирания остаётся целой', () => {
        const r = run(`mov word[30h], 'OK'
mov si, 20h
mov word[si], '<='
mov word[si+2], 'AB'
mov word[si+4], 'C>'
mov dl, 0
wipe:
mov bx, 20h
add bx, dx
mov al, byte[bx]
cmp al, '>'
je after
mov byte[bx], '^'
inc dl
jmp wipe
after:
mov bx, 20h
add bx, dx
mov byte[bx], '^'
int 21h`, 3, 6);

        expect(memText(r.dbg!, 0x30, 0x32)).toBe('OK');
    });
});

describe('3.6 - затирание памяти до и после надписи', () => {
    it('затирает область до надписи и после неё', () => {
        // надпись ABCD лежит в 20h..23h, поэтому "до" - это 00h..1Fh, а "после" - с 24h
        const r = run(`mov si, 20h
mov word[si], 'AB'
mov word[si+2], 'CD'
mov dl, 20h
mov si, 0
w1:
mov byte[si], '^'
inc si
cmp si, dx
jl w1
mov si, 24h
w2:
mov byte[si], '^'
inc si
cmp si, 30h
jl w2
int 21h`, 3, 7);

        expect(r.error).toBeUndefined();

        // до надписи затёрто
        expect(memText(r.dbg!, 0, 4)).toBe('^^^^');
        // сама надпись цела
        expect(memText(r.dbg!, 0x20, 0x22)).toBe('AB');
        expect(memText(r.dbg!, 0x22, 0x24)).toBe('CD');
        // после надписи затёрто
        expect(memText(r.dbg!, 0x24, 0x28)).toBe('^^^^');
    });
});

describe('3.7 - копирование фрагмента памяти', () => {
    it('копирует фрагмент через промежуточный регистр', () => {
        // MOV Память, Память запрещено - поэтому копируем через CL
        const r = run(`mov si, 10h
mov byte[si], 'A'
mov byte[si+1], 'B'
mov byte[si+2], 'C'
mov al, 0
mov ah, 2
mov bl, 20h
cp:
mov bh, 10h
add bh, al
mov cl, byte[bh]
mov bh, bl
add bh, al
mov byte[bh], cl
inc al
cmp al, ah
jle cp
int 21h`, 3, 8);

        expect(r.error).toBeUndefined();
        // источник не изменился
        expect(memText(r.dbg!, 0x10, 0x13)).toBe('ABC');
        // приёмник получил копию
        expect(memText(r.dbg!, 0x20, 0x23)).toBe('ABC');
    });

    it('запрещает MOV Память, Память', () => {
        const r = run(`mov byte[10h], 'A'
mov byte[20h], 'B'
mov byte[30h], byte[10h]
int 21h`, 3, 8);

        // копирование напрямую из памяти в память недопустимо
        expect(r.error).toBeDefined();
    });
});

describe('3.8 - подсчёт вхождений символа', () => {
    it('считает, сколько раз буква встречается в надписи', () => {
        const r = run(`mov si, 10h
mov byte[si], 'A'
mov byte[si+1], 'B'
mov byte[si+2], 'A'
mov byte[si+3], 'A'
mov dl, 0
mov dh, 0
mov cx, 4
cnt:
mov bh, 10h
add bh, dh
mov al, byte[bh]
cmp al, 'A'
jne sk
inc dl
sk:
inc dh
loop cnt
int 21h`, 3, 9);

        expect(r.error).toBeUndefined();
        // буква A встречается 3 раза
        expect(parseInt(reg(r.dbg!, 'dl')!, 16)).toBe(3);
    });

    it('возвращает 0, если символ не найден', () => {
        const r = run(`mov byte[10h], 'A'
mov dl, 0
mov dh, 0
mov cx, 1
cnt:
mov bh, 10h
add bh, dh
mov al, byte[bh]
cmp al, 'Z'
jne sk
inc dl
sk:
inc dh
loop cnt
int 21h`, 3, 9);

        expect(parseInt(reg(r.dbg!, 'dl')!, 16)).toBe(0);
    });
});
