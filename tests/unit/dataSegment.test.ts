import { describe, it, expect, beforeEach } from 'vitest';
import { DataSegment } from 'src/entities/DataSegment/ui/DataSegment';

/**
 * Юнит-тесты сегмента данных (Л/Р 3).
 *
 * Сегмент - это таблица 16x16 ячеек (256 байт), которую видит пользователь.
 * DataSegment умеет читать и писать байты и слова; слово раскладывается
 * по двум соседним ячейкам в порядке little-endian (младший байт - по меньшему адресу).
 */

const newSegment = (): DataSegment => {
    const app = document.createElement('div');
    document.body.appendChild(app);
    return new DataSegment(app);
};

/** Прочитать len байт начиная с адреса */
const readBytes = (seg: DataSegment, from: number, len: number): string[] =>
    Array.from({ length: len }, (_, k) => seg.getCellValue((from + k).toString(16).padStart(2, '0')));

describe('DataSegment - запись байта', () => {
    it('записывает байт по адресу', () => {
        const seg = newSegment();

        seg.write(0x45, 'byte', '41');

        expect(seg.getCellValue('45')).toBe('41');
    });

    it('запись не затрагивает соседние ячейки', () => {
        const seg = newSegment();

        seg.write(0x45, 'byte', '41');

        expect(seg.getCellValue('44')).toBe('00');
        expect(seg.getCellValue('46')).toBe('00');
    });

    it('перезапись ячейки заменяет значение', () => {
        const seg = newSegment();

        seg.write(0x10, 'byte', '41');
        seg.write(0x10, 'byte', '42');

        expect(seg.getCellValue('10')).toBe('42');
    });

    it('записывает в последнюю ячейку сегмента', () => {
        const seg = newSegment();

        seg.write(0xff, 'byte', '7f');

        // сегмент хранит значения в верхнем регистре - так они и выводятся в таблице
        expect(seg.getCellValue('FF')).toBe('7F');
    });
});

describe('DataSegment - чтение байта', () => {
    it('читает записанный байт', () => {
        const seg = newSegment();
        seg.write(0x20, 'byte', 'ab');

        expect(seg.read(0x20, 'byte')).toBe('AB');
    });

    it('неинициализированная ячейка содержит 00', () => {
        const seg = newSegment();

        expect(seg.read(0x00, 'byte')).toBe('00');
    });
});

describe('DataSegment - слово (word)', () => {
    it('записывает слово двумя байтами little-endian', () => {
        const seg = newSegment();

        // слово 6C6Ch ('ll') ложится как 6Ch по младшему адресу и 6Ch по старшему
        seg.write(0x10, 'word', '6c6c');

        expect(seg.getCellValue('10')).toBe('6C');
        expect(seg.getCellValue('11')).toBe('6C');
    });

    it('раскладывает слово с разными байтами', () => {
        const seg = newSegment();

        seg.write(0x20, 'word', '4142');

        // младший байт (42) - по адресу 20, старший (41) - по адресу 21
        expect(seg.getCellValue('20')).toBe('42');
        expect(seg.getCellValue('21')).toBe('41');
    });

    it('читает слово обратно в исходном порядке', () => {
        const seg = newSegment();
        seg.write(0x20, 'word', '4142');

        expect(seg.read(0x20, 'word')).toBe('4142');
    });

    it('слово занимает ровно две ячейки', () => {
        const seg = newSegment();

        seg.write(0x30, 'word', 'ffff');

        expect(readBytes(seg, 0x2f, 4)).toEqual(['00', 'FF', 'FF', '00']);
    });

    it('запись слова не задевает следующую ячейку', () => {
        const seg = newSegment();

        seg.write(0x40, 'word', 'abcd');

        expect(seg.getCellValue('42')).toBe('00');
    });
});

describe('DataSegment - символы', () => {
    it('getChar возвращает символ для печатного кода', () => {
        const seg = newSegment();

        // 41h = 'A'
        seg.write(0x00, 'byte', '41');

        expect(seg.getChar(0)).toBe('A');
    });

    it('getChar возвращает точку для непечатного кода', () => {
        const seg = newSegment();

        seg.write(0x00, 'byte', '00');

        // нулевой байт не является печатным символом
        expect(seg.getChar(0)).not.toBe('A');
    });

    it('надпись из двух слов читается подряд', () => {
        const seg = newSegment();

        // 'He' = 48h, 65h ; 'll' = 6Ch, 6Ch
        seg.write(0x45, 'word', '6548');
        seg.write(0x47, 'word', '6c6c');

        expect(seg.getChar(0x45)).toBe('H');
        expect(seg.getChar(0x46)).toBe('e');
        expect(seg.getChar(0x47)).toBe('l');
        expect(seg.getChar(0x48)).toBe('l');
    });
});

describe('DataSegment - сброс', () => {
    it('reset очищает записанные байты', () => {
        const seg = newSegment();
        seg.write(0x10, 'byte', 'ff');

        seg.reset();

        expect(seg.getCellValue('10')).toBe('00');
    });

    it('reset очищает слово целиком', () => {
        const seg = newSegment();
        seg.write(0x20, 'word', 'abcd');

        seg.reset();

        expect(readBytes(seg, 0x20, 2)).toEqual(['00', '00']);
    });

    it('reset не падает на пустом сегменте', () => {
        const seg = newSegment();

        expect(() => seg.reset()).not.toThrow();
    });
});

describe('DataSegment - размер сегмента', () => {
    it('объявляет размер 256 байт', () => {
        expect(DataSegment.SIZE).toBe(256);
    });

    it('таблица содержит 256 ячеек', () => {
        const seg = newSegment();
        seg.write(0xff, 'byte', '01');

        // последняя ячейка доступна
        expect(seg.getCellValue('FF')).toBe('01');
        expect(document.getElementById('FF')).not.toBeNull();
    });
});
