import { describe, it, expect } from 'vitest';
import { getRestrists } from 'src/shared/Restricts/getRestricts';

/**
 * Юнит-тесты ограничений задач.
 *
 * Ограничения задаются ссылкой вида ?lab=3&z=2 и определяют, какие команды,
 * регистры и возможности доступны студенту в конкретной задаче.
 * getRestrists(lab, z) возвращает набор ограничений либо undefined,
 * если такой работы или задачи нет.
 */

/** Набор команд как множество - удобно проверять вхождение */
const cmds = (lab: number, z: number): string[] => getRestrists(lab, z)!.cmd;
const regs = (lab: number, z: number): string[] => getRestrists(lab, z)!.rl;

describe('getRestrists - выбор работы и задачи', () => {
    it('возвращает наборы для всех трёх работ', () => {
        expect(getRestrists(1, 1)).toBeDefined();
        expect(getRestrists(2, 0)).toBeDefined();
        expect(getRestrists(3, 0)).toBeDefined();
    });

    it('возвращает undefined для несуществующей работы', () => {
        expect(getRestrists(4, 1)).toBeUndefined();
        expect(getRestrists(0, 1)).toBeUndefined();
    });

    it('возвращает undefined для несуществующей задачи', () => {
        expect(getRestrists(1, 11)).toBeUndefined();
        expect(getRestrists(2, 11)).toBeUndefined();
        expect(getRestrists(3, 10)).toBeUndefined();
    });

    it('набор "все задачи" есть в каждой работе', () => {
        expect(getRestrists(1, -1)).toBeDefined();
        expect(getRestrists(2, -1)).toBeDefined();
        expect(getRestrists(3, -1)).toBeDefined();
    });
});

describe('Л/Р 1 - ограничения задач', () => {
    it('задача 1.1 разрешает только mov, shl и int', () => {
        expect(cmds(1, 1).sort()).toEqual(['int', 'mov', 'shl']);
    });

    it('задача 1.1 ограничивает регистры AX и BX', () => {
        expect(regs(1, 1).sort()).toEqual(['ax', 'bx']);
    });

    it('задача 1.2 работает с CX и DX', () => {
        expect(regs(1, 2).sort()).toEqual(['cx', 'dx']);
        expect(cmds(1, 2)).toEqual(expect.arrayContaining(['mov', 'add', 'sub']));
    });

    it('задача 1.3 разрешает только AX', () => {
        expect(regs(1, 3)).toEqual(['ax']);
        expect(cmds(1, 3).sort()).toEqual(['and', 'int', 'mov']);
    });

    it('задача 1.4 добавляет сдвиги', () => {
        expect(cmds(1, 4)).toEqual(expect.arrayContaining(['shl', 'shr', 'and']));
    });

    it('задача 1.8 разрешает loop', () => {
        expect(cmds(1, 8)).toContain('loop');
        expect(regs(1, 8)).toContain('cx');
    });

    it('задача 1.9 разрешает условные переходы', () => {
        const c = cmds(1, 9);

        expect(c).toEqual(expect.arrayContaining(['cmp', 'jmp', 'js', 'jns', 'jz', 'jnz']));
    });

    it('в каждой задаче разрешён int 21h', () => {
        for (let z = 1; z <= 10; z++) {
            expect(cmds(1, z)).toContain('int');
        }
    });
});

describe('Л/Р 2 - подпрограммы и макросы', () => {
    it('задача 2.0 разрешает call, ret и макросы', () => {
        const c = cmds(2, 0);

        expect(c).toContain('call');
        expect(c).toContain('ret');
        expect(c).toContain('%macro');
    });

    it('задача 2.0 разрешает int 21h как завершение программы', () => {
        expect(cmds(2, 0)).toContain('int');
    });

    it('любая задача Л/Р 2 наследует команды соответствующей задачи Л/Р 1', () => {
        for (let z = 1; z <= 9; z++) {
            const lab1Cmd = cmds(1, z);
            const lab2Cmd = cmds(2, z);

            for (const c of lab1Cmd) {
                expect(lab2Cmd).toContain(c);
            }
        }
    });

    it('задача 2.1 ограничивает регистры так же, как 1.1', () => {
        expect(regs(2, 1)).toEqual(regs(1, 1));
    });
});

