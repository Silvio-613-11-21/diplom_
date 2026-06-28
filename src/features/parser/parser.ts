

import { AllInstructions } from "src/shared/types/ASMcode/AllInstructions";

import { RegExp } from "./model/RegExp";
import { InsrtrInspector as InsIn } from "./model/InstructionCheckers";

import mess from "./config/messages.json"

let labels: string[] ;
let labelsFromInstr: string[] ;

export function parser(code: string, commandsList: string[], registersNameList: string[]) {
    labels = [] ;
    labelsFromInstr = [] ;

    code = code.toLowerCase();
    code = RegExp.unitLineBreack(code);
    code = RegExp.delLineBreackInStart(code);
    code = RegExp.delSpace(code);
    code = RegExp.delComments(code);
    
    const res = objTransformer(code, commandsList, registersNameList);
    console.log(res)

    if(!labelsCheck(labels, labelsFromInstr)){
        return mess.messages_ru[8]; 
    }

    return res;
}

// командарегистр,значение\n 
function objTransformer(code: string, commandsList: string[], registersNameList: string[]) {
    //let error_ = "unknow err"

    let allInstr: AllInstructions[] = [];
    

    const codeLen = code.length;
    if (codeLen === 0) {
        return mess.messages_ru[0];
    }

    let i = 0;
    let instrIndex = 0;
    while (i < codeLen) {

        //============================
        let simpleInstrCheck
            =  InsIn.simpleInctructionProcessing(code, commandsList, registersNameList, i);

        if (typeof simpleInstrCheck === 'string') {

            let labelCheck = InsIn.labelProcessing(code, i);
            let labelInstrCheck = InsIn.labelInstructionCheck(code, commandsList, i);

            if (labelCheck) {
                labels.push(labelCheck.label.name);
                const hasDuplicates = new Set(labels).size !== labels.length;
                if (hasDuplicates) {
                    return simpleInstrCheck
                }
                allInstr[instrIndex] = labelCheck.label;
                i = labelCheck.i;
            }
            
            else if (labelInstrCheck) {
                labelsFromInstr.push(labelInstrCheck.labelInstr.label); 
                allInstr[instrIndex] = labelInstrCheck.labelInstr; 
                i = labelInstrCheck.i; 
            }
            else {
                return simpleInstrCheck;
            }

        }
        else {
            allInstr[instrIndex] = simpleInstrCheck.simpleInstr
            i = simpleInstrCheck.i
        }

        instrIndex++;
    }

    // console.log(simpleInstr) 
    return allInstr;
}

function labelsCheck(labels: string[], labelsFromInstr: string[]): boolean {
    const labelSet = new Set(labels);
    return labelsFromInstr.every(label => labelSet.has(label));
}