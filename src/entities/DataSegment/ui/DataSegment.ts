import './DataSegment.css'
import html_ from './DataSegment.html?raw';

import { getAsciiCharWithHexCode } from 'src/shared/AsciiTable/AsciiTable';

export class DataSegment {

    /** Сколько всего байт в сегменте данных (16 строк по 16 байт) */
    static readonly SIZE = 256;

    constructor(App: HTMLElement) {
        App.insertAdjacentHTML('afterbegin', html_);

    }

    /**
     * Ячейка памяти по координате вида "AB"
     */
    private getCell(coord: string): HTMLElement | null {
        coord = coord.toUpperCase();
        return document.getElementById(coord) as HTMLElement | null;
    }

    /**
     * Приведение адреса к виду "AB" (2 шестнадцатеричные цифры)
     */
    private normalizeCoord(coord: string): string {
        coord = coord.toUpperCase().replace(/^0X/, '');

        if (coord.length === 1) {
            coord = '0' + coord;
        }

        return coord.slice(-2);
    }

    public setValueByCoord(coord: string, val: string) {
        const td = this.getCell(this.normalizeCoord(coord));

        if (!td) {
            return;
        }

        td.textContent = val.toUpperCase();
    }

    /**
     * Чтение одной ячейки памяти (одного байта)
     */
    public getCellValue(coord: string): string {
        const td = this.getCell(this.normalizeCoord(coord));

        if (!td || !td.textContent) {
            return '00';
        }

        return td.textContent.toUpperCase().padStart(2, '0');
    }

    /**
     * Чтение значения из памяти: байт - 1 ячейка, слово - 2 ячейки (little-endian)
     * Возвращает 16-ричное значение в порядке отображения (старший байт слева)
     */
    public read(address: number, size: 'byte' | 'word'): string {
        const low = this.getCellValue(address.toString(16));

        if (size === 'byte') {
            return low;
        }

        const high = this.getCellValue((address + 1).toString(16));
        return high + low;
    }

    /**
     * Запись значения в память: байт - 1 ячейка, слово - 2 ячейки (little-endian)
     */
    public write(address: number, size: 'byte' | 'word', value: string) {
        value = value.toUpperCase();

        if (size === 'byte') {
            this.setValueByCoord(address.toString(16), value.slice(-2).padStart(2, '0'));
            return;
        }

        const normalized = value.padStart(4, '0').slice(-4);

        this.setValueByCoord(address.toString(16), normalized.slice(2, 4));
        this.setValueByCoord((address + 1).toString(16), normalized.slice(0, 2));
    }

    /**
     * Символ, который сейчас находится в ячейке памяти
     */
    public getChar(address: number): string {
        return getAsciiCharWithHexCode(this.getCellValue(address.toString(16))) ?? '';
    }

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
