import { styled } from '@mui/material/styles';
import { Box, Button, Paper, Typography } from '@mui/material';

export const Container = styled(Box)(({ theme }) => ({
    minHeight: '100vh',
    background: 'linear-gradient(135deg, rgba(255, 245, 248, 0.6) 0%, rgba(245, 235, 255, 0.6) 100%)',
    padding: theme.spacing(4),
    [theme.breakpoints.down('sm')]: {
        padding: theme.spacing(2),
    },
}));

export const ContentWrapper = styled(Box)(({ theme }) => ({
    maxWidth: '1200px',
    margin: '0 auto',
}));

export const Title = styled(Typography)(({ theme }) => ({
    fontSize: '2rem',
    fontWeight: 700,
    background: 'linear-gradient(135deg, #FF1493 0%, #9B30FF 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    marginBottom: theme.spacing(3),
    textAlign: 'center',
}));

export const ChoiceContainer = styled(Box)(({ theme }) => ({
    display: 'flex',
    gap: theme.spacing(3),
    justifyContent: 'center',
    marginTop: theme.spacing(4),
    [theme.breakpoints.down('md')]: {
        flexDirection: 'column',
        alignItems: 'center',
    },
}));

export const ChoiceCard = styled(Paper)(({ theme }) => ({
    padding: theme.spacing(4),
    background: 'rgba(255, 255, 255, 0.95)',
    border: '2px solid rgba(255, 20, 147, 0.2)',
    borderRadius: '16px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    minWidth: '300px',
    textAlign: 'center',
    '&:hover': {
        transform: 'translateY(-4px)',
        boxShadow: '0 8px 24px rgba(255, 20, 147, 0.3)',
        border: '2px solid rgba(255, 20, 147, 0.5)',
    },
}));

export const ChoiceTitle = styled(Typography)(({ theme }) => ({
    fontSize: '1.5rem',
    fontWeight: 600,
    background: 'linear-gradient(135deg, #FF1493 0%, #9B30FF 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    marginBottom: theme.spacing(2),
}));

export const ChoiceDescription = styled(Typography)(({ theme }) => ({
    fontSize: '1rem',
    color: '#666',
    marginBottom: theme.spacing(2),
}));

export const BackButton = styled(Button)(({ theme }) => ({
    marginBottom: theme.spacing(3),
    color: '#FF1493',
    borderColor: '#FF1493',
    '&:hover': {
        borderColor: '#9B30FF',
        background: 'rgba(255, 20, 147, 0.05)',
    },
}));

export const EditorContainer = styled(Paper)(({ theme }) => ({
    padding: theme.spacing(4),
    background: 'rgba(255, 255, 255, 0.95)',
    border: '2px solid rgba(255, 20, 147, 0.2)',
    borderRadius: '16px',
    marginTop: theme.spacing(3),
}));

export const Section = styled(Box)(({ theme }) => ({
    marginBottom: theme.spacing(4),
    padding: theme.spacing(3),
    background: 'rgba(255, 245, 248, 0.3)',
    borderRadius: '12px',
    border: '1px solid rgba(255, 20, 147, 0.2)',
}));

export const SectionTitle = styled(Typography)(({ theme }) => ({
    fontSize: '1.25rem',
    fontWeight: 600,
    background: 'linear-gradient(135deg, #FF1493 0%, #9B30FF 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    marginBottom: theme.spacing(2),
}));

export const EntryRow = styled(Box)(({ theme }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(2),
    marginBottom: theme.spacing(2),
    padding: theme.spacing(2),
    background: 'white',
    borderRadius: '8px',
    border: '1px solid rgba(255, 20, 147, 0.1)',
}));

export const EntryLabel = styled(Typography)(({ theme }) => ({
    fontSize: '1rem',
    fontWeight: 500,
    minWidth: '120px',
    color: '#333',
}));

export const PlayerListContainer = styled(Box)(({ theme }) => ({
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: theme.spacing(2),
    marginTop: theme.spacing(3),
}));

export const PlayerCard = styled(Paper)(({ theme }) => ({
    padding: theme.spacing(2.5),
    background: 'rgba(255, 255, 255, 0.95)',
    border: '2px solid rgba(255, 20, 147, 0.2)',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    '&:hover': {
        transform: 'translateY(-2px)',
        boxShadow: '0 6px 20px rgba(255, 20, 147, 0.2)',
        border: '2px solid rgba(255, 20, 147, 0.4)',
    },
}));

export const PlayerName = styled(Typography)(({ theme }) => ({
    fontSize: '1.1rem',
    fontWeight: 600,
    background: 'linear-gradient(135deg, #FF1493 0%, #9B30FF 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    marginBottom: theme.spacing(0.5),
}));

export const PlayerEmail = styled(Typography)(({ theme }) => ({
    fontSize: '0.9rem',
    color: '#666',
}));

export const ActionButtons = styled(Box)(({ theme }) => ({
    display: 'flex',
    gap: theme.spacing(2),
    justifyContent: 'flex-end',
    marginTop: theme.spacing(4),
    paddingTop: theme.spacing(3),
    borderTop: '1px solid rgba(255, 20, 147, 0.2)',
}));

export const ConfirmButton = styled(Button)(({ theme }) => ({
    background: 'linear-gradient(135deg, #FF1493 0%, #9B30FF 100%)',
    color: 'white',
    padding: theme.spacing(1.5, 4),
    fontSize: '1rem',
    fontWeight: 600,
    borderRadius: '8px',
    textTransform: 'none',
    '&:hover': {
        background: 'linear-gradient(135deg, #E6127F 0%, #8A2BE2 100%)',
    },
    '&:disabled': {
        background: '#ccc',
        color: '#666',
    },
}));

export const CancelButton = styled(Button)(({ theme }) => ({
    color: '#FF1493',
    borderColor: '#FF1493',
    padding: theme.spacing(1.5, 4),
    fontSize: '1rem',
    fontWeight: 600,
    borderRadius: '8px',
    textTransform: 'none',
    '&:hover': {
        borderColor: '#9B30FF',
        background: 'rgba(255, 20, 147, 0.05)',
    },
}));

export const SummaryDialog = styled(Box)(({ theme }) => ({
    padding: theme.spacing(3),
}));

export const SummarySection = styled(Box)(({ theme }) => ({
    marginBottom: theme.spacing(3),
    padding: theme.spacing(2),
    background: 'rgba(255, 245, 248, 0.3)',
    borderRadius: '8px',
}));

export const SummaryTitle = styled(Typography)(({ theme }) => ({
    fontSize: '1.1rem',
    fontWeight: 600,
    color: '#FF1493',
    marginBottom: theme.spacing(1),
}));

export const SummaryItem = styled(Box)(({ theme }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
    marginBottom: theme.spacing(0.5),
    fontSize: '0.95rem',
}));

export const ChangeIndicator = styled('span')(({ theme }) => ({
    color: '#FF1493',
    fontWeight: 600,
}));
