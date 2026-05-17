interface Register {
    name: string;
    value: number;
}


export class RegistersState {
    protected RegistersNameList: string[] = [
        "AX", "BX", "CX", "DX",
        "SI", "DI", "BP", "SP",
        "CS", "DS", "ES", "SS"
    ];

    private registers: Map<string, number> = new Map();

    constructor() {
        this.RegistersNameList.forEach(name => {
            this.registers.set(name, 0);
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

    protected setValue(name: string, value: number) {
        if (this.registers.has(name)) {
            this.registers.set(name, value);
            return true;
        }
        return false;
    }

    protected resetAll() {
        for (const name of this.RegistersNameList) {
            this.registers.set(name, 0);
        }
    }
}


