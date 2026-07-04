
import { AllInstructions } from "src/shared/types/ASMcode/AllInstructions";

import { RegExp } from "./model/RegExp";
import { InsrtrInspector as InsIn } from "./model/InstructionsInspector";

import mess from "./config/messages.json"
import { linesReader } from "src/widgets/Editor/model/linesReader";

let labels: string[];
let labelsFromInstr: string[];

export function parser(lines: string[], commandsList: string[], registersNameList: string[]) {
    labels = [];
    labelsFromInstr = [];

    

    lines.forEach((line, i) => { 
        lines[i] = RegExp.delComments(line)
        lines[i] = lines[i].toLowerCase();
    });

    lines.forEach((line, i) => {
        lines[i] = RegExp.delSpace(line); 
    })

    let chLines = lines.filter(line => !RegExp.lineIsEmpty(line))

    const res = objTransformer(chLines, commandsList, registersNameList);
    //console.log(res)

    //console.log(labels);
    //console.log(labelsFromInstr);
    if (!labelsCheck(labels, labelsFromInstr)) {
        return mess.messages_ru[8];
    }

    return res;
}


function objTransformer(lines: string[], commandsList: string[], registersNameList: string[]) {
    //let error_ = "unknow err"

    let allInstr: AllInstructions[] = [];


    const linesCount = lines.length;
    if (linesCount === 0) {
        return mess.messages_ru[0];
    }


    for (let i = 0; i < linesCount; i++) {

        //============================
        let simpleInstrCheck
            = InsIn.simpleInctructionProcessing(lines[i], commandsList, registersNameList);
        if (typeof simpleInstrCheck !== 'string') {
            allInstr.push(simpleInstrCheck)
            continue;
        }
        //===========================

        let labelCheck = InsIn.labelProcessing(lines[i]);
        if (labelCheck) {
            labels.push(labelCheck.name);
            const hasDuplicates = new Set(labels).size !== labels.length;
            if (hasDuplicates) {
                return simpleInstrCheck;
            }
            else {
                allInstr.push(labelCheck);
                continue;
            }
        }
        //==========================

        let labelInstrCheck = InsIn.labelInstructionProcessing(lines[i], commandsList);
        if (labelInstrCheck) {
            labelsFromInstr.push(labelInstrCheck.label);
            allInstr.push(labelInstrCheck);
            continue;
        }
        //============================

        let singleInstrCheck = InsIn.singleInstructionProcessing(lines[i], commandsList, registersNameList); 
        if (singleInstrCheck) {
            allInstr.push(singleInstrCheck);
            continue; 
        }

        return simpleInstrCheck; 

    }

    // console.log(simpleInstr) 
    return allInstr;
}

function labelsCheck(labels: string[], labelsFromInstr: string[]): boolean {
    const labelSet = new Set(labels);
    return labelsFromInstr.every(label => labelSet.has(label));
}