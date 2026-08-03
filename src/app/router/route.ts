import { Header } from "widgets/Header";
import { Workpage } from "src/pages/Workpage";

import { setRestricts } from "../restricts/setRestricts";
import { getCode } from "../restricts/setRestricts";

export default function Router(App: HTMLElement, pathname?: string) {

    new Header(App);
    Workpage(App, setRestricts());



}