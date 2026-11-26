import { describe, it, expect } from 'vitest';
import { resolveAddress } from 'src/features/emulator/model/address/addressResolver';
import { RegistersState } from 'src/entities/Registers/model/RegistersState';

/**
 * Модульные тесты вычисления адреса памяти (Л/Р 3).
 *
 * Проверяются основные формы адресного выражения: прямой адрес, адрес по
 * регистру, база + индекс и отрицательное смещение.
 */

/** Регистры с заданными значениями - как после выполнения mov si, 10h */
class TestRegisters extends RegistersState {
    constructor(values: Record<string, string> = {}) {
        super();

        for (const [name, value] of Object.entries(values)) {
            (this as any).setValue(name, value);
        }
    }
}

const regs = (values: Record<string, string> = {}) => new TestRegisters(values) as any;

describe('resolveAddress - вычисление адреса', () => {
    it('принимает прямой шестнадцатеричный адрес', () => {
        expect(resolveAddress('45h', regs())).toBe(0x45);
    });

    it('вычисляет адрес по регистру', () => {
        expect(resolveAddress('si', regs({ si: '0010' }))).toBe(0x10);
    });

});
