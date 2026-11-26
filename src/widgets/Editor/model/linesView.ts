
export function linesView(lineList: string): string {

    lineList = lineList.replace(/>([\s\S]*?)<br>/g, '><div>$1</div>');
    
    return lineList;  
}