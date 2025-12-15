import { styled } from "@mui/material/styles";
import { Dialog, DialogTitle, DialogContent, DialogActions, Box, Typography, Button, IconButton } from "@mui/material";

export const StyledDialog = styled(Dialog)(({ theme }) => ({
    '& .MuiDialog-paper': {
        maxWidth: '600px',
        maxHeight: '85vh',
        borderRadius: '12px',
        border: '2px solid rgba(255, 20, 147, 0.3)',
        boxShadow: '0 8px 32px rgba(255, 20, 147, 0.2)',
    },
}));

export const StyledDialogTitle = styled(DialogTitle)(({ theme }) => ({
    background: 'linear-gradient(135deg, #FF1493 0%, #9B30FF 100%)',
    color: 'white',
    padding: '16px 20px',
    marginBottom: '12px',
    fontWeight: 700,
    fontSize: '1.25rem',
}));

export const StyledDialogContent = styled(DialogContent)(({ theme }) => ({
    padding: theme.spacing(2),
    paddingTop: theme.spacing(3),
}));

export const Section = styled(Box)(({ theme }) => ({
    padding: '16px',
    marginBottom: '12px',
    borderRadius: '8px',
    background: 'rgba(255, 245, 248, 0.4)',
    border: '1px solid rgba(255, 20, 147, 0.2)',
}));

export const SectionTitle = styled(Typography)(({ theme }) => ({
    fontSize: '1rem',
    fontWeight: 600,
    marginBottom: '8px',
    color: '#9B30FF',
}));

export const SectionDesc = styled(Typography)(({ theme }) => ({
    fontSize: '0.8rem',
    color: '#666',
    marginBottom: '12px',
}));

export const SectionHeader = styled(Box)(({ theme }) => ({
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing(2),
}));

export const FinalRankingRow = styled(Box)(({ theme }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '8px',
    padding: '8px',
    borderRadius: '6px',
    background: 'white',
    border: '1px solid rgba(255, 20, 147, 0.2)',
}));

export const PositionLabel = styled(Typography)(({ theme }) => ({
    minWidth: '50px',
    fontWeight: 700,
    color: '#9B30FF',
    fontSize: '0.9rem',
}));

export const StyledDialogActions = styled(DialogActions)(({ theme }) => ({
    padding: theme.spacing(1.5, 2),
    justifyContent: 'space-between',
    borderTop: '1px solid rgba(255, 20, 147, 0.2)',
    '& > div:first-of-type': {
        display: 'flex',
        gap: theme.spacing(1),
        flexWrap: 'wrap',
        alignItems: 'center',
    },
    '& > div:last-of-type': {
        display: 'flex',
        gap: theme.spacing(1),
        alignItems: 'center',
    },
    [theme.breakpoints.down('sm')]: {
        flexDirection: 'column',
        alignItems: 'stretch',
        gap: theme.spacing(1),
        '& > div:first-of-type': {
            display: 'flex',
            flexDirection: 'column',
            gap: theme.spacing(1),
            alignItems: 'stretch',
            '& .MuiFormControlLabel-root': {
                width: '100%'
            }
        },
        '& > div:last-of-type': {
            display: 'flex',
            justifyContent: 'center',
            gap: theme.spacing(1),
            '& button': {
                minWidth: 120,
                flex: '1 1 auto',
                maxWidth: '48%'
            }
        }
    }
}));

export const SubmitButton = styled(Button)(({ theme }) => ({
    background: 'linear-gradient(135deg, #FF1493 0%, #9B30FF 100%)',
    color: 'white',
    fontWeight: 600,
    '&:hover': {
        background: 'linear-gradient(135deg, #E6127F 0%, #8A2BE2 100%)',
    },
}));

export const CancelButton = styled(Button)(({ theme }) => ({
    borderColor: '#FF1493',
    color: '#FF1493',
    '&:hover': {
        borderColor: '#9B30FF',
        background: 'rgba(255, 20, 147, 0.05)',
    },
}));

export const AddButton = styled(Button)(({ theme }) => ({
    borderColor: '#FF1493',
    color: '#FF1493',
    '&:hover': {
        borderColor: '#9B30FF',
        background: 'rgba(255, 20, 147, 0.05)',
    },
}));

export const DeleteIconButton = styled(IconButton)(({ theme }) => ({
    color: '#d32f2f',
}));

export const BonusCategoryLabel = styled(Typography)(({ theme }) => ({
    fontWeight: 600,
    marginBottom: '8px',
    color: '#333',
}));

export const ChipWrapper = styled(Box)(({ theme }) => ({
    display: 'flex',
    flexWrap: 'wrap',
    gap: '4px',
}));

export const ErrorText = styled(Typography)(({ theme }) => ({
    color: '#b71c1c',
    marginTop: '8px',
}));

export const FlexContainer = styled(Box)(({ theme }) => ({
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    marginTop: '8px',
}));

export const FlexRow = styled(Box)(({ theme }) => ({
    display: 'flex',
    gap: '16px',
    marginTop: '8px',
}));

