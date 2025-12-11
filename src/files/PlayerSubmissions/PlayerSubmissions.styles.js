// ...existing code...
import { styled } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import { Chip } from '@mui/material';

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

export const OverallSubmissionsBox = styled('div')(({ theme }) => ({
    padding: 20,
    marginBottom: 20,
    borderRadius: 12,
    background: 'linear-gradient(135deg, rgba(255, 20, 147, 0.05) 0%, rgba(155, 48, 255, 0.05) 100%)',
    border: `2px solid transparent`,
    backgroundImage: 'linear-gradient(white, white), linear-gradient(135deg, #FF1493 0%, #9B30FF 100%)',
    backgroundOrigin: 'border-box',
    backgroundClip: 'padding-box, border-box',
    boxShadow: '0 4px 16px rgba(255, 20, 147, 0.15)',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
    '&:hover': {
        transform: 'translateY(-2px)',
        boxShadow: '0 6px 20px rgba(255, 20, 147, 0.25)',
    },
    [theme.breakpoints.down('sm')]: {
        padding: 16,
    },
}));

export const SubmissionChip = styled(Chip)(({ theme }) => ({
    backgroundColor: '#FFE4F2',
    color: '#FF1493',
    fontWeight: 600,
    fontSize: '0.875rem',
    border: '1px solid #FF1493',
    '&:hover': {
        backgroundColor: '#FFD1E9',
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
    // prevent default expanded margin applied by MUI
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
        display: 'none', // Remove MUI default divider
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
    fontSize: '1.3rem',
    color: '#333',
}));

export const StyledDetails = styled(AccordionDetails)(({ theme }) => ({
    padding: '16px 20px',
    borderTop: `2px solid ${theme?.palette?.divider ?? '#f4f4f4'}`,
    background: 'linear-gradient(135deg, rgba(255, 255, 255, 1) 0%, rgba(255, 245, 248, 1) 100%)',
    color: theme?.palette?.text?.primary ?? '#333',
    fontSize: '0.95rem',
}));

// Nested accordion styling (for Rankings, Winners, Bonuses)
export const NestedAccordion = styled(Accordion)(({ theme }) => ({
    border: `1px solid ${theme?.palette?.divider ?? '#e0e0e0'}`,
    borderRadius: 6,
    background: '#fff',
    overflow: 'hidden',
    boxShadow: '0 1px 4px rgba(0, 0, 0, 0.05)',
    marginBottom: 12,
    transition: 'all 0.2s ease',
    '&.Mui-expanded': {
        margin: '0 0 12px 0',
        boxShadow: '0 2px 8px rgba(155, 48, 255, 0.1)',
    },
    '&:hover': {
        boxShadow: '0 2px 8px rgba(155, 48, 255, 0.08)',
    },
    '&:before': {
        display: 'none',
    },
    '&:last-child': {
        marginBottom: 0,
    },
}));

export const NestedSummary = styled(AccordionSummary)(() => ({
    padding: '10px 16px',
    minHeight: 44,
    '&.Mui-expanded': {
        minHeight: 44,
        background: 'rgba(155, 48, 255, 0.02)',
    },
    '& .MuiAccordionSummary-expandIconWrapper': {
        color: '#9B30FF',
    },
}));

export const NestedSummaryText = styled(Typography)(() => ({
    fontWeight: 600,
    fontSize: '1rem',
    color: '#555',
}));

export const NestedDetails = styled(AccordionDetails)(() => ({
    padding: '12px 16px',
    background: '#fafafa',
    borderTop: '1px solid #f0f0f0',
}));

// Styled ordered list
export const StyledOrderedList = styled('ol')(() => ({
    margin: 0,
    paddingLeft: 24,
    '& li': {
        marginBottom: 8,
        color: '#333',
        fontSize: '0.9rem',
        lineHeight: 1.6,
        transition: 'color 0.2s ease',
        '&:hover': {
            color: '#FF1493',
        },
    },
    '& li:last-child': {
        marginBottom: 0,
    },
}));