/**
 * Полурегистры (старшая/младшая половина 16-битного регистра).
 * В задачах Л/Р 2 и Л/Р 3 широко используются AH, AL, BH, BL, CH, CL, DH, DL.
 */
export type HalfRegister = {
    /** Полный 16-битный регистр */
    full: string;
    /** true - старшая половина (AH, BH, CH, DH), false - младшая (AL, BL, CL, DL) */
    high: boolean;
}

export const HALF_REGISTERS: Record<string, HalfRegister> = {
    'ah': { full: 'ax', high: true },
    'al': { full: 'ax', high: false },
    'bh': { full: 'bx', high: true },
    'bl': { full: 'bx', high: false },
    'ch': { full: 'cx', high: true },
    'cl': { full: 'cx', high: false },
    'dh': { full: 'dx', high: true },
    'dl': { full: 'dx', high: false }
};

/**
 * Имя полного регистра для любого операнда (dh -> dx, ax -> ax)
 */
export function fullRegisterName(name: string): string {
    return HALF_REGISTERS[name]?.full ?? name;
}

/**
 * Расширение списка регистров полурегистрами: ['ax'] -> ['ax', 'ah', 'al']
 */
export function expandRegisters(registers: string[]): string[] {
    const res: string[] = [];

    for (const reg of registers) {
        res.push(reg);

        for (const [halfName, half] of Object.entries(HALF_REGISTERS)) {
            if (half.full === reg) {
                res.push(halfName);
            }
        }
    }

    return res;
}
