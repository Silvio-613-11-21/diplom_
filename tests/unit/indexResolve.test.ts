import { describe, it, expect } from 'vitest';
import { idxResv } from 'src/features/parser/model/BTHelpers/IndexResolve';

/**
 * Модульные тесты разбора индексных выражений.
 *
 * idxResv приводит числа к 16-ричной системе и нормализует порядок
 * «база + индекс».
 */

describe('idxResv - разбор выражения', () => {
    it('переводит шестнадцатеричное число', () => {
        expect(idxResv('10h')).toBe('0010');
    });

    it('переводит десятичное число в шестнадцатеричное', () => {
        expect(idxResv('16')).toBe('0010');
    });

});
