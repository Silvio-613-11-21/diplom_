import './ControlPanel.css'
import controlpanelhtml from './ControlPanel.html?raw'

import { Editor } from 'src/widgets/Editor';
import { Debugger } from 'src/widgets/Debugger';

import { emulator } from 'src/features/emulator';

export class ControlPanel {
    private app: HTMLElement;  
    private editor: Editor;  
    private debugger_: Debugger;  
    private controlpanelhtml = controlpanelhtml; 
    private runBtn : HTMLButtonElement | null = null ; 


    constructor (app: HTMLElement, editor: Editor, debugger_: Debugger ) {
        this.app = app; 
        this.editor = editor; 
        this.debugger_ = debugger_; 

        this.init(); 
        
        this.runBtn?.addEventListener('click', () => {emulator(editor, debugger_)}); 

    }

    private init() {
        this.app.insertAdjacentHTML("afterbegin", this.controlpanelhtml); 
        this.runBtn = document.getElementById("run-all") as HTMLButtonElement; 


    }

}