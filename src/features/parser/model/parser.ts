import { SimpleInstruction } from "src/shared/types/SimpleInstruction";

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

    const cmdLen = commandsList.length;
    const codeLen = code.length;

    let i = 0;
    let instrIndex = 0;
    while (i < codeLen) {

        simpleInstr[instrIndex] = {
            command: "",
            register: "",
            value: ""
        };

        //==================================================
        const cmd = Reader.commands(i, code, commandsList);
        if (cmd === null) {
            return "неопознанная команда";
        }
        else {
            i += cmd.length;
            simpleInstr[instrIndex].command = cmd
        }
        //==================================================

        //==================================================
        const rg = Reader.registers(i, code, registersNameList);
        if (rg === null) {
            return "неопознанный регистр";
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
            return "отсутствует \",\"";
        }

        //================================================

        // ===============================================
        
        const value = Reader.value(i, code, codeLen);

        simpleInstr[instrIndex].value = value; 

        i += simpleInstr[instrIndex].value.length + 1; //('\n')
        
        // ===============================================

        instrIndex++;
    }

    // console.log(simpleInstr) 
    return simpleInstr;
}


class Reader {

    static registers(index: number, code: string, registersNameList: string[]): string | null {
        for (let i = 0; i < registersNameList.length; i++) {
            const regLen = registersNameList[i].length;
            if (registersNameList[i] === code.slice(index, index + regLen)) {
                return registersNameList[i];
            }
        }
        return null;
    }

    static commands(index: number, code: string, comamndsList: string[]): string | null {
        for (let i = 0; i < comamndsList.length; i++) {
            const cmdLen = comamndsList[i].length;
            if (comamndsList[i] === code.slice(index, index + cmdLen)) {
                return comamndsList[i];
            }
        }
        return null;
    }

    static value(index: number, code: string, codeLen: number): string {
        let val = "";
        while (code[index] != '\n') {
            val += code[index];
            index++;

            if (index === codeLen) break;
        }

        return val;
    }       

}

class RegExp { //потом исправить

    static delComments(code: string) {
        const regExp = /;.*(?=\n)/g
        return code.replace(regExp, '')
    }

    static delSpace(code: string) {
        return code.replace(/[ \t]/g, "");
    }

    static delLineBreackInStart(code: string) {
        return code.replace(/^\n+/, "");
    }

}

