export class Commands {

    private constructor() { }
    
    public static shl(val: string, step: number): string {
        let len = val.length;
        len = len - step;

        val = val.slice(-len);
        for (let i = 0; i < step; i++) {
            val += "0";
        }

        return val
    }


}