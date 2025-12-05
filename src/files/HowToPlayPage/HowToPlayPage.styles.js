import { Box, Typography, Button } from '@mui/material';
import { styled } from '@mui/material/styles';

export const PageContainer = styled(Box)(({ theme }) => ({
    maxWidth: '1000px',
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

export const StepSection = styled(Box)(({ theme }) => ({
    marginBottom: theme.spacing(6),
    padding: theme.spacing(3),
    borderRadius: theme.spacing(2),
    background: 'linear-gradient(135deg, rgba(255, 20, 147, 0.03) 0%, rgba(255, 215, 0, 0.03) 100%)',
    border: '2px solid rgba(255, 20, 147, 0.1)',
    transition: 'all 0.3s ease',
    '&:hover': {
        border: '2px solid rgba(255, 20, 147, 0.3)',
        boxShadow: '0 8px 25px rgba(255, 20, 147, 0.15)',
        transform: 'translateY(-4px)',
    },
    [theme.breakpoints.down('sm')]: {
        marginBottom: theme.spacing(4),
        padding: theme.spacing(2),
        '&:hover': {
            transform: 'translateY(-2px)',
        },
    },
}));

export const StepHeader = styled(Box)(({ theme }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(3),
    marginBottom: theme.spacing(3),
    [theme.breakpoints.down('sm')]: {
        gap: theme.spacing(2),
        marginBottom: theme.spacing(2),
    },
}));

export const StepNumber = styled(Box)(({ theme }) => ({
    width: '60px',
    height: '60px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #FF1493 0%, #FFD700 100%)',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.8rem',
    fontWeight: 900,
    flexShrink: 0,
    boxShadow: '0 6px 20px rgba(255, 20, 147, 0.4)',
    border: '3px solid white',
    [theme.breakpoints.down('sm')]: {
        width: '50px',
        height: '50px',
        fontSize: '1.5rem',
        border: '2px solid white',
    },
}));

export const StepTitle = styled(Typography)(({ theme }) => ({
    fontSize: '2rem',
    fontWeight: 700,
    color: theme.palette.primary.main,
    [theme.breakpoints.down('sm')]: {
        fontSize: '1.5rem',
    },
}));

export const StepContent = styled(Box)(({ theme }) => ({
    paddingLeft: theme.spacing(10),
    [theme.breakpoints.down('sm')]: {
        paddingLeft: 0,
    },
}));

export const StepDescription = styled(Typography)(({ theme }) => ({
    fontSize: '1.05rem',
    lineHeight: 1.9,
    color: theme.palette.text.secondary,
    marginBottom: theme.spacing(2),
}));

export const StepList = styled('ul')(({ theme }) => ({
    marginTop: theme.spacing(2),
    paddingLeft: theme.spacing(4),
    '& li': {
        fontSize: '1.05rem',
        lineHeight: 1.9,
        color: theme.palette.text.secondary,
        marginBottom: theme.spacing(1.5),
        '&::marker': {
            color: theme.palette.primary.main,
            fontSize: '1.2rem',
        },
    },
}));

export const HighlightBox = styled(Box)(({ theme }) => ({
    background: 'linear-gradient(135deg, rgba(255, 20, 147, 0.1) 0%, rgba(255, 215, 0, 0.1) 100%)',
    padding: theme.spacing(3),
    borderRadius: theme.spacing(1.5),
    marginTop: theme.spacing(3),
    border: `3px solid ${theme.palette.primary.main}`,
    boxShadow: '0 4px 15px rgba(255, 20, 147, 0.2)',
}));

export const HighlightText = styled(Typography)(({ theme }) => ({
    fontSize: '1.05rem',
    fontWeight: 700,
    color: theme.palette.primary.main,
}));

export const ExampleBox = styled(Box)(({ theme }) => ({
    background: 'linear-gradient(135deg, rgba(155, 48, 255, 0.08) 0%, rgba(0, 206, 209, 0.08) 100%)',
    padding: theme.spacing(3),
    borderRadius: theme.spacing(1.5),
    marginTop: theme.spacing(3),
    border: `2px solid ${theme.palette.info.main}`,
    boxShadow: '0 4px 12px rgba(0, 206, 209, 0.15)',
}));

export const ExampleTitle = styled(Typography)(({ theme }) => ({
    fontSize: '1.1rem',
    fontWeight: 700,
    marginBottom: theme.spacing(1.5),
    color: theme.palette.info.main,
}));

export const ExampleText = styled(Typography)(({ theme }) => ({
    fontSize: '1rem',
    lineHeight: 1.8,
    color: theme.palette.text.secondary,
    fontStyle: 'italic',
}));

export const CTASection = styled(Box)(({ theme }) => ({
    textAlign: 'center',
    marginTop: theme.spacing(8),
    padding: theme.spacing(5),
    background: 'linear-gradient(135deg, #FF1493 0%, #9B30FF 50%, #FFD700 100%)',
    borderRadius: theme.spacing(3),
    color: 'white',
    boxShadow: '0 10px 35px rgba(255, 20, 147, 0.4)',
    position: 'relative',
    overflow: 'hidden',
    '&::before': {
        content: '""',
        position: 'absolute',
        top: '-50%',
        left: '-50%',
        width: '200%',
        height: '200%',
        background: 'radial-gradient(circle, rgba(255, 255, 255, 0.1) 1px, transparent 1px)',
        backgroundSize: '20px 20px',
        animation: 'sparkle 15s linear infinite',
    },
    '@keyframes sparkle': {
        '0%': { transform: 'translate(0, 0)' },
        '100%': { transform: 'translate(40px, 40px)' },
    },
    [theme.breakpoints.down('sm')]: {
        marginTop: theme.spacing(5),
        padding: theme.spacing(3),
        borderRadius: theme.spacing(2),
    },
}));

export const CTATitle = styled(Typography)(({ theme }) => ({
    fontSize: '2.2rem',
    fontWeight: 900,
    marginBottom: theme.spacing(2),
    textShadow: '0 4px 15px rgba(0, 0, 0, 0.3)',
    position: 'relative',
    zIndex: 1,
    [theme.breakpoints.down('sm')]: {
        fontSize: '1.6rem',
    },
}));

export const CTAButton = styled(Button)(({ theme }) => ({
    padding: '16px 48px',
    fontSize: '1.2rem',
    fontWeight: 700,
    borderRadius: '50px',
    textTransform: 'none',
    backgroundColor: 'white',
    color: theme.palette.primary.main,
    boxShadow: '0 6px 20px rgba(0, 0, 0, 0.3)',
    position: 'relative',
    zIndex: 1,
    transition: 'all 0.3s ease',
    '&:hover': {
        backgroundColor: theme.palette.secondary.main,
        color: 'white',
        transform: 'scale(1.08)',
        boxShadow: '0 8px 30px rgba(255, 215, 0, 0.5)',
    },
    [theme.breakpoints.down('sm')]: {
        padding: '12px 32px',
        fontSize: '1rem',
        width: '100%',
        maxWidth: '300px',
    },
}));
