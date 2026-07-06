export
    class RegExp { //потом исправить

    //===============================
    static lineIsEmpty(line: string): boolean {
        const isEmpty = /^\s+$/.test(line);
        return isEmpty || line.length === 0;
    }

    static delComments(line: string) {
        const regExp = /;.*/g
        return line.replace(regExp, '')
    }

    //===============================
    static delSpace(code: string) {
        return code.replace(/\s/g, "");
    }

    //====================================
    static isBinaryString(str: string) {
        return /^[01]+$/.test(str);
    }

    static isHexadecimalString(str: string) {
        return /^[0-9a-f]+$/.test(str);
    }

    static isDecimalString(str: string) {
        return /^[+-]?[0-9]+$/.test(str);
    }

    //=================================

    static isEndsWithColon(str: string) {
        return /:$/.test(str);
    }

    static removeEndColon(str: string) {
        return str.replace(/:$/, '');
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
