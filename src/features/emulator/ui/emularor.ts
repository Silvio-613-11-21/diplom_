import { Commands as cmd } from "../model/commands/commands";
import { Convertor as cv } from "../model/сonvertor/convertor";

import { SimpleInstruction } from "shared/types/ASMcode/SimpleInstruction";
import { Label } from "shared/types/ASMcode/Label";
import { LabelInstruction } from "src/shared/types/ASMcode/LabelInstruction";
import { AllInstructions } from "src/shared/types/ASMcode/AllInstructions";

import { Debugger } from 'src/widgets/Debugger';

import mess from '../config/errors.json'

export class Emulator {

    private static allInsrtr: AllInstructions[];

    public static step: number;
    public static trFl: boolean = false;
    public static breakFl: boolean = false; 

    static emulate(instrs: AllInstructions[], debugger_: Debugger, i: number, NumSys: 2 | 10 | 16 = 16) {
        this.allInsrtr = instrs;
        this.trFl = false;
        this.breakFl = false; 

        this.cmdSwitcher(instrs[i], debugger_, NumSys);
        debugger_.codeSegment.setStep(i);

    }

    //=====================================================================================
    private static cmdSwitcher(instr: AllInstructions, debugger_: Debugger, NumSys: 2 | 10 | 16 ) {
        if (instr.kind === 'smplinstr') {
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
                            console.log(resVal)

                            if (resVal.state == false) {
                                debugger_.consolePrint(mess.err_ru.add_err);
                                this.breakFl = true;
                                break;
                            }

                            let overflCheck = overflowCheck(resVal.value, NumSys);
                            //console.log(overflCheck)
                            //console.log(resVal.value)
                            //console.log(NumSys)

                            if (!overflCheck) {
                                //console.log('ho')
                                debugger_.consolePrint(mess.err_ru.overflow_err);
                                this.breakFl = true;
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
                                debugger_.consolePrint(mess.err_ru.add_err);
                                this.breakFl = true;
                                break;
                            }

                            let overflCheck = overflowCheck(resVal.value, NumSys);
                            if (!overflCheck) {
                                debugger_.consolePrint(mess.err_ru.overflow_err);
                                this.breakFl = true;
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
                                debugger_.consolePrint(mess.err_ru.overflow_err);
                                this.breakFl = true;
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
                                debugger_.consolePrint(mess.err_ru.overflow_err);
                                this.breakFl = true;
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
                                debugger_.consolePrint(mess.err_ru.overflow_err);
                                this.breakFl = true;
                                break;
                            }

                            debugger_.reg.setValue(instr.register, resVal);
                        }
                    }
                    break;
                }
                case "cmp": {


                    let val_1 = debugger_.reg.getValueByName(instr.register);
                    if (typeof val_1 !== 'string') {
                        return;
                    }

                    let val_2;
                    if (instr.secondRegister.system === 'register') {
                        val_2 = debugger_.reg.getValueByName(instr.secondRegister.value);
                    }
                    else {
                        val_2 = normalizationValueSystem(instr, NumSys);
                    }

                    if (!val_2) {
                        return;
                    }

                    let val1Num = parseInt(val_1, NumSys);
                    let val2Num = parseInt(val_2, NumSys);

                    if (isNaN(val1Num)) {
                        return;
                    }

                    if (isNaN(val2Num)) {
                        return;
                    }

                    debugger_.flagReg.resetAll();
                    let resValNum = val1Num - val2Num;

                    if (resValNum >= 0) {
                        debugger_.flagReg.setValue('sf', false);
                    }
                    else {
                        debugger_.flagReg.setValue('sf', true)
                    }

                    if (val1Num != val2Num) {
                        debugger_.flagReg.setValue('zf', false);
                    }
                    else {
                        debugger_.flagReg.setValue('zf', true);
                    }
                }

                    break;
            }

        }



        else if (instr.kind === 'singleInstr') {
            switch (instr.cmd) {
                case "inc": {

                    let val_1 = debugger_.reg.getValueByName(instr.register);
                    //console.log(val_1)
                    if (typeof val_1 === 'string') {
                        let val_2 = cv.convert('1', 10, NumSys);
                        //console.log(val_2)

                        if (val_2) {
                            let resVal = cmd.add(val_1, val_2, NumSys);
                            //console.log(resVal)

                            if (resVal.state == false) {
                                debugger_.consolePrint(mess.err_ru.add_err);
                                this.breakFl = true;
                                break;
                            }

                            if (!overflowCheck(resVal.value, NumSys)) {
                                debugger_.consolePrint(mess.err_ru.overflow_err);
                                this.breakFl = true;
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
                case "dec": {
                    let val_1 = debugger_.reg.getValueByName(instr.register);
                    //console.log(val_1)
                    if (typeof val_1 === 'string') {
                        let val_2 = cv.convert('1', 10, NumSys);
                        //console.log(val_2)

                        if (val_2) {
                            let resVal = cmd.sub(val_1, val_2, NumSys);
                            //console.log(resVal)

                            if (resVal.state == false) {
                                debugger_.consolePrint(mess.err_ru.add_err);
                                this.breakFl = true;
                                break;
                            }

                            if (!overflowCheck(resVal.value, NumSys)) {
                                debugger_.consolePrint(mess.err_ru.overflow_err);
                                this.breakFl = true;
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

            }
        }

        else if (instr.kind === 'lbinstr') {
            switch (instr.cmd) {
                case "loop": {
                    let cx = debugger_.reg.getValueByName('cx');
                    console.log(cx)

                    let cxNum = parseInt(cx!, NumSys);
                    console.log(cxNum)

                    if (cxNum !== 0) {
                        let dec = cv.convert('1', 10, NumSys);
                        let resVal = cmd.sub(cx!, dec, NumSys);
                        resVal.value = cv.normalization(resVal.value, NumSys);
                        debugger_.reg.setValue('cx', resVal.value);

                        let label = instr.label;
                        let step = this.allInsrtr.findIndex(item => item.kind === 'lb' && item.name === label);
                        //console.log(step)

                        this.step = step;
                        this.trFl = true;
                        break
                    }

                    break;
                }
                case "js": {
                    if (debugger_.flagReg.getValueByName('sf') === true) {
                        let label = instr.label;
                        let step = this.allInsrtr.findIndex(item => item.kind === 'lb' && item.name === label);

                        this.step = step;
                        this.trFl = true;
                        break;
                    }
                    break;
                }
                case "jns": {
                    if (debugger_.flagReg.getValueByName('sf') === false) {
                        let label = instr.label;
                        let step = this.allInsrtr.findIndex(item => item.kind === 'lb' && item.name === label);

                        this.step = step;
                        this.trFl = true;
                        break;
                    }
                    break;
                }
                case "jz": {
                    if (debugger_.flagReg.getValueByName('zf') === true) {
                        let label = instr.label;
                        let step = this.allInsrtr.findIndex(item => item.kind === 'lb' && item.name === label);

                        this.step = step;
                        this.trFl = true;
                        break;
                    }
                    break;
                }
                case "jnz": {
                    if (debugger_.flagReg.getValueByName('zf') === false) {
                        let label = instr.label;
                        let step = this.allInsrtr.findIndex(item => item.kind === 'lb' && item.name === label);

                        this.step = step;
                        this.trFl = true;
                        break;
                    }
                    break;
                }
                case "jmp": {
                    let label = instr.label;
                    let step = this.allInsrtr.findIndex(item => item.kind === 'lb' && item.name === label);

                    this.step = step;
                    this.trFl = true;
                    break;
                }

                // case "none":
            }
        }
        else if (instr.kind === 'lb') {
            return;
        }
        else if (instr.kind === 'int') {
            switch (instr.value) {
                case '21h': {
                    debugger_.consolePrint(mess.err_ru.program_end);
                    this.breakFl = true;
                    break;
                }
                default: {
                    debugger_.consolePrint(mess.err_ru.unknow_cmd_err);
                    this.breakFl = true;
                    break;
                }

            }
        }

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


function overflowCheck(num: string, NumSys: 2 | 10 | 16) {
    if (NumSys == 2) {
        if (num.length > 16) {
            return false;
        }
    }
    else if (NumSys == 10) {
        let decNum = parseInt(num);
        if (isNaN(decNum)) {
            return false;
        }

        if (decNum > 65535) {
            return false;
        }
    }
    else if (NumSys == 16) {
        if (num.length > 4) {
            return false;
        }
    }

    return true;

}