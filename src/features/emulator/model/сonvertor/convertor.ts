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

    static normalization(num: string, system: 2 | 10 | 16) {
        switch (system) {
            case 16: {
                while (num.length < 4) {
                    num = "0" + num;
                }
                return num;
            }
            case 10: {
                while (num.length < 5) {
                    num = "0" + num;
                }
                return num;
            }
            case 2: {
                while (num.length < 16) {
                    num = "0" + num;
                }
                return num;
            }
        }
    }


}