import { styled } from "@mui/material/styles";
import { Typography, Box } from "@mui/material";

export const Root = styled(Box)({
    padding: '20px',
    maxWidth: '900px',
    margin: '0 auto',
});

export const Title = styled(Typography)({
    marginBottom: '24px',
    fontWeight: 600,
    color: '#333',
});

export const HistoryList = styled(Box)({
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
});

export const HistoryItem = styled(Box)({
    backgroundColor: '#f8f9fa',
    padding: '16px',
    borderRadius: '8px',
    borderLeft: '4px solid #007bff',
    transition: 'all 0.2s ease',
    '&:hover': {
        backgroundColor: '#e9ecef',
        transform: 'translateX(4px)',
    },
});

export const HistoryDate = styled(Typography)({
    fontSize: '0.875rem',
    color: '#666',
    marginBottom: '8px',
    fontStyle: 'italic',
});

export const HistoryText = styled(Typography)({
    fontSize: '1rem',
    color: '#333',
    lineHeight: 1.5,
});
