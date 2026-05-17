import './Workpage.css'
import { Editor } from "src/widgets/Editor";
import workspace from './Workpage.html?raw'

import { Debugger } from 'src/widgets/Debugger';
import { ControlPanel } from 'src/widgets/ControlPanel';

export function Workpage(App: HTMLElement) {
    new ControlPanel(App);

    App.insertAdjacentHTML('beforeend', workspace);

    const editorspace = document.getElementById("editorspace") as HTMLElement; 
    const debuggerspace = document.getElementById("debuggerspace") as HTMLElement; 

   

    new Editor(editorspace);
    new Debugger(debuggerspace);


}