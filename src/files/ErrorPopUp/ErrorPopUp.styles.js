// ...existing code...
import { styled } from '@mui/material/styles';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';

export const StyledDialog = styled(Dialog)(({ theme }) => ({
    '& .MuiPaper-root': {
        borderRadius: 12,
        padding: theme.spacing(2),
        width: 380,
        maxWidth: '92%',
        [theme.breakpoints.down('sm')]: {
            width: '90%',
            padding: theme.spacing(1.5),
        },
    },
}));

export const Content = styled(DialogContent)(({ theme }) => ({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: theme.spacing(2),
    padding: theme.spacing(3),
    textAlign: 'center',
    [theme.breakpoints.down('sm')]: {
        padding: theme.spacing(2),
        gap: theme.spacing(1.5),
    },
}));

export const ErrorIconWrapper = styled(Box)(({ theme }) => ({
    width: 50,
    height: 50,
    borderRadius: '50%',
    backgroundColor: theme.palette.error.light,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: theme.palette.error.main,
    boxShadow: theme.shadows[1],
}));

export const Message = styled(Typography)(({ theme }) => ({
    color: theme.palette.text.primary,
    fontWeight: 500,
}));

export const CloseButton = styled(Button)(({ theme }) => ({
    marginTop: theme.spacing(1),
    alignSelf: 'stretch',
    textTransform: 'none',
}));