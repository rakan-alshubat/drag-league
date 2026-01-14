import calculatePoints from './calculatePoints';
import mostFrequentName from './lipSyncAssassin';

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

    // Track worst single prediction globally (player predicted queen position vs actual)
    let worstDiff = -Infinity;
    const worstPredictions = []; // { playerId, playerName, queen, predicted, actual, diff }
    for (const player of (playersData || [])) {
        const plRankings = Array.isArray(player.plRankings) ? player.plRankings : [];
        for (let i = 0; i < plRankings.length; i++) {
            const queenRaw = (plRankings[i] || '').trim();
            if (!queenRaw) continue;
            const lc = queenRaw.toLowerCase();
            const actual = actualRankMap[lc];
            if (typeof actual === 'undefined' || actual === null) continue;
            const predicted = i + 1;
            const diff = Math.abs(actual - predicted);
            const canonicalQueen = (Array.isArray(leagueData.lgQueenNames) ? (leagueData.lgQueenNames.find(q => String(q).toLowerCase() === lc) || queenRaw) : queenRaw);
            if (diff > worstDiff) {
                worstDiff = diff;
                worstPredictions.length = 0;
                worstPredictions.push({ playerId: player.id || null, playerName: player.plName || player.plEmail || player.id || 'unknown', queen: canonicalQueen, predicted, actual, diff });
            } else if (diff === worstDiff) {
                worstPredictions.push({ playerId: player.id || null, playerName: player.plName || player.plEmail || player.id || 'unknown', queen: canonicalQueen, predicted, actual, diff });
            }
        }
    }
    const worstPrediction = worstPredictions.length > 0 ? worstPredictions[0] : null;

    // Determine best ranking players (allow ties)
    let bestRankingPlayers = [];
    let maxPoints = -Infinity;
    for (const p of players) {
        if (typeof p.rankingPoints === 'number') {
            if (p.rankingPoints > maxPoints) {
                maxPoints = p.rankingPoints;
                bestRankingPlayers = [p];
            } else if (p.rankingPoints === maxPoints) {
                bestRankingPlayers.push(p);
            }
        }
    }

    // Keep single-value compatibility for existing callers (first in the array)
    const bestRankingPlayer = bestRankingPlayers.length > 0 ? bestRankingPlayers[0] : null;

    // Challenge winner accuracy and streaks
    const challengeWinnersRaw = Array.isArray(leagueData.lgChallengeWinners) ? leagueData.lgChallengeWinners : [];
    const totalWeeks = challengeWinnersRaw.length;

    // helper to parse names into lowercase array
    const parseNames = (str) => {
        if (!str || typeof str !== 'string') return [];
        return str.split(/\s*(?:\||,|&|and)\s*/i).map(s => s.trim()).filter(Boolean).map(s => s.toLowerCase());
    };

    // build actual winners per week (array of arrays)
    const actualWinnersPerWeek = challengeWinnersRaw.map(entry => parseNames(entry));

    // compute per-player challenge stats
    for (const p of players) {
        const preds = Array.isArray(playersData) ? (playersData.find(x => x.id === p.id) || {}) : {};
        const plWinners = (preds.plWinners && Array.isArray(preds.plWinners)) ? preds.plWinners : [];

        let correct = 0;
        let streak = 0;

        // count correct across all weeks; treat missing prediction as incorrect
        for (let i = 0; i < totalWeeks; i++) {
            const actual = actualWinnersPerWeek[i] || [];
            const predRaw = plWinners[i] || '';
            const predList = parseNames(predRaw);
            const matched = predList.some(pr => actual.includes(pr));
            if (matched) correct += 1;
        }

        // compute current consecutive streak from last week backwards
        for (let i = totalWeeks - 1; i >= 0; i--) {
            const actual = actualWinnersPerWeek[i] || [];
            const predRaw = plWinners[i] || '';
            const predList = parseNames(predRaw);
            const matched = predList.some(pr => actual.includes(pr));
            if (matched) streak += 1;
            else break;
        }

        p.challengeCorrectCount = correct;
        p.challengeAccuracy = totalWeeks > 0 ? (correct / totalWeeks) : null;
        p.challengeAccuracyPercent = totalWeeks > 0 ? Number(((correct / totalWeeks) * 100).toFixed(2)) : null;
        p.currentChallengeStreak = streak;
        // count missed weekly challenge picks (empty or missing prediction)
        let nonEmptyPreds = 0;
        for (let i = 0; i < totalWeeks; i++) {
            const predRaw = plWinners[i];
            if (predRaw && String(predRaw).trim() !== '') nonEmptyPreds += 1;
        }
        p.missedChallengeCount = totalWeeks > 0 ? (totalWeeks - nonEmptyPreds) : 0;
        // incorrect = non-empty predictions that did not match the actual winner
        const incorrect = Math.max(0, (nonEmptyPreds - correct));
        p.challengeIncorrectCount = incorrect;
        p.challengeIncorrectPercent = nonEmptyPreds > 0 ? Number(((incorrect / nonEmptyPreds) * 100).toFixed(2)) : null;

        // compute longest consecutive correct streak for this player (across the season)
        let longest = 0;
        let current = 0;
        for (let i = 0; i < totalWeeks; i++) {
            const actual = actualWinnersPerWeek[i] || [];
            const predRaw = plWinners[i] || '';
            const predList = parseNames(predRaw);
            const matched = predList.some(pr => actual.includes(pr));
            if (matched) {
                current += 1;
                if (current > longest) longest = current;
            } else {
                current = 0;
            }
        }
        p.longestChallengeStreak = longest;
    }

    // Determine best challenge predictor(s)
    let bestChallengePlayers = [];
    let bestPercent = -Infinity;
    for (const p of players) {
        if (typeof p.challengeAccuracyPercent === 'number') {
            if (p.challengeAccuracyPercent > bestPercent) {
                bestPercent = p.challengeAccuracyPercent;
                bestChallengePlayers = [p];
            } else if (p.challengeAccuracyPercent === bestPercent) {
                bestChallengePlayers.push(p);
            }
        }
    }

    const bestChallengePlayer = bestChallengePlayers.length > 0 ? bestChallengePlayers[0] : null;

    // Determine player(s) with the most wins (raw correct count, regardless of streak)
    let mostWinsPlayers = [];
    let maxWins = -Infinity;
    for (const p of players) {
        const wins = typeof p.challengeCorrectCount === 'number' ? p.challengeCorrectCount : 0;
        if (wins > maxWins) {
            maxWins = wins;
            mostWinsPlayers = [p];
        } else if (wins === maxWins) {
            mostWinsPlayers.push(p);
        }
    }
    const mostWinsPlayer = mostWinsPlayers.length > 0 ? mostWinsPlayers[0] : null;

    // collect streaks >= 2
    const streakHolders = players.filter(p => typeof p.currentChallengeStreak === 'number' && p.currentChallengeStreak >= 2)
        .map(p => ({ id: p.id, name: p.name, streak: p.currentChallengeStreak })) || [];

    // Determine player(s) with the longest challenge streak (may be historical, not necessarily active)
    let longestStreakPlayers = [];
    let maxLongest = -Infinity;
    for (const p of players) {
        const st = typeof p.longestChallengeStreak === 'number' ? p.longestChallengeStreak : 0;
        if (st > maxLongest) {
            maxLongest = st;
            longestStreakPlayers = [p];
        } else if (st === maxLongest) {
            longestStreakPlayers.push(p);
        }
    }
    const longestStreakPlayer = longestStreakPlayers.length > 0 ? longestStreakPlayers[0] : null;

    // Determine players who missed the most weekly challenge picks
    let mostMissedPlayers = [];
    let maxMissed = -Infinity;
    for (const p of players) {
        const missed = typeof p.missedChallengeCount === 'number' ? p.missedChallengeCount : 0;
        if (missed > maxMissed) {
            maxMissed = missed;
            mostMissedPlayers = [p];
        } else if (missed === maxMissed) {
            mostMissedPlayers.push(p);
        }
    }
    const mostMissedPlayer = mostMissedPlayers.length > 0 ? mostMissedPlayers[0] : null;

    // Determine player(s) who most often predicted the challenge winner incorrectly
    let mostIncorrectPlayers = [];
    let maxIncorrect = -Infinity;
    for (const p of players) {
        const incorrect = typeof p.challengeIncorrectCount === 'number' ? p.challengeIncorrectCount : 0;
        if (incorrect > maxIncorrect) {
            maxIncorrect = incorrect;
            mostIncorrectPlayers = [p];
        } else if (incorrect === maxIncorrect) {
            mostIncorrectPlayers.push(p);
        }
    }
    const mostIncorrectPlayer = mostIncorrectPlayers.length > 0 ? mostIncorrectPlayers[0] : null;

    // Compute best swap (point gain) by simulating swaps per player — allow ties
    let bestSwapPlayers = [];
    let bestSwapGain = -Infinity;
    try {
        for (const player of (playersData || [])) {
            try {
                const before = Number(calculatePoints(player, leagueData) || 0);
                const swapRaw = String(player.plSwap || '').trim();
                if (!swapRaw) continue;
                const parts = swapRaw.split('|').map(s => (s || '').trim()).filter(Boolean);
                if (parts.length < 2) continue;
                const nameA = parts[0];
                const nameB = parts[1];

                const currentRankings = Array.isArray(player.plRankings) ? [...player.plRankings] : [];
                const i = currentRankings.indexOf(nameA);
                const j = currentRankings.indexOf(nameB);
                if (i === -1 || j === -1) continue;

                const swapped = [...currentRankings];
                swapped[i] = nameB;
                swapped[j] = nameA;

                const playerAfter = { ...player, plRankings: swapped };
                const after = Number(calculatePoints(playerAfter, leagueData) || 0);
                const gain = after - before;
                if (gain > 0) {
                    if (gain > bestSwapGain) {
                        bestSwapGain = gain;
                        bestSwapPlayers = [{
                            playerId: player.id || null,
                            playerName: player.plName || player.plEmail || player.id || 'unknown',
                            swap: `${nameA} | ${nameB}`,
                            before,
                            after,
                            gain
                        }];
                    } else if (gain === bestSwapGain) {
                        bestSwapPlayers.push({
                            playerId: player.id || null,
                            playerName: player.plName || player.plEmail || player.id || 'unknown',
                            swap: `${nameA} | ${nameB}`,
                            before,
                            after,
                            gain
                        });
                    }
                }
            } catch (e) {
                // ignore player-level errors
            }
        }
    } catch (e) {
        // ignore
    }
    const bestSwap = bestSwapPlayers.length > 0 ? bestSwapPlayers[0] : null;

    // Determine most-picked challenge winner overall
    const counts = new Map();
    const displayMap = new Map();

    // Prefer canonical casing from league's queen list
    const canonicalMap = new Map();
    for (const q of (leagueData.lgQueenNames || [])) {
        if (!q) continue;
        canonicalMap.set(String(q).toLowerCase(), q);
    }

    // Split names but preserve original casing for display (we'll prefer canonical casing when available)
    const splitNamesPreserveCase = (str) => {
        if (!str || typeof str !== 'string') return [];
        return str.split(/\s*(?:\||,|&|and)\s*/i).map(s => s.trim()).filter(Boolean);
    };

    for (const entry of challengeWinnersRaw) {
        const namesPreserve = splitNamesPreserveCase(entry);
        for (const n of namesPreserve) {
            const lc = (n || '').toLowerCase();
            counts.set(lc, (counts.get(lc) || 0) + 1);
            if (!displayMap.has(lc)) displayMap.set(lc, canonicalMap.get(lc) || n);
        }
    }
    let maxCount = 0;
    const mostPicked = [];
    for (const [lc, c] of counts.entries()) {
        if (c > maxCount) {
            maxCount = c;
            mostPicked.length = 0;
            mostPicked.push(displayMap.get(lc) || canonicalMap.get(lc) || lc);
        } else if (c === maxCount) {
            mostPicked.push(displayMap.get(lc) || canonicalMap.get(lc) || lc);
        }
    }
    const mostPickedFormatted = (() => {
        if (!mostPicked || mostPicked.length === 0) return null;
        if (mostPicked.length === 1) return mostPicked[0];
        if (mostPicked.length === 2) return `${mostPicked[0]} & ${mostPicked[1]}`;
        return `${mostPicked.slice(0, -1).join(', ')}, & ${mostPicked[mostPicked.length - 1]}`;
    })();

    // --- Repeated picks: per-player, track if a player kept picking the same queen multiple weeks ---
    // Build a canonicalMap for queen display
    const canonicalMap2 = new Map();
    for (const q of (leagueData.lgQueenNames || [])) {
        if (!q) continue;
        canonicalMap2.set(String(q).toLowerCase(), q);
    }

    for (const p of players) {
        const orig = Array.isArray(playersData) ? (playersData.find(x => x.id === p.id) || {}) : {};
        const plWinners = (orig.plWinners && Array.isArray(orig.plWinners)) ? orig.plWinners : [];
        const pickCounts = new Map();
        for (let i = 0; i < plWinners.length; i++) {
            const raw = plWinners[i] || '';
            const parsed = parseNames(raw); // lowercase
            for (const n of parsed) {
                pickCounts.set(n, (pickCounts.get(n) || 0) + 1);
            }
        }
        // find top pick for this player
        let topCount = 0;
        let topName = null;
        for (const [lc, c] of pickCounts.entries()) {
            if (c > topCount) {
                topCount = c;
                topName = lc;
            }
        }
        p.mostRepeatedPickCount = topCount || 0;
        p.mostRepeatedPickQueen = topName ? (canonicalMap2.get(topName) || topName) : null;
    }

    // Determine global most-repetitive predictors
    let mostRepeatedPlayers = [];
    let maxRepeated = -Infinity;
    for (const p of players) {
        const c = typeof p.mostRepeatedPickCount === 'number' ? p.mostRepeatedPickCount : 0;
        if (c > maxRepeated) {
            maxRepeated = c;
            mostRepeatedPlayers = [p];
        } else if (c === maxRepeated) {
            mostRepeatedPlayers.push(p);
        }
    }
    const mostRepeatedPlayer = mostRepeatedPlayers.length > 0 ? mostRepeatedPlayers[0] : null;

    // Compare average predicted finish vs actual finish per queen to find surprises
    const queenPredictions = new Map(); // lcName -> { canonical, actualRanking, preds: [] }
    for (const q of (leagueData.lgQueenNames || [])) {
        if (!q) continue;
        const lc = String(q).toLowerCase();
        const canonical = canonicalMap.get(lc) || q;
        const actual = actualRankMap[lc];
        queenPredictions.set(lc, { canonical, actualRanking: typeof actual !== 'undefined' ? actual : null, preds: [] });
    }

    for (const pl of (playersData || [])) {
        const rankings = Array.isArray(pl.plRankings) ? pl.plRankings : [];
        for (let i = 0; i < rankings.length; i++) {
            const name = (rankings[i] || '').trim();
            if (!name) continue;
            const lc = name.toLowerCase();
            if (!queenPredictions.has(lc)) {
                // also tolerate non-canonical entries
                queenPredictions.set(lc, { canonical: name, actualRanking: actualRankMap[lc] || null, preds: [] });
            }
            const entry = queenPredictions.get(lc);
            entry.preds.push(i + 1);
        }
    }

    const earlierThanExpected = [];
    const laterThanExpected = [];
    for (const [lc, info] of queenPredictions.entries()) {
        if (info.actualRanking == null) continue; // skip queens without final rank
        const preds = info.preds || [];
        if (!preds || preds.length === 0) continue;
        const sum = preds.reduce((s, v) => s + (Number(v) || 0), 0);
        const avg = sum / preds.length;
        const delta = info.actualRanking - avg; // positive = eliminated earlier than avg predicted
        const deltaReverse = avg - info.actualRanking; // positive = made it further than predicted
        earlierThanExpected.push({ name: info.canonical, lc, actualRanking: info.actualRanking, avgPredicted: avg, delta: delta });
        laterThanExpected.push({ name: info.canonical, lc, actualRanking: info.actualRanking, avgPredicted: avg, delta: deltaReverse });
    }

    // find max early surprise (largest positive delta)
    let maxEarly = -Infinity;
    const earlyWinners = [];
    for (const e of earlierThanExpected) {
        if (e.delta > maxEarly) {
            maxEarly = e.delta;
            earlyWinners.length = 0;
            earlyWinners.push(e);
        } else if (e.delta === maxEarly) {
            earlyWinners.push(e);
        }
    }

    // find max late surprise (largest positive deltaReverse)
    let maxLate = -Infinity;
    const lateWinners = [];
    for (const e of laterThanExpected) {
        if (e.delta > maxLate) {
            maxLate = e.delta;
            lateWinners.length = 0;
            lateWinners.push(e);
        } else if (e.delta === maxLate) {
            lateWinners.push(e);
        }
    }

    const earliestSurprises = earlyWinners.filter(x => x.delta > 0);
    const latestSurprises = lateWinners.filter(x => x.delta > 0);

    const earliestSurprise = earliestSurprises.length > 0 ? earliestSurprises[0] : null;
    const latestSurprise = latestSurprises.length > 0 ? latestSurprises[0] : null;

    // Compute bonus points per player (based on lgBonusPoints results)
    const bonusDefs = Array.isArray(leagueData.lgBonusPoints) ? leagueData.lgBonusPoints : [];
    const lipSyncWinners = Array.isArray(leagueData.lgLipSyncWinners) ? leagueData.lgLipSyncWinners : [];
    const lipSyncAssassin = mostFrequentName(lipSyncWinners);
    const lipSyncPointsWorth = Number(leagueData?.lgLipSyncPoints || 0);
    for (const p of players) {
        const orig = Array.isArray(playersData) ? (playersData.find(x => x.id === p.id) || {}) : {};
        const plBonuses = Array.isArray(orig.plBonuses) ? orig.plBonuses : [];
        let bonusPoints = 0;
        for (const pb of plBonuses) {
            try {
                const parts = String(pb || '').split('|').map(s => s.trim());
                const cat = parts[0] || '';
                const pred = parts[1] || '';
                if (!cat || !pred) continue;
                const matching = bonusDefs.find(b => {
                    const bparts = String(b || '').split('|').map(s => s.trim());
                    return bparts[0] === cat;
                });
                if (!matching) continue;
                const mb = String(matching || '').split('|').map(s => s.trim());
                const pointsWorth = parseInt(mb[1]) || 0;
                const correctAnswer = mb[3] || null;
                if (correctAnswer && pred && String(pred).toLowerCase() === String(correctAnswer).toLowerCase()) {
                    bonusPoints += pointsWorth;
                }
            } catch (e) {
                // ignore
            }
        }
        // include lip-sync-assassin points as part of bonus points
        let lipPts = 0;
        try {
            const playerLipSyncPrediction = orig.plLipSyncAssassin;
            if (lipSyncAssassin && playerLipSyncPrediction) {
                const actuals = (String(lipSyncAssassin) || '').split(/\s*(?:\||,|&|and)\s*/i).map(s => s.trim()).filter(Boolean).map(s => s.toLowerCase());
                const preds = (String(playerLipSyncPrediction) || '').split(/\s*(?:\||,|&|and)\s*/i).map(s => s.trim()).filter(Boolean).map(s => s.toLowerCase());
                const matched = preds.some(pr => actuals.includes(pr));
                if (matched) lipPts = lipSyncPointsWorth;
            }
        } catch (e) {
            lipPts = 0;
        }

        p.lipSyncPoints = lipPts;
        p.bonusPoints = bonusPoints + lipPts;
    }

    // Determine best lip-sync points earners (allow ties)
    let bestLipSyncPlayers = [];
    let maxLipPts = -Infinity;
    for (const p of players) {
        const pts = typeof p.lipSyncPoints === 'number' ? p.lipSyncPoints : 0;
        if (pts > maxLipPts) {
            maxLipPts = pts;
            bestLipSyncPlayers = [p];
        } else if (pts === maxLipPts) {
            bestLipSyncPlayers.push(p);
        }
    }
    const bestLipSyncPlayer = bestLipSyncPlayers.length > 0 ? bestLipSyncPlayers[0] : null;

    // Determine top bonus earners
    let bestBonusPlayers = [];
    let maxBonus = -Infinity;
    for (const p of players) {
        const pts = typeof p.bonusPoints === 'number' ? p.bonusPoints : 0;
        if (pts > maxBonus) {
            maxBonus = pts;
            bestBonusPlayers = [p];
        } else if (pts === maxBonus) {
            bestBonusPlayers.push(p);
        }
    }
    const bestBonusPlayer = bestBonusPlayers.length > 0 ? bestBonusPlayers[0] : null;

    // Compute last-week vs current points and rank changes
    const clone = (o) => JSON.parse(JSON.stringify(o || {}));
    const leagueBefore = clone(leagueData);
    // remove last entries (simulate state before this week's submission)
    if (Array.isArray(leagueBefore.lgChallengeWinners) && leagueBefore.lgChallengeWinners.length > 0) leagueBefore.lgChallengeWinners = leagueBefore.lgChallengeWinners.slice(0, -1);
    if (Array.isArray(leagueBefore.lgLipSyncWinners) && leagueBefore.lgLipSyncWinners.length > 0) leagueBefore.lgLipSyncWinners = leagueBefore.lgLipSyncWinners.slice(0, -1);
    if (Array.isArray(leagueBefore.lgEliminatedPlayers) && leagueBefore.lgEliminatedPlayers.length > 0) leagueBefore.lgEliminatedPlayers = leagueBefore.lgEliminatedPlayers.slice(0, -1);
    if (Array.isArray(leagueBefore.lgBonusPoints) && leagueBefore.lgBonusPoints.length > 0) {
        // If bonus points entries include results (4 parts), the admin may have appended results; try to remove last if it looks like a result
        const last = String(leagueBefore.lgBonusPoints[leagueBefore.lgBonusPoints.length - 1] || '');
        const parts = last.split('|').map(s => s.trim());
        if (parts.length >= 4) leagueBefore.lgBonusPoints = leagueBefore.lgBonusPoints.slice(0, -1);
    }

    // compute points for each player before and after
    const pointsBeforeMap = new Map();
    const pointsAfterMap = new Map();
    for (const pl of playersData || []) {
        try {
            const before = Number(calculatePoints(pl, leagueBefore) || 0);
            const after = Number(calculatePoints(pl, leagueData) || 0);
            pointsBeforeMap.set(pl.id, before);
            pointsAfterMap.set(pl.id, after);
        } catch (e) {
            pointsBeforeMap.set(pl.id, 0);
            pointsAfterMap.set(pl.id, 0);
        }
    }

    // derive dense ranks (1,2,3...) based on points desc
    const makeRanks = (pointsMap) => {
        const arr = [];
        for (const [id, pts] of pointsMap.entries()) arr.push({ id, pts });
        arr.sort((a,b) => b.pts - a.pts);
        const ranks = new Map();
        let rank = 1;
        let prevPts = null;
        for (const item of arr) {
            if (prevPts !== null && item.pts !== prevPts) rank += 1;
            ranks.set(item.id, rank);
            prevPts = item.pts;
        }
        return ranks;
    };

    const ranksBefore = makeRanks(pointsBeforeMap);
    const ranksAfter = makeRanks(pointsAfterMap);

    const weeklyPointChanges = [];
    for (const pl of (playersData || [])) {
        const id = pl.id;
        const name = pl.plName || pl.plEmail || id || 'unknown';
        const before = pointsBeforeMap.get(id) || 0;
        const after = pointsAfterMap.get(id) || 0;
        const beforeRank = ranksBefore.get(id) || null;
        const afterRank = ranksAfter.get(id) || null;
        const rankChange = (beforeRank !== null && afterRank !== null) ? (beforeRank - afterRank) : null; // positive = moved up
        if (before !== after || (rankChange !== null && rankChange !== 0)) {
            weeklyPointChanges.push({ id, name, before, after, beforeRank, afterRank, rankChange });
        } else {
            // include everyone? still include with zeros
            weeklyPointChanges.push({ id, name, before, after, beforeRank, afterRank, rankChange });
        }
    }

    // Determine biggest rank gainers and losers for the most recent week
    let maxGain = -Infinity;
    let gainers = [];
    let maxLoss = Infinity;
    let losers = [];
    for (const w of weeklyPointChanges) {
        const rc = (typeof w.rankChange === 'number') ? w.rankChange : 0;
        if (rc > maxGain) {
            maxGain = rc;
            gainers = [w];
        } else if (rc === maxGain) {
            gainers.push(w);
        }

        if (rc < maxLoss) {
            maxLoss = rc;
            losers = [w];
        } else if (rc === maxLoss) {
            losers.push(w);
        }
    }

    // Filter to meaningful winners: gains > 0 and losses < 0
    const biggestRankGainers = gainers.filter(g => typeof g.rankChange === 'number' && g.rankChange > 0);
    const biggestRankLosers = losers.filter(l => typeof l.rankChange === 'number' && l.rankChange < 0);
    const biggestRankGainer = biggestRankGainers.length > 0 ? biggestRankGainers[0] : null;
    const biggestRankLoser = biggestRankLosers.length > 0 ? biggestRankLosers[0] : null;

    return {
        players,
        // arrays for ties
        bestRankingPlayers,
        bestChallengePlayers,
        streakHolders,
        mostMissedPlayers,
        mostMissedPlayer,
        bestBonusPlayers,
        // best swap (may be multiple with same gain)
        bestSwapPlayers,
        // single convenience properties (first entry)
        // most wins (raw count)
        mostWinsPlayers,
        mostWinsPlayer,
        mostWinsCount: (typeof maxWins === 'number' && maxWins >= 0) ? maxWins : 0,
        bestRankingPlayer,
        bestChallengePlayer,
        // best swap simulation (most positive gain)
        bestSwap,
        // most-picked weekly challenge winner (formatted)
        mostPicked: mostPicked,
        mostPickedFormatted,
        bestBonusPlayer,
        // best lip-sync earners
        bestLipSyncPlayers,
        bestLipSyncPlayer,
        weeklyPointChanges,
        biggestRankGainers,
        biggestRankGainer,
        biggestRankLosers,
        biggestRankLoser,
        // surprise queens
        earliestSurprises,
        latestSurprises,
        earliestSurprise,
        latestSurprise,
        // repeated pick stats
        mostRepeatedPlayers,
        mostRepeatedPlayer,
        mostIncorrectPlayers,
        mostIncorrectPlayer,
        // longest challenge streak (historical)
        longestStreakPlayers,
        longestStreakPlayer,
        // worst single ranking prediction(s)
        worstPredictions,
        worstPrediction,
        meta: {
            totalQueens,
            eliminatedWeeks: eliminatedPlayers.length,
        }
    };
}
