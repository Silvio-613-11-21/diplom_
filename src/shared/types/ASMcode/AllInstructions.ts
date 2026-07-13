//import { SimpleInstruction } from "./SimpleInstruction";
//import { Label } from "./Label";
//import { LabelInstruction } from "./LabelInstruction";
//import { SingleInstruction } from "./SingleInstructio";
//import { Int } from "./IntInstruction";
//import { Ret } from "./Ret";
import { ResgisterValue } from "./RegisterValue";

export type AllInstructions = SimpleInstruction | Label | LabelInstruction | SingleInstruction | Int | Ret | Word | Byte;

interface Word {
    kind: 'word';  
    indexVal: string;
}

interface Byte{
    kind: 'byte';  
    indexVal: string;
}

interface Int {
    kind: 'int';
    value: string;
}

interface Label {
    kind: 'lb';
    name: string;
}

interface Ret {
    kind: 'ret';
}


interface SimpleInstruction {
    kind: "smplinstr";
    command: string;
    register: string;
    secondRegister: ResgisterValue;
}

interface LabelInstruction{
    kind: "lbinstr";
    cmd: "loop" | "js" | "jns" | "jz" | "jnz" | "jmp" | "call" |  "none";
    label: string; 
}

interface SingleInstruction {
    kind: "singleInstr"; 
    cmd: "inc" | "dec" | "none"; 
    register: string; 
}