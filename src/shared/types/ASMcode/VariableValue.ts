export type VariableValue = {
    state: boolean;
    system: "b" | "h" | "d" | "register" | `word` | `byte` | "none" | 'str' ;
    value: string;
    index?: string; 
}



