import { Box, Typography, Button } from '@mui/material';
import { styled } from '@mui/material/styles';

export const PageContainer = styled(Box)(({ theme }) => ({
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    padding: theme.spacing(4),
    background: 'linear-gradient(135deg, #FF1493 0%, #9B30FF 50%, #FFD700 100%)',
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
    [theme.breakpoints.down('sm')]: {
        padding: theme.spacing(3, 2),
    },
}));

export const ContentBox = styled(Box)(({ theme }) => ({
    position: 'relative',
    zIndex: 1,
    maxWidth: '600px',
}));

export const ErrorCode = styled(Typography)(({ theme }) => ({
    fontSize: '10rem',
    fontWeight: 900,
    lineHeight: 1,
    marginBottom: theme.spacing(2),
    background: 'linear-gradient(135deg, #FFD700 0%, #FFF 50%, #FFD700 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    textShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
    animation: 'pulse 2s ease-in-out infinite',
    '@keyframes pulse': {
        '0%, 100%': { transform: 'scale(1)' },
        '50%': { transform: 'scale(1.05)' },
    },
    [theme.breakpoints.down('md')]: {
        fontSize: '8rem',
    },
    [theme.breakpoints.down('sm')]: {
        fontSize: '6rem',
    },
}));

export const ErrorTitle = styled(Typography)(({ theme }) => ({
    fontSize: '2.5rem',
    fontWeight: 700,
    color: 'white',
    marginBottom: theme.spacing(2),
    textShadow: '0 2px 10px rgba(0, 0, 0, 0.7)',
    [theme.breakpoints.down('md')]: {
        fontSize: '2rem',
    },
    [theme.breakpoints.down('sm')]: {
        fontSize: '1.5rem',
    },
}));

export const ErrorMessage = styled(Typography)(({ theme }) => ({
    fontSize: '1.2rem',
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: theme.spacing(4),
    textShadow: '0 2px 10px rgba(0, 0, 0, 0.5)',
    [theme.breakpoints.down('sm')]: {
        fontSize: '1rem',
        marginBottom: theme.spacing(3),
    },
}));

export const RedirectMessage = styled(Typography)(({ theme }) => ({
    fontSize: '1rem',
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: theme.spacing(3),
    fontStyle: 'italic',
    [theme.breakpoints.down('sm')]: {
        fontSize: '0.9rem',
    },
}));

export const HomeButton = styled(Button)(({ theme }) => ({
    backgroundColor: '#FFD700',
    color: '#000000',
    padding: '16px 48px',
    fontSize: '1.2rem',
    fontWeight: 700,
    borderRadius: '50px',
    textTransform: 'none',
    boxShadow: '0 8px 24px rgba(255, 215, 0, 0.4)',
    transition: 'all 0.3s ease',
    '&:hover': {
        backgroundColor: '#FFED4E',
        transform: 'translateY(-4px) scale(1.05)',
        boxShadow: '0 12px 32px rgba(255, 215, 0, 0.6)',
    },
    [theme.breakpoints.down('sm')]: {
        padding: '12px 36px',
        fontSize: '1rem',
        width: '100%',
    },
}));

export const CountdownText = styled('span')(({ theme }) => ({
    fontWeight: 900,
    color: '#FFD700',
    textShadow: '0 0 10px rgba(255, 215, 0, 0.8)',
}));
