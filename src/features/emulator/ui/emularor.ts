import { Commands as cmd } from "../model/commands/commands";
import { Convertor as cv } from "../model/сonvertor/convertor";

// import { SimpleInstruction } from "shared/types/ASMcode/SimpleInstruction";
// import { Label } from "shared/types/ASMcode/Label";
// import { LabelInstruction } from "src/shared/types/ASMcode/LabelInstruction";

import { AllInstructions } from "src/shared/types/ASMcode/AllInstructions";

import { Debugger } from 'src/widgets/Debugger';

import { resolveAddress } from "../model/address/addressResolver";

import mess from '../config/errors.json'

export class Emulator {

    private static allInsrtr: AllInstructions[];
    public static trFl: boolean = false;
    public static breakFl: boolean = false;

    // стек адресов возврата из подпрограмм (позволяет вызывать подпрограммы из подпрограмм)
    private static callStack: number[] = [];
    public static step: number;

    static emulate(instrs: AllInstructions[], debugger_: Debugger, i: number, NumSys: 2 | 10 | 16 = 16) {
        this.allInsrtr = instrs;
        this.trFl = false;
        this.breakFl = false;

        // при остановке/сбросе программы стек вызовов не должен переживать запуск
        if (i === 0) {
            this.callStack = [];
        }

        this.cmdSwitcher(instrs[i], debugger_, i, NumSys,);
        debugger_.codeSegment.setStep(i);

    }

    /**
     * Команды inc/dec - работают и с регистром, и с ячейкой памяти
     */
    private static incDec(instr: AllInstructions, debugger_: Debugger, NumSys: 2 | 10 | 16, diff: 1 | -1) {
        if (instr.kind !== 'singleInstr') {
            return;
        }

        let val_1 = this.readTarget(instr, debugger_, NumSys)
            ?? debugger_.reg.getValueByName(instr.register);

        if (typeof val_1 !== 'string') {
            return;
        }

        let val_2 = cv.convert('1', 10, NumSys);

        let resVal = diff > 0
            ? cmd.add(val_1, val_2, NumSys)
            : cmd.sub(val_1, val_2, NumSys);

        if (resVal.state == false) {
            debugger_.consolePrint(mess.err_ru.add_err);
            this.breakFl = true;
            return;
        }

        if (!overflowCheck(resVal.value, NumSys)) {
            debugger_.consolePrint(mess.err_ru.overflow_err);
            this.breakFl = true;
            return;
        }

        if (resVal.value) {
            resVal.value = cv.normalization(resVal.value, NumSys);
            this.writeTarget(instr, debugger_, resVal.value, NumSys);
        }
    }

    //=====================================================================================
    //========================== Работа с памятью (Л/Р 3) =================================
    //=====================================================================================

    /**
     * Команда пересылки mov - полностью повторяет поведение ассемблера:
     *   mov <регистр>,  <регистр>
     *   mov <регистр>,  <число>
     *   mov <регистр>,  byte[...] / word[...]      - из памяти
     *   mov <регистр>,  'строка'                   - загрузка символов в регистр
     *   mov byte[...],  <регистр / число / символ>
     *   mov word[...],  <регистр / число / символы>
     *   mov byte[...],  byte[...]                  - запрещено (движение через регистр)
     *
     * Возвращает false, если адрес ячейки памяти некорректен
     */
    private static mov(instr: AllInstructions, debugger_: Debugger, NumSys: 2 | 10 | 16): boolean | void {
        if (instr.kind !== 'smplinstr') {
            return;
        }

        const targetMemory = instr.targetMemory;
        const source = instr.secondRegister;

        //============================== mov <регистр>, ...
        if (!targetMemory) {
            let value = this.readOperand(instr, debugger_, NumSys);

            if (value === undefined) {
                return;
            }

            debugger_.reg.setValue(instr.register, value);
            return;
        }

        //============================== mov <память>, ...
        const address = resolveAddress(targetMemory.address, debugger_.reg);

        if (address === undefined) {
            return false;
        }

        let value: string | undefined;

        if (source.system === 'register') {
            value = debugger_.reg.getValueByName(source.value);
        }
        else if (source.system === 'byte' || source.system === 'word') {
            // mov Память, Память - в ассемблере запрещена, нужен промежуточный регистр
            return false;
        }
        else if (source.system === 'str') {
            value = cmd.charsToHex(source.value);
        }
        else {
            value = normalizationValueSystem(instr, NumSys);
        }

        if (value === undefined) {
            return;
        }

        if (targetMemory.system === 'byte') {
            // в байт записывается только один символ
            debugger_.dataSegment.write(address, 'byte', value.slice(-2).padStart(2, '0'));
            return;
        }

        if (source.system === 'str') {
            // mov word[1], 'el' - символы ложатся в память подряд: [1]='e', [2]='l'
            const bytes = cmd.charsToHex(source.value);
            const maxByte = targetMemory.system === 'word' ? 2 : 1;

            for (let k = 0; k < maxByte && k * 2 < bytes.length; k++) {
                debugger_.dataSegment.write(address + k, 'byte', bytes.slice(k * 2, k * 2 + 2));
            }

            return;
        }

        debugger_.dataSegment.write(address, 'word', value.padStart(4, '0').slice(-4));
    }

