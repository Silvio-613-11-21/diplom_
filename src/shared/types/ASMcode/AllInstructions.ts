import { SimpleInstruction } from "./SimpleInstruction";
import { Label } from "./Label";
import { LabelInstruction } from "./LabelInstruction";
import { SingleInstruction } from "./SingleInstructio";
import { Int } from "./IntInstruction";

export type AllInstructions = SimpleInstruction | Label | LabelInstruction | SingleInstruction | Int; 