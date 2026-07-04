import './Workpage.css'
import workspace_html from './Workpage.html?raw'

import { Editor } from "src/widgets/Editor";
import { Debugger } from 'src/widgets/Debugger';
import { ControlPanel } from 'src/widgets/ControlPanel';
import { RestrictInfo } from 'src/widgets/RestrictInfo';

import { Restricts } from 'src/shared/types/Restricts/Restricts';

export function Workpage(App: HTMLElement, restricts: Restricts | undefined) {
    
    App.insertAdjacentHTML('beforeend', workspace_html);

    const restrictinfoSpace = document.querySelector(".restrictinfo-space") as HTMLElement; 
    const controlpanelSpace = document.querySelector(".controlpanel-space") as HTMLElement;
    const editorSpace = document.querySelector(".editor-space") as HTMLElement;
    const debuggerSpace = document.querySelector(".debugger-space") as HTMLElement;

    const editor = new Editor(editorSpace);
    const debugger_ = new Debugger(debuggerSpace);
    const controlpanel =  new ControlPanel(controlpanelSpace, editor, debugger_, restricts);
    const restrictinfo = new RestrictInfo(restrictinfoSpace,  restricts); 
}