import { describe, it, expect } from 'vitest';
import { HALF_REGISTERS, fullRegisterName, expandRegisters } from 'src/shared/types/ASMcode/HalfRegisters';
import { RegistersState } from 'src/entities/Registers/model/RegistersState';

/**
 * Юнит-тесты полурегистров.
 *
 * Регистры в эмуляторе 16-битные и хранятся строкой из 4 hex-цифр.
 * Полурегистр (AH, AL, BH, BL, CH, CL, DH, DL) адресует половину:
 *   AH - старшие два разряда AX, AL - младшие два.
 * Запись в полурегистр не должна задевать соседнюю половину.
 */

/** Регистры, в которые можно писать напрямую в тестах */
class TestRegisters extends RegistersState {
    constructor() {
        super();
    }

    public setFull(name: string, value: string) {
        (this as any).setValue(name, value);
    }
}

describe('HALF_REGISTERS - таблица соответствия', () => {
    it('содержит все восемь полурегистров', () => {
        expect(Object.keys(HALF_REGISTERS)).toHaveLength(8);
        expect(Object.keys(HALF_REGISTERS).sort()).toEqual(
            ['ah', 'al', 'bh', 'bl', 'ch', 'cl', 'dh', 'dl']
        );
    });

    it('ставит в соответствие правильный полный регистр', () => {
        expect(HALF_REGISTERS['ah'].full).toBe('ax');
        expect(HALF_REGISTERS['al'].full).toBe('ax');
        expect(HALF_REGISTERS['bh'].full).toBe('bx');
        expect(HALF_REGISTERS['bl'].full).toBe('bx');
        expect(HALF_REGISTERS['ch'].full).toBe('cx');
        expect(HALF_REGISTERS['cl'].full).toBe('cx');
        expect(HALF_REGISTERS['dh'].full).toBe('dx');
        expect(HALF_REGISTERS['dl'].full).toBe('dx');
    });

    it('помечает старшие половины как high', () => {
        expect(HALF_REGISTERS['ah'].high).toBe(true);
        expect(HALF_REGISTERS['bh'].high).toBe(true);
        expect(HALF_REGISTERS['ch'].high).toBe(true);
        expect(HALF_REGISTERS['dh'].high).toBe(true);
    });

    it('помечает младшие половины как не-high', () => {
        expect(HALF_REGISTERS['al'].high).toBe(false);
        expect(HALF_REGISTERS['bl'].high).toBe(false);
        expect(HALF_REGISTERS['cl'].high).toBe(false);
        expect(HALF_REGISTERS['dl'].high).toBe(false);
    });
});

describe('fullRegisterName', () => {
    it('возвращает полный регистр для полурегистра', () => {
        expect(fullRegisterName('dh')).toBe('dx');
        expect(fullRegisterName('al')).toBe('ax');
    });

    it('оставляет полный регистр без изменений', () => {
        expect(fullRegisterName('ax')).toBe('ax');
        expect(fullRegisterName('si')).toBe('si');
    });

    it('не падает на несуществующем имени', () => {
        expect(fullRegisterName('zz')).toBe('zz');
    });
});

describe('expandRegisters - расширение списка ограничений', () => {
    it('добавляет полурегистры к полным', () => {
        const res = expandRegisters(['ax']);

        expect(res).toContain('ax');
        expect(res).toContain('ah');
        expect(res).toContain('al');
    });

    it('раскрывает несколько регистров', () => {
        const res = expandRegisters(['ax', 'dx']);

        expect(res).toEqual(expect.arrayContaining(['ax', 'ah', 'al', 'dx', 'dh', 'dl']));
    });

    it('не добавляет полурегистры для регистров без половин', () => {
        const res = expandRegisters(['si', 'di']);

        expect(res).toEqual(['si', 'di']);
    });

    it('не дублирует исходные имена', () => {
        const res = expandRegisters(['ax']);

        expect(res.filter(x => x === 'ax')).toHaveLength(1);
    });

    it('на пустом списке возвращает пустой список', () => {
        expect(expandRegisters([])).toEqual([]);
    });
});

describe('RegistersState - чтение полурегистров', () => {
    it('читает AH как старший байт AX', () => {
        const r = new TestRegisters();
        r.setFull('ax', '1234');

        expect(r.getValueByName('ah')).toBe('12');
    });

    it('читает AL как младший байт AX', () => {
        const r = new TestRegisters();
        r.setFull('ax', '1234');

        expect(r.getValueByName('al')).toBe('34');
    });

    it('читает DH и DL из DX', () => {
        const r = new TestRegisters();
        r.setFull('dx', 'ABCD');

        expect(r.getValueByName('dh')).toBe('AB');
        expect(r.getValueByName('dl')).toBe('CD');
    });

    it('читает полный регистр без изменений', () => {
        const r = new TestRegisters();
        r.setFull('bx', '5678');

        expect(r.getValueByName('bx')).toBe('5678');
    });
});

describe('RegistersState - запись в полурегистры', () => {
    it('запись в AH не меняет AL', () => {
        const r = new TestRegisters();
        r.setFull('ax', '1234');
        r.setFull('ah', 'FF');

        expect(r.getValueByName('ax')).toBe('FF34');
    });

    it('запись в AL не меняет AH', () => {
        const r = new TestRegisters();
        r.setFull('ax', '1234');
        r.setFull('al', 'FF');

        expect(r.getValueByName('ax')).toBe('12FF');
    });

    it('запись в DH не меняет DL', () => {
        const r = new TestRegisters();
        r.setFull('dx', '0500');
        r.setFull('dh', '0A');

        expect(r.getValueByName('dx')).toBe('0A00');
        expect(r.getValueByName('dl')).toBe('00');
    });

    it('запись в DL не меняет DH', () => {
        const r = new TestRegisters();
        r.setFull('dx', '0A00');
        r.setFull('dl', '05');

        expect(r.getValueByName('dx')).toBe('0A05');
    });
});

describe('RegistersState - getNumberByName', () => {
    it('возвращает число для полного регистра', () => {
        const r = new TestRegisters();
        r.setFull('si', '0010');

        expect(r.getNumberByName('si')).toBe(16);
    });

    it('возвращает число для полурегистра', () => {
        const r = new TestRegisters();
        r.setFull('dx', '0A05');

        expect(r.getNumberByName('dh')).toBe(10);
        expect(r.getNumberByName('dl')).toBe(5);
    });

    it('возвращает undefined для неизвестного регистра', () => {
        const r = new TestRegisters();

        expect(r.getNumberByName('zz')).toBeUndefined();
    });

    it('все регистры инициализируются нулями', () => {
        const r = new TestRegisters();

        expect(r.getValueByName('ax')).toBe('0000');
        expect(r.getValueByName('sp')).toBe('0000');
    });
});
