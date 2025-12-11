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
    marginBottom: 20,
    fontSize: '1.5rem',
    fontWeight: 700,
    background: 'linear-gradient(135deg, #FF1493 0%, #9B30FF 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    [theme.breakpoints.down('sm')]: {
        fontSize: '1.3rem',
    },
}));

export const SettingSection = styled('div')(({ theme }) => ({
    marginBottom: 24,
    padding: 20,
    backgroundColor: theme?.palette?.background?.paper ?? '#fff',
    borderRadius: 8,
    border: '2px solid rgba(255, 20, 147, 0.2)',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
    transition: 'all 0.2s ease',
    '&:hover': {
        borderColor: '#FFB6D9',
    },
    [theme.breakpoints.down('sm')]: {
        padding: 16,
        marginBottom: 16,
    },
}));

export const SectionTitle = styled(Typography)(({ theme }) => ({
    marginBottom: 12,
    fontSize: '1.05rem',
    fontWeight: 600,
    color: '#9B30FF',
}));

export const List = styled('div')(() => ({
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
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
    },
    '&:before': {
        display: 'none',
    },
}));

export const StyledSummary = styled(AccordionSummary)(({ theme }) => ({
    padding: '14px 20px',
    minHeight: 56,
    background: 'linear-gradient(135deg, rgba(255, 245, 248, 0.4) 0%, rgba(245, 235, 255, 0.4) 100%)',
    '&.Mui-expanded': {
        minHeight: 56,
    },
    [theme.breakpoints.down('sm')]: {
        padding: '12px 16px',
    },
}));

export const SummaryText = styled(Typography)(() => ({
    fontWeight: 600,
    fontSize: '1.05rem',
}));

export const StyledDetails = styled(AccordionDetails)(({ theme }) => ({
    padding: '16px 20px',
    borderTop: `1px solid ${theme?.palette?.divider ?? '#f4f4f4'}`,
    background: 'linear-gradient(135deg, rgba(255, 245, 248, 0.3) 0%, rgba(245, 235, 255, 0.3) 100%)',
    color: theme?.palette?.text?.primary ?? '#333',
    fontSize: '1rem',
    [theme.breakpoints.down('sm')]: {
        padding: '12px 16px',
    },
}));

export const SettingsSection = styled('div')(({ theme }) => ({
    marginBottom: 24,
    padding: 20,
    backgroundColor: theme?.palette?.background?.paper ?? '#fff',
    borderRadius: 12,
    border: '2px solid rgba(255, 20, 147, 0.15)',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
    transition: 'all 0.3s ease',
    '&:hover': {
        borderColor: 'rgba(255, 20, 147, 0.3)',
        boxShadow: '0 4px 12px rgba(255, 20, 147, 0.1)',
    },
    [theme.breakpoints.down('sm')]: {
        padding: 16,
        marginBottom: 16,
    },
}));

export const SettingRow = styled('div')(({ theme }) => ({
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 0',
    borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
    '&:last-child': {
        borderBottom: 'none',
    },
    [theme.breakpoints.down('sm')]: {
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: 8,
    },
}));

export const SettingLabel = styled(Typography)(({ theme }) => ({
    fontSize: '1rem',
    fontWeight: 600,
    color: theme?.palette?.text?.primary ?? '#333',
    [theme.breakpoints.down('sm')]: {
        fontSize: '0.95rem',
    },
}));

export const SettingValue = styled(Typography)(({ theme }) => ({
    fontSize: '1rem',
    color: theme?.palette?.text?.secondary ?? '#666',
    textAlign: 'right',
    [theme.breakpoints.down('sm')]: {
        fontSize: '0.95rem',
        textAlign: 'left',
    },
}));

export const InfoChip = styled('div')(({ theme, isEnabled }) => ({
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '6px 14px',
    borderRadius: 20,
    fontSize: '0.9rem',
    fontWeight: 600,
    backgroundColor: isEnabled 
        ? 'rgba(76, 175, 80, 0.1)' 
        : 'rgba(158, 158, 158, 0.1)',
    color: isEnabled ? '#4CAF50' : '#9E9E9E',
    border: isEnabled 
        ? '1.5px solid rgba(76, 175, 80, 0.3)' 
        : '1.5px solid rgba(158, 158, 158, 0.3)',
    '& .MuiSvgIcon-root': {
        fontSize: '1.1rem',
    },
}));

export const PrivacyChip = styled('div')(({ theme, privacyColor }) => ({
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '6px 14px',
    borderRadius: 20,
    fontSize: '0.9rem',
    fontWeight: 600,
    backgroundColor: `${privacyColor}22`,
    color: privacyColor,
    border: `1.5px solid ${privacyColor}66`,
    '& .MuiSvgIcon-root': {
        fontSize: '1.1rem',
    },
}));