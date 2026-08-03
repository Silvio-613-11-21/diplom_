const signList = ['+', '-', '*', '/'] as const;
type Sign = typeof signList[number];

interface Operand {
    sign: Sign;
    value: string;
    system: 'd' | 'h' | 'b' | 'reg';
}

const regList = ['si', 'bx'] as const;
type Reg = typeof regList[number];

export function idxRes(line: string) {
    // TODO: реализовать
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