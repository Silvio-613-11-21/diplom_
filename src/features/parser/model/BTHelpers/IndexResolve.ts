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
    return unsigned16Bit.toString(16).padStart(4, '0');
}

const systemCheck = (val: string): 'd' | 'h' | 'b' | 'reg' => {
    // Проверяем на регистр
    if (regList.includes(val as Reg)) {
        return 'reg';
    }
    // Проверяем на hexadecimal (заканчивается на h)
    else if (/^[0-9a-f]+h$/i.test(val)) {
        return 'h';
    }
    // Проверяем на binary (заканчивается на b)
    else if (/^[01]+b$/i.test(val)) {
        return 'b';
    }
    // Иначе decimal
    else {
        return 'd';
    }
}

const cleanValue = (val: string, system: 'd' | 'h' | 'b' | 'reg'): string => {
    if (system === 'h' || system === 'b') {
        // Удаляем последний символ (h или b)
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

    // Обработка первого знака
    let sign: Sign = '+';
    if (line[i] === '-') {
        sign = '-';
        i++;
    } else if (line[i] === '+') {
        i++;
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
    ops.push({
        sign: sign,
        value: cleanValue(firstVal, system),
        system: system
    });

    // Если строка закончилась, возвращаем результат
    if (i >= line.length) {
        return ops;
    }

    // Парсим остальные операнды
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
        } else {
            return false;
        }
    }

    return ops;
}

export function idxResv(line: string) {
    const ops = operParser(line);
    if (!ops) { 
        return false; 
    }

    let res = '';

    // Проверяем si - должен быть только со знаком + и не более одного раза
    let siCount = ops.filter(item => item.value === 'si').length;
    if (siCount > 1) {
        return false;
    }

    // Проверяем bx - должен быть только со знаком + и не более одного раза
    let bxCount = ops.filter(item => item.value === 'bx').length;
    if (bxCount > 1) {
        return false;
    }

    // Проверяем, что регистры только со знаком + и не участвуют в умножении/делении
    for (let i = 0; i < ops.length; i++) {
        const current = ops[i];
        const prev = ops[i - 1];
        const next = ops[i + 1];
        
        // Если текущий операнд - регистр
        if (current.system === 'reg') {
            // Проверяем знак у регистра (должен быть +)
            if (current.sign !== '+') {
                return false;
            }
            
            // Проверяем, что перед регистром не стоит * или /
            if (prev && (prev.sign === '*' || prev.sign === '/')) {
                return false;
            }
            
            // Проверяем, что после регистра не стоит * или /
            if (next && (next.sign === '*' || next.sign === '/')) {
                return false;
            }
        }
    }

    // Собираем только числовые операнды
    let numOps: numOperand[] = [];

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
                });
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
                });
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
                });
            }
        }
    }

    // Если нет числовых операндов, добавляем 0
    if (numOps.length === 0) {
        numOps.push({
            sign: '+',
            value: 0
        });
    }

    let expression = numOps.map(op => ({ ...op }));

    // Обработка умножения и деления (приоритетные операции)
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

            // Сохраняем знак результата от первого операнда
            const resultSign = prev.sign;
            expression.splice(i - 1, 2, {
                sign: resultSign,
                value: result
            });
            // Не увеличиваем i, так как элемент заменился
        } else {
            i++;
        }
    }

    // Вычисление сложения и вычитания
    let numRes = expression[0].value;
    for (let i = 1; i < expression.length; i++) {
        if (expression[i].sign === '+') {
            numRes += expression[i].value;
        } else if (expression[i].sign === '-') {
            numRes -= expression[i].value;
        }
    }

    // Проверка на переполнение 16-битного диапазона
    if (numRes > 65535 || numRes < -65535) {
        return false;
    }

    // Формируем результат
    let numResStr = negativeNumberTransform(numRes);
    
    // Добавляем регистры в правильном порядке (сначала si, потом bx)
    let siElem = ops.find(item => item.value === 'si');
    let bxElem = ops.find(item => item.value === 'bx');
    
    // Формируем строку с регистрами
    let regStr = '';
    if (siElem) {
        regStr += 'si';
    }
    if (bxElem) {
        if (regStr) {
            regStr += '+';
        }
        regStr += 'bx';
    }
    
    // Если есть регистры и число, объединяем с +
    if (regStr) {
        // Проверяем, что число не равно 0 (если 0, то не добавляем +0)
        if (numRes !== 0) {
            res = regStr + '+' + numResStr;
        } else {
            res = regStr;
        }
    } else {
        res = numResStr;
    }

    return res;
}
