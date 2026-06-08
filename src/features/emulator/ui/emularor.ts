import { parser } from "../model/parser/parser";
import { Commands as cmd } from "../model/commands/commands";

import { SimpleInstruction } from "src/shared/types/SimpleInstruction";

import { Editor } from 'src/widgets/Editor';
import { Debugger } from 'src/widgets/Debugger';

import { Restricts  } from "src/shared/types/Restricts";

export function emulator(editor: Editor, debugger_: Debugger, restricts: Restricts) {

    debugger_.reg.resetAll();
    //console.log(editor.content)
    const instrs = parser(editor.content, restricts.cmd, restricts.rl)
    if (!instrs) return;
    //console.log(instrs)


    for (const instr of instrs) {
        if (typeof instr !== 'string')
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