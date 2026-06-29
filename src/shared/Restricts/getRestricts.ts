import { Restricts } from "../types/Restricts/Restricts"

export function getRestrists(lab: number, z: number): Restricts | undefined | null {
    const labs = [lab1]
    return labs[lab - 1 ](z)
}

function lab1(z: number): Restricts | null {
    switch (z) {
        case 1: {
            return { cmd: ["mov", "shl"], rl: ["ax", "bx"] }
        }

        case 2: {
            return { cmd: ["add", "sub", ...(lab1(z - 1)?.cmd ?? [])], rl: ["cx", "dx"] }
        }
        case 3: {
            return { cmd: ["mov", "and"], rl: ["ax"] }
        }
        case 4: {
            return { cmd: ["shr", "and", ...(lab1(1)?.cmd ?? [])], rl: ["ax"] }
        }
        case 5: {
            return { cmd: ["shr", "add", "sub", ...(lab1(1)?.cmd ?? [])], rl: ["ax", "bx", "cx", "dx"] }
        }
        case 6: {
            return lab1(5);
        }
        case 7: {
            return { cmd: ["mov", "shr", "shl", "add", "xor", "or", "and"], rl: ["ax", "bx", "cx", "dx"] }
        }
        case 8: {
            return { cmd: ["mov", "loop", "shl", "inc"], rl: ["ax", "bx", "dx", "cx"] }
        }
        case 9: {
            return {
                cmd: ["mov", "cmp", "jmp", "js", "jns", "jz", "jnz",  "add", "sub", "inc", "dec"
                ], rl: ["ax", "bx", "cx", "dx"]
            }
        }
        case 10: {
            return lab1(9); 
        }
        default: {
            return null;
        }
    }
}
