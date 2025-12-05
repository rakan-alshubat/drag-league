import { Box, Typography, Accordion, AccordionSummary, AccordionDetails } from '@mui/material';
import { styled } from '@mui/material/styles';

export const PageContainer = styled(Box)(({ theme }) => ({
    maxWidth: '900px',
    margin: '0 auto',
    padding: theme.spacing(4, 2),
    minHeight: '100vh',
    [theme.breakpoints.down('sm')]: {
        padding: theme.spacing(3, 1.5),
    },
}));

export const PageTitle = styled(Typography)(({ theme }) => ({
    fontSize: '3rem',
    fontWeight: 900,
    textAlign: 'center',
    marginBottom: theme.spacing(2),
    background: 'linear-gradient(135deg, #FF1493 0%, #9B30FF 50%, #FFD700 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    textShadow: '0 4px 20px rgba(255, 20, 147, 0.3)',
    [theme.breakpoints.down('md')]: {
        fontSize: '2.5rem',
    },
    [theme.breakpoints.down('sm')]: {
        fontSize: '2rem',
    },
}));

export const PageSubtitle = styled(Typography)(({ theme }) => ({
    fontSize: '1.2rem',
    textAlign: 'center',
    marginBottom: theme.spacing(6),
    color: theme.palette.text.secondary,
    fontWeight: 500,
    [theme.breakpoints.down('sm')]: {
        fontSize: '1rem',
        marginBottom: theme.spacing(4),
    },
}));

export const CategorySection = styled(Box)(({ theme }) => ({
    marginBottom: theme.spacing(5),
}));

export const CategoryTitle = styled(Typography)(({ theme }) => ({
    fontSize: '1.8rem',
    fontWeight: 700,
    marginBottom: theme.spacing(3),
    color: theme.palette.primary.main,
    borderBottom: `3px solid ${theme.palette.primary.main}`,
    paddingBottom: theme.spacing(1.5),
    background: 'linear-gradient(90deg, rgba(255, 20, 147, 0.1) 0%, transparent 100%)',
    paddingLeft: theme.spacing(2),
    borderRadius: theme.spacing(0.5),
    [theme.breakpoints.down('sm')]: {
        fontSize: '1.4rem',
        paddingLeft: theme.spacing(1.5),
        marginBottom: theme.spacing(2),
    },
}));

export const StyledAccordion = styled(Accordion)(({ theme }) => ({
    marginBottom: theme.spacing(2),
    borderRadius: theme.spacing(1.5),
    border: `2px solid ${theme.palette.primary.light}`,
    '&:before': {
        display: 'none',
    },
    boxShadow: '0 4px 15px rgba(255, 20, 147, 0.15)',
    transition: 'all 0.3s ease',
    '&.Mui-expanded': {
        margin: `${theme.spacing(2)} 0`,
        boxShadow: '0 8px 25px rgba(255, 20, 147, 0.25)',
        border: `2px solid ${theme.palette.primary.main}`,
    },
}));

export const StyledAccordionSummary = styled(AccordionSummary)(({ theme }) => ({
    backgroundColor: theme.palette.background.paper,
    borderRadius: theme.spacing(1.5),
    transition: 'all 0.3s ease',
    '&:hover': {
        backgroundColor: 'rgba(255, 20, 147, 0.05)',
    },
    '& .MuiAccordionSummary-content': {
        margin: `${theme.spacing(2)} 0`,
    },
    '& .MuiAccordionSummary-expandIconWrapper': {
        color: theme.palette.primary.main,
        transition: 'transform 0.3s ease',
    },
    '& .MuiAccordionSummary-expandIconWrapper.Mui-expanded': {
        transform: 'rotate(180deg)',
        color: theme.palette.secondary.main,
    },
}));

export const QuestionText = styled(Typography)(({ theme }) => ({
    fontSize: '1.15rem',
    fontWeight: 700,
    color: theme.palette.text.primary,
    [theme.breakpoints.down('sm')]: {
        fontSize: '1rem',
    },
}));

export const StyledAccordionDetails = styled(AccordionDetails)(({ theme }) => ({
    padding: theme.spacing(3),
    backgroundColor: 'rgba(255, 20, 147, 0.02)',
    borderTop: `2px solid ${theme.palette.primary.light}`,
}));

export const AnswerText = styled(Typography)(({ theme }) => ({
    fontSize: '1.05rem',
    lineHeight: 1.8,
    color: theme.palette.text.secondary,
    [theme.breakpoints.down('sm')]: {
        fontSize: '0.95rem',
        lineHeight: 1.6,
    },
}));
