
export class Convertor {

    static convert(num: string, from: number, to: number) {
        let transNum = parseInt(num, from).toString(to).toUpperCase(); 
        if([2,10,16].includes(to)){
            transNum = this.normalization(transNum, to as 2 |10 | 16);
        } 
        return transNum; 
    }

    static normalization(num: string, system: 2 | 10 | 16 ) {
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

    static negativeNumberTransform(val: number): string {
        const unsigned16Bit = (val & 0xFFFF) >>> 0;
        return unsigned16Bit.toString(16).padStart(4, '0')
    }

}