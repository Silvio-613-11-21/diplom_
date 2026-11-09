import { Restricts } from "../types/Restricts/Restricts"

export function getRestrists(lab: number, z: number): Restricts | undefined {
    const labs = [lab1, lab2, lab3]

    if (!labs[lab - 1]) {
        return undefined;
    }

    return labs[lab - 1](z)
}

function lab1(z: number): Restricts | undefined {
    // int 21h - стандартное завершение программы, доступно в любой работе
    switch (z) {
        case 1: {
            return { cmd: ["mov", "shl", "int"], rl: ["ax", "bx"] }
        }

        case 2: {
            return { cmd: ["mov", "add", "sub", "int"], rl: ["cx", "dx"] }
        }
        case 3: {
            return { cmd: ["mov", "and", "int"], rl: ["ax"] }
        }
        case 4: {
            return { cmd: ["mov", "shl", "shr", "and", "int"], rl: ["ax"] }
        }
        case 5: {
            return { cmd: ["mov", "shr", "shl", "add", "sub", "int"], rl: ["ax", "bx", "cx", "dx"] }
        }
        case 6: {
            return lab1(5);
        }
        case 7: {
            return { cmd: ["mov", "shr", "shl", "add", "xor", "or", "and", "int"], rl: ["ax", "bx", "cx", "dx"] }
        }
        case 8: {
            return { cmd: ["mov", "loop", "shl", "inc", "int"], rl: ["ax", "bx", "dx", "cx"] }
        }
        case 9: {
            return {
                cmd: ["mov", "cmp", "jmp", "js", "jns", "jz", "jnz",
                    "je", "jne", "ja", "jb", "jl", "jg", "jle", "jge",
                    "add", "sub", "inc", "dec", "int"
                ], rl: ["ax", "bx", "cx", "dx"]
            }
        }
        case 10: {
            return lab1(9);
        }
        case -1: {
            return {
                cmd: ["mov", "shl", "add", "sub", "and", "shr", "xor", "or", "loop", "inc", "cmp", "jmp",
                    "js", "jns", "jz", "jnz", "je", "jne", "ja", "jb", "jl", "jg", "jle", "jge", "dec", "int"],
                rl: ["ax", "bx", "cx", "dx"]
            };
        }
        default: {
            return undefined;
        }
    }
}


function lab2(z: number): Restricts | undefined {
    switch (z) {
        case (0): {
            return {lab : 2, cmd: ["call", "ret", "%macro", "mov"], rl: ["ax", "bx", "cx", "dx"] }
        }
        case 1: {
            return { lab : 2, cmd: ["call", "ret", "%macro", "int", ...(lab1(1)?.cmd ?? [])], rl: [...lab1(1)?.rl ?? []] }
        }

        case 2: {
            return {lab : 2, cmd: ["call", "ret", "%macro", "int", ...(lab1(2)?.cmd ?? [])], rl: [...lab1(2)?.rl ?? []] }
        }
        case 3: {
            return {lab : 2, cmd: ["call", "ret", "%macro", "int", ...(lab1(3)?.cmd ?? [])], rl: [...lab1(3)?.rl ?? []] }
        }
        case 4: {
            return {lab : 2, cmd: ["call", "ret", "%macro", "int", ...(lab1(4)?.cmd ?? [])], rl: [...lab1(4)?.rl ?? []] }
        }
        case 5: {
            return {lab : 2, cmd: ["call", "ret", "%macro", "int", ...(lab1(5)?.cmd ?? [])], rl: [...lab1(5)?.rl ?? []] }
        }
        case 6: {
            return {lab : 2, cmd: ["call", "ret", "%macro", "int", ...(lab1(6)?.cmd ?? [])], rl: [...lab1(6)?.rl ?? []] }
        }
        case 7: {
            return {lab : 2, cmd: ["call", "ret", "%macro", "int", ...(lab1(7)?.cmd ?? [])], rl: [...lab1(7)?.rl ?? []] }
        }
        case 8: {
            return {lab : 2, cmd: ["call", "ret", "%macro", "int", ...(lab1(8)?.cmd ?? [])], rl: [...lab1(8)?.rl ?? []] }
        }
        case 9: {
            return {lab : 2, cmd: ["call", "ret", "%macro", "int", ...(lab1(9)?.cmd ?? [])], rl: [...lab1(9)?.rl ?? []] }
        }
        case 10: {
            return lab2(9);
        }
        case (-1): {
            return {
                lab : 2,
                cmd: ["call", "ret", "%macro", "int", ...(lab1(-1)?.cmd ?? [])], rl: ["ax", "bx", "cx", "dx"]
            }
        }
        default: {
            return undefined;
        }
    }
}


/**
 * Л/Р 3: Работа с памятью ЭВМ
 *
 * Все задачи оформляются как подпрограммы, вызываемые через универсальный макрос из Л/Р 2,
 * поэтому дополнительно к командам задачи всегда разрешены: call, ret, %macro.
 * BX/SI не запрещаются на уровне ограничений, а оговариваются в тексте задания -
 * так же, как это сделано в самих методических указаниях.
 */
