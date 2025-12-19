// ...existing code...
import React, { useState, useEffect } from "react";
import mostFrequentName from '../../helpers/lipSyncAssassin';
import calculatePoints from '../../helpers/calculatePoints';
import Typography from '@mui/material/Typography';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Box, Chip } from '@mui/material';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import {
    Root,
    Title,
    List,
    StyledAccordion,
    StyledSummary,
    SummaryText,
    StyledDetails,
    OverallSubmissionsBox,
    SubmissionChip,
    NestedAccordion,
    NestedSummary,
    NestedSummaryText,
    NestedDetails,
    StyledOrderedList,
} from './PlayerSubmissions.styles';

function getOrdinal(n) {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

function calculateQueenRankingInfo(queenName, predictedPosition, leagueData) {
    const eliminatedPlayers = leagueData?.lgEliminatedPlayers || [];
    const totalQueens = leagueData?.lgQueenNames?.length || 0;
    
    // Check if queen is eliminated (might be in a tie like "Queen1|Queen2")
    let isEliminated = false;
    let eliminationEntryIndex = -1;
    let positionInTie = 0; // 0 if first in tie, 1 if second, etc.
    
    for (let i = 0; i < eliminatedPlayers.length; i++) {
        const entry = eliminatedPlayers[i];
        const queensInEntry = entry.split('|').map(s => s.trim());
        
        if (queensInEntry.includes(queenName)) {
            isEliminated = true;
            eliminationEntryIndex = i;
            positionInTie = queensInEntry.indexOf(queenName);
            break;
        }
    }
    
    if (!isEliminated) {
        return null; // Queen is still in the competition
    }
    
    // Calculate actual ranking
    // For ties, all queens in the tie get the SAME (highest) position
    // e.g., if 2 queens tie at positions 14 and 13, both are ranked 14th
    
    // Count how many queens were eliminated BEFORE this entry
    let queensEliminatedBefore = 0;
    for (let i = 0; i < eliminationEntryIndex; i++) {
        const entry = eliminatedPlayers[i];
        const queensInEntry = entry.split('|').map(s => s.trim()).filter(Boolean);
        queensEliminatedBefore += queensInEntry.length;
    }
    
    // Actual ranking is the highest position in the tie
    // If 14 queens total, and 0 eliminated before, this tie is at position 14
    const actualRanking = totalQueens - queensEliminatedBefore;
    
    // Calculate points earned
    // Points = totalQueens - |actualRanking - predictedPosition|
    const difference = Math.abs(actualRanking - predictedPosition);
    const pointsEarned = Math.max(0, totalQueens - difference);
    
    return {
        isEliminated: true,
        actualRanking,
        pointsEarned,
        difference
    };
}

function PlayerItem({ item, leagueData, currentWeekSubmission }) {
    const [rankOpen, setRankOpen] = React.useState(false);
    const [winnersOpen, setWinnersOpen] = React.useState(false);
    const [bonusesOpen, setBonusesOpen] = React.useState(false);
    const [expanded, setExpanded] = React.useState(false);

    const totalPoints = calculatePoints(item, leagueData) || 0;

    // helper to parse names from various separators
    const parseNames = (str) => {
        if (!str || typeof str !== 'string') return [];
        return str
            .split(/\s*(?:\||,|&|and)\s*/i)
            .map(s => s.trim())
            .filter(Boolean)
            .map(s => s.toLowerCase());
    };

    // Rankings subtotal: sum of points earned from eliminated queens based on rankings
    const rankingsTotal = (() => {
        try {
            const rankings = Array.isArray(item.plRankings) ? item.plRankings : [];
            return rankings.reduce((sum, rankName, idx) => {
                const info = calculateQueenRankingInfo(rankName, idx + 1, leagueData);
                return sum + (info?.pointsEarned || 0);
            }, 0);
        } catch (e) { return 0; }
    })();

    // Challenge subtotal: count correct weekly challenge picks * points per challenge
    const challengeTotal = (() => {
        try {
            const challengeWinners = leagueData?.lgChallengeWinners || [];
            const playerWinners = Array.isArray(item.plWinners) ? item.plWinners : [];
            const pointsPer = Number(leagueData?.lgChallengePoints) || 0;
            let total = 0;
            for (let i = 0; i < playerWinners.length && i < challengeWinners.length; i++) {
                const actual = challengeWinners[i];
                const pred = playerWinners[i];
                if (!actual || !pred) continue;
                const actualList = parseNames(actual);
                const predList = parseNames(pred);
                if (predList.some(p => actualList.includes(p))) total += pointsPer;
            }
            return total;
        } catch (e) { return 0; }
    })();

    // Bonus subtotal: sum of matched bonus category points
    const bonusesTotal = (() => {
        try {
            const leagueBonuses = leagueData?.lgBonusPoints || [];
            const playerBonuses = Array.isArray(item.plBonuses) ? item.plBonuses : [];
            let total = 0;
            playerBonuses.forEach(pb => {
                const parts = (pb || '').split('|').map(s => s.trim());
                const categoryName = parts[0] || '';
                const prediction = parts.length > 1 ? parts.slice(1).join('|') : '';
                const match = leagueBonuses.find(lb => (lb || '').split('|').map(s => s.trim())[0] === categoryName);
                if (!match) return;
                const matchParts = match.split('|').map(s => s.trim());
                const pointsWorth = parseInt(matchParts[1]) || 0;
                const correctAnswer = matchParts[3] || null;
                if (correctAnswer) {
                    const correctList = parseNames(correctAnswer);
                    const predList = parseNames(prediction);
                    if (predList.some(p => correctList.includes(p))) total += pointsWorth;
                }
            });
            return total;
        } catch (e) { return 0; }
    })();

    // Check if player's last pick matches last week's challenge winner
    const checkLastPickCorrect = () => {
        if (!currentWeekSubmission) return null;
        
        const challengeWinners = leagueData?.lgChallengeWinners || [];
        if (challengeWinners.length === 0) return null;
        
        // Get the last challenge winner
        const lastChallengeWinner = challengeWinners[challengeWinners.length - 1];
        if (!lastChallengeWinner || lastChallengeWinner.trim() === '') return null;
        
        // Compare (case-insensitive)
        return currentWeekSubmission.toLowerCase() === lastChallengeWinner.toLowerCase();
    };

    const isCorrect = checkLastPickCorrect();

    return (
        <StyledAccordion disableGutters>
            <StyledSummary expandIcon={<ExpandMoreIcon />}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', pr: 1 }}>
                    <SummaryText>{item.plName}</SummaryText>
                    {/* Always show a chip: show pick + correctness if available, otherwise show 'No pick ✗' as incorrect */}
                    {(() => {
                        const hasPick = !!currentWeekSubmission;
                        const isTrue = isCorrect === true;
                        const isFalse = isCorrect === false;
                        const challengeWinners = leagueData?.lgChallengeWinners || [];

                        // Only show the "No pick" chip when there is at least one recorded challenge winner
                        const showNoPick = !hasPick && Array.isArray(challengeWinners) && challengeWinners.length > 0;

                        // Determine label; if no pick and no winners, leave label empty to hide the chip
                        const label = hasPick ? (isCorrect !== null ? `${currentWeekSubmission} ${isCorrect ? '✓' : '✗'}` : currentWeekSubmission) : (showNoPick ? 'No pick ✗' : '');

                        if (!label) return null;

                        // Styling: preserve original colors
                        const bg = isTrue
                            ? 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)' // gold for correct
                            : isFalse
                                ? 'linear-gradient(135deg, #9B30FF 0%, #6A0DAD 100%)' // purple for incorrect
                                : 'linear-gradient(135deg, #FF1493 0%, #C71585 100%)'; // pink for unknown

                        // If no pick, style like unknown (pink)
                        const finalBg = hasPick ? bg : 'linear-gradient(135deg, #9B30FF 0%, #6A0DAD 100%)';

                        const border = finalBg === 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)'
                            ? '1px solid #FFD700'
                            : finalBg === 'linear-gradient(135deg, #9B30FF 0%, #6A0DAD 100%)'
                                ? '1px solid #9B30FF'
                                : '1px solid #FF1493';

                        const boxShadow = finalBg === 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)'
                            ? '0 2px 8px rgba(255, 215, 0, 0.3)'
                            : finalBg === 'linear-gradient(135deg, #9B30FF 0%, #6A0DAD 100%)'
                                ? '0 2px 8px rgba(155, 48, 255, 0.3)'
                                : '0 2px 8px rgba(255, 20, 147, 0.3)';

                        return (
                            <Chip
                                label={label}
                                size="medium"
                                sx={{
                                    background: finalBg,
                                    color: 'white',
                                    fontWeight: 600,
                                    fontSize: '0.85rem',
                                    height: '28px',
                                    border,
                                    boxShadow,
                                    textShadow: '0 1px 2px rgba(0,0,0,0.2)',
                                    '& .MuiChip-label': { px: 2 }
                                }}
                            />
                        );
                    })()}
                </Box>
            </StyledSummary>

            <StyledDetails>
                {/* Controlled Rankings accordion */}
                <NestedAccordion
                    sx={{ mt: 1 }}
                    expanded={rankOpen}
                    onChange={(_, isExpanded) => setRankOpen(isExpanded)}
                    disableGutters
                >
                    <NestedSummary expandIcon={<ExpandMoreIcon />}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                            <NestedSummaryText>🏆 Rankings</NestedSummaryText>
                            {rankingsTotal > 0 && (
                                <Chip label={`${rankingsTotal} pts`} size="small" sx={{ background: 'linear-gradient(135deg,#50C878 0%, #3CB371 100%)', color: 'white', fontWeight: 700 }} />
                            )}
                        </Box>
                    </NestedSummary>

                    <NestedDetails>
                        {/* Show swap indicator when player has a recorded swap */}
                        {item?.plSwap && typeof item.plSwap === 'string' && item.plSwap.trim() !== '' && (() => {
                            const parts = item.plSwap.split('|').map(s => s.trim()).filter(Boolean);
                            if (parts.length >= 2) {
                                const [a, b] = parts;
                                return (
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                        <Chip
                                            icon={<SwapHorizIcon sx={{ color: 'white' }} />}
                                            label={`Swapped: ${a} ↔ ${b}`}
                                            size="meduim"
                                            sx={{ background: 'linear-gradient(135deg,#FF1493 0%, #9B30FF 100%)', color: 'white', fontWeight: 700 }}
                                        />
                                    </Box>
                                );
                            }
                            return null;
                        })()}

                        {Array.isArray(item.plRankings) && item.plRankings.length > 0 ? (
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                                {item.plRankings.map((rank, idx) => {
                                    const queenInfo = calculateQueenRankingInfo(rank, idx + 1, leagueData);
                                    const isEliminated = queenInfo?.isEliminated;
                                    
                                    return (
                                        <Box
                                            key={idx}
                                            sx={{
                                                display: 'flex',
                                                flexDirection: { xs: 'column', sm: 'row' },
                                                alignItems: { xs: 'flex-start', sm: 'center' },
                                                gap: 1.5,
                                                p: 1,
                                                borderRadius: 1,
                                                background: isEliminated
                                                    ? 'linear-gradient(135deg, rgba(255, 245, 248, 0.6) 0%, rgba(245, 235, 255, 0.6) 100%)'
                                                    : 'transparent',
                                                border: isEliminated ? '1px solid rgba(255, 20, 147, 0.2)' : 'none',
                                                transition: 'all 0.2s ease',
                                            }}
                                        >
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, width: '100%' }}>
                                                <Typography
                                                    component="span"
                                                    sx={{
                                                        fontWeight: 700,
                                                        color: '#9B30FF',
                                                        minWidth: '40px',
                                                        flexShrink: 0
                                                    }}
                                                >
                                                    {getOrdinal(idx + 1)}
                                                </Typography>

                                                <Typography
                                                    component="span"
                                                    sx={{
                                                        flex: 1,
                                                        fontWeight: 500
                                                    }}
                                                >
                                                    {rank}
                                                </Typography>
                                            </Box>

                                            {isEliminated && (
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: { xs: 0, sm: 0 } }}>
                                                    <Chip
                                                        label={getOrdinal(queenInfo.actualRanking)}
                                                        size="medium"
                                                        sx={{
                                                            background: 'linear-gradient(135deg, #9B30FF 0%, #7A1CAC 100%)',
                                                            color: 'white',
                                                            fontWeight: 600,
                                                            fontSize: '0.85rem',
                                                            height: '28px',
                                                            '& .MuiChip-label': {
                                                                px: 2
                                                            }
                                                        }}
                                                    />
                                                    <Chip
                                                        label={`+${queenInfo.pointsEarned} pts`}
                                                        size="medium"
                                                        sx={{
                                                            background: queenInfo.difference === 0
                                                                ? 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)'
                                                                : queenInfo.pointsEarned >= (leagueData?.lgQueenNames?.length || 0) * 0.75
                                                                    ? 'linear-gradient(135deg, #50C878 0%, #3CB371 100%)'
                                                                    : queenInfo.pointsEarned >= (leagueData?.lgQueenNames?.length || 0) * 0.5
                                                                        ? 'linear-gradient(135deg, #FF8C00 0%, #FF6347 100%)'
                                                                        : 'linear-gradient(135deg, #DC143C 0%, #B22222 100%)',
                                                            color: 'white',
                                                            fontWeight: 700,
                                                            fontSize: '0.85rem',
                                                            height: '28px',
                                                            boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                                                            '& .MuiChip-label': {
                                                                px: 2
                                                            }
                                                        }}
                                                    />
                                                </Box>
                                            )}
                                        </Box>
                                    );
                                })}
                            </Box>
                        ) : (
                            <Typography variant="body2" color="text.secondary">
                                No rankings available.
                            </Typography>
                        )}
                    </NestedDetails>
                </NestedAccordion>

                {/* Stack Winners and Bonuses under Rankings */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 12 }}>
                    {Number(leagueData?.lgChallengePoints || 0) > 0 && (
                        <NestedAccordion
                            sx={{ width: '100%' }}
                            expanded={winnersOpen}
                            onChange={(_, isExpanded) => setWinnersOpen(isExpanded)}
                            disableGutters
                        >
                            <NestedSummary expandIcon={<ExpandMoreIcon />}>
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                                    <NestedSummaryText>👑 Weekly Challenge Winners</NestedSummaryText>
                                    {challengeTotal > 0 && (
                                        <Chip label={`${challengeTotal} pts`} size="small" sx={{ background: 'linear-gradient(135deg,#FFD700 0%, #FFA500 100%)', color: '#333', fontWeight: 700 }} />
                                    )}
                                </Box>
                            </NestedSummary>

                            <NestedDetails>
                                {Array.isArray(item.plWinners) && item.plWinners.length > 0 ? (
                                    <Box>
                                        {/* Points information banner */}
                                        <Box sx={{
                                            p: 1.5,
                                            mb: 2,
                                            borderRadius: 2,
                                            background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.12) 0%, rgba(255, 165, 0, 0.12) 100%)',
                                            border: '1px solid rgba(255, 215, 0, 0.4)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 1
                                        }}>
                                            <Typography sx={{ 
                                                fontSize: '1rem', 
                                                color: '#666',
                                                fontWeight: 500 
                                            }}>
                                            Points per correct guess:
                                            </Typography>
                                            <Chip
                                                label={`${leagueData?.lgChallengePoints || 0} pts`}
                                                size="medium"
                                                sx={{
                                                    background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
                                                    color: '#333',
                                                    fontWeight: 700,
                                                    fontSize: '0.85rem',
                                                    height: '28px',
                                                    boxShadow: '0 2px 4px rgba(255, 165, 0, 0.3)',
                                                    '& .MuiChip-label': {
                                                        px: 2
                                                    }
                                                }}
                                            />
                                        </Box>

                                        {/* Weekly predictions list */}
                                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                            {item.plWinners.map((prediction, i) => {
                                                const challengeWinners = leagueData?.lgChallengeWinners || [];
                                                const actualWinner = challengeWinners[i] || null;
                                            
                                                // Check if prediction is correct (only if there's a confirmed winner)
                                                // Treat missing prediction as incorrect when an actual winner exists.
                                                // Handle ties: both actualWinner and prediction might have multiple queens separated by |
                                                let isCorrect = null;
                                                if (actualWinner && actualWinner.trim() !== '') {
                                                    if (prediction && prediction.trim() !== '') {
                                                        const winnersList = actualWinner.split('|').map(s => s.trim().toLowerCase());
                                                        const predictions = prediction.split('|').map(s => s.trim().toLowerCase());
                                                        // Player is correct if ANY of their predictions match ANY of the actual winners
                                                        isCorrect = predictions.some(pred => winnersList.includes(pred));
                                                    } else {
                                                    // No prediction but there is an actual winner -> incorrect
                                                        isCorrect = false;
                                                    }
                                                }
                                            
                                                const hasPrediction = prediction && prediction.trim() !== '';
                                            
                                                return (
                                                    <Box 
                                                        key={i}
                                                        sx={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: 1.5,
                                                            p: 1.25,
                                                            borderRadius: 2,
                                                            background: 'linear-gradient(135deg, rgba(255, 245, 248, 0.6) 0%, rgba(245, 235, 255, 0.6) 100%)',
                                                            border: '1px solid rgba(255, 20, 147, 0.2)',
                                                            transition: 'all 0.2s ease',
                                                            '&:hover': {
                                                                background: 'linear-gradient(135deg, rgba(255, 245, 248, 0.8) 0%, rgba(245, 235, 255, 0.8) 100%)',
                                                                border: '1px solid rgba(255, 20, 147, 0.4)',
                                                                transform: 'translateX(4px)',
                                                                boxShadow: '0 2px 8px rgba(255, 20, 147, 0.15)'
                                                            }
                                                        }}
                                                    >
                                                        <Typography 
                                                            sx={{ 
                                                                fontWeight: 700, 
                                                                color: '#9B30FF',
                                                                minWidth: '60px',
                                                                fontSize: '1rem'
                                                            }}
                                                        >
                                                        Week {i + 1}
                                                        </Typography>
                                                    
                                                        {hasPrediction ? (
                                                            <Typography 
                                                                sx={{ 
                                                                    flex: 1,
                                                                    fontWeight: 500,
                                                                    fontSize: '1rem',
                                                                    color: '#333'
                                                                }}
                                                            >
                                                                {prediction}
                                                            </Typography>
                                                        ) : (
                                                        // Show 'No pick' as plain text so chips (like incorrect) appear at the end consistently
                                                            <Typography 
                                                                sx={{ 
                                                                    flex: 1,
                                                                    fontWeight: 500,
                                                                    fontSize: '1rem',
                                                                    color: '#666'
                                                                }}
                                                            >
                                                            No pick
                                                            </Typography>
                                                        )}
                                                    
                                                        {isCorrect === true && (
                                                            <Chip
                                                                label="✓ Correct"
                                                                size="medium"
                                                                sx={{
                                                                    background: 'linear-gradient(135deg, #50C878 0%, #3CB371 100%)',
                                                                    color: 'white',
                                                                    fontWeight: 700,
                                                                    fontSize: '0.85rem',
                                                                    height: '28px',
                                                                    boxShadow: '0 2px 4px rgba(80, 200, 120, 0.4)',
                                                                    '& .MuiChip-label': {
                                                                        px: 2
                                                                    }
                                                                }}
                                                            />
                                                        )}
                                                    
                                                        {isCorrect === false && (
                                                            <Chip
                                                                label="✗ Incorrect"
                                                                size="medium"
                                                                sx={{
                                                                    background: 'linear-gradient(135deg, #DC143C 0%, #B22222 100%)',
                                                                    color: 'white',
                                                                    fontWeight: 700,
                                                                    fontSize: '0.85rem',
                                                                    height: '28px',
                                                                    boxShadow: '0 2px 4px rgba(220, 20, 60, 0.4)',
                                                                    '& .MuiChip-label': {
                                                                        px: 2
                                                                    }
                                                                }}
                                                            />
                                                        )}
                                                    </Box>
                                                );
                                            })}
                                        </Box>
                                    </Box>
                                ) : (
                                    <Typography variant="body2" color="text.secondary">
                                    No weekly predictions submitted.
                                    </Typography>
                                )}
                            </NestedDetails>
                        </NestedAccordion>
                    )}

                    {Array.isArray(item.plBonuses) && item.plBonuses.length > 0 && (
                        <NestedAccordion
                            sx={{ width: '100%' }}
                            expanded={bonusesOpen}
                            onChange={(_, isExpanded) => setBonusesOpen(isExpanded)}
                            disableGutters
                        >
                            <NestedSummary expandIcon={<ExpandMoreIcon />}>
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                                    <NestedSummaryText>⭐ Bonus Predictions</NestedSummaryText>
                                    {bonusesTotal > 0 && (
                                        <Chip label={`${bonusesTotal} pts`} size="small" sx={{ background: 'linear-gradient(135deg,#50C878 0%, #3CB371 100%)', color: 'white', fontWeight: 700 }} />
                                    )}
                                </Box>
                            </NestedSummary>

                            <NestedDetails>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                                    {item.plBonuses.map((b, i) => {
                                        const playerParts = b.split('|').map(s => s.trim());
                                        const categoryName = playerParts[0] || '';
                                        // join remaining parts back in case prediction itself contained pipes
                                        const prediction = playerParts.length > 1 ? playerParts.slice(1).join('|') : '';

                                        // Find matching bonus in league data to get points and result
                                        const leagueBonuses = leagueData?.lgBonusPoints || [];
                                        const matchingBonus = leagueBonuses.find(lb => {
                                            const lbParts = lb.split('|').map(s => s.trim());
                                            return lbParts[0] === categoryName;
                                        });

                                        let pointsWorth = 0;
                                        let correctAnswer = null;
                                        let isCorrect = null;

                                        if (matchingBonus) {
                                            const bonusParts = matchingBonus.split('|').map(s => s.trim());
                                            pointsWorth = parseInt(bonusParts[1]) || 0;
                                            correctAnswer = bonusParts[3] || null; // Result is at index 3

                                            // Only evaluate correctness if there's a confirmed result
                                            if (correctAnswer) {
                                                const correctList = parseNames(correctAnswer);
                                                const predList = parseNames(prediction);
                                                isCorrect = predList.some(p => correctList.includes(p));
                                            }
                                        }

                                        return (
                                            <Box 
                                                key={i}
                                                sx={{
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    gap: 0.75,
                                                    p: 1.5,
                                                    borderRadius: 2,
                                                    background: 'linear-gradient(135deg, rgba(255, 245, 248, 0.6) 0%, rgba(245, 235, 255, 0.6) 100%)',
                                                    border: '1px solid rgba(255, 20, 147, 0.2)',
                                                    transition: 'all 0.2s ease',
                                                    '&:hover': {
                                                        background: 'linear-gradient(135deg, rgba(255, 245, 248, 0.8) 0%, rgba(245, 235, 255, 0.8) 100%)',
                                                        border: '1px solid rgba(255, 20, 147, 0.4)',
                                                        transform: 'translateX(4px)',
                                                        boxShadow: '0 2px 8px rgba(255, 20, 147, 0.15)'
                                                    }
                                                }}
                                            >
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, flexDirection: { xs: 'column', sm: 'row' }, gap: 1 }}>
                                                    <Typography 
                                                        sx={{ 
                                                            fontWeight: 700, 
                                                            fontSize: '1rem',
                                                            color: '#9B30FF',
                                                        }}
                                                    >
                                                        {categoryName}
                                                    </Typography>
                                                    <Chip
                                                        label={`${pointsWorth} pts`}
                                                        size="medium"
                                                        sx={{
                                                            background: 'linear-gradient(135deg, #9B30FF 0%, #7A1CAC 100%)',
                                                            color: 'white',
                                                            fontWeight: 700,
                                                            fontSize: '0.85rem',
                                                            height: '28px',
                                                            '& .MuiChip-label': {
                                                                px: 2
                                                            },
                                                            mt: { xs: 0.5, sm: 0 }
                                                        }}
                                                    />
                                                </Box>
                                            
                                                <Box sx={{ display: 'flex', alignItems: { xs: 'flex-start', sm: 'center' }, gap: 1, flexDirection: { xs: 'column', sm: 'row' }, flexWrap: 'wrap' }}>
                                                    <Typography 
                                                        sx={{ 
                                                            fontSize: '1rem',
                                                            color: '#666',
                                                            fontWeight: 500,
                                                            minWidth: { xs: '100%', sm: 'auto' }
                                                        }}
                                                    >
                                                    Prediction:
                                                    </Typography>
                                                    <Chip
                                                        label={capitalize(prediction)}
                                                        size="medium"
                                                        sx={{
                                                            background: 'linear-gradient(135deg, #FF1493 0%, #9B30FF 100%)',
                                                            color: 'white',
                                                            fontWeight: 600,
                                                            fontSize: '0.85rem',
                                                            height: '28px',
                                                            boxShadow: '0 2px 4px rgba(255, 20, 147, 0.3)',
                                                            '& .MuiChip-label': {
                                                                px: 2
                                                            },
                                                            width: { xs: '100%', sm: 'auto' }
                                                        }}
                                                    />
                                                
                                                    {isCorrect !== null && (
                                                        <Chip
                                                            label={isCorrect ? '✓ Correct' : '✗ Incorrect'}
                                                            size="medium"
                                                            sx={{
                                                                background: isCorrect 
                                                                    ? 'linear-gradient(135deg, #50C878 0%, #3CB371 100%)'
                                                                    : 'linear-gradient(135deg, #DC143C 0%, #B22222 100%)',
                                                                color: 'white',
                                                                fontWeight: 700,
                                                                fontSize: '0.85rem',
                                                                height: '28px',
                                                                boxShadow: isCorrect
                                                                    ? '0 2px 4px rgba(80, 200, 120, 0.4)'
                                                                    : '0 2px 4px rgba(220, 20, 60, 0.4)',
                                                                '& .MuiChip-label': {
                                                                    px: 2
                                                                },
                                                                mt: { xs: 0.5, sm: 0 }
                                                            }}
                                                        />
                                                    )}
                                                </Box>
                                            </Box>
                                        );
                                    })}
                                </Box>
                            </NestedDetails>
                        </NestedAccordion>
                    )}

                    {item.plLipSyncAssassin && item.plLipSyncAssassin.trim() !== '' && (
                        <Box sx={{ width: '100%', mt: 1 }}>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75, p: 1.5, borderRadius: 2, background: 'linear-gradient(135deg, rgba(255, 245, 248, 0.6) 0%, rgba(245, 235, 255, 0.6) 100%)', border: '1px solid rgba(255, 20, 147, 0.12)', mb: 1 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, flexDirection: { xs: 'column', sm: 'row' }, gap: 1 }}>
                                    <Typography sx={{ fontWeight: 700, fontSize: '1rem', color: '#9B30FF' }}>
                                        Lip Sync Assassin
                                    </Typography>
                                    <Chip
                                        label={`${leagueData?.lgLipSyncPoints || 0} pts`}
                                        size="medium"
                                        sx={{ background: 'linear-gradient(135deg, #9B30FF 0%, #7A1CAC 100%)', color: 'white', fontWeight: 700, fontSize: '0.85rem', height: '28px', '& .MuiChip-label': { px: 2 }, mt: { xs: 0.5, sm: 0 } }}
                                    />
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: { xs: 'flex-start', sm: 'center' }, gap: 1, flexDirection: { xs: 'column', sm: 'row' }, flexWrap: 'wrap' }}>
                                    <Typography sx={{ fontSize: '1rem', color: '#666', fontWeight: 500, minWidth: { xs: '100%', sm: 'auto' } }}>Prediction:</Typography>
                                    <Chip label={item.plLipSyncAssassin} size="medium" sx={{ background: 'linear-gradient(135deg, #FF1493 0%, #9B30FF 100%)', color: 'white', fontWeight: 600, fontSize: '0.85rem', height: '28px', boxShadow: '0 2px 4px rgba(255, 20, 147, 0.3)', '& .MuiChip-label': { px: 2 }, width: { xs: '100%', sm: 'auto' } }} />
                                    {(() => {
                                        const leagueAssassin = mostFrequentName(leagueData?.lgLipSyncWinners || []);
                                        if (!leagueAssassin) return null;
                                        const assassinNames = parseNames(leagueAssassin);
                                        const playerPreds = parseNames(item.plLipSyncAssassin || '');
                                        const correct = playerPreds.some(p => assassinNames.includes(p));
                                        const leagueActive = !(leagueData && leagueData.lgFinished === 'finished');
                                        const prefix = leagueActive ? 'Currently ' : '';
                                        return (
                                            <Chip label={prefix + (correct ? '✓ Correct' : '✗ Incorrect')} size="medium" sx={{ background: correct ? 'linear-gradient(135deg, #50C878 0%, #3CB371 100%)' : 'linear-gradient(135deg, #DC143C 0%, #B22222 100%)', color: 'white', fontWeight: 700, fontSize: '0.85rem', height: '28px', boxShadow: correct ? '0 2px 4px rgba(80, 200, 120, 0.4)' : '0 2px 4px rgba(220, 20, 60, 0.4)', '& .MuiChip-label': { px: 2 }, mt: { xs: 0.5, sm: 0 } }} />
                                        );
                                    })()}
                                </Box>
                            </Box>
                        </Box>
                    )}
                </div>
            </StyledDetails>
        </StyledAccordion>
    );
}

