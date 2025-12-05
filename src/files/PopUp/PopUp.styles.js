import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, Box } from "@mui/material";
import { styled } from "@mui/material/styles";

export const StyledDialog = styled(Dialog)(({ theme }) => ({
    zIndex: theme.zIndex.modal + 10,
}));

export const TitleRow = styled(DialogTitle)(({ theme }) => ({
    padding: theme.spacing(2, 3),
    '& .MuiTypography-root': {
        fontWeight: 600,
    },
}));

export const ContentBox = styled(DialogContent)(({ theme }) => ({
    padding: theme.spacing(2, 3),
    minWidth: 320,
    [theme.breakpoints.down('sm')]: {
        padding: theme.spacing(2),
        minWidth: 280,
    },
}));

export const ActionRow = styled(DialogActions)(({ theme }) => ({
    padding: theme.spacing(1.5, 2.5),
    display: 'flex',
    justifyContent: 'flex-end',
    gap: theme.spacing(1),
    [theme.breakpoints.down('sm')]: {
        flexDirection: 'column-reverse',
        padding: theme.spacing(1.5, 2),
        '& button': {
            width: '100%',
        },
    },
}));

export const ConfirmButton = styled(Button)(({ theme }) => ({
    minWidth: 100,
}));

export const CancelButton = styled(Button)(({ theme }) => ({
    minWidth: 100,
}));