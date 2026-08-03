import { Macros } from "src/shared/types/ASMcode/Macros"

export class MacrosReader {

    static macrostart(line: string) {
        if (line.slice(0, 6) !== '%macro') {
            return false;
        }

        let i = 6;
        while (i < line.length && isNaN(parseInt(line[i]))) {
            i++;
        }

        let macroName = line.slice(6, i);
        let paramCount = parseInt(line.slice(i));

        if (isNaN(paramCount)) {
            return false;
        }

        return { macroName, paramCount };
    }


    static macroend(line: string) {
        if (line.slice(0, 9) !== '%endmacro') {
            return false;
        }
        return true;
    }

    static macroCall(line: string, macrosNames: string[]) {
        for (let mn of macrosNames) {
            if (line !== undefined)
                if (line.slice(0, mn.length) === mn) {
                    let params = line.slice(mn.length);
                    let paramsArr = params.split(',');
                    return { mn, paramsArr }
                }

        }
        return false;
    }



}