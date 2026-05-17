import "./Header.css"
import  header  from "./Header.html?raw"

import img from 'shared/assets/images/assembly.svg'
import lightImg from 'shared/assets/images/light.svg'
import darkImg from 'shared/assets/images/dark.svg'

export class Header {
    private app: HTMLElement;

    private Btn: HTMLElement | null = null;
    private imgBtn: HTMLImageElement | null = null;

    private header = header; 

    public themeBtnState: "dark" | "light" = "light";

    constructor(app: HTMLElement) {
        this.app = app;
        this.init();
        

        this.Btn = document.getElementById("themeBtn");
        
        this.imgBtn = document.getElementById("imgBtn") as HTMLImageElement | null;
        if(this.imgBtn)
            this.imgBtn.src = lightImg;

        this.Btn?.addEventListener('click', this.changeBtnState);
    }

    private init = () => {
        this.app.insertAdjacentHTML('beforeend', this.header); 

        let logo = document.getElementById("logo") as HTMLImageElement; 
        logo.src = img; 
    }

    private changeBtnState = () => {
        this.themeBtnState = this.themeBtnState === "light" ? "dark" : "light";
        console.log(this.themeBtnState);

        this.changeBtnVisual();
    }

    private changeBtnVisual = () => {
        if (!this.imgBtn) return;

        if (this.themeBtnState === "light") {
            this.imgBtn.src = lightImg;
            console.log("hi")
        }
        else {
            this.imgBtn.src = darkImg;
        }
    }

}