    /**
     * Значение второго операнда (регистр, память, символ или число)
     * в текущей системе счисления 
     */
    private static readOperand(instr: AllInstructions, debugger_: Debugger, NumSys: 2 | 10 | 16): string | undefined {
        if (instr.kind !== 'smplinstr') {
            return undefined;
        }

        const source = instr.secondRegister;

        if (source.system === 'register') {
            const val = debugger_.reg.getValueByName(source.value);

            if (typeof val === 'string') {
                // регистры хранят 16-ричное значение - приводим к текущей системе
                return cv.convert(val, 16, NumSys);
            }

            return undefined;
        }

        if (source.system === 'byte' || source.system === 'word') {
            const memory = instr.memory;

            if (!memory) {
                return undefined;
            }

            const address = resolveAddress(memory.address, debugger_.reg);

            if (address === undefined) {
                return undefined;
            }

            const val = debugger_.dataSegment.read(address, memory.system);
            return cv.convert(val, 16, NumSys);
        }

        if (source.system === 'str') {
            const hex = cmd.charsToHex(source.value);

            // mov ax, 'a' - в регистр попадает код символа
            return cv.convert(hex.padStart(4, '0').slice(-4), 16, NumSys);
        }

        return normalizationValueSystem(instr, NumSys);
    }

    /**
     * Значение первого операнда - если это была ячейка памяти (для add, sub, and, or, xor, cmp)
     */
    private static readTarget(instr: AllInstructions, debugger_: Debugger, NumSys: 2 | 10 | 16): string | undefined {
        const memory = instr.kind === 'smplinstr'
            ? instr.targetMemory
            : instr.kind === 'singleInstr' ? instr.memory : undefined;

        if (!memory) {
            return undefined;
        }

        const address = resolveAddress(memory.address, debugger_.reg);

        if (address === undefined) {
            return undefined;
        }

        const val = debugger_.dataSegment.read(address, memory.system);
        return cv.convert(val, 16, NumSys);
    }

    /**
     * Запись результата в первый операнд - регистр или ячейку памяти
     */
    private static writeTarget(instr: AllInstructions, debugger_: Debugger, value: string, NumSys: 2 | 10 | 16) {
        if (instr.kind !== 'smplinstr' && instr.kind !== 'singleInstr') {
            return;
        }

        const memory = instr.kind === 'smplinstr' ? instr.targetMemory : instr.memory;

        if (!memory) {
            debugger_.reg.setValue(instr.register, value);
            return;
        }

        const address = resolveAddress(memory.address, debugger_.reg);

        if (address === undefined) {
            return;
        }

        const hexValue = cv.convert(value, NumSys, 16);

        if (memory.system === 'byte') {
            debugger_.dataSegment.write(address, 'byte', hexValue.slice(-2).padStart(2, '0'));
            return;
        }

        debugger_.dataSegment.write(address, 'word', hexValue.padStart(4, '0').slice(-4));
    }

    /**
     * Переход на метку (используется условными переходами)
     */
    private static jumpToLabel(instr: AllInstructions, debugger_: Debugger) {
        if (instr.kind !== 'lbinstr') {
            return;
        }

        const step = this.allInsrtr.findIndex(item => item.kind === 'lb' && item.name === instr.label);

        if (step === -1) {
            debugger_.consolePrint(mess.err_ru.unknow_cmd_err);
            this.breakFl = true;
            return;
        }

        this.step = step;
        this.trFl = true;
    }

