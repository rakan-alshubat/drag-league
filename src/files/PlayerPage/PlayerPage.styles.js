import { Box, Typography} from '@mui/material';
import { styled } from '@mui/material/styles';

// Styled Components with RuPaul's Drag Race Theme
export const WelcomeBanner = styled(Box)(({ theme }) => ({
    width: '80%',
    background: 'linear-gradient(135deg, #FF1493 0%, #9B30FF 50%, #FFD700 100%)',
    padding: theme.spacing(4),
    marginBottom: theme.spacing(4),
    marginTop: theme.spacing(5),
    marginLeft: 'auto',
    marginRight: 'auto',
    borderRadius: theme.spacing(2),
    boxShadow: '0 8px 30px rgba(255, 20, 147, 0.4)',
    border: '3px solid rgba(255, 215, 0, 0.5)',
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
        backgroundSize: '30px 30px',
        animation: 'sparkleMove 20s linear infinite',
    },
    '@keyframes sparkleMove': {
        '0%': { transform: 'translate(0, 0)' },
        '100%': { transform: 'translate(50px, 50px)' },
    },
    [theme.breakpoints.down('md')]: {
        width: '85%',
        padding: theme.spacing(3),
        marginTop: theme.spacing(4),
    },
    [theme.breakpoints.down('sm')]: {
        width: '90%',
        padding: theme.spacing(2),
        marginTop: theme.spacing(3),
        marginBottom: theme.spacing(3),
    },
}));

export const WelcomeText = styled(Typography)(({ theme }) => ({
    color: '#ffffff',
    textAlign: 'center',
    fontSize: '2.5rem',
    fontWeight: 900,
    textShadow: '0 4px 15px rgba(0, 0, 0, 0.5), 0 0 30px rgba(255, 215, 0, 0.4)',
    letterSpacing: '1px',
    position: 'relative',
    zIndex: 1,
    [theme.breakpoints.down('md')]: {
        fontSize: '2rem',
    },
    [theme.breakpoints.down('sm')]: {
        fontSize: '1.5rem',
        letterSpacing: '0.5px',
    },
}));

export const ContentContainer = styled(Box)(({ theme }) => ({
    maxWidth: '900px',
    margin: '0 auto',
    padding: theme.spacing(3),
    background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.98) 0%, rgba(255, 250, 250, 0.95) 100%)',
    borderRadius: theme.spacing(2),
    boxShadow: '0 4px 20px rgba(255, 20, 147, 0.15)',
    [theme.breakpoints.down('md')]: {
        padding: theme.spacing(2),
    },
    [theme.breakpoints.down('sm')]: {
        padding: theme.spacing(1.5),
        borderRadius: theme.spacing(1),
    },
}));

export const LeagueSection = styled(Box)(({ theme }) => ({
    marginTop: theme.spacing(3),
}));

export const LeagueList = styled(Box)(({ theme }) => ({
    padding: theme.spacing(3),
    border: `2px solid ${theme.palette.primary.main}`,
    borderRadius: theme.spacing(2),
    marginTop: theme.spacing(2),
    background: 'linear-gradient(135deg, rgba(255, 20, 147, 0.05) 0%, rgba(255, 215, 0, 0.05) 100%)',
    boxShadow: '0 4px 15px rgba(255, 20, 147, 0.1)',
    transition: 'all 0.3s ease',
    '&:hover': {
        boxShadow: '0 6px 25px rgba(255, 20, 147, 0.2)',
        transform: 'translateY(-2px)',
    },
    [theme.breakpoints.down('sm')]: {
        padding: theme.spacing(2),
        marginTop: theme.spacing(1.5),
    },
    // Limit height and allow scrolling when there are many leagues
    maxHeight: '360px',
    overflowY: 'auto',
    // subtle scrollbar styling
    '&::-webkit-scrollbar': {
        width: '10px',
    },
    '&::-webkit-scrollbar-thumb': {
        background: 'rgba(0,0,0,0.12)',
        borderRadius: '6px',
    },
}));

