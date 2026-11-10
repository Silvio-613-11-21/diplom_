
export class  FlagRegistersState {
    protected RegistersNameList: string[] = [
        "of", "df", "if", "sf",
        "zf", "af", "pf", "cf"
    ];

    private registers: Map<string, boolean> = new Map();

    constructor() {
        this.RegistersNameList.forEach(name => {
            this.registers.set(name, false);
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

    protected setValue(name: string, value: boolean) {
        if (this.registers.has(name)) {
            this.registers.set(name, value);
            return true;
        }
        return false;
    }

    protected resetAll() {
        for (const name of this.RegistersNameList) {
            this.registers.set(name, false);
        }
    }
}


