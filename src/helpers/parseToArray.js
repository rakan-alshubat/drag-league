export default function parseToArray(stringToParse){
    let resultArray = [];
    if(typeof stringToParse === 'string' && stringToParse.length > 0){
        resultArray = stringToParse.split('|').map(item => item.trim());
    }
    return resultArray;
}