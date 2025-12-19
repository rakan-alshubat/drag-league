import { Box } from "@mui/material";
import { styled } from "@mui/material/styles";

export const LoadingWheelBox = styled(Box)(({ theme }) => ({
    background: 'linear-gradient(180deg, #1a0033 0%, #330066 100%)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center'
}));