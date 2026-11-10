import { AllInstructions } from "src/shared/types/ASMcode/AllInstructions"
import html_ from './CodeSegment.html?raw';
import imgback from './nothing.jpg'

//================================ 
import './CodeSegment.css'
//===============================

export class CodeSegment {

    private instr_s: AllInstructions[] | undefined = undefined;

    private lineTpl: HTMLTemplateElement;
    private codeSegmentLineSpace: HTMLElement;
    private codeSegmentNumSpace: HTMLElement;
    // private codeSegmentElem!: HTMLElement; 

    constructor(App: HTMLElement) {
        App.insertAdjacentHTML('afterbegin', html_);
        this.lineTpl = document.querySelector(".tpl-line-code-segment") as HTMLTemplateElement;
        this.codeSegmentLineSpace = document.querySelector(".line-code-segment-space") as HTMLElement;
        this.codeSegmentNumSpace = document.querySelector(".num-code-segment-space") as HTMLElement;

        this.render();
    }

    public renderInstr(instr_s?: AllInstructions[]) {
        this.instr_s = instr_s;
        this.render();
    }

    public reset() {
        let lineElemList = document.querySelectorAll('.line-code-segment');
        lineElemList.forEach(line => { line.remove() })

        this.codeSegmentNumSpace.replaceChildren();
        this.codeSegmentLineSpace.style.backgroundImage = `url("${imgback}")`;
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
            this.codeSegmentLineSpace.style.backgroundImage = `none`;

            let i = 0;
            for (const instr of this.instr_s) {
                let fragment = this.lineTpl.content.cloneNode(true) as DocumentFragment;
                let lineElem = fragment.firstElementChild as HTMLElement;
                lineElem.id = `line-${i}`;
                let p = lineElem.querySelector('pre') as HTMLElement;
                p.textContent = this.instrParser(instr);

                this.codeSegmentLineSpace.appendChild(lineElem);

                if (i < this.instr_s.length   ) {
                    this.codeSegmentNumSpace.innerHTML += `<div>${i + 1}</div>`
                }
                i++;
            }


            this.setStep(0);
            return;
        }
    }


    // =====================================================
    private instrParser(instr: AllInstructions) {
        let res = '  ';

        if (instr.kind == 'smplinstr') {
            res += instr.command;
            res += "    ";

            // первый операнд - регистр или ячейка памяти byte[...] / word[...]
            if (instr.targetMemory) {
                res += `${instr.targetMemory.system}[${instr.index ?? instr.targetMemory.address}]`;
            }
            else {
                res += instr.register;
            }

            res += ' , ';

            // второй операнд - регистр, память, символ или число
            if (instr.memory) {
                const shownAddress = instr.secondRegister.index ?? instr.memory.address;
                res += `${instr.memory.system}[${shownAddress}]`;
            }
            else if (instr.secondRegister.system === 'str') {
                res += `'${instr.secondRegister.value}'`;
            }
            else {
                res += instr.secondRegister.value;
            }
        }

        if (instr.kind == 'lb') {
            res += instr.name
            res += ':'
        }


        if (instr.kind == 'lbinstr') {
            res += instr.cmd;
            res += '    ';
            res += instr.label;
        }


        if (instr.kind === 'singleInstr') {
            res += instr.cmd;
            res += '    ';

            if (instr.memory) {
                // адрес в том виде, в котором его написал пользователь
                res += `${instr.memory.system}[${instr.index ?? instr.memory.address}]`;
            }
            else {
                res += instr.register;
            }
        }

        if (instr.kind === 'int') {
            res += 'int';
            res += ' ';
            res += instr.value;
        }

        if (instr.kind === 'ret') {
            res += "ret";
        }

        //console.log(res)
        return res;

    }
}