import html from './Register.html?raw';
import './Register.css'

import { RegistersState } from '../model/RegistersState';
import { HALF_REGISTERS } from 'src/shared/types/ASMcode/HalfRegisters';

export class Registers extends RegistersState {
   
    constructor(debugger_: HTMLElement) {
        super(); 

        this.init(debugger_);
    }

    private init(debugger_: HTMLElement) {
        debugger_.insertAdjacentHTML('beforeend', html)
    }
    

    public override setValue(name: string, value:string) : boolean {
        const res = super.setValue(name, value);

        // у полурегистра нет своей ячейки в таблице - показываем полный регистр
        const full = HALF_REGISTERS[name]?.full ?? name;
        const reg = document.getElementById(full);

        if (reg) {
            reg.textContent = (this.getValueByName(full) ?? value).toUpperCase();
        }

        return res;
    }

    public override resetAll(): void {
        this.RegistersNameList.forEach(name => {
            (document.getElementById(name) as HTMLElement).textContent = "0000"; 
        })

        return super.resetAll();  
    }

    // public getRegisterValue(name: string) {
    //     let val = document.getElementById(`${name}`)?.textContent;
    //     return val;
    // }

    // public setRegisterValue(name: string, val: string) {
    //     let reg = document.getElementById(`${name}`) as HTMLElement;
    //     reg.textContent =  val; 
    // }


} 