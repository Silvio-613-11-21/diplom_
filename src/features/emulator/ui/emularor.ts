import { Commands as cmd } from "../model/commands/commands";
import { Convertor as cv } from "../model/сonvertor/convertor";

import { SimpleInstruction } from "src/shared/types/SimpleInstruction";

import { Editor } from 'src/widgets/Editor';
import { Debugger } from 'src/widgets/Debugger';


export function emulator(instrs: SimpleInstruction[], editor: Editor, debugger_: Debugger,) {

    debugger_.resetAll();

    for (const instr of instrs) {
        cmdSwitcher(instr, debugger_);
    }

}

function cmdSwitcher(instr: SimpleInstruction, debugger_: Debugger) {
    switch (instr.command) {
        case "mov": {
            if (instr.secondRegister.system === 'none') {
                break;
            }

            if (instr.secondRegister.system === "register") {
                let val = debugger_.reg.getValueByName(instr.secondRegister.value);
                if (typeof val === 'string') {
                    debugger_.reg.setValue(instr.register, val)
                }
                break;
            }

            if (instr.secondRegister.system === 'h') {
                let val = cv.normalization(instr.secondRegister.value, 16);
                debugger_.reg.setValue(instr.register, val)
            }


            if (instr.secondRegister.system === "b") {
                let val = cv.convert(instr.secondRegister.value, 2, 16);
                val = cv.normalization(val, 16);
                debugger_.reg.setValue(instr.register, val)
                break;
            }
            else if (instr.secondRegister.system === "d") {
                let val = cv.convert(instr.secondRegister.value, 10, 16);
                val = cv.normalization(val, 16);
                debugger_.reg.setValue(instr.register, val)
                break;
            }
            break;
        }
        case "shl": {
            let step = parseInt(instr.secondRegister.value)
            if (step) {
                console.log(step)
                let unprocVal = debugger_.reg.getValueByName(instr.register);
                console.log(unprocVal)
                if (unprocVal) {
                    unprocVal = cv.convert(unprocVal, 16, 2);
                    unprocVal = cv.normalization(unprocVal, 2);
                    let resVol = cmd.shl(unprocVal, step)
                    resVol = cv.convert(resVol, 2, 16); 
                    resVol = cv.normalization(resVol, 16);

                    debugger_.reg.setValue(instr.register, resVol);

                }
            }
            break;
        }

    }


}