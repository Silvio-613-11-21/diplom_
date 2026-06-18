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
            let resVal = resNumVal.toString(16);


            if (resNumVal >= 0) {
                return {
                    state: true,
                    system: 'h',
                    value: resVal
                }
            }
            else {
                resVal = cv.negativeNumberTransform(resNumVal);

                return {
                    state: true,
                    system: 'h',
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
            let resVal = resNumVal.toString(16);

            if (resNumVal >= 0) {
                return {
                    state: true,
                    system: 'h',
                    value: resVal
                }
            }
            else {
                resVal = cv.negativeNumberTransform(resNumVal);

                return {
                    state: true,
                    system: 'h',
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
}