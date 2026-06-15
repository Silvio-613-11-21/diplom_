 import { ResgisterValue } from "./RegisterValue";

export interface SimpleInstruction {
    command: string;
    register: string;
    secondRegister: ResgisterValue;
}