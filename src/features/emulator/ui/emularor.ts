import { parser } from "../../parser/model/parser";
import { Commands as cmd } from "../model/commands/commands";

import { SimpleInstruction } from "src/shared/types/SimpleInstruction";

import { Editor } from 'src/widgets/Editor';
import { Debugger } from 'src/widgets/Debugger';

import { Restricts } from "src/shared/types/Restricts";

export function emulator(instrs: SimpleInstruction[],  editor: Editor, debugger_: Debugger,) {

    debugger_.reg.resetAll();
    //console.log(editor.content)
    // const instrs: SimpleInstruction[] | string = parser(editor.content, restricts.cmd, restricts.rl)
    // if (typeof instrs === 'string') return;
    //console.log(instrs)


    for (const instr of instrs) {
        cmdSwitcher(instr, debugger_);
    }

}

function cmdSwitcher(instr: SimpleInstruction, debugger_: Debugger) {
    switch (instr.command) {
        case "mov": {
            debugger_.reg.setValue(instr.register, instr.value) //instr.value - тут нужна логикам проверки значения (число/другой регистр) 
            break;
        }
        case "shl": {
            debugger_.reg.setValue(instr.register, cmd.shl(debugger_.reg.getValueByName(instr.register)!, parseInt(instr.value)));
            break;
        }

    }


}