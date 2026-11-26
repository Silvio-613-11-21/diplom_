export function tabExpection(
    e: KeyboardEvent,
    textarea: HTMLTextAreaElement | null
) {
    if (e.key !== "Tab") return;

    e.preventDefault();
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const value = textarea.value;

    if (e.shiftKey) {
        let removeCount = 0;

        if (start !== end) {
    
            const before = value.slice(0, start);
            const selected = value.slice(start, end);
            const after = value.slice(end);

            const dedented = selected.replace(/^\t|^ {1,4}/gm, '');
            const removedFromSelection = selected.length - dedented.length;

            textarea.value = before + dedented + after;
            textarea.selectionStart = start;
            textarea.selectionEnd = end - removedFromSelection;
        } else {
    
            if (value[start - 1] === '\t') {
                removeCount = 1;
            } else {
                let i = start;
                while (i > 0 && value[i - 1] === ' ' && start - i < 4) i--;
                removeCount = start - i;
            }

            if (removeCount > 0) {
                textarea.value =
                    value.slice(0, start - removeCount) + value.slice(start);
                textarea.selectionStart = textarea.selectionEnd = start - removeCount;
            }
        }
    } else {

        textarea.value = value.slice(0, start) + '\t' + value.slice(end);
        textarea.selectionStart = textarea.selectionEnd = start + 1;
    }
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
}