export interface LabelInstruction{
    kind: "lbinstr";
    cmd: "loop" | "js" | "jns" | "jz" | "jnz" | "jmp" | "none";
    label: string; 
}