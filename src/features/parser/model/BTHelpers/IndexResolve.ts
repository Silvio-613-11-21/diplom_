const signList = ['+', '-', '*', '/'] as const;
type Sign = typeof signList[number];

interface Operand {
    sign: Sign;
    value: string;
    system: 'd' | 'h' | 'b' | 'reg';
};

interface numOperand {
    sign: Sign;
    value: number
};

const regList = ['si', 'bx'] as const;
type Reg = typeof regList[number];

class RegExp {
    //====================================
    static isBinaryString(str: string) {
        return /^[01]+$/.test(str);
    }

    static isHexadecimalString(str: string) {
        return /^[0-9a-f]+$/.test(str);
    }

    static isDecimalString(str: string) {
        return /^[0-9]+$/.test(str);
    }

    //=================================
}

function negativeNumberTransform(val: number): string {
    const unsigned16Bit = (val & 0xFFFF) >>> 0;
    return unsigned16Bit.toString(16).padStart(4, '0')
}

export function idxResv(line: string) {
    const ops = operParser(line);
    if (!ops) { return false; }

    let res = ''

    let siCount = ops.filter(item => item.value === 'si').length;
    if (siCount > 1) {
        return false;
    }
    else if (siCount == 1){
        let siElem = ops.find(item => item.value === 'si'); 
        if (siElem?.sign == '+'){
            res += 'si'
        }
        else{
            return false;
        }
    }

    let bxCount = ops.filter(item => item.value === 'bx').length;
    if (bxCount > 1) {
        return false;
    }
    else if (bxCount == 1){
        let bxElem = ops.find(item => item.value === 'bx'); 
        if (bxElem?.sign == '+'){
            res += '+bx'
        }
        else{
            return false;
        }
    }

    let numOps: numOperand[] = [];

    for (let i = 0; i < ops.length; i++) {
        if (ops[i - 1] != undefined && ops[i - 1].system === 'reg') {
            if (ops[i].sign === '*' || ops[i].sign === '/' ) {
                return false;
            }            
        }

        if(ops[i].system === 'reg' && ops[i].sign !== '+'){
            return false; 
        }
    }

    for (let i = 0; i < ops.length; i++) {
        if (ops[i].system !== 'reg') {
            let op = ops[i];


            if (op.system === 'd') {
                if (!RegExp.isDecimalString(op.value)) {
                    return false;
                }

                let num = parseInt(op.value, 10);

                if (isNaN(num)) {
                    return false;
                }
                numOps.push({
                    sign: op.sign,
                    value: num
                })
            }
            else if (op.system === 'h') {
                if (!RegExp.isHexadecimalString(op.value)) {
                    return false;
                }

                let num = parseInt(op.value, 16);

                if (isNaN(num)) {
                    return false;
                }
                numOps.push({
                    sign: op.sign,
                    value: num
                })
            }
            else if (op.system === 'b') {
                if (!RegExp.isBinaryString(op.value)) {
                    return false;
                }

                let num = parseInt(op.value, 2);

                if (isNaN(num)) {
                    return false;
                }
                numOps.push({
                    sign: op.sign,
                    value: num
                })
            }

        }
    }

    let expression = numOps.map(op => ({ ...op }));

    let i = 1;
    while (i < expression.length) {
        if (expression[i].sign === '*' || expression[i].sign === '/') {
            let prev = expression[i - 1];
            let current = expression[i];

            let result: number;
            if (current.sign === '*') {
                result = prev.value * current.value;
            } else { // '/'
                if (current.value === 0) {
                    return false;
                }
                result = Math.floor(prev.value / current.value);

            }

            expression.splice(i - 1, 2, {
                sign: expression[i - 1]?.sign || '+' as Sign,
                value: result
            });

        } else {
            i++;
        }
    }

    let numRes = expression[0].value;
    for (let i = 1; i < expression.length; i++) {
        if (expression[i].sign === '+') {
            numRes += expression[i].value;
        } else if (expression[i].sign === '-') {
            numRes -= expression[i].value;
        }
    }

    if(numRes > 65535 || numRes < -65535){
        return false 
    }

    let numResStr = negativeNumberTransform(numRes); 
    res += numResStr; 

    return res; 
}

const systemCheck = (val: string): 'd' | 'h' | 'b' | 'reg' => {
    if (regList.includes(val as Reg)) {
        return 'reg';
    }
    else if (val[val.length - 1] === 'h') {
        return 'h';
    }
    else if (val[val.length - 1] === 'b') {
        return 'b';
    }
    else {
        return 'd';
    }
}

const cleanValue = (val: string, system: 'd' | 'h' | 'b' | 'reg'): string => {
    if (system === 'h' || system === 'b') {
        return val.slice(0, -1);
    }
    return val;
}

const operParser = (line: string): false | Operand[] => {
    if (line.length === 0) {
        return false;
    }

    let i = 0;
    const ops: Operand[] = [];

    if (!signList.includes(line[i] as Sign)) {
        ops.push({
            sign: '+',
            value: '',
            system: 'd'
        });
    }
    else if (line[i] === '+') {
        ops.push({
            sign: '+',
            value: '',
            system: 'd'
        });
        i++;
    }
    else if (line[i] === '-') {
        ops.push({
            sign: '-',
            value: '',
            system: 'd'
        });
        i++;
    }
    else {
        return false;
    }

    let firstVal = '';
    while (i < line.length && !signList.includes(line[i] as Sign)) {
        firstVal += line[i];
        i++;
    }

    if (firstVal === '') {
        return false;
    }

    const system = systemCheck(firstVal);
    ops[0].system = system;
    ops[0].value = cleanValue(firstVal, system);

    if (i >= line.length) {
        return ops;
    }


    while (i < line.length) {
        if (signList.includes(line[i] as Sign)) {
            const sign = line[i] as Sign;
            i++;

            let val = '';
            while (i < line.length && !signList.includes(line[i] as Sign)) {
                val += line[i];
                i++;
            }

            if (val === '') {
                return false;
            }


            const system = systemCheck(val);
            ops.push({
                sign: sign,
                value: cleanValue(val, system),
                system: system
            });
        }
        else {
            return false;
        }
    }

    return ops;
}