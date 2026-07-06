import { ResgisterValue } from "src/shared/types/ASMcode/RegisterValue";
import mess from "../config/messages.json"
import { RegExp } from "./RegExp";

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

    static checkValue(val: string, currentCmd: string, registersNameList: string[]): ResgisterValue {

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

            if (registersNameList.includes(val)) {
                //console.log("asa")
                return {
                    state: true,
                    system: "register",
                    value: val
                }

            }
        }

        return {
            state: false,
            system: "none",
            value: mess.messages_ru[6]
        }
    }
}

