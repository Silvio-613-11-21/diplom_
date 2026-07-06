
import { AllInstructions } from "src/shared/types/ASMcode/AllInstructions";

import { RegExp } from "./model/RegExp";
import { InsrtrInspector as InsIn } from "./model/InstructionsInspector";

import mess from "./config/messages.json"
import { linesReader } from "src/widgets/Editor/model/linesReader";

let labels: string[];
let labelsFromInstr: string[];
let codeSegmentName: string;
let i = 0;

export function parser(lines: string[], commandsList: string[], registersNameList: string[]) {
    labels = [];
    labelsFromInstr = [];
    i = 0;

    let chLines = linesInit(lines);
    codeSegmentInit(chLines[i]);
    org100hInit(chLines[i]); 

    const res = objTransformer(chLines, commandsList, registersNameList, i);
    //console.log(res)

    //console.log(labels);
    //console.log(labelsFromInstr);
    if (!labelsCheck(labels, labelsFromInstr)) {
        return mess.messages_ru[8];
    }

    return res;
}


function codeSegmentInit(line: string) {
    let res = RegExp.extractSegmentName(line);
    if (res) {
        i++;
        codeSegmentName = res;
        return;
    }
}

function org100hInit(line:string){
    if ( RegExp.org100hCheck(line)) {
        i++;
        return;
    }
}


function linesInit(lines: string[], i: number = 0) {
    for (let idx = i; idx < lines.length; idx++) {
        lines[idx] = RegExp.delComments(lines[idx]);
        lines[idx] = lines[idx].toLowerCase();
    }

    for (let idx = i; idx < lines.length; idx++) {
        lines[idx] = RegExp.delSpace(lines[idx]);
    }
    // filter без индекса не может начать с i
    let chLines = lines.slice(i).filter(line => !RegExp.lineIsEmpty(line));
    return chLines;
}




function objTransformer(lines: string[], commandsList: string[], registersNameList: string[], i: number = 0) {
    //let error_ = "unknow err"

    let allInstr: AllInstructions[] = [];


    const linesCount = lines.length;
    if (linesCount === 0) {
        return mess.messages_ru[0];
    }

  
    for (; i < linesCount; i++) {

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

        //===========================

        let intCheck = InsIn.intCommandProcessing(lines[i]);
        if (intCheck) {
            allInstr.push({ kind: 'int', value: intCheck })
            continue;
        }

        //===========================

        return simpleInstrCheck;

    }

    // console.log(simpleInstr) 
    return allInstr;
}

function labelsCheck(labels: string[], labelsFromInstr: string[]): boolean {
    const labelSet = new Set(labels);
    return labelsFromInstr.every(label => labelSet.has(label));
}