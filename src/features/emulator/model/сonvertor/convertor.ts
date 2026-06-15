export class Convertor {

    // public static decimalToBin(decNum: string) {
    //     return parseFloat(decNum).toString(2);
    // }

    // public static binToHex(binNum: string) {
    //     return parseInt(binNum, 2).toString(16).toUpperCase()
    // }

    // public static hexToBin(hexNum: string) {
    //     return parseInt(hexNum, 16).toString(2)
    // }

    static convert(num: string, from: number, to: number) {
        return parseInt(num, from).toString(to).toUpperCase()
    }

    
}