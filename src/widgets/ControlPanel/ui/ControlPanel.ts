import './ControlPanel.css'
import controlpanelhtml from './ControlPanel.html?raw'

export class ControlPanel {
    private app: HTMLElement;  
    private controlpanelhtml = controlpanelhtml; 
    private runBtn : HTMLButtonElement | null = null ; 

    constructor (app: HTMLElement) {
        this.app = app; 
        this.init(); 
        
        this.runBtn?.addEventListener('click', () => {console.log("whi")}); 

    }

    private init() {
        this.app.insertAdjacentHTML('beforeend', this.controlpanelhtml); 
        this.runBtn = document.getElementById("run-all") as HTMLButtonElement; 


    }

}