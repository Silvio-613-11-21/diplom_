import { describe, it, expect } from 'vitest';
import { getRestrists } from 'src/shared/Restricts/getRestricts';

/**
 * Модульные тесты ограничений задач.
 *
 * Ограничения задаются ссылкой вида ?lab=3&z=2 и определяют, какие команды
 * и регистры доступны студенту в конкретной задаче.
 */

describe('getRestrists - выбор работы и задачи', () => {
    it('возвращает наборы для всех трёх работ', () => {
        expect(getRestrists(1, 1)).toBeDefined();
        expect(getRestrists(2, 0)).toBeDefined();
        expect(getRestrists(3, 0)).toBeDefined();
    });

    it('возвращает undefined для несуществующей работы или задачи', () => {
        expect(getRestrists(4, 1)).toBeUndefined();
        expect(getRestrists(1, 11)).toBeUndefined();
    });

});
