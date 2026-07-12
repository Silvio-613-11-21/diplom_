import editor from './Editor.html?raw'
import './Editor.css'

import { tabExpection } from '../model/tabExpection';
import { linesReader } from '../model/linesReader';


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
            if (!this.textArea?.innerHTML) {
                return;
            }
            this.linesArr = linesReader(this.textArea.innerHTML);
            console.log(this.linesArr)

        })

        this.textArea.addEventListener("keydown", (e) => {
            if (e.key === 'Tab') {
                tabExpection(e, this.textArea as HTMLDivElement);
                return;
            }
        });


    }



    private init() {
        this.app.insertAdjacentHTML('beforeend', this.editor);
    }

}
















