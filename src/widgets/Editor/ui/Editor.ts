import editor from './Editor.html?raw'
import './Editor.css'

import { tabExpection } from '../model/tabExpection';
import { linesReader } from '../model/linesReader';
import { backlights } from '../model/backlights';

export class Editor {

    private app: HTMLElement;
    public content: string = "";
    public linesArr: string[] = [];

    private editor = editor;
    private textArea: HTMLElement | null = null;

    constructor(app: HTMLElement) {
        this.app = app;
        this.init();
        this.textArea = document.getElementById("textArea") as HTMLElement;


        this.textArea.addEventListener('input', () => {
            if (this.textArea?.childNodes) {
                this.linesArr = linesReader(this.textArea.childNodes);
                //console.log(this.linesArr)

                //backlights(this.textArea.childNodes ); 
            }
        })

        this.textArea.addEventListener("keydown", (e) => {
            tabExpection(e, this.textArea as HTMLDivElement);
            handleCtrlEnter(e, this.textArea as HTMLElement); // Ctrl+Enter
        });

        // Вставка с заменой <br> на <div>
        this.textArea.addEventListener('paste', (e) => {
            if (this.textArea) {
                handlePaste(e, this.textArea);
            }
        });
    }

    private init() {
        this.app.insertAdjacentHTML('beforeend', this.editor);
    }

}


function handlePaste(e: ClipboardEvent, textArea: HTMLElement): void {
    e.preventDefault();

    const clipboardData = e.clipboardData || (window as any).clipboardData;
    if (!clipboardData) return;

    const pastedText = clipboardData.getData('text/plain');
    if (!pastedText) return;

    // Разбиваем по строкам и создаем div для каждой
    const lines: string[] = pastedText.split(/\r?\n/);
    const fragment = document.createDocumentFragment();

    lines.forEach((line) => {
        const div = document.createElement('div');
        div.textContent = line;
        fragment.appendChild(div);
    });

    // Вставляем в позицию курсора
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        range.deleteContents();
        range.insertNode(fragment);
    } else {
        textArea.appendChild(fragment);
    }

    textArea.dispatchEvent(new Event('input', { bubbles: true }));
}

/**
 * Обработка Ctrl+Enter - создает новый div
 */
function handleCtrlEnter(e: KeyboardEvent, textArea: HTMLElement): void {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();

        const div = document.createElement('div');
        div.innerHTML = '<br>';

        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            const node = range.startContainer;

            // Ищем родительский div
            let parent = node.parentNode;
            while (parent && parent !== textArea) {
                if (parent.nodeType === 1 && (parent as HTMLElement).tagName === 'DIV') {
                    break;
                }
                parent = parent.parentNode;
            }

            if (parent && parent !== textArea) {
                parent.parentNode?.insertBefore(div, parent.nextSibling);
                // Ставим курсор в новый div
                const newRange = document.createRange();
                newRange.setStart(div, 0);
                newRange.collapse(true);
                selection.removeAllRanges();
                selection.addRange(newRange);
            } else {
                textArea.appendChild(div);
            }
        } else {
            textArea.appendChild(div);
        }

        textArea.dispatchEvent(new Event('input', { bubbles: true }));
    }
}

// ===== 