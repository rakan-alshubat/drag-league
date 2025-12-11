import { Box } from "@mui/material";
import { styled } from "@mui/material/styles";

export const SignInBox = styled(Box)(({ theme }) => ({
    background: 'linear-gradient(180deg, #1a0033 0%, #330066 100%)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    '& [data-amplify-authenticator]': {
        backgroundColor: 'white',
        padding: theme.spacing(3),
        borderRadius: theme.spacing(2),
        boxShadow: '0 8px 30px rgba(0, 0, 0, 0.3)',
    }
}));