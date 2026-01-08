import React, { useState } from 'react';
import { Typography, Box, Button } from '@mui/material';
import {
    Root,
    Title,
    HistoryList,
    HistoryItem,
    HistoryDate,
    HistoryText
} from './History.styles';

function formatDate(isoString) {
    if (!isoString) return '';
    try {
        const date = new Date(isoString);
        const options = { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric', 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: true 
        };
        return date.toLocaleString('en-US', options);
    } catch (e) {
        return isoString;
    }
}

export default function History({ leagueData }) {
    const League = leagueData?.leagueData || leagueData;
    const history = League?.lgHistory || [];
    
    // State to track how many entries to show
    const [visibleCount, setVisibleCount] = useState(30);
    
    // Reverse the history array to show latest entries first
    const reversedHistory = [...history].reverse();
    
    // Filter out non-string or empty entries
    const validHistory = reversedHistory.filter(e => typeof e === 'string' && e.trim() !== '');
    
    // Get the entries to display
    const displayedHistory = validHistory.slice(0, visibleCount);
    const hasMore = validHistory.length > visibleCount;
    
    const handleSeeMore = () => {
        setVisibleCount(prev => prev + 30);
    };

    return (
        <Root>
            <Title variant="h5">{League?.lgName} - History</Title>
            <HistoryList>
                {validHistory.length === 0 ? (
                    <Box sx={{ textAlign: 'center', mt: 4, color: '#666' }}>
                        <Typography variant="body1">No history available yet</Typography>
                    </Box>
                ) : (
                    <>
                        {displayedHistory.map((entry, index) => {
                            // Support entries that may not include the expected ". " separator.
                            const parts = entry.includes('. ') ? entry.split('. ') : [ '', entry ];
                            const dateStr = parts[0];
                            let actionText = parts.slice(1).join('. ');

                            // If splitting didn't produce an action, fall back to the whole entry
                            if (!actionText || actionText.trim() === '') actionText = entry;

                            // Check if this is an admin edit or announcement
                            const isAdminEdit = actionText.startsWith('[ADMIN EDIT]');
                            const isAnnouncement = actionText.startsWith('[ANNOUNCEMENT]');
                            const displayText = isAdminEdit 
                                ? actionText.replace('[ADMIN EDIT] ', '') 
                                : isAnnouncement 
                                    ? actionText.replace('[ANNOUNCEMENT] ', '') 
                                    : actionText;

                            return (
                                <HistoryItem key={index} isAdminEdit={isAdminEdit} isAnnouncement={isAnnouncement}>
                                    <HistoryDate isAdminEdit={isAdminEdit} isAnnouncement={isAnnouncement}>{formatDate(dateStr)}</HistoryDate>
                                    <HistoryText isAdminEdit={isAdminEdit} isAnnouncement={isAnnouncement}>
                                        {isAdminEdit && (
                                            <Box component="span" sx={{ 
                                                display: 'inline-block',
                                                background: 'linear-gradient(135deg, #FF6B35 0%, #FF1493 100%)',
                                                color: 'white',
                                                padding: '2px 8px',
                                                borderRadius: '4px',
                                                fontSize: '0.75rem',
                                                fontWeight: 700,
                                                marginRight: '8px',
                                                verticalAlign: 'middle'
                                            }}>
                                                ADMIN EDIT
                                            </Box>
                                        )}
                                        {isAnnouncement && (
                                            <Box component="span" sx={{ 
                                                display: 'inline-block',
                                                background: 'linear-gradient(135deg, #4A90E2 0%, #7B68EE 100%)',
                                                color: 'white',
                                                padding: '2px 8px',
                                                borderRadius: '4px',
                                                fontSize: '0.75rem',
                                                fontWeight: 700,
                                                marginRight: '8px',
                                                verticalAlign: 'middle'
                                            }}>
                                                ANNOUNCEMENT
                                            </Box>
                                        )}
                                        {displayText}
                                    </HistoryText>
                                </HistoryItem>
                            );
                        })}
                        {hasMore && (
                            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3, mb: 2 }}>
                                <Button
                                    onClick={handleSeeMore}
                                    variant="outlined"
                                    sx={{
                                        borderColor: '#FF1493',
                                        color: '#FF1493',
                                        fontWeight: 600,
                                        padding: '8px 24px',
                                        borderRadius: '8px',
                                        textTransform: 'none',
                                        '&:hover': {
                                            borderColor: '#9B30FF',
                                            backgroundColor: 'rgba(255, 20, 147, 0.05)',
                                        }
                                    }}
                                >
                                    See More ({validHistory.length - visibleCount} remaining)
                                </Button>
                            </Box>
                        )}
                    </>
                )}
            </HistoryList>
        </Root>
    );
}
