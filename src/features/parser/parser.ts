import { SimpleInstruction } from "src/shared/types/SimpleInstruction";
import { ResgisterValue } from "src/shared/types/RegisterValue";

import { RegExp } from "./model/RegExp";
import { Reader } from "./model/Reader";
import mess from "./config/messages.json"



export function parser(code: string, commandsList: string[], registersNameList: string[]) {
    code = code.toLowerCase();
    code = RegExp.delComments(code);
    code = RegExp.delSpace(code);
    code = RegExp.delLineBreackInStart(code);

    const res = objTransformer(code, commandsList, registersNameList);
    console.log(res)
    return res;
}

// командарегистр,значение\n 
function objTransformer(code: string, commandsList: string[], registersNameList: string[]) {
    let simpleInstr: SimpleInstruction[] = [];

    //const cmdLen = commandsList.length;
    const codeLen = code.length;
    if (codeLen === 0) {
        return mess.messages_ru[0];
    }

    let i = 0;
    let instrIndex = 0;
    while (i < codeLen) {

        simpleInstr[instrIndex] = {
            command: "",
            register: "",
            secondRegister: {
                state: false,
                system: 'none',
                value: ""
            }
        };

        //==================================================
        const cmd = Reader.commands(i, code, commandsList);
        if (cmd === null) {
            console.log("ya zdes")
            return mess.messages_ru[1];
        }
        else {
            i += cmd.length;
            simpleInstr[instrIndex].command = cmd
        }
        //==================================================

        //==================================================
        const rg = Reader.registers(i, code, registersNameList);
        if (rg === null) {
            return mess.messages_ru[2];
        }
        else {
            i += rg.length;
            simpleInstr[instrIndex].register = rg;
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

        const value = Reader.value(i, code, codeLen);
        if (value.length == 0) {
            return mess.messages_ru[4];
        }

        const checkedValue = Reader.checkValue(value, registersNameList);
        if (checkedValue.state === false) {
            return checkedValue.value;
        }

        simpleInstr[instrIndex].secondRegister = checkedValue;

        i += simpleInstr[instrIndex].secondRegister.value.length + 1; //('\n')
        if (checkedValue.system === "h") {
            i += 2; //('0' + 'h')
        }
        else if (checkedValue.system === "b") {
            i += 1; //('b')
        }

        // ===============================================

        instrIndex++;
    }

    // console.log(simpleInstr) 
    return simpleInstr;
}


