export function linesReader(lineList: NodeList) {
    if (lineList.length == 1) {
        if (lineList[0].textContent) {
            return [lineList[0].textContent]
        }
    }
    else {
        let linesArr: string[] = [];
        lineList.forEach(line => {
            if (line.textContent) {
                linesArr.push(line.textContent)
            }
        })
        return linesArr;
    }
    return ['']; 
}   