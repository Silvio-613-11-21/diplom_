export function getAsciiCharWithHexCode(hexCode: string): string | undefined {
    let upperHex = hexCode.toUpperCase(); 
    const code = parseInt(upperHex, 16);
    return String.fromCharCode(code);
}

export function getHexCodeWithAsciiChar(char: string): string | undefined {
    // Проверяем, что передан ровно 1 символ
    if (char.length !== 1) {
        return undefined;
    }

    // Получаем ASCII код символа
    const code = char.charCodeAt(0);

    // Проверяем, что символ находится в диапазоне ASCII (20-7F)
    // Исключаем управляющие символы (00-1F)
    if (code < 0x20 || code > 0x7F) {
        return undefined;
    }

    // Преобразуем в hex и добавляем ведущий ноль при необходимости
    return code.toString(16).toUpperCase().padStart(2, '0');
}

