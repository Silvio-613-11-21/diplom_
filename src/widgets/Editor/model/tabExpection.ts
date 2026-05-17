export function tabExpection
    (e: KeyboardEvent,
        textArea: HTMLTextAreaElement | null,
        content: string) {
    if (e.key === "Tab") {
        e.preventDefault();

        if (!textArea) return;

        const start = textArea.selectionStart;
        const end = textArea.selectionEnd;

        const currentValue = textArea.value;
        const newValue = currentValue.substring(0, start) + '\t' + currentValue.substring(end);

        textArea.value = newValue;
        content = newValue;

        textArea.selectionStart = start + 1;
        textArea.selectionEnd = start + 1;

        textArea.dispatchEvent(new Event('input'));
    }
}