
import { AllInstructions } from "src/shared/types/ASMcode/AllInstructions";

import { RegExp } from "./model/RegExp/RegExp";
import { InsrtrInspector as InsIn } from "./model/OTHelpers/InstructionsInspector"
import { idxResv } from "./model/BTHelpers/IndexResolve";

import { Macros } from "src/shared/types/ASMcode/Macros";
import { MacrosReader as MR } from "./model/MTHelpers/MacrosReader";

import { expandRegisters, HALF_REGISTERS } from "src/shared/types/ASMcode/HalfRegisters";

import mess from "./config/messages.json"



let labels: string[];
let labelsFromInstr: string[];

let i = 0;

export function parser(lines: string[],
    labNum: number | undefined,
    commandsList: string[],
    registersNameList: string[],
    indexRegs?: string[],
    forbiddenRegs?: string[]
) {
    labels = [];
    labelsFromInstr = [];
    i = 0;

    // регистры, запрещенные условием задачи (например, BX и SI в задаче 3.0)
    // проверяем по исходному тексту - пробелы тогда еще на месте
    if (forbiddenRegs && forbiddenRegs.length > 0) {
        const sourceLines = lines
            .map(line => RegExp.delComments(line).toLowerCase());

        if (checkForbiddenRegisters(sourceLines, forbiddenRegs)) {
            return mess.err_ru.forbidden_reg_err;
        }
    }



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
        let idxCheckedLines = byteWordIndexTransformer(chLines, registersNameList, indexRegs); 
        if(typeof idxCheckedLines === 'string'){
            return idxCheckedLines;
        }
        else{
            chLines = idxCheckedLines; 
        }
        
    }


    // работа с памятью доступна только начиная с Л/Р 3
    if (labNum === undefined || labNum < 3) {
        for (const line of chLines) {
            if (/(byte|word)\[/.test(line)) {
                return mess.err_ru.memory_err;
            }
        }
    }

    // разрешенные регистры дополняем полурегистрами: ax -> ax, ah, al
    const registersWithHalves = expandRegisters(registersNameList);

    const res = objTransformer(chLines, commandsList, registersWithHalves, i);
    //console.log(res)

    //console.log(labels);
    //console.log(labelsFromInstr);
    if (!labelsCheck(labels, labelsFromInstr)) {
        return mess.messages_ru[8];
    }

    return res;
}

// ===========================================

/**
 * Проверка того, что в коде не используются запрещенные условием регистры.
 * Учитываются и полурегистры: если запрещен BX, то запрещены и BH, BL.
 * Возвращает имя первого найденного запрещенного регистра.
 */
function checkForbiddenRegisters(lines: string[], forbiddenRegs: string[]): string | undefined {
    for (const line of lines) {
        for (const reg of forbiddenRegs) {
            const halves = Object.entries(HALF_REGISTERS)
                .filter(([, half]) => half.full === reg)
                .map(([name]) => name);

            const allNames = [reg, ...halves];

            for (const name of allNames) {
                if (hasWord(line, name)) {
                    return name;
                }
            }
        }
    }

    return undefined;
}

function hasWord(line: string, word: string): boolean {
    let index = line.indexOf(word);

    while (index !== -1) {
        const before = index === 0 ? '' : line[index - 1];
        const after = index + word.length >= line.length ? '' : line[index + word.length];

        const beforeOk = before === '' || !/[a-z0-9]/.test(before);
        const afterOk = after === '' || !/[a-z0-9]/.test(after);

        if (beforeOk && afterOk) {
            return true;
        }

        index = line.indexOf(word, index + 1);
    }

    return false;
}

function byteWordIndexTransformer(lines: string[], registersNameList: string[], indexRegs?: string[]) {
    for (let i = 0; i < lines.length; i++) {
        // в одной строке может быть два обращения к памяти:
        // mov byte[bx], byte[si+1]
        const matches = [...lines[i].matchAll(/(byte|word)\[([^\]]*)\]/g)];

        for (const match of matches) {
            const type = match[1];
            const index = match[2];

            // в адресном выражении допустимы только регистры-указатели
            const memoryRegs = ['si', 'bx', 'di', 'bp'];
            const indexLower = index.toLowerCase();

            for (const reg of memoryRegs) {
                if (!indexLower.includes(reg)) {
                    continue;
                }

                if (!registersNameList.includes(reg)) {
                    return mess.err_ru.memory_reg_err;
                }

                if (indexRegs && !indexRegs.includes(reg)) {
                    return mess.err_ru.memory_reg_err;
                }
            }

            const newIndex = idxResv(index);

            if (!newIndex) {
                return mess.err_ru.index_err;
            }

            lines[i] = lines[i].replace(match[0], `${type}[${newIndex}]`);
        }
    }
    return lines;
}



//============================================

function macrosTransformer(lines: string[]) {
    let MacrosArr: Macros[] = [];
    let MacrosNames: string[] = [];

    // защита от бесконечной рекурсии макросов и слишком большого разворачивания
    const maxLines = 10000;
    let expansions = 0;
    const maxExpansions = 5000;

    let i = 0;
    while (i < lines.length) {
        if (lines.length > maxLines || expansions > maxExpansions) {
            return mess.err_ru.macroRecursion_err;
        }

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
                expansions++;

                // остаемся на той же позиции: вставленные строки тоже могут содержать
                // вызовы макросов (вложенные макросы, макрос внутри макроса)
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

        // if(labNum == 3){
        //     let byteWordCheck = 
        // }
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
            // регистр меняем только вне кавычек: 'Hello, World!' должен остаться как есть
            lines[idx] = RegExp.toLowerCase(lines[idx]);
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