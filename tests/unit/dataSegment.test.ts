import { describe, it, expect } from 'vitest';
import { DataSegment } from 'src/entities/DataSegment/ui/DataSegment';

/**
 * Модульные тесты сегмента данных (Л/Р 3).
 *
 * Сегмент - таблица 16x16 ячеек (256 байт). Слово раскладывается по двум
 * соседним ячейкам в порядке little-endian.
 */

const newSegment = (): DataSegment => {
    const app = document.createElement('div');
    document.body.appendChild(app);
    return new DataSegment(app);
};

describe('DataSegment - запись и чтение', () => {
    it('записывает и читает байт', () => {
        const seg = newSegment();

        seg.write(0x45, 'byte', '41');

        expect(seg.getCellValue('45')).toBe('41');
    });

    it('записывает слово в две ячейки', () => {
        const seg = newSegment();

        seg.write(0x20, 'word', 'ABCD');

        expect(seg.getCellValue('20')).toBe('CD');
        expect(seg.getCellValue('21')).toBe('AB');
    });

});
