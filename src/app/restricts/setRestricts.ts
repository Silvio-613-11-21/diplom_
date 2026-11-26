import { Restricts } from "src/shared/types/Restricts/Restricts";
import { getRestrists } from "src/shared/Restricts/getRestricts";

export function setRestricts(): Restricts | undefined{
    const search = new URLSearchParams(window.location.search);

    const labBumber = search.get("lab")
    const taskNumber = search.get("z")

    if(!labBumber) return undefined;
    if(!taskNumber) return undefined; 

    const lab = parseInt(labBumber); 
    const z = parseInt(taskNumber);  
    
    //console.log(lab)
    //console.log(z)

    return getRestrists(lab,z); 
}

export function getCode(){
    let textArea = document.getElementById("textArea") as HTMLDivElement; 

    return textArea.textContent; 
}