import './ControlPanel.css'
import html from './ControlPanel.html?raw'

//=================================================
import { Editor } from 'src/widgets/Editor';
import { Debugger } from 'src/widgets/Debugger';
//=================================================


import { Emulator as em } from 'src/features/emulator';
import { parser } from 'src/features/parser/parser';

//=================================================
import { Restricts } from 'src/shared/types/Restricts/Restricts';
import { AllInstructions } from 'src/shared/types/ASMcode/AllInstructions';
//=================================================


export class ControlPanel {
    private editor: Editor;
    private debugger_: Debugger;

    private assembleBtn!: HTMLButtonElement;
    private runAllBtn!: HTMLButtonElement;
    private resetBtn!: HTMLButtonElement;
    private runByStepBtn!: HTMLButtonElement;

    private instructions: AllInstructions[] | string | null = null;
    private restricts: Restricts | null | undefined = null;
    private step = 0;

    constructor(App: HTMLElement, editor: Editor, debugger_: Debugger, restricts: Restricts | null | undefined) {
        this.editor = editor;
        this.debugger_ = debugger_;
        this.restricts = restricts;

        this.init(App);

        if (restricts) {
            this.assembleBtn.addEventListener('click', () => { this.reset(); this.parse(this.editor.content, restricts) })
            this.runAllBtn.addEventListener('click', () => { this.runEmulate() });
            this.resetBtn.addEventListener('click', () => { this.reset() });
            this.runByStepBtn.addEventListener('click', () => { this.runByStep() });
        }
    }

    private init(App: HTMLElement) {
        App.insertAdjacentHTML("afterbegin", html);
        this.assembleBtn = document.querySelector('.assemble') as HTMLButtonElement;
        this.runAllBtn = document.querySelector(".run-all") as HTMLButtonElement;
        this.resetBtn = document.querySelector(".reset-all") as HTMLButtonElement;
        this.runByStepBtn = document.querySelector(".run-by-step") as HTMLButtonElement;
    }

    private parse(code: string, restricts: Restricts) {
        let instructions = parser(code, restricts.cmd, restricts.rl);
        if (typeof instructions == 'string') {
            this.debugger_.consolePrint(instructions);
            this.instructions = null;
        }
        else {
            this.instructions = instructions;
            this.debugger_.consolePrintS("Успешная компиляция")
            this.debugger_.codeSegment.renderInstr(instructions);
        }
    }

    private runEmulate() {

        if (typeof this.instructions == 'string') {
            return;
        }
        else if (this.instructions == null) {
            this.debugger_.consolePrint("Нет скомпилированной программы");
        }
        else {
            this.debugger_.debbCall();
            this.debugger_.resetAll();

            let i = 0;
            while (i < this.instructions.length) {
                em.emulate(this.instructions, this.debugger_, i);
                if (em.trFl === false) {
                    i++;
                }
                else {
                    i = em.step;
                }

            }
            this.debugger_.consolePrintS("Конец программы")
            this.step = 0;
        }
    }

    private runByStep() {
        if (typeof this.instructions == 'string') {
            return;
        }
        else if (this.instructions == null) {
            this.debugger_.consolePrint("Нет скомпилированной программы");
        }
        else if (this.step < this.instructions.length) {
            if (this.step == 0) {
                this.debugger_.resetAll();
            }

            this.debugger_.debbCall();

            em.emulate(this.instructions, this.debugger_, this.step);
            if (em.trFl === false) {
                this.step++;
            }
            else {
                this.step = em.step;
            }
        }
        else {
            this.debugger_.consolePrint("Конец программы")
            this.step = 0;
            this.debugger_.codeSegment.setStep(this.step);
        }
    }

    public setStep(step: number) {
        this.step = step;
    }

    private reset() {
        this.debugger_.resetAll();
        this.debugger_.codeSegment.reset();
        this.instructions = null;
    }


}