import { AllInstructions } from "src/shared/types/ASMcode/AllInstructions"
import html_ from './CodeSegment.html?raw';
import imgback from './nothing.jpg'

//================================ 
import './CodeSegment.css'
//===============================

export class CodeSegment {

    private instr_s: AllInstructions[] | undefined = undefined;

    private lineTpl: HTMLTemplateElement;
    private codeSegmentElem: HTMLElement;


    constructor(App: HTMLElement) {
        App.insertAdjacentHTML('afterbegin', html_);
        this.lineTpl = document.querySelector(".tpl-line-code-segment") as HTMLTemplateElement;
        this.codeSegmentElem = document.querySelector(".code-segment") as HTMLElement;

        this.render();
    }

    public renderInstr(instr_s?: AllInstructions[]) {
        this.instr_s = instr_s;
        this.render();
    }

    public reset() {
        let lineElemList = document.querySelectorAll('.line-code-segment');
        lineElemList.forEach(line => { line.remove() })
        this.codeSegmentElem.style.backgroundImage = `url("${imgback}")`;
    }

    public setStep(step: number | "last") {

        let lineElemList = document.querySelectorAll('.line-code-segment');
        lineElemList.forEach(line => { line.classList.remove('isActiveLine') })

        if (step === "last") {
            step = this.instr_s!.length - 1;
        }

        let choosenLine = document.getElementById(`line-${step}`) as HTMLElement;
        choosenLine?.classList.add("isActiveLine");

    }

    private render() {
        if (this.instr_s == undefined) {
            this.reset();
            return;
        }
        else {
            this.reset();
            this.codeSegmentElem.style.backgroundImage = `none`;

            let i = 0;
            for (const instr of this.instr_s) {
                let fragment = this.lineTpl.content.cloneNode(true) as DocumentFragment;
                let lineElem = fragment.firstElementChild as HTMLElement;
                lineElem.id = `line-${i}`;
                let p = lineElem.querySelector('pre') as HTMLElement;
                p.textContent = this.instrParser(instr, i);

                this.codeSegmentElem.appendChild(lineElem);

                i++;
            }

            this.setStep(0);
            return;
        }
    }


    // =====================================================
    private instrParser(instr: AllInstructions, i: number) {
        let res = String(i + 1) + '.  ';

        if (instr.kind == 'smplinstr') {

            res += instr.command;
            res += "    ";
            res += instr.register;
            res += ' , ';
            res += instr.secondRegister.value;
        }

        if (instr.kind == 'lb') {
            res += instr.name
            res += ':'
        }


        if(instr.kind == 'lbinstr') {
            res += instr.cmd;
            res += '    ';
            res += instr.label; 
        }


        if(instr.kind === 'singleInstr'){
            res += instr.cmd;
            res += '    ';
            res += instr.register; 
        }

        if(instr.kind === 'int'){
            res += 'int'; 
            res += ' '; 
            res += instr.value; 
        }
        //console.log(res)
        return res;

    }
}