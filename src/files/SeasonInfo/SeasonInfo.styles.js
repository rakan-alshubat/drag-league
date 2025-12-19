// ...existing code...
import { styled } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';

export const Root = styled('div')(({ theme }) => ({
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
    color: theme?.palette?.text?.primary ?? '#222',
    [theme.breakpoints.down('sm')]: {
        padding: 12,
        margin: '12px auto',
    },
}));

export const Title = styled(Typography)(({ theme }) => ({
    margin: 0,
    marginBottom: 16,
    fontSize: '1.5rem',
    fontWeight: 700,
    background: 'linear-gradient(135deg, #FF1493 0%, #9B30FF 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    [theme.breakpoints.down('sm')]: {
        fontSize: '1.3rem',
    },
}));

export const List = styled('div')(() => ({
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
}));

export const StyledAccordion = styled(Accordion)(({ theme }) => ({
    border: `2px solid ${theme?.palette?.divider ?? '#e6e6e6'}`,
    borderRadius: 8,
    background: theme?.palette?.background?.paper ?? '#fff',
    overflow: 'hidden',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
    transition: 'all 0.2s ease',
    '&.Mui-expanded': {
        margin: 'initial',
        boxShadow: '0 4px 12px rgba(255, 20, 147, 0.15)',
        borderColor: '#FFB6D9',
    },
    '&:hover': {
        borderColor: '#FFB6D9',
        boxShadow: '0 4px 12px rgba(255, 20, 147, 0.1)',
    },
    '&:before': {
        display: 'none',
    },
}));

export const StyledSummary = styled(AccordionSummary)(({ theme }) => ({
    padding: '14px 20px',
    minHeight: 56,
    transition: 'background 0.2s ease',
    '&.Mui-expanded': {
        minHeight: 56,
        background: 'linear-gradient(135deg, rgba(255, 20, 147, 0.03) 0%, rgba(155, 48, 255, 0.03) 100%)',
    },
    '&:hover': {
        background: 'linear-gradient(135deg, rgba(255, 20, 147, 0.05) 0%, rgba(155, 48, 255, 0.05) 100%)',
    },
    '& .MuiAccordionSummary-expandIconWrapper': {
        color: '#FF1493',
        transition: 'transform 0.3s ease, color 0.2s ease',
    },
    '& .MuiAccordionSummary-expandIconWrapper.Mui-expanded': {
        color: '#9B30FF',
    },
}));

export const SummaryText = styled(Typography)(() => ({
    fontWeight: 600,
    fontSize: '1.05rem',
    color: '#333',
}));

export const StyledDetails = styled(AccordionDetails)(({ theme }) => ({
    padding: '16px 20px',
    borderTop: `2px solid ${theme?.palette?.divider ?? '#f4f4f4'}`,
    background: 'linear-gradient(135deg, rgba(255, 255, 255, 1) 0%, rgba(255, 245, 248, 1) 100%)',
    color: theme?.palette?.text?.primary ?? '#333',
    fontSize: '1rem',
}));
// ...existing code...