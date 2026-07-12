export function linesReader(lineList: string) {
    
    lineList = lineList.replace(/<div[\s\S]*?>/g, "") 
    lineList = lineList.replace(/<\/div>/g, "<br>");
    

    return lineList.split('<br>'); 
}   










