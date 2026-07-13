import './Restrictinfo.css'
import html from './Restrictinfo.html?raw'
import pic from 'shared/assets/images/attention.svg'

import { Restricts } from 'src/shared/types/Restricts/Restricts';

export class RestrictInfo {

    constructor(App: HTMLElement, restricts: Restricts | undefined) {
        this.init(App); 


        const sp1 = document.querySelector(".restrict-info-text-1") as HTMLElement;
        const sp2 = document.querySelector(".restrict-info-text-2") as HTMLElement;
        const sp3 = document.querySelector(".restrict-info-text-3") as HTMLElement;

        if (!restricts) {
            sp1.textContent = "Ограничения не установлены"
            sp2.textContent = "Вы не можете воспользоваться эмулятором"
            //sp3.textContent = "use right link"
        }
        else if(restricts.lab === undefined){
            sp1.textContent = `Разрешено использовать только команды: ${restricts.cmd} `;
            sp2.textContent = `и регистры: ${restricts.rl}`;  
        }
        else if (restricts.lab = 3){
            sp1.textContent = `Разрешено использовать только команды: ${restricts.cmd} `;
            sp2.textContent = `и регистры: ${restricts.rl}. А также можно обращаться к памяти: byte[], word[]`;  
        }


        //console.log(restricts)
    }

    private init(App: HTMLElement){
        App.insertAdjacentHTML('beforeend', html);
        const img = document.querySelector(".restrict-img") as HTMLImageElement; 
        img.src = pic; 
    }

}