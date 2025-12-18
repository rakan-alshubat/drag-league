// ...existing code...
import React from 'react';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Box from '@mui/material/Box';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import mostFrequentName from '../../helpers/lipSyncAssassin';
import {
    Root,
    Title,
    List,
    StyledAccordion,
    StyledSummary,
    SummaryText,
    StyledDetails,
} from './SeasonInfo.styles';

function getOrdinal(n) {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

export default function SeasonInfo(props) {
    const { leagueData } = props;

    const eliminated = Array.isArray(leagueData?.lgEliminatedPlayers) ? leagueData.lgEliminatedPlayers : [];
    const challengeWinners = Array.isArray(leagueData?.lgChallengeWinners) ? leagueData.lgChallengeWinners : [];
    const lipSyncWinners = Array.isArray(leagueData?.lgLipSyncWinners) ? leagueData.lgLipSyncWinners : [];
    
    const totalQueens = leagueData?.lgQueenNames?.length || 0;

    return (
        <Root>
            <Title variant="h5">Season Info</Title>

            <List>
                <StyledAccordion disableGutters>
                    <StyledSummary expandIcon={<ExpandMoreIcon />}>
                        <SummaryText>Eliminated Queens</SummaryText>
                    </StyledSummary>
                    <StyledDetails>
                        {eliminated.length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {(() => {
                                    // Build display items with correct positions for ties
                                    const displayItems = [];
                                    
                                    // Process in order (winner first, first eliminated last)
                                    for (let idx = 0; idx < eliminated.length; idx++) {
                                        const entry = eliminated[idx];
                                        const queensInEntry = entry.split('|').map(s => s.trim()).filter(Boolean);
                                        
                                        // Calculate position counting from beginning
                                        let queensEliminatedBefore = 0;
                                        for (let i = 0; i < idx; i++) {
                                            const prevQueens = eliminated[i].split('|').filter(Boolean);
                                            queensEliminatedBefore += prevQueens.length;
                                        }
                                        
                                        const position = totalQueens - queensEliminatedBefore - (queensInEntry.length - 1);
                                        
                                        displayItems.push({
                                            position: position,
                                            queens: queensInEntry,
                                            isTie: queensInEntry.length > 1
                                        });
                                    }
                                    
                                    // Reverse the array to show first eliminated first, winner last
                                    return displayItems.reverse().map((item, i) => (
                                        <div 
                                            key={i} 
                                            style={{ 
                                                display: 'flex', 
                                                alignItems: 'center', 
                                                gap: 12,
                                                padding: '8px 12px',
                                                borderRadius: 8,
                                                background: 'linear-gradient(135deg, rgba(255, 245, 248, 0.6) 0%, rgba(245, 235, 255, 0.6) 100%)',
                                                border: '1px solid rgba(255, 20, 147, 0.2)',
                                                transition: 'all 0.2s ease'
                                            }}
                                        >
                                            <Typography 
                                                component="span" 
                                                sx={{ 
                                                    fontWeight: 700, 
                                                    color: '#9B30FF',
                                                    minWidth: '80px',
                                                    fontSize: '1rem'
                                                }}
                                            >
                                                {getOrdinal(item.position)}
                                            </Typography>
                                            <Typography 
                                                component="span"
                                                sx={{ 
                                                    fontWeight: 500,
                                                    fontSize: '1rem',
                                                    color: item.isTie ? '#FF1493' : 'inherit'
                                                }}
                                            >
                                                {item.queens.length === 1 
                                                    ? item.queens[0]
                                                    : item.queens.length === 2
                                                        ? `${item.queens[0]} & ${item.queens[1]}`
                                                        : `${item.queens.slice(0, -1).join(', ')}, & ${item.queens[item.queens.length - 1]}`
                                                }
                                            </Typography>
                                        </div>
                                    ));
                                })()}
                            </div>
                        ) : (
                            <Typography variant="body2" color="text.secondary">
                                No eliminated queens yet.
                            </Typography>
                        )}
                    </StyledDetails>
                </StyledAccordion>

                <StyledAccordion disableGutters>
                    <StyledSummary expandIcon={<ExpandMoreIcon />}>
                        <SummaryText>Challenge Winners</SummaryText>
                    </StyledSummary>
                    <StyledDetails>
                        {challengeWinners.length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {[...challengeWinners].reverse().map((entry, i) => {
                                    const originalIndex = challengeWinners.length - 1 - i;
                                    const weekNumber = originalIndex + 1;
                                    const winners = entry.split('|').map(s => s.trim()).filter(Boolean);
                                    const isTie = winners.length > 1;
                                    
                                    return (
                                        <div 
                                            key={i} 
                                            style={{ 
                                                display: 'flex', 
                                                alignItems: 'center', 
                                                gap: 12,
                                                padding: '8px 12px',
                                                borderRadius: 8,
                                                background: 'linear-gradient(135deg, rgba(255, 245, 248, 0.6) 0%, rgba(245, 235, 255, 0.6) 100%)',
                                                border: '1px solid rgba(255, 20, 147, 0.2)',
                                                transition: 'all 0.2s ease'
                                            }}
                                        >
                                            <Typography 
                                                component="span" 
                                                sx={{ 
                                                    fontWeight: 700, 
                                                    color: '#9B30FF',
                                                    minWidth: '80px',
                                                    fontSize: '1rem'
                                                }}
                                            >
                                                Week {weekNumber}
                                            </Typography>
                                            <Typography 
                                                component="span"
                                                sx={{ 
                                                    fontWeight: 500,
                                                    fontSize: '1rem',
                                                    color: 'inherit'
                                                }}
                                            >
                                                {(() => {
                                                    // Build counts preserving first-appearance order
                                                    const counts = new Map();
                                                    const order = [];
                                                    winners.forEach(name => {
                                                        const n = String(name || '').trim();
                                                        if (!counts.has(n)) order.push(n);
                                                        counts.set(n, (counts.get(n) || 0) + 1);
                                                    });

                                                    const parts = order.map(n => (counts.get(n) > 1 ? `${n} x${counts.get(n)}` : n)).filter(Boolean);
                                                    if (parts.length === 0) return <em style={{ color: '#999' }}>No winner</em>;
                                                    if (parts.length === 1) return parts[0];
                                                    if (parts.length === 2) return `${parts[0]} & ${parts[1]}`;
                                                    return `${parts.slice(0, -1).join(', ')}, & ${parts[parts.length - 1]}`;
                                                })()}
                                            </Typography>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <Typography variant="body2" color="text.secondary">
                                No challenge winners yet.
                            </Typography>
                        )}
                    </StyledDetails>
                </StyledAccordion>

                <StyledAccordion disableGutters>
                    <StyledSummary expandIcon={<ExpandMoreIcon />}>
                        <SummaryText>Lip Sync Winners</SummaryText>
                    </StyledSummary>
                    <StyledDetails>
                        {lipSyncWinners.length > 0 ? (
                            <>
                                {/* Lip Sync Assassin Banner */}
                                {lipSyncWinners.length > 0 && mostFrequentName(lipSyncWinners) && (() => {
                                    const assassinText = mostFrequentName(lipSyncWinners);
                                    const hasMultiple = assassinText.includes('&');
                                    const leagueActive = !(leagueData && leagueData.lgFinished === 'finished');
                                    const labelPrefix = leagueActive ? 'Current ' : '';
                                    return (
                                        <div style={{
                                            padding: '10px 14px',
                                            marginBottom: 12,
                                            borderRadius: 8,
                                            background: 'linear-gradient(135deg, rgba(255, 20, 147, 0.08) 0%, rgba(155, 48, 255, 0.08) 100%)',
                                            border: '1px solid rgba(255, 20, 147, 0.3)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 10
                                        }}>
                                            <Typography sx={{ 
                                                fontSize: '1rem', 
                                                color: '#666',
                                                fontWeight: 500 
                                            }}>
                                                {labelPrefix}Lip Sync Assassin{hasMultiple ? 's' : ''}:
                                            </Typography>
                                            <Chip
                                                label={assassinText}
                                                size="medium"
                                                sx={{
                                                    background: 'linear-gradient(135deg, #FF1493 0%, #9B30FF 100%)',
                                                    color: 'white',
                                                    fontWeight: 700,
                                                    fontSize: '0.85rem',
                                                    height: '28px',
                                                    boxShadow: '0 2px 4px rgba(255, 20, 147, 0.3)',
                                                    '& .MuiChip-label': {
                                                        px: 2
                                                    }
                                                }}
                                            />
                                        </div>
                                    );
                                })()}

                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                    {[...lipSyncWinners].reverse().map((entry, i) => {
                                        const originalIndex = lipSyncWinners.length - 1 - i;
                                        const weekNumber = originalIndex + 1;
                                        const winners = entry.split('|').map(s => s.trim()).filter(Boolean);
                                        const isTie = winners.length > 1;
                                    
                                        return (
                                            <div 
                                                key={i} 
                                                style={{ 
                                                    display: 'flex', 
                                                    alignItems: 'center', 
                                                    gap: 12,
                                                    padding: '8px 12px',
                                                    borderRadius: 8,
                                                    background: 'linear-gradient(135deg, rgba(255, 245, 248, 0.6) 0%, rgba(245, 235, 255, 0.6) 100%)',
                                                    border: '1px solid rgba(255, 20, 147, 0.2)',
                                                    transition: 'all 0.2s ease'
                                                }}
                                            >
                                                <Typography 
                                                    component="span" 
                                                    sx={{ 
                                                        fontWeight: 700, 
                                                        color: '#9B30FF',
                                                        minWidth: '80px',
                                                        fontSize: '1rem'
                                                    }}
                                                >
                                                Week {weekNumber}
                                                </Typography>
                                                <Typography
                                                    component="span"
                                                    sx={{
                                                        fontWeight: 500,
                                                        fontSize: '1rem',
                                                        color: 'inherit',
                                                        display: 'inline-flex',
                                                        flexWrap: 'wrap',
                                                        gap: '6px',
                                                        alignItems: 'center'
                                                    }}
                                                >
                                                    {(() => {
                                                        // Aggregate duplicates preserving first appearance order
                                                        const counts = new Map();
                                                        const order = [];
                                                        winners.forEach(name => {
                                                            const n = String(name || '').trim();
                                                            if (!counts.has(n)) order.push(n);
                                                            counts.set(n, (counts.get(n) || 0) + 1);
                                                        });

                                                        const parts = order.map(n => (counts.get(n) > 1 ? `${n} x${counts.get(n)}` : n)).filter(Boolean);
                                                        if (parts.length === 0) return <em style={{ color: '#999' }}>No winner</em>;
                                                        if (parts.length === 1) return parts[0];
                                                        if (parts.length === 2) return `${parts[0]} & ${parts[1]}`;
                                                        return `${parts.slice(0, -1).join(', ')}, & ${parts[parts.length - 1]}`;
                                                    })()}
                                                </Typography>
                                            </div>
                                        );
                                    })}
                                </div>
                            </>
                        ) : (
                            <Typography variant="body2" color="text.secondary">
                                No lip sync winners yet.
                            </Typography>
                        )}
                    </StyledDetails>
                </StyledAccordion>
            </List>
        </Root>
    );
}