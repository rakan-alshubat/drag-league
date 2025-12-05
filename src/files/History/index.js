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

    return (
        <Root>
            <Title variant="h5">{League?.lgName} - History</Title>
            <HistoryList>
                {history.length === 0 ? (
                    <Box sx={{ textAlign: 'center', mt: 4, color: '#666' }}>
                        <Typography variant="body1">No history available yet</Typography>
                    </Box>
                ) : (
                    history.map((entry, index) => {
                        const parts = entry.split('. ');
                        const dateStr = parts[0];
                        const actionText = parts.slice(1).join('. ');
                        
                        return (
                            <HistoryItem key={index}>
                                <HistoryDate>{formatDate(dateStr)}</HistoryDate>
                                <HistoryText>{actionText}</HistoryText>
                            </HistoryItem>
                        );
                    })
                )}
            </HistoryList>
        </Root>
    );
}
