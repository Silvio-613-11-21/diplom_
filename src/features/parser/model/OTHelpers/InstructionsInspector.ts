// import { SimpleInstruction } from "shared/types/ASMcode/SimpleInstruction";
// import { Label } from "shared/types/ASMcode/Label";
// import { LabelInstruction } from "shared/types/ASMcode/LabelInstruction";
// import { SingleInstruction } from "src/shared/types/ASMcode/SingleInstructio";

import { AllInstructions } from "src/shared/types/ASMcode/AllInstructions";
import { LabelCommand } from "src/shared/types/ASMcode/AllInstructions";

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

        const operand = line.slice(cmd.length);

        if (operand === '') {
            return false;
        }

        // inc byte[5] / dec word[si+1]
        if (SIR.isMemoryOperand(operand)) {
            const memory = SIR.parseMemoryOperand(operand)!;

            return {
                kind: 'singleInstr',
                cmd: cmd,
                register: memory.system,
                index: operand.slice(memory.system.length + 1, -1),
                memory: memory
            } as AllInstructions;
        }

        if (!registersNameList.includes(operand)) {
            return false;
        }

        return {
            kind: 'singleInstr',
            cmd: cmd,
            register: operand
        } as AllInstructions;

    }

    static labelInstructionProcessing(line: string, commandsList: string[]) {
        // console.log('ys sddf')

        let labelInstrList = [
            "loop", "js", "jns", "jz", "jnz", "jmp", "call",
            "je", "jne", "ja", "jb", "jl", "jg", "jle", "jge"
        ];

        let cmd;
        for (const instr of labelInstrList) {
            if (instr === line.slice(0, instr.length)) {
                cmd = instr as LabelCommand;
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

    /**
     * Разбор простой команды (mov, add, ... , byte[5], 'H')
     */
    static simpleInctructionProcessing(line: string,
        commandsList: string[],
        registersNameList: string[],
        i = 0
    ) {
        //==================================================
        const cmd = SIR.commands(i, line, commandsList);
        if (cmd === null) {
            return mess.messages_ru[1];
        }
        else {
            i += cmd.length;
        }
        //==================================================

        //==================================================
        let register: string | undefined = undefined;
        let targetMemory: { system: 'byte' | 'word', address: string } | undefined = undefined;

        const reg = SIR.registers(i, line, registersNameList);
        const mem = SIR.byteWord(i, line);

        if (reg) {
            register = reg;
            i += reg.length;
        }
        else if (mem) {
            register = mem.cmd;
            targetMemory = { system: mem.cmd as 'byte' | 'word', address: mem.idx };
            i += mem.cmd.length + 2 + mem.idx.length;
        }
        else {
            return mess.messages_ru[2];
        }
        //==================================================

        //==================================================
        if (line[i] === ",") {
            i++;
        }
        else {
            return mess.messages_ru[3];
        }
        //==================================================

        //==================================================
        const value = SIR.value(i, line, line.length);
        if (value.length == 0) {
            return mess.messages_ru[4];
        }

        const checkedValue = SIR.checkValue(value, cmd, registersNameList);
        if (checkedValue.state === false) {
            return checkedValue.value;
        }
        //==================================================

        const instr = {
            kind: 'smplinstr',
            command: cmd,
            register: register,
            secondRegister: checkedValue,
            index: mem?.idx,
        } as AllInstructions;

        if (targetMemory) {
            (instr as any).targetMemory = targetMemory;
        }

        if (checkedValue.system === 'byte' || checkedValue.system === 'word') {
            const memory = SIR.parseMemoryOperand(checkedValue.value)!;
            (instr as any).memory = memory;
        }

        return instr;
    }
}
