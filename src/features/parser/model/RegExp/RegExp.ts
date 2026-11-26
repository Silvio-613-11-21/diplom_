export
    class RegExp { //потом исправить

    //===============================
    static lineIsEmpty(line: string): boolean {
        const isEmpty = /^\s+$/.test(line);
        return isEmpty || line.length === 0;
    }

    static delComments(line: string) {
        return this.transformOutsideQuotes(line, (part) => part.replace(/;.*/g, ''));
    }

    //===============================
    static delSpace(code: string) {
        return this.transformOutsideQuotes(code, (part) => part.replace(/\s/g, ""));
    }

    static toLowerCase(code: string) {
        return this.transformOutsideQuotes(code, (part) => part.toLowerCase());
    }

    /**
     * Применение преобразования только к части строки вне кавычек.
     * Содержимое 'символьных строк' не должно меняться (важен регистр и пробелы).
     */
    static transformOutsideQuotes(line: string, transform: (part: string) => string): string {
        let res = '';
        let buffer = '';
        let inQuotes = false;

        for (let i = 0; i < line.length; i++) {
            const char = line[i];

            if (char === "'") {
                if (inQuotes) {
                    res += "'" + buffer + "'";
                    buffer = '';
                    inQuotes = false;
                }
                else {
                    res += transform(buffer);
                    buffer = '';
                    inQuotes = true;
                }

                continue;
            }

            buffer += char;
        }

        // незакрытая кавычка - обрабатываем остаток как обычный код
        if (inQuotes) {
            return transform(res + "'" + buffer);
        }

        return res + transform(buffer);
    }

    //=============================

    static extractSegmentName(input: string): string | false {
        const regex = /^(.+)segment\.data$/;
        const match = input.match(regex);
        if (match) {
            console.log(match[1])
            return match[1];

        }
        return false;
    }

     static org100hCheck(input: string) {
        const regex = /^org100h$/;
        const match = input.match(regex);
        if (match) {
            return true; 
        }
        return false;
    }



}
