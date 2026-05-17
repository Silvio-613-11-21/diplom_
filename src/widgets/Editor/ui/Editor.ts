import editor from './Editor.html?raw'
import './Editor.css'

import { tabExpection } from '../model/tabExpection';

export class Editor {

    private app: HTMLElement;
    public content: string = "";

    private editor = editor;
    private textArea: HTMLTextAreaElement | null = null;

    constructor(app: HTMLElement) {
        this.app = app;
        this.init();
        this.textArea = document.getElementById("textArea") as HTMLTextAreaElement;

        
        this.textArea.addEventListener('input', () => {
            if (this.textArea?.value)
                this.content = this.textArea?.value
            //console.log(this.content)
        })//слишком просто чтоб переносить в model

        this.textArea.addEventListener("keydown", (e) => {tabExpection(e, this.textArea, this.content);})
    }

    private init() {
        this.app.insertAdjacentHTML('beforeend', this.editor);
    }

}