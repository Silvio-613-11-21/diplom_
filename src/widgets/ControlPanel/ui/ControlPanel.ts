import './ControlPanel.css'
import html from './ControlPanel.html?raw'

//=================================================
import { Editor } from 'src/widgets/Editor';
import { Debugger } from 'src/widgets/Debugger';
//=================================================


import { emulator } from 'src/features/emulator';
import { parser } from 'src/features/parser/parser';

//=================================================
import { Restricts } from 'src/shared/types/Restricts';
import { SimpleInstruction } from 'src/shared/types/SimpleInstruction';
//=================================================


export class ControlPanel { 
    private editor: Editor;  
    private debugger_: Debugger;  

    private assembleBtn: HTMLButtonElement | null = null ;
    private runAllBtn: HTMLButtonElement | null = null;

    private instructions: SimpleInstruction[] | string | null = null; 
    private restricts:Restricts | null | undefined = null;  

    constructor (App: HTMLElement, editor: Editor, debugger_: Debugger, restricts: Restricts | null | undefined ) {    
        this.editor = editor; 
        this.debugger_ = debugger_; 
        this.restricts = restricts; 

        this.init(App); 
        
        if(restricts){
            this.assembleBtn?.addEventListener('click', () => {this.parse(this.editor.content, restricts)} ) 
            this.runAllBtn?.addEventListener('click', () => {this.runEmulate()}); 
        }
    }

    private init(App: HTMLElement) {
        App.insertAdjacentHTML("afterbegin", html); 
        this.assembleBtn = document.querySelector('.assemble') as HTMLButtonElement;
        this.runAllBtn = document.querySelector(".run-all") as HTMLButtonElement; 
    }

    private parse(code: string, restricts: Restricts){
        let instructions = parser(code, restricts.cmd, restricts.rl); 
        if(typeof instructions == 'string'){
            this.debugger_.consolePrint(instructions);
            this.instructions = null; 
        }
        else{
            this.instructions = instructions; 
            this.debugger_.consolePrint("<br/> Успешная компиляция")
        }
    } 

    private runEmulate(){
        this.debugger_.resetAll(); 

        if(typeof this.instructions == 'string'){
            return; 
        }
        else if (this.instructions == null){
            this.debugger_.consolePrint("Нет скомпилированной программы"); 
        }
        else{
            this.debugger_.debbCall(); 
            emulator(this.instructions, this.editor, this.debugger_); 
        }
    }
}