    //=====================================================================================
    private static cmdSwitcher(instr: AllInstructions, debugger_: Debugger, i: number, NumSys: 2 | 10 | 16) {
        if (instr.kind === 'smplinstr') {
            switch (instr.command) {
                case "mov": {
                    let res = this.mov(instr, debugger_, NumSys);

                    if (res === false) {
                        debugger_.consolePrint(mess.err_ru.memory_err);
                        this.breakFl = true;
                    }

                    break;
                }

                case "shl": {
                    let step = parseInt(instr.secondRegister.value)
                    if (step) {
                        let unprocVal = this.readTarget(instr, debugger_, NumSys)
                            ?? debugger_.reg.getValueByName(instr.register);

                        if (typeof unprocVal === 'string') {
                            unprocVal = cv.convert(unprocVal, NumSys, 2);

                            let resVal = cmd.shl(unprocVal, step)
                            resVal = cv.convert(resVal, 2, NumSys);

                            this.writeTarget(instr, debugger_, resVal, NumSys);
                        }
                    }
                    break;
                }

                case "shr": {
                    let step = parseInt(instr.secondRegister.value)
                    if (step) {
                        let unprocVal = this.readTarget(instr, debugger_, NumSys)
                            ?? debugger_.reg.getValueByName(instr.register);

                        if (typeof unprocVal === 'string') {
                            unprocVal = cv.convert(unprocVal, NumSys, 2);
                            let resVal = cmd.shr(unprocVal, step)
                            resVal = cv.convert(resVal, 2, NumSys);

                            this.writeTarget(instr, debugger_, resVal, NumSys);
                        }
                    }
                    break;
                }

                case "add": {
                    let val_1 = this.readTarget(instr, debugger_, NumSys)
                        ?? debugger_.reg.getValueByName(instr.register);

                    if (typeof val_1 === 'string') {
                        let val_2 = this.readOperand(instr, debugger_, NumSys);

                        if (!val_2) {
                            if (instr.secondRegister.system === 'register' ||
                                instr.secondRegister.system === 'byte' ||
                                instr.secondRegister.system === 'word') {
                                this.breakFl = true;
                            }
                            break;
                        }

                        let resVal = cmd.add(val_1, val_2, NumSys);

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

                        if (resVal.state == true) {
                            resVal.value = cv.normalization(resVal.value, NumSys);
                            this.writeTarget(instr, debugger_, resVal.value, NumSys);
                            break
                        }
                    }
                    break;
                }

                case "sub": {
                    let val_1 = this.readTarget(instr, debugger_, NumSys)
                        ?? debugger_.reg.getValueByName(instr.register);

                    if (typeof val_1 === 'string') {
                        let val_2 = this.readOperand(instr, debugger_, NumSys);

                        if (!val_2) {
                            if (instr.secondRegister.system === 'register' ||
                                instr.secondRegister.system === 'byte' ||
                                instr.secondRegister.system === 'word') {
                                this.breakFl = true;
                            }
                            break;
                        }

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
                            this.writeTarget(instr, debugger_, resVal.value, NumSys);
                            break
                        }
                    }
                    break;
                }

                case "and": {
                    let val = this.readTarget(instr, debugger_, NumSys)
                        ?? debugger_.reg.getValueByName(instr.register);

                    if (typeof val === 'string') {
                        val = cv.convert(val, NumSys, 2)

                        let mask = this.readOperand(instr, debugger_, 2);

                        if (mask) {
                            let resVal = cmd.and(val, mask);

                            resVal = cv.convert(resVal, 2, NumSys);

                            if (resVal.length > 4) {
                                debugger_.consolePrint(mess.err_ru.overflow_err);
                                this.breakFl = true;
                                break;
                            }

                            this.writeTarget(instr, debugger_, resVal, NumSys);
                        }
                    }
                    break;
                }

                case "or": {
                    let val = this.readTarget(instr, debugger_, NumSys)
                        ?? debugger_.reg.getValueByName(instr.register);

                    if (typeof val === 'string') {
                        val = cv.convert(val, NumSys, 2)

                        let mask = this.readOperand(instr, debugger_, 2);

                        if (mask) {
                            let resVal = cmd.or(val, mask);

                            resVal = cv.convert(resVal, 2, NumSys);

                            if (resVal.length > 4) {
                                debugger_.consolePrint(mess.err_ru.overflow_err);
                                this.breakFl = true;
                                break;
                            }

                            this.writeTarget(instr, debugger_, resVal, NumSys);
                        }
                    }
                    break;
                }

                case "xor": {
                    let val = this.readTarget(instr, debugger_, NumSys)
                        ?? debugger_.reg.getValueByName(instr.register);

                    if (typeof val === 'string') {
                        val = cv.convert(val, NumSys, 2)

                        let mask = this.readOperand(instr, debugger_, 2);

                        if (mask) {
                            let resVal = cmd.xor(val, mask);

                            resVal = cv.convert(resVal, 2, NumSys);

                            if (resVal.length > 4) {
                                debugger_.consolePrint(mess.err_ru.overflow_err);
                                this.breakFl = true;
                                break;
                            }

                            this.writeTarget(instr, debugger_, resVal, NumSys);
                        }
                    }
                    break;
                }
                case "cmp": {

                    let val_1 = this.readTarget(instr, debugger_, NumSys)
                        ?? debugger_.reg.getValueByName(instr.register);

                    if (typeof val_1 !== 'string') {
                        return;
                    }

                    let val_2 = this.readOperand(instr, debugger_, NumSys);

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
                    this.incDec(instr, debugger_, NumSys, 1);
                    break;
                }
                case "dec": {
                    this.incDec(instr, debugger_, NumSys, -1);
                    break;

                }

            }
        }

