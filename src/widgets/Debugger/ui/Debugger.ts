import { Registers } from "src/entities/Registers";


export class Debugger  {
    public reg

    constructor(app: HTMLElement) {
        this.reg =  new Registers(app);
        //this.reg.setValue("ax", "4")
        
    }
    
}   

