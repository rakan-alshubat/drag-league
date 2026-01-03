import { styled } from "@mui/material/styles";
import { Typography, Box } from "@mui/material";

export const Root = styled(Box)({
    maxWidth: 820,
    margin: '16px auto',
    padding: 16,
    fontFamily: [
        'system-ui',
        '-apple-system',
        '"Segoe UI"',
        'Roboto',
        '"Helvetica Neue"',
        'Arial',
    ].join(','),
    color: '#222',
});

export const Title = styled(Typography)(({ theme }) => ({
    margin: 0,
    marginBottom: 20,
    fontSize: '1.5rem',
    fontWeight: 700,
    background: 'linear-gradient(135deg, #FF1493 0%, #9B30FF 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    [theme?.breakpoints?.down('sm')]: {
        fontSize: '1.3rem',
    },
}));

export const HistoryList = styled(Box)({
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
});

export const HistoryItem = styled(Box)(({ isAdminEdit, isAnnouncement }) => ({
    padding: '12px 16px',
    borderRadius: '8px',
    background: isAdminEdit 
        ? 'linear-gradient(135deg, rgba(255, 107, 53, 0.15) 0%, rgba(255, 20, 147, 0.15) 100%)'
        : isAnnouncement
            ? 'linear-gradient(135deg, rgba(74, 144, 226, 0.15) 0%, rgba(123, 104, 238, 0.15) 100%)'
            : 'linear-gradient(135deg, rgba(255, 245, 248, 0.6) 0%, rgba(245, 235, 255, 0.6) 100%)',
    border: isAdminEdit
        ? '1px solid rgba(255, 107, 53, 0.4)'
        : isAnnouncement
            ? '1px solid rgba(74, 144, 226, 0.4)'
            : '1px solid rgba(255, 20, 147, 0.2)',
    transition: 'all 0.2s ease',
    '&:hover': {
        borderColor: isAdminEdit ? '#FF6B35' : isAnnouncement ? '#4A90E2' : '#FFB6D9',
        boxShadow: isAdminEdit 
            ? '0 2px 8px rgba(255, 107, 53, 0.2)'
            : isAnnouncement
                ? '0 2px 8px rgba(74, 144, 226, 0.2)'
                : '0 2px 8px rgba(255, 20, 147, 0.1)',
    },
}));

export const HistoryDate = styled(Typography)(({ isAdminEdit, isAnnouncement }) => ({
    fontSize: '0.85rem',
    color: isAdminEdit ? '#FF6B35' : isAnnouncement ? '#4A90E2' : '#9B30FF',
    marginBottom: '6px',
    fontWeight: 600,
}));

export const HistoryText = styled(Typography)(({ isAdminEdit }) => ({
    fontSize: '1rem',
    color: '#333',
    lineHeight: 1.5,
}));
