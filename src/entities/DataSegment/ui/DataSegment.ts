import './DataSegment.css'
import html_ from './DataSegment.html?raw';

import { getAsciiCharWithHexCode } from 'src/shared/AsciiTable/AsciiTable';

export class DataSegment {

    constructor(App: HTMLElement) {
        App.insertAdjacentHTML('afterbegin', html_);

    }

    public setValueByCoord(coord: string, val: string) {
        coord = coord.toUpperCase();
        let td = document.getElementById(coord);

        if (!td) {
            return;
        }

        td.textContent = val;
    }

    //public getValue

    public reset() {
        let table = document.querySelector('.data-segment-table') as HTMLTableElement;
        let tboby = table.querySelector('tbody');
        let tdList = tboby?.querySelectorAll('td');

        if (!tdList) {
            return;
        }

        let iter = 0;
        tdList.forEach(td => {
            if (iter != 0) {
                td.textContent = '00';
            }
            iter++ ;

            if(iter > 16){
                iter =  0; 
            }

        })
    }

}