//import { SimpleInstruction } from "./SimpleInstruction";
//import { Label } from "./Label";
//import { LabelInstruction } from "./LabelInstruction";
//import { SingleInstruction } from "./SingleInstructio";
//import { Int } from "./IntInstruction";
//import { Ret } from "./Ret";
import { VariableValue } from "./VariableValue";

export type AllInstructions = SimpleInstruction | Label | LabelInstruction | SingleInstruction | Int | Ret | WordInstr | ByteInstr;

// ================

type ByteWordInstr<K> = {
    command: string;
    kind: K; 
    indexVal: string;
    asciiStr: string; 
}

type WordInstr = ByteWordInstr<'word'>
type ByteInstr = ByteWordInstr<'byte'>

// ==================

interface SimpleInstruction {
    kind: "smplinstr";
    command: string;
    register: string | 'byte' | 'word';
    index?: string; 
    secondRegister: VariableValue;
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


interface LabelInstruction {
    kind: "lbinstr";
    cmd: "loop" | "js" | "jns" | "jz" | "jnz" | "jmp" | "call" | "none";
    label: string;
}

interface SingleInstruction {
    kind: "singleInstr";
    cmd: "inc" | "dec" | "none";
    register: string;
}