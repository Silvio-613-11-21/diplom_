/**
 * Результат выполнения арифметической команды над значением регистра/памяти
 */
export type ResgisterValue = {
    state: boolean;
    system: 'none' | 'b' | 'h' | 'd' | 'register' | 'byte' | 'word';
    value: string;
}
