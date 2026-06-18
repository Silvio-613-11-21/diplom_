import { Restricts } from "src/shared/types/Restricts/Restricts";
import { getRestrists } from "src/shared/Restricts/getRestricts";

export function setRestricts(): Restricts | null | undefined{
    const search = new URLSearchParams(window.location.search);

    const labBumber = search.get("lab")
    const taskNumber = search.get("z")

    if(!labBumber) return null;
    if(!taskNumber) return null; 

    const lab = parseInt(labBumber); 
    const z = parseInt(taskNumber);  
    
    console.log(lab)
    console.log(z)

    return getRestrists(lab,z); 
}