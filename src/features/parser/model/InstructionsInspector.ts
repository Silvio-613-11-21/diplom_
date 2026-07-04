import { SimpleInstruction } from "shared/types/ASMcode/SimpleInstruction";
import { Label } from "shared/types/ASMcode/Label";
import { LabelInstruction } from "shared/types/ASMcode/LabelInstruction";
import { SingleInstruction } from "src/shared/types/ASMcode/SingleInstructio";

import { RegExp } from "./RegExp";
import { SimpleInstructionsReader as SIR } from "./SimpeInstructionsReader";
import mess from "../config/messages.json"

export class InsrtrInspector {

    static singleInstructionProcessing(line: string, commandsList: string[], registersNameList: string[]) {
        let singlInstr: SingleInstruction = {
            kind: 'singleInstr',
            cmd: 'none',
            register: ''
        }

        let singlInstrList = ["inc", "dec"];

        for (const instr of singlInstrList) {
            if (instr === line.slice(0, instr.length)) {
                singlInstr.cmd = instr as "inc" | "dec";
            }
        }

        if (singlInstr.cmd === 'none') {
            return false;
        }

        if (!commandsList.includes(singlInstr.cmd)) {
            return false;
        }

        for (let i = singlInstr.cmd.length; i < line.length; i++) {
            singlInstr.register += line[i];
        }

        if (singlInstr.register == '') {
            return false;
        }

        if (!registersNameList.includes(singlInstr.register)) {
            return false;
        }

        return singlInstr
    }


    static labelInstructionProcessing(line: string, commandsList: string[]) {
        console.log('ys sddf')
        let labelInstr: LabelInstruction = {
            kind: 'lbinstr',
            cmd: 'none',
            label: '',
        }

        let labelInstrList = ["loop", "js", "jns", "jz", "jnz", "jmp"];

        for (const instr of labelInstrList) {
            if (instr === line.slice(0, instr.length)) {
                labelInstr.cmd = instr as "loop" | "js" | "jns" | "jz" | "jnz" | "jmp";
            }
        }

        if (labelInstr.cmd === 'none') {
            return false;
        }

        if (!commandsList.includes(labelInstr.cmd)) {
            return false;
        }


        for (let i = labelInstr.cmd.length; i < line.length; i++) {
            labelInstr.label += line[i];
        }

        if (labelInstr.label == '') {
            return false;
        }
        return labelInstr;
    }


    static labelProcessing(line: string) {

        let label: Label = {
            kind: 'lb',
            name: ''
        }

        for (let i = 0; i < line.length; i++) {
            label.name += line[i];

        }

        if (RegExp.isEndsWithColon(label.name)) {
            label.name = RegExp.removeEndColon(label.name);

            if (label.name !== '') {
                return label;
            }
        }

        return false;
    }

    static simpleInctructionProcessing(line: string,
        commandsList: string[],
        registersNameList: string[],
        i = 0 
    ) {
        console.log("line:" + line)

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
        const cmd = SIR.commands(i, line, commandsList);
        if (cmd === null) {
            //console.log("ya zdes")
            return mess.messages_ru[1];
        }
        else {
            i += cmd.length;
            simpleInstr.command = cmd
        }
        //==================================================

        //==================================================
        const rg = SIR.registers(i, line, registersNameList);
        if (rg === null) {
            return mess.messages_ru[2];
        }
        else {
            i += rg.length;
            simpleInstr.register = rg;
        }
        //=================================================

        //=================================================
        if (line[i] === ",") {
            i++;
        }
        else {
            return mess.messages_ru[3];
        }

        //================================================

        // ===============================================

        const value = SIR.value(i, line, line.length);
        if (value.length == 0) {
            return mess.messages_ru[4];
        }

        const checkedValue = SIR.checkValue(value, cmd, registersNameList);
        if (checkedValue.state === false) {
            return checkedValue.value;
        }
        //console.log(checkedValue)

        simpleInstr.secondRegister = checkedValue;

        // ==============================================
        return simpleInstr; 
    }
}