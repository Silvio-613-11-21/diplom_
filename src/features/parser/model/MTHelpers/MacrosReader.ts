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
        // объявление макроса вызовом не является
        if (line === undefined || line.slice(0, 6) === '%macro' || line.slice(0, 9) === '%endmacro') {
            return false;
        }

        for (let mn of macrosNames) {
            // имя макроса должно быть отдельным словом: printhello, а не printhello2
            if (line.slice(0, mn.length) !== mn) {
                continue;
            }

            const next = line[mn.length];

            if (next !== undefined && /[a-z_]/.test(next)) {
                continue;
            }

            let params = line.slice(mn.length).trim();
            // макрос без параметров вызывается просто по имени
            let paramsArr = params === '' ? [] : params.split(',');
            return { mn, paramsArr }
        }
        return false;
    }



}