export const LeagueLink = styled(Typography)(({ theme }) => ({
    cursor: 'pointer',
    color: theme.palette.text.primary,
    fontWeight: 600,
    padding: theme.spacing(1.5, 0),
    transition: 'all 0.3s ease',
    borderLeft: '4px solid transparent',
    paddingLeft: theme.spacing(2),
    '&:hover': {
        color: theme.palette.primary.main,
        borderLeft: `4px solid ${theme.palette.primary.main}`,
        paddingLeft: theme.spacing(3),
        transform: 'translateX(5px)',
    },
}));

export const ButtonContainer = styled(Box)(({ theme }) => ({
    display: 'flex',
    gap: theme.spacing(2),
    marginTop: theme.spacing(3),
    justifyContent: 'center',
    [theme.breakpoints.down('sm')]: {
        flexDirection: 'column',
        gap: theme.spacing(1.5),
    },
}));

export const EmptyState = styled(Box)(({ theme }) => ({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing(6, 3),
    textAlign: 'center',
    minHeight: '300px',
    background: 'linear-gradient(135deg, rgba(255, 20, 147, 0.03) 0%, rgba(255, 215, 0, 0.03) 100%)',
    borderRadius: theme.spacing(2),
    border: `2px dashed ${theme.palette.primary.light}`,
    [theme.breakpoints.down('sm')]: {
        padding: theme.spacing(4, 2),
        minHeight: '250px',
    },
}));

export const EmptyStateIcon = styled(Box)(({ theme }) => ({
    fontSize: '4rem',
    marginBottom: theme.spacing(2),
    opacity: 0.6,
    [theme.breakpoints.down('sm')]: {
        fontSize: '3rem',
    },
}));

export const EmptyStateTitle = styled(Typography)(({ theme }) => ({
    fontSize: '1.5rem',
    fontWeight: 700,
    color: theme.palette.primary.main,
    marginBottom: theme.spacing(1),
    [theme.breakpoints.down('sm')]: {
        fontSize: '1.25rem',
    },
}));

export const EmptyStateDescription = styled(Typography)(({ theme }) => ({
    fontSize: '1rem',
    color: theme.palette.text.secondary,
    marginBottom: theme.spacing(3),
    maxWidth: '400px',
    [theme.breakpoints.down('sm')]: {
        fontSize: '0.9rem',
    },
}));

export const SearchResultCard = styled(Box)(({ theme }) => ({
    padding: theme.spacing(2),
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: theme.spacing(1),
    marginBottom: theme.spacing(2),
    transition: 'all 0.2s ease',
    cursor: 'pointer',
    '&:hover': {
        borderColor: theme.palette.primary.main,
        boxShadow: '0 4px 12px rgba(255, 20, 147, 0.15)',
        transform: 'translateY(-2px)',
    },
    [theme.breakpoints.down('sm')]: {
        padding: theme.spacing(1.5),
    },
}));

export const SearchResultTitle = styled(Typography)(({ theme }) => ({
    fontWeight: 600,
    fontSize: '1.1rem',
    color: '#FF1493',
    marginBottom: theme.spacing(0.5),
    [theme.breakpoints.down('sm')]: {
        fontSize: '1rem',
    },
}));

export const SearchResultDescription = styled(Typography)(({ theme }) => ({
    fontSize: '0.9rem',
    color: theme.palette.text.secondary,
    marginBottom: theme.spacing(1),
    [theme.breakpoints.down('sm')]: {
        fontSize: '0.85rem',
    },
}));

export const SearchResultMeta = styled(Box)(({ theme }) => ({
    display: 'flex',
    gap: theme.spacing(2),
    fontSize: '0.85rem',
    color: theme.palette.text.secondary,
    [theme.breakpoints.down('sm')]: {
        flexDirection: 'column',
        gap: theme.spacing(0.5),
        fontSize: '0.8rem',
    },
}));