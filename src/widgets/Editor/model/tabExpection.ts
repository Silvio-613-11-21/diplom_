export function tabExpection(
    e: KeyboardEvent,
    editableDiv: HTMLDivElement | null
) {
    if (e.key === "Tab") {
        e.preventDefault();

        if (!editableDiv) return;

        // Получаем выделение
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) return;

        const range = selection.getRangeAt(0);
        
        // Если выделение не внутри нашего div — игнорируем
        if (!editableDiv.contains(range.commonAncestorContainer)) return;

        // Вставляем символ табуляции через document.execCommand (старый способ)
        // или через Insert Text (новый, но не везде поддерживается)
        try {
            // Современный способ (работает в Chrome, Firefox, Safari)
            document.execCommand('insertText', false, '\t');
        } catch {
            // Fallback: ручная вставка
            const tabNode = document.createTextNode('\t');
            range.deleteContents();
            range.insertNode(tabNode);
            
            // Перемещаем курсор после вставленного таба
            range.setStartAfter(tabNode);
            range.setEndAfter(tabNode);
            selection.removeAllRanges();
            selection.addRange(range);
        }

        // Триггерим событие input для реактивности (если нужно)
        editableDiv.dispatchEvent(new Event('input', { bubbles: true }));
    }
}