// ...existing code...
import React, { useState, useEffect } from "react";
import mostFrequentName from '../../helpers/lipSyncAssassin';
import Typography from '@mui/material/Typography';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Box, Chip } from '@mui/material';
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
                    {currentWeekSubmission && (
                        <Chip 
                            label={isCorrect !== null ? `${currentWeekSubmission} ${isCorrect ? '✓' : '✗'}` : currentWeekSubmission}
                            size="medium" 
                            sx={{ 
                                background: isCorrect === true 
                                    ? 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)' // Gold gradient for correct
                                    : isCorrect === false 
                                        ? 'linear-gradient(135deg, #9B30FF 0%, #6A0DAD 100%)' // Purple gradient for incorrect
                                        : 'linear-gradient(135deg, #FF1493 0%, #C71585 100%)', // Pink gradient for no data
                                color: 'white',
                                fontWeight: 600,
                                fontSize: '0.85rem',
                                height: '28px',
                                border: isCorrect === true 
                                    ? '1px solid #FFD700'
                                    : isCorrect === false
                                        ? '1px solid #9B30FF'
                                        : '1px solid #FF1493',
                                boxShadow: isCorrect === true
                                    ? '0 2px 8px rgba(255, 215, 0, 0.3)'
                                    : isCorrect === false
                                        ? '0 2px 8px rgba(155, 48, 255, 0.3)'
                                        : '0 2px 8px rgba(255, 20, 147, 0.3)',
                                textShadow: '0 1px 2px rgba(0,0,0,0.2)',
                                '& .MuiChip-label': {
                                    px: 2
                                }
                            }} 
                        />
                    )}
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
                        <NestedSummaryText>🏆 Rankings</NestedSummaryText>
                    </NestedSummary>

                    <NestedDetails>
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
                                                alignItems: 'center', 
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
                                            
                                            {isEliminated && (
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
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
                                                                ? 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)' // Perfect guess - gold
                                                                : queenInfo.pointsEarned >= (leagueData?.lgQueenNames?.length || 0) * 0.75
                                                                    ? 'linear-gradient(135deg, #50C878 0%, #3CB371 100%)' // Great guess - green
                                                                    : queenInfo.pointsEarned >= (leagueData?.lgQueenNames?.length || 0) * 0.5
                                                                        ? 'linear-gradient(135deg, #FF8C00 0%, #FF6347 100%)' // Good guess - orange
                                                                        : 'linear-gradient(135deg, #DC143C 0%, #B22222 100%)', // Poor guess - red
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
                    <NestedAccordion
                        sx={{ width: '100%' }}
                        expanded={winnersOpen}
                        onChange={(_, isExpanded) => setWinnersOpen(isExpanded)}
                        disableGutters
                    >
                        <NestedSummary expandIcon={<ExpandMoreIcon />}>
                            <NestedSummaryText>👑 Weekly Challenge Winners</NestedSummaryText>
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
                                            // Handle ties: both actualWinner and prediction might have multiple queens separated by |
                                            let isCorrect = null;
                                            if (actualWinner && actualWinner.trim() !== '' && prediction && prediction.trim() !== '') {
                                                const winnersList = actualWinner.split('|').map(s => s.trim().toLowerCase());
                                                const predictions = prediction.split('|').map(s => s.trim().toLowerCase());
                                                
                                                // Player is correct if ANY of their predictions match ANY of the actual winners
                                                isCorrect = predictions.some(pred => winnersList.includes(pred));
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
                                                    
                                                    <Typography 
                                                        sx={{ 
                                                            flex: 1,
                                                            fontWeight: 500,
                                                            fontSize: '1rem',
                                                            color: hasPrediction ? '#333' : '#999',
                                                            fontStyle: hasPrediction ? 'normal' : 'italic'
                                                        }}
                                                    >
                                                        {hasPrediction ? prediction : 'No pick'}
                                                    </Typography>
                                                    
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

                    {((item.plLipSyncAssassin && item.plLipSyncAssassin.trim() !== '') || (Array.isArray(item.plBonuses) && item.plBonuses.length > 0)) && (
                        <NestedAccordion
                            sx={{ width: '100%' }}
                            expanded={bonusesOpen}
                            onChange={(_, isExpanded) => setBonusesOpen(isExpanded)}
                            disableGutters
                        >
                            <NestedSummary expandIcon={<ExpandMoreIcon />}>
                                <NestedSummaryText>⭐ Bonus Predictions</NestedSummaryText>
                            </NestedSummary>

                            <NestedDetails>
                                {item.plLipSyncAssassin && item.plLipSyncAssassin.trim() !== '' && (
                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75, p: 1.5, borderRadius: 2, background: 'linear-gradient(135deg, rgba(255, 245, 248, 0.6) 0%, rgba(245, 235, 255, 0.6) 100%)', border: '1px solid rgba(255, 20, 147, 0.12)', mb: 1 }}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <Typography sx={{ fontWeight: 700, fontSize: '1rem', color: '#9B30FF' }}>
                                            Lip Sync Assassin
                                            </Typography>
                                            <Chip
                                                label={`${leagueData?.lgLipSyncPoints || 0} pts`}
                                                size="medium"
                                                sx={{ background: 'linear-gradient(135deg, #9B30FF 0%, #7A1CAC 100%)', color: 'white', fontWeight: 700, fontSize: '0.85rem', height: '28px', '& .MuiChip-label': { px: 2 } }}
                                            />
                                        </Box>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                                            <Typography sx={{ fontSize: '1rem', color: '#666', fontWeight: 500 }}>Prediction:</Typography>
                                            <Chip label={item.plLipSyncAssassin} size="medium" sx={{ background: 'linear-gradient(135deg, #FF1493 0%, #9B30FF 100%)', color: 'white', fontWeight: 600, fontSize: '0.85rem', height: '28px', boxShadow: '0 2px 4px rgba(255, 20, 147, 0.3)', '& .MuiChip-label': { px: 2 } }} />
                                            {(() => {
                                                const leagueAssassin = mostFrequentName(leagueData?.lgLipSyncWinners || []);
                                                if (!leagueAssassin) return null;
                                                const assassinNames = parseNames(leagueAssassin);
                                                const playerPreds = parseNames(item.plLipSyncAssassin || '');
                                                const correct = playerPreds.some(p => assassinNames.includes(p));
                                                return (
                                                    <Chip label={correct ? '✓ Correct' : '✗ Incorrect'} size="medium" sx={{ background: correct ? 'linear-gradient(135deg, #50C878 0%, #3CB371 100%)' : 'linear-gradient(135deg, #DC143C 0%, #B22222 100%)', color: 'white', fontWeight: 700, fontSize: '0.85rem', height: '28px', boxShadow: correct ? '0 2px 4px rgba(80, 200, 120, 0.4)' : '0 2px 4px rgba(220, 20, 60, 0.4)', '& .MuiChip-label': { px: 2 } }} />
                                                );
                                            })()}
                                        </Box>
                                    </Box>
                                )}

                                {Array.isArray(item.plBonuses) && item.plBonuses.length > 0 ? (
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
                                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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
                                                                }
                                                            }}
                                                        />
                                                    </Box>
                                                
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                                                        <Typography 
                                                            sx={{ 
                                                                fontSize: '1rem',
                                                                color: '#666',
                                                                fontWeight: 500
                                                            }}
                                                        >
                                                        Prediction:
                                                        </Typography>
                                                        <Chip
                                                            label={prediction}
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
                                                                }
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
                                                                    }
                                                                }}
                                                            />
                                                        )}
                                                    </Box>
                                                </Box>
                                            );
                                        })}
                                    </Box>
                                ) : (
                                    <Typography variant="body2" color="text.secondary">
                                    No bonus predictions submitted.
                                    </Typography>
                                )}
                            </NestedDetails>
                        </NestedAccordion>
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
                        What Everyone Picked Last Week
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