describe('Л/Р 3 - работа с памятью', () => {
    it('в Л/Р 3 память разрешена', () => {
        expect(getRestrists(3, 0)!.memory).toBe(true);
    });

    it('в Л/Р 1 и Л/Р 2 память запрещена', () => {
        expect(getRestrists(1, 1)!.memory).toBeFalsy();
        expect(getRestrists(2, 0)!.memory).toBeFalsy();
    });

    it('задача 3.0 запрещает BX и SI по условию', () => {
        expect(getRestrists(3, 0)!.forbiddenRegs).toEqual(['bx', 'si']);
    });

    it('остальные задачи не запрещают регистры', () => {
        for (const z of [1, 2, 3, 5, 9]) {
            expect(getRestrists(3, z)!.forbiddenRegs).toBeUndefined();
        }
    });

    it('каждая задача Л/Р 3 содержит текст задания', () => {
        for (let z = 0; z <= 9; z++) {
            const task = getRestrists(3, z)!.task;

            expect(task).toBeTruthy();
            expect(task!.length).toBeGreaterThan(20);
        }
    });

    it('задачи с циклами разрешают loop и inc', () => {
        for (const z of [3, 4, 5, 6, 7, 8, 9]) {
            expect(cmds(3, z)).toContain('loop');
            expect(cmds(3, z)).toContain('inc');
        }
    });

    it('задачи 3.4+ разрешают условные переходы', () => {
        for (const z of [5, 6, 7, 8, 9]) {
            expect(cmds(3, z)).toEqual(expect.arrayContaining(['cmp', 'je', 'jmp']));
        }
    });

    it('любая задача Л/Р 3 разрешает call и макросы', () => {
        for (let z = 0; z <= 9; z++) {
            expect(cmds(3, z)).toContain('call');
            expect(cmds(3, z)).toContain('ret');
            expect(cmds(3, z)).toContain('%macro');
        }
    });

    it('задачи 3.2 и 3.3 разрешают SI для косвенной адресации', () => {
        expect(regs(3, 2)).toContain('si');
        expect(regs(3, 3)).toContain('si');
    });

    it('задача 3.0 разрешает SI на уровне списка (запрет - в forbiddenRegs)', () => {
        // запрет оформлен отдельным полем, чтобы дать более точное сообщение
        expect(regs(3, 0)).toContain('si');
        expect(getRestrists(3, 0)!.forbiddenRegs).toContain('si');
    });
});

describe('Набор "все задачи" (z = -1)', () => {
    it('Л/Р 1: объединяет команды всех задач', () => {
        const c = cmds(1, -1);

        expect(c).toEqual(expect.arrayContaining(['mov', 'shl', 'shr', 'and', 'or', 'xor']));
        expect(c).toEqual(expect.arrayContaining(['loop', 'cmp', 'jmp', 'je', 'jne']));
    });

    it('Л/Р 3: разрешает всё нужное для работы с памятью', () => {
        const c = cmds(3, -1);

        expect(c).toEqual(expect.arrayContaining(['mov', 'inc', 'dec', 'cmp', 'call', 'ret']));
        expect(getRestrists(3, -1)!.memory).toBe(true);
    });

    it('Л/Р 3: не запрещает конкретные регистры', () => {
        expect(getRestrists(3, -1)!.forbiddenRegs).toBeUndefined();
    });
});

describe('Структура ограничений', () => {
    it('у каждого набора есть непустые cmd и rl', () => {
        const sets: [number, number][] = [
            [1, 1], [1, -1], [2, 0], [2, 5], [2, -1], [3, 0], [3, 9], [3, -1],
        ];

        for (const [lab, z] of sets) {
            const r = getRestrists(lab, z)!;

            expect(Array.isArray(r.cmd)).toBe(true);
            expect(r.cmd.length).toBeGreaterThan(0);
            expect(Array.isArray(r.rl)).toBe(true);
            expect(r.rl.length).toBeGreaterThan(0);
        }
    });

    it('набор Л/Р 2 и Л/Р 3 помечен номером работы', () => {
        expect(getRestrists(2, 0)!.lab).toBe(2);
        expect(getRestrists(3, 5)!.lab).toBe(3);
    });

    it('команды в наборе не повторяются', () => {
        for (let z = 0; z <= 9; z++) {
            const c = cmds(3, z);
            expect(new Set(c).size).toBe(c.length);
        }
    });
});
