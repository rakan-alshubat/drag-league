import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, Box } from "@mui/material";
import { styled } from "@mui/material/styles";

export const StyledDialog = styled(Dialog)(({ theme }) => ({
    zIndex: theme.zIndex.modal + 10,
    '& .MuiDialog-paper': {
        maxWidth: '600px',
        maxHeight: '85vh',
        borderRadius: '12px',
        border: '2px solid rgba(255, 20, 147, 0.3)',
        boxShadow: '0 8px 32px rgba(255, 20, 147, 0.2)',
        overflow: 'hidden'
    },
}));

export const TitleRow = styled(DialogTitle)(({ theme }) => ({
    padding: '16px 20px',
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1.5),
    background: 'linear-gradient(135deg, #FF1493 0%, #9B30FF 100%)',
    color: '#fff',
    marginBottom: '12px',
    '& .MuiTypography-root': {
        fontWeight: 700,
        fontSize: '1.1rem'
    },
}));

export const ContentBox = styled(DialogContent)(({ theme }) => ({
    padding: theme.spacing(2),
    paddingTop: theme.spacing(3),
    [theme.breakpoints.down('sm')]: {
        padding: theme.spacing(2),
    },
}));

export const DescriptionText = styled(Typography)(({ theme }) => ({
    fontSize: '1.2rem',
    color: theme.palette.text.primary,
    lineHeight: 1.45,
    margin: theme.spacing(0, 0, 1.5, 0),
    background: 'linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,245,248,0.02))',
    padding: theme.spacing(1.5),
    borderRadius: theme.spacing(1),
    border: `1px solid rgba(255,20,147,0.06)`,
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.02)',
}));

export const ActionRow = styled(DialogActions)(({ theme }) => ({
    padding: theme.spacing(1.5, 2),
    justifyContent: 'space-between',
    borderTop: '1px solid rgba(255, 20, 147, 0.2)',
    [theme.breakpoints.down('sm')]: {
        flexDirection: 'column-reverse',
        padding: theme.spacing(1.5, 2),
        '& button': {
            width: '100%',
            marginTop: theme.spacing(1),
        },
    },
}));

export const ConfirmButton = styled(Button)(({ theme, variantstyle }) => ({
    minWidth: 100,
    padding: theme.spacing(1, 3),
    borderRadius: theme.spacing(1),
    fontWeight: 700,
    transition: 'transform 120ms ease, box-shadow 120ms ease',
    ...(variantstyle === 'danger'
        ? {
            background: 'linear-gradient(135deg, #ff4444 0%, #cc0000 100%)',
            color: '#fff',
            boxShadow: '0 6px 18px rgba(204,0,0,0.18)',
            '&:hover': { filter: 'brightness(1.03)', transform: 'translateY(-2px)' }
        }
        : variantstyle === 'success'
            ? {
                background: 'linear-gradient(135deg, #FF1493 0%, #FFD700 100%)',
                color: '#fff',
                boxShadow: '0 6px 18px rgba(40,167,69,0.18)',
                '&:hover': { filter: 'brightness(1.03)', transform: 'translateY(-2px)' }
            }
            : {
                background: 'linear-gradient(135deg, #FF1493 0%, #FFD700 100%)',
                color: '#1a0033',
                boxShadow: '0 6px 18px rgba(255,20,147,0.16)',
                '&:hover': { filter: 'brightness(1.02)', transform: 'translateY(-2px)' }
            }
    )
}));

export const CancelButton = styled(Button)(({ theme }) => ({
    borderColor: '#FF1493',
    color: '#FF1493',
    '&:hover': {
        borderColor: '#9B30FF',
        background: 'rgba(255, 20, 147, 0.05)'
    },
}));