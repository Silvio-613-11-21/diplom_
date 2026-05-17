interface SimpleInstruction {
    command: string;
    register: string;
    value: string;
}

export function parser(code: string) {
    code = code.toLowerCase();
    code = delComments(code);
    code = delSpace(code);
    code = delLineBreackInStart(code);

    return code;
}

// командарегистр,значение\n 
function objTransformer(code: string, comamndsList: string[], registersNameList: string[]) {
    let simpleInstr: SimpleInstruction[] = [];

    const cmdLen = comamndsList.length;
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
        const cmd = commandsReader(i, code, comamndsList);
        if (cmd === null) {
            return null;
        }
        else {
            i += cmd.length;
            simpleInstr[instrIndex].command = cmd
        }
        //==================================================

        //==================================================
        const rg = commandsReader(i, code, registersNameList);
        if (rg === null) {
            return null;
        }
        else {
            i += rg.length;
            simpleInstr[instrIndex].register = rg;
        }
        //=================================================

        //=================================================
        if(code[i] === ","){
            i++; 
        } 
        else {
            return null; 
        }

        //================================================

        // ===============================================
        let val = "";  
        while (code[i] != '\n'){
            val+=code[i]; 
            i++; 

            if(i === codeLen) break; 
        }

        simpleInstr[instrIndex].value = val;

        i++; //('\n')
        // ===============================================

        instrIndex++; 
    }

    return simpleInstr;
}

function registersReader(index: number, code: string, registersNameList: string[]): string | null {
    for (let i = 0; i < registersNameList.length; i++) {
        const regLen = registersNameList[i].length;
        if (registersNameList[i] === code.slice(index, index + regLen)) {
            return registersNameList[i];
        }
    }
    return null;
}


function commandsReader(index: number, code: string, comamndsList: string[]): string | null {
    for (let i = 0; i < comamndsList.length; i++) {
        const cmdLen = comamndsList[i].length;
        if (comamndsList[i] === code.slice(index, index + cmdLen)) {
            return comamndsList[i];
        }
    }
    return null;
}

function delComments(code: string) {
    const regExp = /;.*(?=\n)/g
    return code.replace(regExp, '')
}

function delSpace(code: string) {
    return code.replace(/[ \t]/g, "");
}

function delLineBreackInStart(code: string) {
    return code.replace(/^\n+/, "");
}