function lab3(z: number): Restricts | undefined {

    // базовый набор команд для работы с памятью (mov + макрос + вызов подпрограммы)
    const base = {
        lab: 3,
        memory: true,
        cmd: ["mov", "add", "sub", "call", "ret", "%macro", "int"],
        rl: ["ax", "bx", "cx", "dx", "si", "di", "bp", "sp"]
    };

    let restr: Restricts = { ...base, cmd: [...base.cmd], rl: [...base.rl] };

    switch (z) {
        case 0: {
            restr.task = "Создать в памяти надпись «Hello, World!» с 5-й строки с 6-й позиции. "
                + "Записывать по 2 символа. Регистры BX и SI использовать нельзя!";
            restr.forbiddenRegs = ["bx", "si"];
            return restr;
        }
        case 1: {
            restr.task = "Модифицировать задачу 3.0 с использованием регистра SI для записи надписи в память.";
            return restr;
        }
        case 2: {
            restr.task = "Создать в памяти надпись со своими ФИО английскими буквами <=== Familia Imia Otchestvo ===> "
                + "с использованием SI. Дважды вызвать макрос - напечатать надпись в двух разных местах.";
            return restr;
        }
        case 3: {
            restr.task = "В DH присвоить 5, затем циклом с параметром заполнить символами '^' "
                + "область памяти с 0-й позиции по позицию из DH включительно.";
            restr.cmd = [...restr.cmd, "loop", "inc", "dec", "cmp", "jmp", "jl", "jle", "jg", "jge", "je", "jne", "ja", "jb"];
            restr.rl = ["ax", "bx", "cx", "dx", "si", "di"];
            return restr;
        }
        case 4: {
            restr.task = "В DH присвоить 5, в DL присвоить 10, затем циклом заполнить символами '^' "
                + "область памяти между позициями из DH и DL включительно.";
            restr.cmd = [...restr.cmd, "loop", "inc", "dec", "cmp", "jmp", "jl", "jle", "jg", "jge", "je", "jne", "ja", "jb"];
            restr.rl = ["ax", "bx", "cx", "dx", "si", "di"];
            return restr;
        }
        case 5: {
            restr.task = "Записать надпись с ФИО, обнулить регистры, в DH - позиция начала надписи. "
                + "Подсчитать длину надписи по закрывающую скобку и поместить в DL.";
            restr.cmd = [...restr.cmd, "loop", "inc", "dec", "cmp", "jmp", "jl", "jle", "jg", "jge", "je", "jne", "ja", "jb"];
            restr.rl = ["ax", "bx", "cx", "dx", "si", "di"];
            return restr;
        }
        case 6: {
            restr.task = "Записать надпись с ФИО, обнулить регистры, в DL - позиция начала надписи. "
                + "Циклом затереть символы надписи между скобками символами '^' (скобки тоже затереть). "
                + "Решение построить на вызовах задач 3.4 и 3.3!";
            restr.cmd = [...restr.cmd, "loop", "inc", "dec", "cmp", "jmp", "jl", "jle", "jg", "jge", "je", "jne", "ja", "jb"];
            restr.rl = ["ax", "bx", "cx", "dx", "si", "di"];
            return restr;
        }
        case 7: {
            restr.task = "Записать надпись с ФИО во 2-ю строку, обнулить регистры, в DL - позиция начала надписи. "
                + "Затереть символами '^' всю память ДО и ПОСЛЕ надписи (до 80-го адреса). "
                + "Решение построить на вызовах задач 3.4, 3.3 и 3.2!";
            restr.cmd = [...restr.cmd, "loop", "inc", "dec", "cmp", "jmp", "jl", "jle", "jg", "jge", "je", "jne", "ja", "jb"];
            restr.rl = ["ax", "bx", "cx", "dx", "si", "di"];
            return restr;
        }
        case 8: {
            restr.task = "Записать надпись с ФИО во 2-ю строку, обнулить регистры, "
                + "в AL и AH присвоить 2 позиции относительно начала надписи, в BL - позицию вне надписи. "
                + "Скопировать фрагмент памяти с AL по AH по адресу из BL. "
                + "MOV Память, Память запрещена - делать 2 шага через регистр!";
            restr.cmd = [...restr.cmd, "loop", "inc", "dec", "cmp", "jmp", "jl", "jle", "jg", "jge", "je", "jne", "ja", "jb"];
            restr.rl = ["ax", "bx", "cx", "dx", "si", "di"];
            return restr;
        }
        case 9: {
            restr.task = "Записать надпись с ФИО во 2-ю строку, обнулить регистры, "
                + "в DL - позиция начала надписи, в DH - английская буква (ASCII-код). "
                + "Подсчитать, сколько раз этот символ встречается в надписи. Результат - в тот же регистр. "
                + "Решение построить на вызове задачи 3.4!";
            restr.cmd = [...restr.cmd, "loop", "inc", "dec", "cmp", "and", "or", "xor", "shl", "shr", "jmp", "jl", "jle", "jg", "jge", "je", "jne", "ja", "jb"];
            restr.rl = ["ax", "bx", "cx", "dx", "si", "di"];
            return restr;
        }
        case -1: {
            restr.task = "Все задачи Л/Р 3: работа с памятью byte[] / word[], макросы и подпрограммы.";
            restr.cmd = [
                "mov", "add", "sub", "and", "or", "xor", "cmp", "shl", "shr",
                "inc", "dec", "loop", "jmp", "js", "jns", "jz", "jnz",
                "je", "jne", "ja", "jb", "jl", "jg", "jle", "jge",
                "call", "ret", "%macro", "int"
            ];
            restr.rl = ["ax", "bx", "cx", "dx", "si", "di", "bp", "sp"];
            return restr;
        }
        default:
            return undefined;
    }
}
