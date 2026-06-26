import { AllInstructions } from "src/shared/types/ASMcode/AllInstructions"
import html_ from './CodeSegment.html?raw';

export class CodeSegment {

    private App: HTMLElement;
    private instr_s: AllInstructions[] | undefined = undefined;


    constructor(App: HTMLElement) {
        this.App = App;
        App.insertAdjacentHTML('afterbegin', html_);

        this.render(); 
    }

    public renderInstr(instr_s?: AllInstructions[]) {
        this.instr_s = instr_s;
        this.render();
    }

    private render() {
        if (this.instr_s == undefined) {

            return;
        }
        else {
            return;
        }
    }

} 