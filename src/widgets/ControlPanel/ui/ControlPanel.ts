import './ControlPanel.css'
import html from './ControlPanel.html?raw'

import { Editor } from 'src/widgets/Editor';
import { Debugger } from 'src/widgets/Debugger';

import { emulator } from 'src/features/emulator';

import { Restricts } from 'src/shared/types/Restricts';

export class ControlPanel {
    private app: HTMLElement;  
    private editor: Editor;  
    private debugger_: Debugger;  
    private runBtn : HTMLButtonElement | null = null ; 


    constructor (app: HTMLElement, editor: Editor, debugger_: Debugger, restricts: Restricts | null | undefined ) {
        this.app = app; 
        this.editor = editor; 
        this.debugger_ = debugger_; 

        this.init(); 
        
        if(restricts){
            this.runBtn?.addEventListener('click', () => {emulator(editor, debugger_, restricts)}); 
        }
    }

    private init() {
        this.app.insertAdjacentHTML("afterbegin", html); 
        this.runBtn = document.querySelector(".run-all") as HTMLButtonElement; 
    }

}