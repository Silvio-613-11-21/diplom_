//import { SimpleInstruction } from "./SimpleInstruction";
//import { Label } from "./Label";
//import { LabelInstruction } from "./LabelInstruction";
//import { SingleInstruction } from "./SingleInstructio";
//import { Int } from "./IntInstruction";
//import { Ret } from "./Ret";
import { VariableValue } from "./VariableValue";

export type AllInstructions = SimpleInstruction | Label | LabelInstruction | SingleInstruction | Int | Ret | WordInstr | ByteInstr;

// ================
/**
 * Инструкция для работы со строками в памяти (Л/Р 3).
 * Зарезервировано под директивы описания данных.
 */
type ByteWordInstr<K> = {
    command: string;
    kind: K; 
    indexVal: string;
    asciiStr: string; 
}

type WordInstr = ByteWordInstr<'word'>
type ByteInstr = ByteWordInstr<'byte'>

// ==================
/** Обращение к ячейке памяти: byte[5], word[si+2] */
export interface MemoryOperand {
    /** Адрес ячейки (число или выражение, например "si+0005") */
    address: string;
    /** Размер ячейки: байт (1 символ) или слово (2 символа) */
    system: 'byte' | 'word';
}

export interface SimpleInstruction {
    kind: "smplinstr";
    command: string;
    register: string | 'byte' | 'word';
    index?: string; 
    secondRegister: VariableValue;
    /** Второй операнд - обращение к памяти byte[...] / word[...] */
    memory?: MemoryOperand;
    /** Первый операнд - обращение к памяти byte[...] / word[...] */
    targetMemory?: MemoryOperand;
}


// ============
interface Int {
    kind: 'int';
    value: string;
}

interface Label {
    kind: 'lb';
    name: string;
}
//========

type Ret =  {kind: 'ret';}


export type LabelCommand =
    "loop" | "js" | "jns" | "jz" | "jnz" | "jmp" | "call" |
    "je" | "jne" | "ja" | "jb" | "jl" | "jg" | "jle" | "jge" | "none";

interface LabelInstruction {
    kind: "lbinstr";
    cmd: LabelCommand;
    label: string;
}

interface SingleInstruction {
    kind: "singleInstr";
    cmd: "inc" | "dec" | "none";
    register: string;
    /** Адрес в том виде, в котором его написал пользователь: byte[si+2] -> si+2 */
    index?: string;
    /** Операнд - обращение к памяти byte[...] / word[...] */
    memory?: MemoryOperand;
}
