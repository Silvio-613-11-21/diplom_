import editor from './Editor.html?raw'
import './Editor.css'

import { tabExpection } from '../model/tabExpection';
import { linesReader } from '../model/linesReader';
import { backlights } from '../model/backlights';

export class Editor {

    private app: HTMLElement;
    public content: string = "";
    public linesArr: string [] = []; 

    private editor = editor;
    private textArea: HTMLElement | null = null;

    constructor(app: HTMLElement) {
        this.app = app;
        this.init();
        this.textArea = document.getElementById("textArea") as HTMLElement;

        
        this.textArea.addEventListener('input', () => {
            if (this.textArea?.childNodes){
                this.linesArr = linesReader(this.textArea.childNodes); 
                console.log(this.linesArr)

                //backlights(this.textArea.childNodes ); 
            }
        })

        //this.textArea.addEventListener("keydown", (e) => {tabExpection(e, this.textArea as HTMLDivElement);})
    }

    private init() {
        this.app.insertAdjacentHTML('beforeend', this.editor);
    }

}