export default function mostFrequentName(arr){
    if(!Array.isArray(arr) || arr.length === 0) return null

    const counts = new Map()

    // Count occurrences, handling pipe-separated names
    for(const item of arr){
        const names = String(item).split('|').map(s => s.trim()).filter(Boolean)
        for(const name of names){
            counts.set(name, (counts.get(name) || 0) + 1)
        }
    }

    if(counts.size === 0) return null

    // Find the maximum count
    let maxCount = 0
    for(const count of counts.values()){
        if(count > maxCount) maxCount = count
    }

    // Get all names with the maximum count
    const topNames = []
    for(const [name, count] of counts.entries()){
        if(count === maxCount){
            topNames.push(name)
        }
    }

    // Format with commas and ampersand
    if(topNames.length === 0) return null
    if(topNames.length === 1) return topNames[0]
    if(topNames.length === 2) return `${topNames[0]} & ${topNames[1]}`
    return `${topNames.slice(0, -1).join(', ')}, & ${topNames[topNames.length - 1]}`
}