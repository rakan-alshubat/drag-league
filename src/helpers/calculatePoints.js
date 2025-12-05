import mostFrequentName from './lipSyncAssassin';

export default function calculatePoints(playerData, gameData){
    const filteredRankings = gameData?.lgEliminatedPlayers?.filter(name => name && name.trim() !== '');
    var totalPoints = 0; 
    var totalRankedQueens = filteredRankings?.length || 0;
    const totalQueens = gameData?.lgQueenNames?.length || 0;

    for(const rankedQueen of filteredRankings || []){
        var QueenRanking = (totalQueens+1) - totalRankedQueens
        var position = playerData.plRankings.indexOf(rankedQueen.queen) + 1
        var rankingPoints = totalQueens - (Math.abs(QueenRanking - position))

        totalRankedQueens -= 1;

        totalPoints += rankingPoints
    }

    for (let i = 0; i < gameData?.lgChallengeWinners?.length; i++) {
        if(gameData.lgChallengeWinners[i].includes(playerData.plWinners[i]) && playerData.plWinners[i] !== ''){
            totalPoints += gameData.lgChallengePoints || 0;
        }
    }

    for (let i = 0; i < gameData?.lgBonusPoints?.length; i++) {
        for(let j = 0; j < playerData?.plBonuses?.length; j++){
            const bonusEntry = playerData.plBonuses[j].split('|').map(s => s.trim()).filter(Boolean);
            const bonusParts = gameData.lgBonusPoints[i].split('|').map(s => s.trim());
            
            // Format: name|points|type|result (result is at index 3)
            // Check if bonus has a result (index 3) and if player's prediction matches it
            if(bonusParts.length >= 4 && bonusParts[3] && bonusEntry[0] === bonusParts[3]){
                totalPoints += parseInt(bonusParts[1]) || 0;
            }
        }
    }

    const lipSyncAssassin = mostFrequentName(gameData?.lgLipSyncAssassins)

    if(lipSyncAssassin && playerData?.plLipSyncAssassin?.includes(lipSyncAssassin)){
        totalPoints += gameData?.lgLipSyncPoints || 0
    }

    return totalPoints
}