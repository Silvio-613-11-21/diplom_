import { HALF_REGISTERS } from "src/shared/types/ASMcode/HalfRegisters";

export class RegistersState {
    protected RegistersNameList: string[] = [
        "ax", "bx", "cx", "dx",
        "si", "di", "bp", "sp",
        "cs", "ds", "es", "ss"
    ];

    private registers: Map<string, string> = new Map();

    constructor() {
        this.RegistersNameList.forEach(name => {
            this.registers.set(name, "0000");
        })
    }

    public getValueByName(name: string) {
        // полурегистры (ah, al, bh, bl, ch, cl, dh, dl) - половина полного регистра
        const half = HALF_REGISTERS[name];

        if (half) {
            const full = this.registers.get(half.full);

            if (full === undefined) {
                return undefined;
            }

            return half.high ? full.slice(0, 2) : full.slice(2, 4);
        }

        return this.registers.get(name);
    }

    /**
     * Значение регистра как число (для адресных выражений и вычислений)
     */
    public getNumberByName(name: string): number | undefined {
        const val = this.getValueByName(name);

        if (val === undefined) {
            return undefined;
        }

        return parseInt(val, 16);
    }

    public returnAll() {
        return Array.from(this.registers.entries()).map(([name, value]) => ({
            name,
            value
        }));
    }

    protected setValue(name: string, value: string) {
        // запись в полурегистр меняет только соответствующую половину
        const half = HALF_REGISTERS[name];

        if (half) {
            const full = this.registers.get(half.full) ?? '0000';
            const part = value.slice(-2).padStart(2, '0');

            this.registers.set(half.full, half.high ? part + full.slice(2, 4) : full.slice(0, 2) + part);
            return true;
        }

        if (this.registers.has(name)) {
            this.registers.set(name, value);
            return true;
        }
        return false;
    }

    protected resetAll() {
        for (const name of this.RegistersNameList) {
            this.registers.set(name, "0000");
        }
    }
}


