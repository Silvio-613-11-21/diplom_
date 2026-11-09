import { VariableValue } from "src/shared/types/ASMcode/VariableValue";

import mess from "../../config/messages.json"

const memoryRegExp = /^(byte|word)\[([^\]]*)\]$/;

class RegExp {
    //====================================
    static isBinaryString(str: string) {
        return /^[01]+$/.test(str);
    }

    static isHexadecimalString(str: string) {
        return /^[0-9a-f]+$/.test(str);
    }

    static isDecimalString(str: string) {
        return /^[+-]?[0-9]+$/.test(str);
    }

    //=================================
}

export class SimpleInstructionsReader {

    static registers(index: number, code: string, registersNameList: string[]): string | null {
        for (let i = 0; i < registersNameList.length; i++) {
            const regLen = registersNameList[i].length;
            if (registersNameList[i] === code.slice(index, index + regLen)) {
                return registersNameList[i];
            }
        }
        return null;
    }

    static byteWord(index: number, code: string): { cmd: string, idx: string } | null {

        code = code.slice(index);
        const match = code.match(/^(byte|word)\[([^\]]*)\]/);
        if (match) {
            return { cmd: match[1], idx: match[2] }
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

    //только чтение 
    static value(index: number, code: string, CodeLen: number): string {
        let val = "";
        while (code[index] != '\n') {
            val += code[index];
            index++;

            if (index >= CodeLen) break;
        }
        return val;
    }

    static checkValue(val: string, currentCmd: string, registersNameList: string[]): VariableValue {

        if (currentCmd === "shl" || currentCmd === "shr") {
            if (RegExp.isDecimalString(val)) {
                return {
                    state: true,
                    system: "d",
                    value: val
                }
            }
        }
        else {
            // регистры проверяем раньше чисел: ah / bh / ch / dh заканчиваются на h,
            // но это имена полурегистров, а не 16-ричные константы
            if (registersNameList.includes(val)) {
                return {
                    state: true,
                    system: "register",
                    value: val
                }
            }

            const lastChar = val.slice(-1);
            //console.log(lastChar)
            switch (lastChar) {
                case "b": {
                    const binVal = val.slice(0, -1);

                    if (binVal.length > 16) {
                        return {
                            state: false,
                            system: "none",
                            value: mess.messages_ru[5]
                        }
                    }

                    if (RegExp.isBinaryString(binVal)) {
                        return {
                            state: true,
                            system: "b",
                            value: binVal
                        }
                    }
                    else {
                        return {
                            state: false,
                            system: "none",
                            value: mess.messages_ru[6]
                        }
                    }
                    break;
                }
                case "h": {
                    let hexVal = val.slice(0, -1);

                    //console.log(hexVal)
                    // if (hexVal.slice(0, 1) !== "0") {
                    //     return {
                    //         state: false,
                    //         system: "none",
                    //         value: mess.messages_ru[6]
                    //     }
                    // }

                    if (hexVal.length > 4) {
                        return {
                            state: false,
                            system: "none",
                            value: mess.messages_ru[6]
                        }
                    }

                    //hexVal = hexVal.slice(1);
                    //console.log(hexVal)

                    //console.log(RegExp.isHexadecimalString(hexVal))
                    if (RegExp.isHexadecimalString(hexVal)) {

                        return {
                            state: true,
                            system: "h",
                            value: hexVal
                        }
                    }
                    else {
                        return {
                            state: false,
                            system: "none",
                            value: mess.messages_ru[6]
                        }
                    }
                    break;
                }
            }

            if (RegExp.isDecimalString(val)) {
                //console.log(val)
                let valNum = parseInt(val);


                // if (!valNum) {
                //     return {
                //         state: false,
                //         system: "none",
                //         value: mess.messages_ru[6]
                //     }
                // }

                if (valNum > 65535) {
                    return {
                        state: false,
                        system: "none",
                        value: mess.messages_ru[5]
                    }
                }

                return {
                    state: true,
                    system: "d",
                    value: val
                }

            }

            let match = val.match(/(byte|word)\[([^\]]*)\]/)
            if (match) {
                let sys: 'word' | 'byte'
                if (match[1] === 'byte') {
                    sys = 'byte';
                }
                else {
                    sys = 'word';
                }

                return {
                    state: true,
                    system: sys,
                    value: match[0],
                    index: match[2]
                }
            }

            let str = val.match(/^'(.*)'$/);
            if (str) {
                return {
                    state: true,
                    system: 'str', 
                    value: str[1]
                }
            }

        }

        return {
            state: false,
            system: "none",
            value: mess.messages_ru[6]
        }
    }

    /**
     * Проверка того, что строка является обращением к памяти: byte[...] или word[...]
     */
    static isMemoryOperand(val: string) {
        return memoryRegExp.test(val);
    }

    /**
     * Разбор обращения к памяти на адрес и размер ячейки
     * byte[5]  -> { system: 'byte', address: '5' }
     * word[si] -> { system: 'word', address: 'si' }
     */
    static parseMemoryOperand(val: string): { system: 'byte' | 'word', address: string } | null {
        const match = val.match(memoryRegExp);

        if (!match) {
            return null;
        }

        return {
            system: match[1] as 'byte' | 'word',
            address: match[2]
        }
    }
}
