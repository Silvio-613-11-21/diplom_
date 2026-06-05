

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
        return this.registers.get(name);
    }

    public returnAll() {
        return Array.from(this.registers.entries()).map(([name, value]) => ({
            name,
            value
        }));
    }

    protected setValue(name: string, value: string) {
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


