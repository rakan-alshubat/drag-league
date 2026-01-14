export default function computeLeagueStats(leagueData, playersData = []){
    if (!leagueData) return null;

    const totalQueens = (leagueData.lgQueenNames || []).length;
    const eliminatedPlayers = leagueData.lgEliminatedPlayers || [];

    const actualRankMap = {};
    let queensEliminatedBefore = 0;
    for (let i = 0; i < eliminatedPlayers.length; i++){
        const entry = eliminatedPlayers[i] || '';
        const queensInEntry = entry.split('|').map(s => s.trim()).filter(Boolean);
        for (const q of queensInEntry){
            actualRankMap[q.toLowerCase()] = totalQueens - queensEliminatedBefore;
        }
        queensEliminatedBefore += queensInEntry.length;
    }

    const players = (playersData || []).map(player => {
        const plRankings = player.plRankings || [];
        let sumDiff = 0;
        let count = 0;
        let rankingPoints = 0;

        for (let i = 0; i < plRankings.length; i++){
            const queen = (plRankings[i] || '').trim();
            if (!queen) continue;
            const predicted = i + 1;
            const actual = actualRankMap[queen.toLowerCase()];
            if (typeof actual !== 'undefined'){
                const diff = Math.abs(actual - predicted);
                sumDiff += diff;
                count += 1;
                rankingPoints += Math.max(0, totalQueens - diff);
            }
        }

        const mae = count ? (sumDiff / count) : null;

        return {
            id: player.id || null,
            name: player.plName || player.plEmail || player.id || 'unknown',
            rankingPoints,
            rankingMAE: mae,
            rankingPredictionsCount: count,
        };
    });

    let bestRankingPlayer = null;
    let mostAccuratePlayer = null;

    for (const p of players){
        if (!bestRankingPlayer || p.rankingPoints > bestRankingPlayer.rankingPoints){
            bestRankingPlayer = p;
        }

        if (p.rankingMAE !== null){
            if (!mostAccuratePlayer) mostAccuratePlayer = p;
            else if (p.rankingMAE < mostAccuratePlayer.rankingMAE) mostAccuratePlayer = p;
            else if (p.rankingMAE === mostAccuratePlayer.rankingMAE && p.rankingPoints > mostAccuratePlayer.rankingPoints) mostAccuratePlayer = p;
        }
    }

    return {
        players,
        bestRankingPlayer,
        mostAccurateRankingPrediction: mostAccuratePlayer,
        meta: {
            totalQueens,
            eliminatedWeeks: eliminatedPlayers.length,
        }
    };
}