export default function PlayerSubmissions(props) {
    const Player = props.playersData
    const League = props.leagueData

    const [playersData, setPlayersData] = useState([]);
    const [leagueData, setLeagueData] = useState({});

    useEffect(() => {
        setPlayersData(Player);
        setLeagueData(League);
    }, [Player, League]);

    // Get last picked queen from plWinners array for each player
    const getLastPickedQueens = () => {
        const lastPickMap = {};
        
        playersData?.forEach(player => {
            const playerEmail = player.plEmail?.toLowerCase() || '';
            const winners = player.plWinners || [];
            
            // Get the last entry in plWinners (most recent pick)
            if (winners.length > 0) {
                const lastPick = winners[winners.length - 1];
                // Only add to map if it's not an empty string
                if (lastPick && lastPick.trim() !== '') {
                    lastPickMap[playerEmail] = lastPick.trim();
                }
            }
        });
        
        return lastPickMap;
    };

    // Get all players' picks from last week (last entry in plWinners)
    const getLastWeekPicks = () => {
        const queenCounts = {};
        
        playersData?.forEach(player => {
            const winners = player.plWinners || [];
            
            // Get the last entry in plWinners (most recent pick)
            if (winners.length > 0) {
                const lastPick = winners[winners.length - 1];
                // Only count if it's not an empty string
                if (lastPick && lastPick.trim() !== '') {
                    const queenName = lastPick.trim();
                    queenCounts[queenName] = (queenCounts[queenName] || 0) + 1;
                }
            }
        });
        
        // Sort by count (descending) then alphabetically
        return Object.entries(queenCounts)
            .sort((a, b) => {
                if (b[1] !== a[1]) return b[1] - a[1];
                return a[0].localeCompare(b[0]);
            })
            .map(([queen, count]) => ({ queen, count }));
    };

    const lastPickedQueens = getLastPickedQueens();
    const lastWeekPicks = getLastWeekPicks();

    return (
        <Root>
            <Title variant="h5">Player Submissions</Title>

            {lastWeekPicks.length > 0 && (
                <OverallSubmissionsBox>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1.5, color: '#FF1493' }}>
                        Everyone&apos;s Maxi Challenge Pick Last Week:
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {lastWeekPicks.map(({ queen, count }) => (
                            <SubmissionChip 
                                key={queen}
                                label={`${queen} (${count})`}
                            />
                        ))}
                    </Box>
                </OverallSubmissionsBox>
            )}

            <List>
                {playersData?.map((item) => {
                    const playerEmail = item.plEmail?.toLowerCase() || '';
                    const lastPick = lastPickedQueens[playerEmail];
                    
                    return (
                        <PlayerItem 
                            key={item.id} 
                            item={item} 
                            leagueData={leagueData}
                            currentWeekSubmission={lastPick}
                        />
                    );
                })}
            </List>
        </Root>
    );
}

// parse names from strings that may contain pipes, commas, ampersands or the word 'and'
function parseNames(str) {
    if (!str || typeof str !== 'string') return [];
    return str
        .split(/\s*(?:\||,|&|and)\s*/i)
        .map(s => s.trim())
        .filter(Boolean)
        .map(s => s.toLowerCase());
}

function capitalize(s) {
    if (typeof s !== 'string') return s;
    if (!s) return s;
    return s.charAt(0).toUpperCase() + s.slice(1);
}