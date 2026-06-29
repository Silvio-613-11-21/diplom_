import { SimpleInstruction } from "shared/types/ASMcode/SimpleInstruction";
import { Label } from "shared/types/ASMcode/Label";
import { LabelInstruction } from "shared/types/ASMcode/LabelInstruction";
import { SingleInstruction } from "src/shared/types/ASMcode/SingleInstructio";

import { RegExp } from "./RegExp";
import { SimpleInstructionsReader as SIR } from "./SimpeInstructionsReader";
import mess from "../config/messages.json"

export class InsrtrInspector {

    static singleInstructionProcessing(code: string, commandsList: string[], registersNameList: string[], i: number) {
        let singlInstr: SingleInstruction = {
            kind: 'singleInstr',
            cmd: 'none',
            register: ''
        }

        let singlInstrList = ["inc", "dec"];

        for (const instr of singlInstrList) {
            if (instr === code.slice(i, i + instr.length)) {
                singlInstr.cmd = instr as "inc" | "dec";
            }
        }

        if (singlInstr.cmd === 'none') {
            return false;
        }

        if (!commandsList.includes(singlInstr.cmd)) {
            return false;
        }

        i += singlInstr.cmd.length;
        //console.log(code[i])

        while (code[i] != '\n') {
            singlInstr.register += code[i];

            i++;
            if (i >= code.length) {
                break;
            }
        }

        if (singlInstr.register == '') {
            return false;
        }
        else if (!registersNameList.includes(singlInstr.register)) {
            return false;
        }

        else {
            i += 1; // \n
            return { singlInstr, i }
        }

        return false;

    }


    static labelInstructionProcessing(code: string, commandsList: string[], i: number) {
        console.log('ys sddf')
        let labelInstr: LabelInstruction = {
            kind: 'lbinstr',
            cmd: 'none',
            label: '',
        }

        let labelInstrList = ["loop", "js", "jns", "jz", "jnz", "jmp"];

        for (const instr of labelInstrList) {
            if (instr === code.slice(i, i + instr.length)) {
                labelInstr.cmd = instr as "loop" | "js" | "jns" | "jz" | "jnz" | "jmp";
            }
        }

        if (labelInstr.cmd === 'none') {
            return false;
        }

        if (!commandsList.includes(labelInstr.cmd)) {
            return false;
        }

        i += labelInstr.cmd.length;
        console.log(code[i])

        while (code[i] != '\n') {
            labelInstr.label += code[i];

            i++;
            if (i >= code.length) {
                break;
            }
        }

        if (labelInstr.label == '') {
            return false;
        }
        else {
            i += 1; // \n
            return { labelInstr, i }
        }

        return false;
    }


    static labelProcessing(code: string, i: number) {

        let label: Label = {
            kind: 'lb',
            name: ''
        }

        while (code[i] != '\n') {
            label.name += code[i];

            i++;
            if (i >= code.length) break;
        }
        i++;

        if (RegExp.isEndsWithColon(label.name)) {
            label.name = RegExp.removeEndColon(label.name);

            if (label.name !== '') {
                return { label, i };
            }
        }

        return false;
    }

    static simpleInctructionProcessing(code: string,
        commandsList: string[],
        registersNameList: string[],
        i: number,
    ) {

        let simpleInstr: SimpleInstruction = {
            kind: 'smplinstr',
            command: "",
            register: "",
            secondRegister: {
                state: false,
                system: 'none',
                value: ""
            }
        };

        //==================================================
        const cmd = SIR.commands(i, code, commandsList);
        if (cmd === null) {
            console.log("ya zdes")
            return mess.messages_ru[1];
        }
        else {
            i += cmd.length;
            simpleInstr.command = cmd
        }
        //==================================================

        //==================================================
        const rg = SIR.registers(i, code, registersNameList);
        if (rg === null) {
            return mess.messages_ru[2];
        }
        else {
            i += rg.length;
            simpleInstr.register = rg;
        }
        //=================================================

        //=================================================
        if (code[i] === ",") {
            i++;
        }
        else {
            return mess.messages_ru[3];
        }

        //================================================

        // ===============================================

        const value = SIR.value(i, code, code.length);
        // console.log(value)
        if (value.length == 0) {
            return mess.messages_ru[4];
        }

        const checkedValue = SIR.checkValue(value, cmd, registersNameList);
        if (checkedValue.state === false) {
            return checkedValue.value;
        }
        console.log(checkedValue)

        simpleInstr.secondRegister = checkedValue;

        i += simpleInstr.secondRegister.value.length + 1; //('\n')

        if (checkedValue.system === "h") {
            i += 2; //('0' + 'h')
        }
        else if (checkedValue.system === "b") {
            i += 1; //('b')
        }

        // ==============================================
        return { simpleInstr, i };
    }
}