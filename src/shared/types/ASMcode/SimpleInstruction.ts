 import { ResgisterValue } from "./RegisterValue";

export interface SimpleInstruction {
    kind: "smplinstr";
    command: string;
    register: string;
    secondRegister: ResgisterValue;
}