import { Box, Typography, Button } from '@mui/material';
import { styled } from '@mui/material/styles';

export const PageContainer = styled(Box)(({ theme }) => ({
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    background: 'linear-gradient(180deg, #1a0033 0%, #330066 100%)',
}));

export const HeroSection = styled(Box)(({ theme }) => ({
    minHeight: '75vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    padding: theme.spacing(6, 4),
    background: 'linear-gradient(135deg, #FF1493 0%, #9B30FF 50%, #FFD700 100%)',
    color: 'white',
    position: 'relative',
    overflow: 'hidden',
    '&::before': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'radial-gradient(circle at 20% 50%, rgba(255, 215, 0, 0.2) 0%, transparent 50%), radial-gradient(circle at 80% 50%, rgba(255, 20, 147, 0.2) 0%, transparent 50%)',
        animation: 'sparkle 4s ease-in-out infinite',
    },
    '@keyframes sparkle': {
        '0%, 100%': { opacity: 0.5 },
        '50%': { opacity: 1 },
    },
    [theme.breakpoints.down('md')]: {
        minHeight: '60vh',
        padding: theme.spacing(4, 3),
    },
    [theme.breakpoints.down('sm')]: {
        minHeight: '50vh',
        padding: theme.spacing(3, 2),
    },
}));

export const Title = styled(Typography)(({ theme }) => ({
    fontSize: '4rem',
    fontWeight: 900,
    marginBottom: theme.spacing(2),
    textShadow: '0 4px 20px rgba(0, 0, 0, 0.5), 0 0 40px rgba(255, 215, 0, 0.6)',
    letterSpacing: '2px',
    background: 'linear-gradient(135deg, #FFD700 0%, #FFF 50%, #FFD700 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    animation: 'shine 3s ease-in-out infinite',
    position: 'relative',
    zIndex: 1,
    [theme.breakpoints.down('md')]: {
        fontSize: '3rem',
    },
    [theme.breakpoints.down('sm')]: {
        fontSize: '2.5rem',
    },
    '@keyframes shine': {
        '0%, 100%': { filter: 'brightness(1)' },
        '50%': { filter: 'brightness(1.3)' },
    },
}));

export const Subtitle = styled(Typography)(({ theme }) => ({
    fontSize: '1.6rem',
    marginBottom: theme.spacing(4),
    maxWidth: '700px',
    textShadow: '0 2px 10px rgba(0, 0, 0, 0.7)',
    fontWeight: 500,
    position: 'relative',
    zIndex: 1,
    [theme.breakpoints.down('md')]: {
        fontSize: '1.3rem',
    },
    [theme.breakpoints.down('sm')]: {
        fontSize: '1.1rem',
    },
}));

export const ButtonGroup = styled(Box)(({ theme }) => ({
    display: 'flex',
    gap: theme.spacing(3),
    marginTop: theme.spacing(3),
    position: 'relative',
    zIndex: 1,
    [theme.breakpoints.down('sm')]: {
        flexDirection: 'column',
        width: '100%',
        maxWidth: '350px',
    },
}));

export const StyledButton = styled(Button)(({ theme }) => ({
    padding: '16px 40px',
    fontSize: '1.2rem',
    fontWeight: 700,
    borderRadius: '50px',
    textTransform: 'none',
    boxShadow: '0 8px 25px rgba(0,0,0,0.3)',
    transition: 'all 0.3s ease',
    border: '2px solid transparent',
    '&:hover': {
        transform: 'translateY(-4px) scale(1.05)',
        boxShadow: '0 12px 35px rgba(255, 215, 0, 0.5)',
    },
    [theme.breakpoints.down('md')]: {
        padding: '12px 32px',
        fontSize: '1.1rem',
    },
    [theme.breakpoints.down('sm')]: {
        padding: '10px 24px',
        fontSize: '1rem',
        width: '100%',
    },
}));

export const InfoSection = styled(Box)(({ theme }) => ({
    padding: theme.spacing(10, 4),
    textAlign: 'center',
    maxWidth: '1200px',
    margin: '0 auto',
    background: 'linear-gradient(180deg, #330066 0%, #1a0033 100%)',
    color: 'white',
    [theme.breakpoints.down('md')]: {
        padding: theme.spacing(6, 3),
    },
    [theme.breakpoints.down('sm')]: {
        padding: theme.spacing(4, 2),
    },
}));

export const FeatureGrid = styled(Box)(({ theme }) => ({
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: theme.spacing(5),
    marginTop: theme.spacing(6),
}));

export const FeatureCard = styled(Box)(({ theme }) => ({
    padding: theme.spacing(4),
    borderRadius: '20px',
    background: 'linear-gradient(135deg, rgba(255, 20, 147, 0.1) 0%, rgba(155, 48, 255, 0.1) 100%)',
    border: '2px solid rgba(255, 20, 147, 0.3)',
    boxShadow: '0 8px 25px rgba(255, 20, 147, 0.2)',
    transition: 'all 0.3s ease',
    backdropFilter: 'blur(10px)',
    '&:hover': {
        transform: 'translateY(-10px) scale(1.03)',
        boxShadow: '0 15px 40px rgba(255, 20, 147, 0.4)',
        border: '2px solid rgba(255, 215, 0, 0.6)',
        background: 'linear-gradient(135deg, rgba(255, 20, 147, 0.2) 0%, rgba(155, 48, 255, 0.2) 100%)',
    },
    [theme.breakpoints.down('md')]: {
        padding: theme.spacing(3),
    },
    [theme.breakpoints.down('sm')]: {
        padding: theme.spacing(2.5),
        '&:hover': {
            transform: 'translateY(-5px) scale(1.01)',
        },
    },
}));
