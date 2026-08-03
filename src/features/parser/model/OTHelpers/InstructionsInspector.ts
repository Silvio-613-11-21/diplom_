// import { SimpleInstruction } from "shared/types/ASMcode/SimpleInstruction";
// import { Label } from "shared/types/ASMcode/Label";
// import { LabelInstruction } from "shared/types/ASMcode/LabelInstruction";
// import { SingleInstruction } from "src/shared/types/ASMcode/SingleInstructio";

import { AllInstructions } from "src/shared/types/ASMcode/AllInstructions";
import { Macros } from "src/shared/types/ASMcode/Macros";

// import { RegExp } from "./RegExp";
import { SimpleInstructionsReader as SIR } from "./SimpeInstructionsReader";
import mess from "../../config/messages.json"

class RegExp {
    static isEndsWithColon(str: string) {
        return /:$/.test(str);
    }

    static removeEndColon(str: string) {
        return str.replace(/:$/, '');
    }
}

export class InsrtrInspector {

    static retCommandProccessing(line: string) {
        if (line === "ret") {
            return true;
        }
        else {
            return false;
        }
    }

    static intCommandProcessing(line: string) {
        if (line.slice(0, 3) === "int") {
            let value = line.slice(3);
            return value;
        }
        else {
            return false;
        }
    }

    static singleInstructionProcessing(line: string, commandsList: string[], registersNameList: string[]) {

        let singlInstrList = ["inc", "dec"];
        let cmd;

        for (const instr of singlInstrList) {
            if (instr === line.slice(0, instr.length)) {
                cmd = instr as "inc" | "dec";
                break;
            }
        }

        if (!cmd) {
            return false;
        }

        if (!commandsList.includes(cmd)) {
            return false;
        }

        let register = '';
        for (let i = cmd.length; i < line.length; i++) {
            register += line[i];
        }

        if (register == '') {
            return false;
        }

        if (!registersNameList.includes(register)) {
            return false;
        }

        return {
            kind: 'singleInstr',
            cmd: cmd,
            register: register
        } as AllInstructions;

    }

    static labelInstructionProcessing(line: string, commandsList: string[]) {
        // console.log('ys sddf')

        let labelInstrList = ["loop", "js", "jns", "jz", "jnz", "jmp", "call"];

        let cmd;
        for (const instr of labelInstrList) {
            if (instr === line.slice(0, instr.length)) {
                cmd = instr as "loop" | "js" | "jns" | "jz" | "jnz" | "jmp";
            }
        }

        if (!cmd) {
            return false;
        }

        if (!commandsList.includes(cmd)) {
            return false;
        }

        let label = '';
        for (let i = cmd.length; i < line.length; i++) {
            label += line[i];
        }

        if (label == '') {
            return false;
        }

        return {
            kind: 'lbinstr',
            cmd: cmd,
            label: label,
        } as AllInstructions;
    }


    static labelProcessing(line: string) {

        // let label: AllInstructions = {
        //     kind: 'lb',
        //     name: ''
        // }

        let name = '';
        for (let i = 0; i < line.length; i++) {
            name += line[i];
        }

        if (RegExp.isEndsWithColon(name)) {
            name = RegExp.removeEndColon(name);

            if (name !== '') {
                return {
                    kind: 'lb',
                    name: name
                } as AllInstructions;
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

        //==================================================
        const cmd = SIR.commands(i, line, commandsList);
        if (cmd === null) {
            //console.log("ya zdes")
            return mess.messages_ru[1];
        }
        else {
            i += cmd.length;
        }
        //==================================================

        //==================================================
        const rg = SIR.registers(i, line, registersNameList);
        if (rg === null) {
            return mess.messages_ru[2];
        }
        else {
            i += rg.length;
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

        // ==============================================
        return {
            kind: 'smplinstr',
            command: cmd,
            register: rg,
            secondRegister: checkedValue
        } as AllInstructions;
    }
}