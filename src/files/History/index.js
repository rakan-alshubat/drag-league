import React from 'react';
import { Typography, Box } from '@mui/material';
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
    
    // Reverse the history array to show latest entries first
    const reversedHistory = [...history].reverse();

    return (
        <Root>
            <Title variant="h5">{League?.lgName} - History</Title>
            <HistoryList>
                {reversedHistory.length === 0 ? (
                    <Box sx={{ textAlign: 'center', mt: 4, color: '#666' }}>
                        <Typography variant="body1">No history available yet</Typography>
                    </Box>
                ) : (
                    reversedHistory.map((entry, index) => {
                        const parts = entry.split('. ');
                        const dateStr = parts[0];
                        const actionText = parts.slice(1).join('. ');
                        
                        // Check if this is an admin edit
                        const isAdminEdit = actionText.startsWith('[ADMIN EDIT]');
                        const displayText = isAdminEdit ? actionText.replace('[ADMIN EDIT] ', '') : actionText;
                        
                        return (
                            <HistoryItem key={index} isAdminEdit={isAdminEdit}>
                                <HistoryDate isAdminEdit={isAdminEdit}>{formatDate(dateStr)}</HistoryDate>
                                <HistoryText isAdminEdit={isAdminEdit}>
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
                                    {displayText}
                                </HistoryText>
                            </HistoryItem>
                        );
                    })
                )}
            </HistoryList>
        </Root>
    );
}
