import { Box, Typography, Button } from '@mui/material';
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

export const SupportSection = styled(Box)(({ theme }) => ({
    marginBottom: theme.spacing(5),
    padding: theme.spacing(4),
    background: 'linear-gradient(135deg, rgba(255, 20, 147, 0.05) 0%, rgba(255, 215, 0, 0.05) 100%)',
    borderRadius: theme.spacing(3),
    boxShadow: '0 6px 25px rgba(255, 20, 147, 0.15)',
    border: `2px solid ${theme.palette.primary.light}`,
    transition: 'all 0.3s ease',
    '&:hover': {
        boxShadow: '0 10px 35px rgba(255, 20, 147, 0.25)',
        transform: 'translateY(-4px)',
        border: `2px solid ${theme.palette.primary.main}`,
    },
    [theme.breakpoints.down('sm')]: {
        marginBottom: theme.spacing(3),
        padding: theme.spacing(2.5),
        borderRadius: theme.spacing(2),
        '&:hover': {
            transform: 'translateY(-2px)',
        },
    },
}));

export const SectionTitle = styled(Typography)(({ theme }) => ({
    fontSize: '2rem',
    fontWeight: 700,
    marginBottom: theme.spacing(2),
    color: theme.palette.primary.main,
    [theme.breakpoints.down('sm')]: {
        fontSize: '1.6rem',
    },
}));

export const SectionDescription = styled(Typography)(({ theme }) => ({
    fontSize: '1.05rem',
    lineHeight: 1.9,
    marginBottom: theme.spacing(3),
    color: theme.palette.text.secondary,
}));

export const ButtonGroup = styled(Box)(({ theme }) => ({
    display: 'flex',
    gap: theme.spacing(2),
    flexWrap: 'wrap',
    [theme.breakpoints.down('sm')]: {
        flexDirection: 'column',
    },
}));

export const StyledButton = styled(Button)(({ theme }) => ({
    padding: '14px 32px',
    fontSize: '1.05rem',
    fontWeight: 700,
    borderRadius: '50px',
    textTransform: 'none',
    boxShadow: '0 6px 20px rgba(255, 20, 147, 0.25)',
    transition: 'all 0.3s ease',
    '&:hover': {
        transform: 'translateY(-4px) scale(1.03)',
        boxShadow: '0 10px 30px rgba(255, 20, 147, 0.35)',
    },
    [theme.breakpoints.down('sm')]: {
        padding: '10px 24px',
        fontSize: '0.95rem',
        width: '100%',
    },
}));

export const IconWrapper = styled(Box)(({ theme }) => ({
    marginRight: theme.spacing(1),
    display: 'flex',
    alignItems: 'center',
}));

export const FeatureList = styled('ul')(({ theme }) => ({
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
    background: 'linear-gradient(135deg, rgba(255, 20, 147, 0.15) 0%, rgba(255, 215, 0, 0.15) 100%)',
    padding: theme.spacing(4),
    borderRadius: theme.spacing(2),
    marginTop: theme.spacing(3),
    textAlign: 'center',
    border: `3px solid ${theme.palette.secondary.main}`,
    boxShadow: '0 6px 20px rgba(255, 215, 0, 0.3)',
}));

export const HighlightTitle = styled(Typography)(({ theme }) => ({
    fontSize: '1.8rem',
    fontWeight: 900,
    marginBottom: theme.spacing(1),
    color: theme.palette.primary.main,
}));

export const HighlightText = styled(Typography)(({ theme }) => ({
    fontSize: '1.1rem',
    color: theme.palette.text.primary,
    fontWeight: 600,
}));

export const CoffeeButton = styled(Button)(({ theme }) => ({
    backgroundColor: '#FFDD00',
    color: '#000000',
    padding: '14px 32px',
    fontSize: '1.05rem',
    fontWeight: 700,
    borderRadius: '50px',
    textTransform: 'none',
    boxShadow: '0 6px 20px rgba(255, 221, 0, 0.4)',
    transition: 'all 0.3s ease',
    '&:hover': {
        backgroundColor: '#FFED4E',
        transform: 'translateY(-4px) scale(1.03)',
        boxShadow: '0 10px 30px rgba(255, 221, 0, 0.5)',
    },
    [theme.breakpoints.down('sm')]: {
        padding: '10px 24px',
        fontSize: '0.95rem',
        width: '100%',
    },
}));

export const StyledIcon = styled('span')(({ theme }) => ({
    marginRight: theme.spacing(1),
    display: 'inline-flex',
    alignItems: 'center',
}));

export const WIPBanner = styled(Box)(({ theme }) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    gap: theme.spacing(1),
    background: 'linear-gradient(90deg, rgba(255,240,245,0.9) 0%, rgba(255,250,230,0.9) 100%)',
    border: `1px solid rgba(255, 64, 129, 0.12)`,
    color: theme.palette.primary.main,
    padding: theme.spacing(1.25, 2),
    borderRadius: theme.spacing(3),
    marginBottom: theme.spacing(4),
    fontWeight: 800,
    fontSize: '1rem',
    boxShadow: '0 6px 18px rgba(255, 64, 129, 0.06)',
    [theme.breakpoints.down('sm')]: {
        marginBottom: theme.spacing(3),
        padding: theme.spacing(1, 1.5),
        fontSize: '0.95rem',
    },
}));