        else if (instr.kind === 'lbinstr') {
            switch (instr.cmd) {
                case "loop": {
                    let cx = debugger_.reg.getValueByName('cx');

                    let cxNum = parseInt(cx!, NumSys);

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

                case "je": {
                    if (debugger_.flagReg.getValueByName('zf') === true) {
                        this.jumpToLabel(instr, debugger_);
                    }
                    break;
                }
                case "jne": {
                    if (debugger_.flagReg.getValueByName('zf') === false) {
                        this.jumpToLabel(instr, debugger_);
                    }
                    break;
                }
                case "jl": {
                    if (debugger_.flagReg.getValueByName('sf') === true) {
                        this.jumpToLabel(instr, debugger_);
                    }
                    break;
                }
                case "jge": {
                    if (debugger_.flagReg.getValueByName('sf') === false) {
                        this.jumpToLabel(instr, debugger_);
                    }
                    break;
                }
                case "jle": {
                    if (debugger_.flagReg.getValueByName('sf') === true ||
                        debugger_.flagReg.getValueByName('zf') === true) {
                        this.jumpToLabel(instr, debugger_);
                    }
                    break;
                }
                case "jg": {
                    if (debugger_.flagReg.getValueByName('sf') === false &&
                        debugger_.flagReg.getValueByName('zf') === false) {
                        this.jumpToLabel(instr, debugger_);
                    }
                    break;
                }
                case "ja": {
                    if (debugger_.flagReg.getValueByName('sf') === false &&
                        debugger_.flagReg.getValueByName('zf') === false) {
                        this.jumpToLabel(instr, debugger_);
                    }
                    break;
                }
                case "jb": {
                    if (debugger_.flagReg.getValueByName('sf') === true) {
                        this.jumpToLabel(instr, debugger_);
                    }
                    break;
                }

                case "call": {
                    let label = instr.label;
                    let step = this.allInsrtr.findIndex(item => item.kind === 'lb' && item.name === label);

                    if (step === -1) {
                        debugger_.consolePrint(mess.err_ru.memory_addr_err);
                        this.breakFl = true;
                        break;
                    }

                    // адрес возврата кладем в стек - подпрограмма может вызывать другую подпрограмму
                    this.callStack.push(i);

                    this.step = step;
                    this.trFl = true;
                    break;
                }
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
        else if (instr.kind === 'ret') {

            const returnTo = this.callStack.pop();

            if (returnTo === undefined) {
                debugger_.consolePrint(mess.err_ru.ret_err);
                this.breakFl = true;
                return;
            }

            this.step = returnTo;
            this.step++;
            this.trFl = true;
            return;
        }

    }
}




function normalizationValueSystem(instr: AllInstructions, to: 2 | 10 | 16) {
    if (instr.kind === 'smplinstr') {

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