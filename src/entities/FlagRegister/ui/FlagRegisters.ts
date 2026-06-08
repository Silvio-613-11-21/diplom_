import './FlagRegisters.css'
import html from './FlagRegisters.html?raw'

import { FlagRegistersState } from '../model/FlagRegistersState';

export class FlagRegisters extends FlagRegistersState {

    constructor(debugger_: HTMLElement) {
        super();

        this.init(debugger_);
    }

    private init(debugger_: HTMLElement) {
        debugger_.insertAdjacentHTML('beforeend', html)
    }

    public override setValue(name: string, value: boolean): boolean {
        let reg = document.getElementById(`${name}`) as HTMLElement;
        if(value){
            reg.textContent = `1`;
        }
        else{
            reg.textContent = `0`;
        }
        

        return super.setValue(name, value);
    }

    public override resetAll(): void {
        this.RegistersNameList.forEach(name => {
            (document.getElementById(name) as HTMLElement).textContent = "0";
        })

        return super.resetAll();
    }



}