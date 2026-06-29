export interface SingleInstruction {
    kind: "singleInstr"; 
    cmd: "inc" | "dec" | "none"; 
    register: string; 
}