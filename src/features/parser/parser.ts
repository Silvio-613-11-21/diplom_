import { SimpleInstruction } from "src/shared/types/ASMcode/SimpleInstruction";
import { AllInstructions } from "src/shared/types/ASMcode/AllInstructions";

import { RegExp } from "./model/RegExp";
import { SimpleInstructionsReader as SIR } from "./model/SimpeInstructionsReader";
import mess from "./config/messages.json"



export function parser(code: string, commandsList: string[], registersNameList: string[]) {
    code = code.toLowerCase();
    code = RegExp.delComments(code);
    code = RegExp.delSpace(code);
    code = RegExp.delLineBreackInStart(code);
    code = RegExp.unitLineBreack(code);

    const res = objTransformer(code, commandsList, registersNameList);
    console.log(res)
    return res;
}

// командарегистр,значение\n 
function objTransformer(code: string, commandsList: string[], registersNameList: string[]) {
    let error_ = "unknow err"

    let allInstr: AllInstructions[] = [];

    let simpleInstr: SimpleInstruction[] = [];

    //const cmdLen = commandsList.length;
    const codeLen = code.length;
    if (codeLen === 0) {
        return mess.messages_ru[0];
    }

    let i = 0;
    let instrIndex = 0;
    while (i < codeLen) {

        //============================
        let simpleInstrCheck
            = simpleInctructionProcessing(code, commandsList, registersNameList, i);

        if (typeof simpleInstrCheck === 'string') {
            return simpleInstrCheck
        }
        else {
            allInstr[instrIndex] = simpleInstrCheck.simpleInstr
            simpleInstr[instrIndex] = simpleInstrCheck.simpleInstr
            i = simpleInstrCheck.i
        }

        instrIndex++;
    }

    // console.log(simpleInstr) 
    return allInstr;
}


function simpleInctructionProcessing(code: string,
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
    if (value.length == 0) {
        return mess.messages_ru[4];
    }

    const checkedValue = SIR.checkValue(value, cmd, registersNameList);
    if (checkedValue.state === false) {
        return checkedValue.value;
    }

    simpleInstr.secondRegister = checkedValue;

    i += simpleInstr.secondRegister.value.length + 1; //('\n')
    if (checkedValue.system === "h") {
        i += 2; //('0' + 'h')
    }
    else if (checkedValue.system === "b") {
        i += 1; //('b')
    }

    // ===============================================

    // instrIndex++;
    return { simpleInstr, i };
}