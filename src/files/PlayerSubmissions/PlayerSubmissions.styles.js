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
    marginBottom: 12,
    fontSize: '1.25rem',
    fontWeight: 600,
    [theme.breakpoints.down('sm')]: {
        fontSize: '1.1rem',
    },
}));

export const List = styled('div')(() => ({
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
}));

export const StyledAccordion = styled(Accordion)(({ theme }) => ({
    border: `1px solid ${theme?.palette?.divider ?? '#e6e6e6'}`,
    borderRadius: 6,
    background: theme?.palette?.background?.paper ?? '#fff',
    overflow: 'hidden',
    // prevent default expanded margin applied by MUI
    '&.Mui-expanded': {
        margin: 'initial',
    },
}));

export const StyledSummary = styled(AccordionSummary)(() => ({
    padding: '12px 16px',
    minHeight: 48,
    '&.Mui-expanded': {
        minHeight: 48,
    },
}));

export const SummaryText = styled(Typography)(() => ({
    fontWeight: 600,
}));

export const StyledDetails = styled(AccordionDetails)(({ theme }) => ({
    padding: '12px 16px',
    borderTop: `1px solid ${theme?.palette?.divider ?? '#f4f4f4'}`,
    background: theme?.palette?.action?.hover ?? '#fafafa',
    color: theme?.palette?.text?.primary ?? '#333',
    fontSize: '0.95rem',
}));