//import { SimpleInstruction } from "./SimpleInstruction";
//import { Label } from "./Label";
//import { LabelInstruction } from "./LabelInstruction";
//import { SingleInstruction } from "./SingleInstructio";
//import { Int } from "./IntInstruction";
//import { Ret } from "./Ret";
import { ResgisterValue } from "./RegisterValue";

export type AllInstructions = SimpleInstruction | Label | LabelInstruction | SingleInstruction | Int | Ret | Word | Byte;

// ================

type ByteWord<K> = {
    kind: K,
    indexVal: string;
}

type Word = ByteWord<'word'>
type Byte = ByteWord<'byte'>

// ==================

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


interface SimpleInstruction {
    kind: "smplinstr";
    command: string;
    register: string;
    secondRegister: ResgisterValue;
}

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