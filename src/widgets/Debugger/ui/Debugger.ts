
import './Debugger.css'
import html from './Debugger.html?raw'

import { Registers } from "src/entities/Registers";
import { FlagRegisters } from 'src/entities/FlagRegister';


export class Debugger {
    public debState: "deb" | "cons" = "deb"
    public reg!: Registers
    public flagReg!: FlagRegisters; 


    constructor(App: HTMLElement) {
        this.init(App)
        //this.reg.setValue("ax", "4")
    }

    private init(App: HTMLElement) {
        App.insertAdjacentHTML('beforeend', html);

        const registersSpace = document.querySelector(".registers-space") as HTMLElement;
        const flagRegistersSpace = document.querySelector(".flag-registers-space") as HTMLElement; 
        
        this.reg = new Registers(registersSpace);
        this.flagReg = new FlagRegisters(flagRegistersSpace); 

        const debSwBtn = document.querySelector(".debbuder-switch-btn") as HTMLButtonElement;
        const consSwBtn = document.querySelector(".console-switch-btn") as HTMLButtonElement;
        const debContent = document.querySelector(".debbuger-content") as HTMLElement;
        const consContent = document.querySelector(".console-content")  as HTMLElement; 
         
        this.btnSwitcher(debSwBtn, consSwBtn, debContent, consContent);

        debSwBtn.addEventListener('click', () => {
            this.debState = 'deb';
            this.btnSwitcher(debSwBtn, consSwBtn, debContent, consContent);
        })

        consSwBtn.addEventListener('click', () => {
            this.debState = 'cons';
            this.btnSwitcher(debSwBtn, consSwBtn, debContent, consContent);
        })


        
    }

    private btnSwitcher(debSwBtn: HTMLButtonElement, 
        consSwBtn: HTMLButtonElement, 
        debContent: HTMLElement, 
        consContent: HTMLElement) {
        switch (this.debState) {
            case "deb": {
                debSwBtn.classList.add("isActive");
                consSwBtn.classList.remove("isActive");
                debContent.hidden = false; 
                consContent.hidden = true;
                break;
            }
            case "cons": {
                consSwBtn.classList.add("isActive");
                debSwBtn.classList.remove("isActive");
                consContent.hidden = false;
                debContent.hidden = true; 
                break;
            }
        }
    }

}

