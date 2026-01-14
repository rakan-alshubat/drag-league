import { styled } from '@mui/material/styles';
import Typography from '@mui/material/Typography';

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
}));

export const Title = styled(Typography)(({ theme }) => ({
    margin: 0,
    marginBottom: 12,
    fontSize: '1.25rem',
    fontWeight: 700,
    color: theme?.palette?.text?.primary ?? '#222',
}));

export const StatRow = styled('div')(() => ({
    display: 'flex',
    alignItems: 'center',
    gap: 8,
}));
