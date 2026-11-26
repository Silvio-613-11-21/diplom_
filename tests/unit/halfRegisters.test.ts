import { describe, it, expect } from 'vitest';
import { HALF_REGISTERS, fullRegisterName } from 'src/shared/types/ASMcode/HalfRegisters';
import { RegistersState } from 'src/entities/Registers/model/RegistersState';

/**
 * Модульные тесты полурегистров.
 *
 * Полурегистр (AH, AL, BH, BL, CH, CL, DH, DL) адресует половину 16-битного
 * регистра. Запись в полурегистр не должна задевать соседнюю половину.
 */

/** Регистры, в которые можно писать напрямую в тестах */
class TestRegisters extends RegistersState {
    public setFull(name: string, value: string) {
        (this as any).setValue(name, value);
    }
}

describe('Полурегистры', () => {
    it('содержит все восемь полурегистров', () => {
        expect(Object.keys(HALF_REGISTERS)).toHaveLength(8);
    });

    it('определяет полный регистр полурегистра', () => {
        expect(fullRegisterName('dh')).toBe('dx');
        expect(fullRegisterName('al')).toBe('ax');
    });

});
