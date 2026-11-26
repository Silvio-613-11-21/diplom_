import { describe, it, expect } from 'vitest';
import { RegExp } from 'src/features/parser/model/RegExp/RegExp';

/**
 * Юнит-тесты обработки текста программы.
 *
 * Парсер приводит код к нижнему регистру и убирает пробелы, чтобы упростить
 * разбор. Но содержимое символьных строк ('Hello, World!') меняться не должно:
 * важны и регистр букв, и пробелы, и символы вроде ';'.
 * Для этого все преобразования идут через transformOutsideQuotes.
 */

describe('transformOutsideQuotes - базовое поведение', () => {
    it('применяет преобразование только вне кавычек', () => {
        const res = RegExp.transformOutsideQuotes("mov ax, 'ABC'", p => p.toLowerCase());

        expect(res).toBe("mov ax, 'ABC'");
    });

    it('преобразует код до кавычек', () => {
        const res = RegExp.transformOutsideQuotes("MOV AX, 'ABC'", p => p.toLowerCase());

        expect(res).toBe("mov ax, 'ABC'");
    });

    it('преобразует код после кавычек', () => {
        const res = RegExp.transformOutsideQuotes("'ABC' ; COMMENT", p => p.toLowerCase());

        expect(res).toBe("'ABC' ; comment");
    });

    it('сохраняет регистр внутри строки', () => {
        const res = RegExp.transformOutsideQuotes("mov word[10h], 'Hello'", p => p.toLowerCase());

        expect(res).toBe("mov word[10h], 'Hello'");
    });

    it('обрабатывает несколько строк в одной строке кода', () => {
        const res = RegExp.transformOutsideQuotes("MOV AX, 'Ab' ; MOV BX, 'Cd'", p => p.toLowerCase());

        expect(res).toBe("mov ax, 'Ab' ; mov bx, 'Cd'");
    });

    it('незакрытая кавычка не ломает обработку', () => {
        const res = RegExp.transformOutsideQuotes("MOV AX, 'abc", p => p.toLowerCase());

        expect(res).toBe("mov ax, 'abc");
    });

    it('работает со строкой без кавычек', () => {
        expect(RegExp.transformOutsideQuotes('MOV AX', p => p.toLowerCase())).toBe('mov ax');
    });

    it('работает с пустой строкой', () => {
        expect(RegExp.transformOutsideQuotes('', p => p.toLowerCase())).toBe('');
    });
});

describe('delComments - удаление комментариев', () => {
    it('удаляет комментарий после кода', () => {
        expect(RegExp.delComments('mov ax, 5 ; комментарий')).toBe('mov ax, 5 ');
    });

    it('не удаляет точку с запятой внутри строки', () => {
        const res = RegExp.delComments("mov word[10h], 'a;b'");

        expect(res).toBe("mov word[10h], 'a;b'");
    });

    it('удаляет комментарий, но сохраняет строку с точкой с запятой', () => {
        const res = RegExp.delComments("mov byte[0], ';' ; это комментарий");

        expect(res).toBe("mov byte[0], ';' ");
    });

    it('оставляет строку без комментария без изменений', () => {
        expect(RegExp.delComments('int 21h')).toBe('int 21h');
    });
});

describe('delSpace - удаление пробелов', () => {
    it('убирает все пробелы', () => {
        expect(RegExp.delSpace('mov ax , 5')).toBe('movax,5');
    });

    it('не убирает пробелы внутри строки', () => {
        const res = RegExp.delSpace("mov word[10h], 'Hello, World!'");

        expect(res).toBe("movword[10h],'Hello, World!'");
    });

    it('сохраняет ведущий и хвостовой пробелы внутри кавычек', () => {
        const res = RegExp.delSpace("mov word[0], ' W '");

        expect(res).toBe("movword[0],' W '");
    });
});

describe('toLowerCase - приведение к нижнему регистру', () => {
    it('приводит команды и регистры к нижнему регистру', () => {
        expect(RegExp.toLowerCase('MOV AX, BX')).toBe('mov ax, bx');
    });

    it('не меняет регистр символов в строке', () => {
        const res = RegExp.toLowerCase("MOV WORD[45h], 'Hello, World!'");

        expect(res).toBe("mov word[45h], 'Hello, World!'");
    });

    it('не меняет регистр буквы-символа', () => {
        const res = RegExp.toLowerCase("CMP AL, 'A'");

        expect(res).toBe("cmp al, 'A'");
    });
});

describe('lineIsEmpty - пустые строки', () => {
    it('считает пустой строкой пустую строку', () => {
        expect(RegExp.lineIsEmpty('')).toBe(true);
    });

    it('считает пустой строкой строку из пробелов', () => {
        expect(RegExp.lineIsEmpty('    ')).toBe(true);
        expect(RegExp.lineIsEmpty('\t')).toBe(true);
    });

    it('не считает пустой строку с кодом', () => {
        expect(RegExp.lineIsEmpty('mov ax, 5')).toBe(false);
    });
});

describe('Комплексный сценарий - строка из задания 3.0', () => {
    it('надпись Hello, World! переживает все преобразования', () => {
        const line = "MOV WORD[45h], 'He'  ; запись слова";

        const noComments = RegExp.delComments(line);
        const lower = RegExp.toLowerCase(noComments);
        const noSpaces = RegExp.delSpace(lower);

        expect(noSpaces).toBe("movword[45h],'He'");
        // главное - содержимое кавычек не пострадало
        expect(noSpaces).toContain("'He'");
    });

    it('строка с пробелом и запятой сохраняется целиком', () => {
        const line = "MOV WORD[47h], 'o,'";

        const processed = RegExp.delSpace(RegExp.toLowerCase(RegExp.delComments(line)));

        expect(processed).toBe("movword[47h],'o,'");
    });
});
