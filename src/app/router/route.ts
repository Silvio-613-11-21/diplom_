import { Header } from "widgets/Header";


import { Workpage } from "src/pages/Workpage";

export default function Router(App: HTMLElement) {

    new Header(App);

    Workpage(App); 
    console.log("sdss")

    
    // const search = new URLSearchParams(window.location.search);

    // const labBumber = search.get("lab")
    // const taskNumber = search.get("z")

    // console.log(labBumber)
    // console.log(taskNumber)
}