export interface LabelInstruction{
    kind: "lbinstr";
    cmd: "loop" | "js" | "jns" | "jz" | "jnz" | "none";
    label: string; 
}