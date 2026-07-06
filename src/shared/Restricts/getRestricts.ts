import { Restricts } from "../types/Restricts/Restricts"

export function getRestrists(lab: number, z: number): Restricts | undefined {
    const labs = [lab1, lab2]
    return labs[lab - 1](z)
}

function lab1(z: number): Restricts | undefined {
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
                cmd: ["mov", "cmp", "jmp", "js", "jns", "jz", "jnz", "add", "sub", "inc", "dec"
                ], rl: ["ax", "bx", "cx", "dx"]
            }
        }
        case 10: {
            return lab1(9);
        }
        case -1: {
            return {
                cmd: ["mov", "shl", "add", "sub", "and", "shr", "xor", "or", "loop", "inc", "cmp", "jmp", "js", "jns", "jz", "jnz", "dec"],
                rl: ["ax", "bx", "cx", "dx"]
            };
        }
        default: {
            return undefined;
        }
    }
}


function lab2(z: number): Restricts | undefined {
    switch (z) {
        case (0): {
            return { cmd: ["call", "ret"], rl: [] }
        }
        default: {
            return undefined; 
        }
    }
}

