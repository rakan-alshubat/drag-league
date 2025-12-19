import mostFrequentName from './lipSyncAssassin';

export default function calculatePoints(playerData, gameData){
    if (!playerData || !gameData) return 0;
    
    let totalPoints = 0;
    const totalQueens = gameData?.lgQueenNames?.length || 0;
    const eliminatedPlayers = gameData?.lgEliminatedPlayers || [];
    const playerRankings = playerData?.plRankings || [];

    // 1. Calculate points for rankings (eliminated queens)
    for (const queenName of playerRankings) {
        const predictedPosition = playerRankings.indexOf(queenName) + 1;
        
        // Find if this queen is eliminated
        let isEliminated = false;
        let eliminationEntryIndex = -1;
        
        for (let i = 0; i < eliminatedPlayers.length; i++) {
            const entry = eliminatedPlayers[i];
            const queensInEntry = entry.split('|').map(s => s.trim());
            
            if (queensInEntry.includes(queenName)) {
                isEliminated = true;
                eliminationEntryIndex = i;
                break;
            }
        }
        
        if (isEliminated) {
            // Calculate actual ranking
            let queensEliminatedBefore = 0;
            for (let i = 0; i < eliminationEntryIndex; i++) {
                const entry = eliminatedPlayers[i];
                const queensInEntry = entry.split('|').map(s => s.trim()).filter(Boolean);
                queensEliminatedBefore += queensInEntry.length;
            }
            
            const actualRanking = totalQueens - queensEliminatedBefore;
            
            // Calculate points: totalQueens - |actualRanking - predictedPosition|
            const difference = Math.abs(actualRanking - predictedPosition);
            const pointsEarned = Math.max(0, totalQueens - difference);
            
            totalPoints += pointsEarned;
        }
    }

    // 2. Calculate points for weekly challenge winner predictions
    const challengeWinners = gameData?.lgChallengeWinners || [];
    const playerWinners = playerData?.plWinners || [];
    // helper to parse names from various formats (pipe, comma, ampersand, ' & ', ' and ')
    const parseNames = (str) => {
        if (!str || typeof str !== 'string') return [];
        // Replace Oxford-style ", &" with comma and ampersand handled by regex below
        // Split on pipe, comma, ampersand or the word 'and'
        return str
            .split(/\s*(?:\||,|&|and)\s*/i)
            .map(s => s.trim())
            .filter(Boolean)
            .map(s => s.toLowerCase());
    };

    for (let i = 0; i < challengeWinners.length && i < playerWinners.length; i++) {
        const actualWinner = challengeWinners[i];
        const prediction = playerWinners[i];

        if (actualWinner && actualWinner.trim() !== '' && prediction && prediction.trim() !== '') {
            const winnersList = parseNames(actualWinner);
            const predictions = parseNames(prediction);

            const isCorrect = predictions.some(pred => winnersList.includes(pred));
            if (isCorrect) {
                totalPoints += gameData.lgChallengePoints || 0;
            }
        }
    }

    // 3. Calculate points for bonus predictions
    const leagueBonuses = gameData?.lgBonusPoints || [];
    const playerBonuses = playerData?.plBonuses || [];
    
    for (const playerBonus of playerBonuses) {
        const playerParts = playerBonus.split('|').map(s => s.trim());
        const categoryName = playerParts[0] || '';
        const prediction = playerParts[1] || '';
        
        // Find matching bonus in league data
        const matchingBonus = leagueBonuses.find(lb => {
            const lbParts = lb.split('|').map(s => s.trim());
            return lbParts[0] === categoryName;
        });
        
        if (matchingBonus) {
            const bonusParts = matchingBonus.split('|').map(s => s.trim());
            const pointsWorth = parseInt(bonusParts[1]) || 0;
            const correctAnswer = bonusParts[3] || null; // Result is at index 3 (name|points|type|result)
            
            // Only award points if there's a result and prediction matches
            if (correctAnswer && prediction.toLowerCase() === correctAnswer.toLowerCase()) {
                totalPoints += pointsWorth;
            }
        }
    }

    // 4. Calculate points for lip sync assassin prediction
    const lipSyncWinners = gameData?.lgLipSyncWinners || [];
    const lipSyncAssassin = mostFrequentName(lipSyncWinners);
    const playerLipSyncPrediction = playerData?.plLipSyncAssassin;

    if (lipSyncAssassin && playerLipSyncPrediction) {
        const assassinNames = parseNames(lipSyncAssassin);
        const playerPreds = parseNames(playerLipSyncPrediction);
        // Player gets points if any of their predictions match any of the assassin names
        const match = playerPreds.some(p => assassinNames.includes(p));
        if (match) {
            totalPoints += gameData?.lgLipSyncPoints || 0;
        }
    }

    return totalPoints;
}