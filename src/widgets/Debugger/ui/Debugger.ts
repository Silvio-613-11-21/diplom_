import { Registers } from "src/entities/Registers";


export class Debugger  {
    private reg

    constructor(app: HTMLElement) {
        this.reg =  new Registers(app);
    }
    
}   

