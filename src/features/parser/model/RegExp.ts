export
    class RegExp { //потом исправить

    static delComments(code: string) {
        const regExp = /;.*(?=\n)/g
        return code.replace(regExp, '')
    }

    static delSpace(code: string) {
        return code.replace(/[ \t]/g, "");
    }

    static delLineBreackInStart(code: string) {
        return code.replace(/^\n+/, "");
    }

    static unitLineBreack(code: string) {
        return code.replace(/\n+/g, '\n');
    }

    static removeEmptyLines(code: string) {
        return code.replace(/\n\s*\n/g, '\n');
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
