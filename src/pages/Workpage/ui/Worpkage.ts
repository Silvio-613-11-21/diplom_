import './Workpage.css'
import { Editor } from "src/widgets/Editor";
import workspace_html from './Workpage.html?raw'

import { Debugger } from 'src/widgets/Debugger';
import { ControlPanel } from 'src/widgets/ControlPanel';

export function Workpage(App: HTMLElement) {
    

    App.insertAdjacentHTML('beforeend', workspace_html);

    const editorspace = document.getElementById("editorspace") as HTMLElement; 
    const debuggerspace = document.getElementById("debuggerspace") as HTMLElement; 

   

    const editor = new Editor(editorspace);
    const debugger_ = new Debugger(debuggerspace);

     
    new ControlPanel(App, editor, debugger_);
}