export
    class RegExp { //потом исправить

    //===============================
    static lineIsEmpty(line: string): boolean {
        const isEmpty = /^\s+$/.test(line);
        return isEmpty || line.length === 0;
    }

    static delComments(line: string) {
        const regExp = /;.*(?=\n)/g
        return line.replace(regExp, '')
    }

    //===============================
    static delSpace(code: string) {
        return code.replace(/[ \t]/g, "");
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
}
