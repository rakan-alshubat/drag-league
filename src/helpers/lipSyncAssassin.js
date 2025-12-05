export default function mostFrequentName(arr){
    if(!Array.isArray(arr) || arr.length === 0) return null

    const counts = new Map()
    let maxName = null
    let maxCount = 0

    for(const item of arr){
        const name = String(item)
        const c = (counts.get(name) || 0) + 1
        counts.set(name, c)
        if(c > maxCount){
            maxCount = c
            maxName = name
        }
    }

    return maxName
}