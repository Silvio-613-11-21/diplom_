import { ResgisterValue } from "src/shared/types/ASMcode/RegisterValue";
import { Convertor as cv } from "../сonvertor/convertor";

export class Commands {

    static shl(val: string, step: number): string {
        let len = val.length;
        len = len - step;

        val = val.slice(-len);
        for (let i = 0; i < step; i++) {
            val += "0";
        }

        return val
    }

    static shr(val: string, step: number): string {
        let len = val.length;
        len = len - step;

        val = val.slice(0, len);
        for (let i = 0; i < step; i++) {
            val = "0" + val;
        }

        return val
    }

    static add(val_1: string, val_2: string, system: 2 | 10 | 16): ResgisterValue {
        let val_1Num = parseInt(val_1, system);
        let val_2Num = parseInt(val_2, system);

        if (!isNaN(val_1Num) && !isNaN(val_2Num)) {
            let resNumVal = val_1Num + val_2Num;
            let resVal = resNumVal.toString(system);


            if (resNumVal >= 0) {
                return {
                    state: true,
                    system: 'none',
                    value: resVal
                }
            }
            else {
                resVal = cv.negativeNumberTransform(resNumVal);

                return {
                    state: true,
                    system: 'none',
                    value: resVal
                }
            }

        }

        return {
            state: false,
            system: 'none',
            value: ''
        }
    }

    static sub(val_1: string, val_2: string, system: 2 | 10 | 16): ResgisterValue {
        let val_1Num = parseInt(val_1, system);
        let val_2Num = parseInt(val_2, system);

        if (!isNaN(val_1Num) && !isNaN(val_2Num)) {
            let resNumVal = val_1Num - val_2Num;
            let resVal = resNumVal.toString(system);

            if (resNumVal >= 0) {
                return {
                    state: true,
                    system: 'none',
                    value: resVal
                }
            }
            else {
                resVal = cv.negativeNumberTransform(resNumVal);

                return {
                    state: true,
                    system: 'none',
                    value: resVal
                }
            }

        }

        return {
            state: false,
            system: 'none',
            value: ''
        }
    }

    static and(val: string, mask: string) {
        let valArr = val.split('');
        let maskArr = mask.split('');

        for (let i = 0; i < valArr.length; i++) {
            if (maskArr[i] === '0') {
                valArr[i] = '0';
            }
        }

        val = valArr.join('');
        return val;
    }

    static or(val: string, mask: string) {
        let valArr = val.split('');
        let maskArr = mask.split('');

        for (let i = 0; i < valArr.length; i++) {
            if (maskArr[i] === '1') {
                valArr[i] = '1';
            }
        }

        val = valArr.join('');
        return val;
    }

    static xor(val: string, mask: string) {
        let valArr = val.split('');
        let maskArr = mask.split('');

        for (let i = 0; i < valArr.length; i++) {
            if (maskArr[i] === '1') {
                if (valArr[i] == '0') {
                    valArr[i] = '1'
                }
                else {
                    valArr[i] = '0'
                }
            }
        }

        val = valArr.join('');
        return val;
    }

    //=============================== Работа с памятью (Л/Р 3) ===============================

    /**
     * Перевод строки символов в последовательность 16-ричных байт.
     * 'He' -> '4865'
     */
    static charsToHex(chars: string): string {
        let res = '';

        for (let i = 0; i < chars.length; i++) {
            res += chars.charCodeAt(i).toString(16).toUpperCase().padStart(2, '0');
        }

        return res;
    }

    /**
     * Обратное преобразование: '4865' -> 'He'
     */
    static hexToChars(hex: string): string {
        let res = '';

        for (let i = 0; i + 1 < hex.length; i += 2) {
            res += String.fromCharCode(parseInt(hex.slice(i, i + 2), 16));
        }

        return res;
    }

    /**
     * Разбиение строки на слова по 2 символа (для команды mov word[...], 'Hi')
     * 'Hello, World!' -> 'He', 'll', 'o,', ' W', 'or', 'ld', '!'
     */
    static splitByWords(chars: string): string[] {
        let words: string[] = [];

        for (let i = 0; i < chars.length; i += 2) {
            words.push(chars.slice(i, i + 2));
        }

        return words;
    }
}
