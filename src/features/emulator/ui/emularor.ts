import { Commands as cmd } from "../model/commands/commands";
import { Convertor as cv } from "../model/сonvertor/convertor";

import { SimpleInstruction } from "shared/types/ASMcode/SimpleInstruction";
import { Label } from "shared/types/ASMcode/Label";
import { LabelInstruction } from "src/shared/types/ASMcode/LabelInstruction";
import { AllInstructions } from "src/shared/types/ASMcode/AllInstructions";

import { Debugger } from 'src/widgets/Debugger';

import mess from '../config/errors.json'

export function emulator(instrs: AllInstructions[], debugger_: Debugger, i?: number, NumSys: 2 | 10 | 16 = 16) {


    if (i === undefined) {
        // debugger_.resetAll();

        for (const instr of instrs) {
            if (instr.kind === 'smplinstr') {
                cmdSwitcher(instr, debugger_, NumSys);
            }
        }
    }
    else {
        if (instrs[i].kind === 'smplinstr') {
            cmdSwitcher(instrs[i], debugger_, NumSys);
        }
    }
}

function cmdSwitcher(instr: SimpleInstruction, debugger_: Debugger, NumSys: 2 | 10 | 16) {
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

            let val = normalizationValueSystem(instr, NumSys);
            if (val) {
                debugger_.reg.setValue(instr.register, val)
                break;
            }

            break;
        }

        case "shl": {
            let step = parseInt(instr.secondRegister.value)
            if (step) {
                //console.log(step)
                let unprocVal = debugger_.reg.getValueByName(instr.register);
                //console.log(unprocVal)
                if (unprocVal) {
                    unprocVal = cv.convert(unprocVal, NumSys, 2);

                    let resVal = cmd.shl(unprocVal, step)
                    resVal = cv.convert(resVal, 2, NumSys);


                    debugger_.reg.setValue(instr.register, resVal);

                }
            }
            break;
        }

        case "shr": {
            let step = parseInt(instr.secondRegister.value)
            if (step) {
                //console.log(step)
                let unprocVal = debugger_.reg.getValueByName(instr.register);
                //console.log(unprocVal)
                if (unprocVal) {
                    unprocVal = cv.convert(unprocVal, NumSys, 2);
                    let resVal = cmd.shr(unprocVal, step)
                    resVal = cv.convert(resVal, 2, NumSys);
                    debugger_.reg.setValue(instr.register, resVal);
                }
            }
            break;
        }

        case "add": {
            let val_1 = debugger_.reg.getValueByName(instr.register);
            if (typeof val_1 === 'string') {
                let val_2;
                if (instr.secondRegister.system === 'register') {
                    val_2 = debugger_.reg.getValueByName(instr.secondRegister.value);
                }
                else {
                    val_2 = normalizationValueSystem(instr, NumSys);
                }

                if (val_2) {
                    let resVal = cmd.add(val_1, val_2, NumSys);

                    if (resVal.state == false) {
                        debugger_.consolePrint(mess.errors_ru[0]);
                        break;
                    }

                    if (!overflowChech(resVal.value, NumSys)) {
                        debugger_.consolePrint(mess.errors_ru[1]);
                        break;
                    }

                    if (resVal.state == true) {
                        resVal.value = cv.normalization(resVal.value, NumSys);
                        debugger_.reg.setValue(instr.register, resVal.value);
                        break
                    }
                }
            }
            break;
        }

        case "sub": {
            let val_1 = debugger_.reg.getValueByName(instr.register);
            if (typeof val_1 === 'string') {
                let val_2;
                if (instr.secondRegister.system === 'register') {
                    val_2 = debugger_.reg.getValueByName(instr.secondRegister.value);
                }
                else {
                    val_2 = normalizationValueSystem(instr, NumSys);
                }

                if (val_2) {
                    let resVal = cmd.sub(val_1, val_2, NumSys);

                    if (resVal.state == false) {
                        debugger_.consolePrint(mess.errors_ru[0]);
                        break;
                    }

                    if (!overflowChech(resVal.value, NumSys)) {
                        debugger_.consolePrint(mess.errors_ru[1]);
                        break;
                    }

                    if (resVal.value) {
                        resVal.value = cv.normalization(resVal.value, NumSys);
                        debugger_.reg.setValue(instr.register, resVal.value);
                        break
                    }
                }
            }
            break;
        }

        case "and": {
            let val = debugger_.reg.getValueByName(instr.register);


            if (typeof val === 'string') {
                val = cv.convert(val, NumSys, 2)
                console.log(val)

                let mask;
                if (instr.secondRegister.system === 'register') {

                    mask = debugger_.reg.getValueByName(instr.secondRegister.value);
                    mask = cv.convert(mask!, NumSys, 2)

                }
                else {

                    mask = normalizationValueSystem(instr, 2);
                    console.log(mask)
                }

                if (mask) {

                    let resVal = cmd.and(val, mask);
                    console.log(resVal)

                    resVal = cv.convert(resVal, 2, NumSys);

                    console.log(resVal)


                    if (resVal.length > 4) {
                        debugger_.consolePrint(mess.errors_ru[1]);
                        break;
                    }

                    debugger_.reg.setValue(instr.register, resVal);
                }
            }
            break;
        }

        case "or": {
            let val = debugger_.reg.getValueByName(instr.register);


            if (typeof val === 'string') {
                val = cv.convert(val, NumSys, 2)
                console.log(val)

                let mask;
                if (instr.secondRegister.system === 'register') {
                    mask = debugger_.reg.getValueByName(instr.secondRegister.value);
                    mask = cv.convert(mask!, NumSys, 2)

                }
                else {

                    mask = normalizationValueSystem(instr, 2);
                    console.log(mask)
                }

                if (mask) {

                    let resVal = cmd.or(val, mask);
                    console.log(resVal)

                    resVal = cv.convert(resVal, 2, NumSys);
                    console.log(resVal)


                    if (resVal.length > 4) {
                        debugger_.consolePrint(mess.errors_ru[1]);
                        break;
                    }

                    debugger_.reg.setValue(instr.register, resVal);
                }
            }
            break;
        }

        case "xor": {
            let val = debugger_.reg.getValueByName(instr.register);

            if (typeof val === 'string') {
                val = cv.convert(val, NumSys, 2)
                console.log(val)

                let mask;
                if (instr.secondRegister.system === 'register') {

                    mask = debugger_.reg.getValueByName(instr.secondRegister.value);
                    mask = cv.convert(mask!, NumSys, 2)

                }
                else {

                    mask = normalizationValueSystem(instr, 2);
                    console.log(mask)
                }

                if (mask) {

                    let resVal = cmd.xor(val, mask);
                    console.log(resVal)

                    resVal = cv.convert(resVal, 2, NumSys);
                    console.log(resVal)


                    if (resVal.length > 4) {
                        debugger_.consolePrint(mess.errors_ru[1]);
                        break;
                    }

                    debugger_.reg.setValue(instr.register, resVal);
                }
            }
            break;
        }

        // case "inc": {

        // }

    }

}


function normalizationValueSystem(instr: SimpleInstruction, to: 2 | 10 | 16) {

    if (instr.secondRegister.system === 'h') {
        let val = cv.convert(instr.secondRegister.value, 16, to);
        return val;
    }

    if (instr.secondRegister.system === "b") {
        let val = cv.convert(instr.secondRegister.value, 2, to);
        return val;
    }
    else if (instr.secondRegister.system === "d") {
        let valNum = parseInt(instr.secondRegister.value);

        if (valNum >= 0) {
            let val = cv.convert(instr.secondRegister.value, 10, to);
            return val;
        }
        else {
            let val = cv.negativeNumberTransform(valNum);
            return val;
        }
    }

}


function overflowChech(num: string, NumSys: 2 | 10 | 16) {
    if (NumSys == 2) {
        if (num.length > 16) {
            return false;
        }
    }

    if (NumSys == 10) {
        let decNum = parseInt(num);
        if (isNaN(decNum)) {
            return false;
        }

        if (decNum > 65535) {
            return false;
        }
    }

    if (NumSys == 16) {
        if (num.length > 4) {
            return false;
        }
    }

    return true;

}