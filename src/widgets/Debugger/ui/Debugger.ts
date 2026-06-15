
import './Debugger.css'
import html from './Debugger.html?raw'

import { Registers } from "src/entities/Registers";
import { FlagRegisters } from 'src/entities/FlagRegister';


export class Debugger {
    public debState: "deb" | "cons" = "deb"
    public reg!: Registers
    public flagReg!: FlagRegisters;

    // =======================================

    private debSwBtn!: HTMLButtonElement;
    private consSwBtn!: HTMLButtonElement;
    private debContent!: HTMLElement;
    private consContent!: HTMLElement;

    //===========================

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

        this.debSwBtn = document.querySelector(".debbuder-switch-btn") as HTMLButtonElement;
        this.consSwBtn = document.querySelector(".console-switch-btn") as HTMLButtonElement;
        this.debContent = document.querySelector(".debbuger-content") as HTMLElement;
        this.consContent = document.querySelector(".console-content") as HTMLElement;

        this.btnSwitcher(this.debSwBtn, this.consSwBtn, this.debContent, this.consContent);

        this.debSwBtn.addEventListener('click', () => {
            this.debState = 'deb';
            this.btnSwitcher(this.debSwBtn, this.consSwBtn, this.debContent, this.consContent);
        })

        this.consSwBtn.addEventListener('click', () => {
            this.debState = 'cons';
            this.btnSwitcher(this.debSwBtn, this.consSwBtn, this.debContent, this.consContent);
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

    //===================================================================
    public consolePrint(message: string) {
        this.debState = 'cons';
        this.btnSwitcher(this.debSwBtn, this.consSwBtn, this.debContent, this.consContent);
        this.consContent.textContent = '';
        this.consContent.textContent = message;
    }

    public debbCall() {
        this.debState = 'deb';
        this.btnSwitcher(this.debSwBtn, this.consSwBtn, this.debContent, this.consContent);
    }

    public resetAll() {
        this.reg.resetAll();
        this.flagReg.resetAll(); 
    }
}

