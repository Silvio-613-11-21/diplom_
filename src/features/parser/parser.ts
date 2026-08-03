
import { AllInstructions } from "src/shared/types/ASMcode/AllInstructions";

import { RegExp } from "./model/RegExp/RegExp";
import { InsrtrInspector as InsIn } from "./model/OTHelpers/InstructionsInspector"


import { Macros } from "src/shared/types/ASMcode/Macros";
import { MacrosReader as MR } from "./model/MTHelpers/MacrosReader";

import mess from "./config/messages.json"



let labels: string[];
let labelsFromInstr: string[];

let codeSegmentName: string;
let i = 0;

export function parser(lines: string[], labNum: number | undefined, commandsList: string[], registersNameList: string[]) {
    labels = [];
    labelsFromInstr = [];
    i = 0;



    let chLines = Init.lines(lines);
    Init.codeSegment(chLines[i]); //исправить потом
    Init.org100h(chLines[i]);  //исправить потом

    //макрос преобразование 
    if (labNum != undefined && labNum >= 2) {
        const mcResLines = macrosTransformer(chLines);

        if (typeof mcResLines === 'string') {
            return mcResLines;
        }
        else {
            chLines = mcResLines;
        }
    }
    //

    //
    if (labNum != undefined && labNum >= 3) {

    }


    const res = objTransformer(chLines, commandsList, registersNameList, i);
    //console.log(res)

    //console.log(labels);
    //console.log(labelsFromInstr);
    if (!labelsCheck(labels, labelsFromInstr)) {
        return mess.messages_ru[8];
    }

    return res;
}

// ===========================================

function byteWordIndexTransformer(lines: string[]) {
    for (let i = 0; i < lines.length; i++) {
        // Регулярное выражение для поиска byte[] или word[] и захвата содержимого внутри скобок
        const match = lines[i].match(/(?:byte|word)\[([^\]]*)\]/);
        
        if (match) {
            // match[1] содержит содержимое внутри скобок
            console.log(`Строка ${i + 1}: ${match[1]}`);
        }
    }
}



//============================================

function macrosTransformer(lines: string[]) {
    let MacrosArr: Macros[] = [];
    let MacrosNames: string[] = [];

    let i = 0;
    while (i < lines.length) {
        let isMacro = MR.macrostart(lines[i]);
        if (isMacro) {
            let start = i;
            i++;

            let foundEnd = false;
            while (i < lines.length) {
                if (MR.macroend(lines[i])) {
                    foundEnd = true;
                    break;
                }
                i++;
            }

            if (!foundEnd) {
                return mess.err_ru.macroend_err;
            }

            let end = i;
            let macroLines = lines.slice(start + 1, end);
            if (!macroLines || macroLines.length === 0) {
                return mess.err_ru.macro_err;
            }

            let macro = new Macros();
            macro.macroName = isMacro.macroName;
            macro.paramsCount = isMacro.paramCount;
            macro.lines = macroLines;

            MacrosArr.push(macro);
            MacrosNames.push(macro.macroName);

            lines.splice(start, end - start + 1);

            i = start;
            continue;
        }

        if (i < lines.length) {
            let isMacroCall = MR.macroCall(lines[i], MacrosNames);
            if (isMacroCall) {
                let macro = MacrosArr.find(m => m.macroName === isMacroCall.mn);

                if (!macro) {
                    return mess.err_ru.macro_err;
                }

                if (macro.paramsCount !== isMacroCall.paramsArr.length) {
                    return mess.err_ru.macroParamCount_err;
                }


                let newLines: string[] = [];
                for (let lineIdx = 0; lineIdx < macro.lines.length; lineIdx++) {
                    let newLine = macro.lines[lineIdx];
                    for (let paramIdx = 0; paramIdx < macro.paramsCount; paramIdx++) {
                        newLine = newLine.replace(`%${paramIdx + 1}`, isMacroCall.paramsArr[paramIdx].trim());
                    }
                    newLines.push(newLine);
                }


                lines.splice(i, 1, ...newLines);

                i += newLines.length;
                continue;
            }
        }

        i++;
    }

    return lines;
}


// ======================================

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
        if (labelCheck && labelCheck.kind === 'lb') {
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
        if (labelInstrCheck && labelInstrCheck.kind === 'lbinstr') {
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

        let retCheck = InsIn.retCommandProccessing(lines[i]);
        if (retCheck) {
            allInstr.push({ kind: 'ret' });
            continue;
        }

        return simpleInstrCheck;

    }

    // console.log(simpleInstr) 
    return allInstr;
}

//====================================

function labelsCheck(labels: string[], labelsFromInstr: string[]): boolean {
    const labelSet = new Set(labels);
    return labelsFromInstr.every(label => labelSet.has(label));
}

// =====================================

class Init {
    static codeSegment(line: string) {
        let res = RegExp.extractSegmentName(line);
        if (res) {
            i++;
            codeSegmentName = res;
            return;
        }
    }

    static org100h(line: string) {
        if (RegExp.org100hCheck(line)) {
            i++;
            return;
        }
    }


    static lines(lines: string[], i: number = 0) {
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
}

//======================