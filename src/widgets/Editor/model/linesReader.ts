export function linesReader(text: string): string[] {
    return text.split(/\r?\n/);
}