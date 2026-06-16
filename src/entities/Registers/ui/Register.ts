import html from './Register.html?raw';
import './Register.css'

import { RegistersState } from '../model/RegistersState';

export class Registers extends RegistersState {
   
    constructor(debugger_: HTMLElement) {
        super(); 

        this.init(debugger_);
    }

    private init(debugger_: HTMLElement) {
        debugger_.insertAdjacentHTML('beforeend', html)
    }
    

    public override setValue(name: string, value:string) : boolean {
        
        let reg = document.getElementById(`${name}`) as HTMLElement;
        reg.textContent =  `${value.toUpperCase()}`; 
        
        return super.setValue(name, value);
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