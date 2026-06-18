import { SimpleInstruction } from "./SimpleInstruction";
import { Label } from "./Label";
import { LabelInstruction } from "./LabelInstruction";

export type AllInstructions = SimpleInstruction | Label | LabelInstruction; 