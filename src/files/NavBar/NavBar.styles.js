import { styled } from "@mui/material/styles";
import { AppBar, Toolbar, Typography, Box, Button } from "@mui/material";

export const StyledAppBar = styled(AppBar)(({ theme }) => ({
    background: 'linear-gradient(90deg, #1a0033 0%, #33004d 50%, #1a0033 100%)',
    boxShadow: '0 4px 20px rgba(255, 20, 147, 0.4)',
    position: 'sticky',
    top: 0,
    zIndex: 1100,
    borderBottom: '2px solid #FF1493',
}));

export const StyledToolbar = styled(Toolbar)(({ theme }) => ({
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing(1.5, 3),
    maxWidth: 1100,
    width: '100%',
    margin: '0 auto',
    [theme.breakpoints.down('md')]: {
        padding: theme.spacing(1.5, 2),
    },
    [theme.breakpoints.down('sm')]: {
        padding: theme.spacing(1, 1.5),
    },
}));

export const Logo = styled(Typography)(({ theme }) => ({
    fontSize: 26,
    fontWeight: 800,
    background: 'linear-gradient(135deg, #FF1493 0%, #FFD700 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    cursor: 'pointer',
    letterSpacing: '1px',
    textShadow: '0 0 20px rgba(255, 20, 147, 0.5)',
    filter: 'drop-shadow(0 2px 4px rgba(255, 215, 0, 0.3))',
    '&:hover': {
        filter: 'drop-shadow(0 4px 8px rgba(255, 215, 0, 0.6))',
        transform: 'scale(1.02)',
    },
    transition: 'all 0.3s ease',
    [theme.breakpoints.down('md')]: {
        fontSize: 22,
    },
    [theme.breakpoints.down('sm')]: {
        fontSize: 18,
        letterSpacing: '0.5px',
    },
}));

export const NavLinks = styled(Box)(({ theme }) => ({
    display: 'flex',
    gap: theme.spacing(2),
    alignItems: 'center',
    [theme.breakpoints.down('md')]: {
        gap: theme.spacing(1),
    },
    [theme.breakpoints.down('sm')]: {
        gap: theme.spacing(0.5),
        flexWrap: 'wrap',
        justifyContent: 'flex-end',
    },
}));

export const NavButton = styled(Button)(({ theme }) => ({
    color: '#FFD700',
    textTransform: 'none',
    fontSize: 15,
    fontWeight: 600,
    padding: theme.spacing(1, 2),
    borderRadius: 8,
    transition: 'all 0.3s ease',
    '&:hover': {
        backgroundColor: 'rgba(255, 20, 147, 0.2)',
        color: '#FF69B4',
        transform: 'translateY(-2px)',
        boxShadow: '0 4px 12px rgba(255, 20, 147, 0.3)',
    },
    [theme.breakpoints.down('md')]: {
        fontSize: 13,
        padding: theme.spacing(0.75, 1.5),
    },
    [theme.breakpoints.down('sm')]: {
        fontSize: 11,
        padding: theme.spacing(0.5, 1),
        minWidth: 'auto',
    },
}));

export const NavButtonPrimary = styled(Button)(({ theme }) => ({
    background: 'linear-gradient(135deg, #FF1493 0%, #FFD700 100%)',
    color: '#ffffff',
    textTransform: 'none',
    fontSize: 15,
    fontWeight: 700,
    padding: theme.spacing(1, 2.5),
    borderRadius: 8,
    boxShadow: '0 4px 15px rgba(255, 20, 147, 0.4)',
    transition: 'all 0.3s ease',
    '&:hover': {
        background: 'linear-gradient(135deg, #FFD700 0%, #FF1493 100%)',
        transform: 'translateY(-2px)',
        boxShadow: '0 6px 20px rgba(255, 215, 0, 0.5)',
    },
    [theme.breakpoints.down('md')]: {
        fontSize: 13,
        padding: theme.spacing(0.75, 2),
    },
    [theme.breakpoints.down('sm')]: {
        fontSize: 11,
        padding: theme.spacing(0.5, 1.5),
        minWidth: 'auto',
    },
}));

export const IconButton = styled(Button)(({ theme }) => ({
    minWidth: 'auto',
    padding: theme.spacing(1),
    borderRadius: 8,
    color: '#FFD700',
    transition: 'all 0.3s ease',
    '&:hover': {
        backgroundColor: 'rgba(255, 20, 147, 0.2)',
        color: '#FF69B4',
        transform: 'scale(1.1) rotate(5deg)',
    },
}));

export const Divider = styled(Box)(({ theme }) => ({
    width: '2px',
    height: '28px',
    background: 'linear-gradient(180deg, #FF1493 0%, #FFD700 100%)',
    borderRadius: '2px',
    boxShadow: '0 0 10px rgba(255, 20, 147, 0.5)',
    [theme.breakpoints.down('md')]: {
        width: '100%',
        height: '2px',
        margin: theme.spacing(2, 0),
    },
}));

export const MobileMenuButton = styled(Button)(({ theme }) => ({
    minWidth: 'auto',
    padding: theme.spacing(1),
    borderRadius: 8,
    color: '#FFD700',
    transition: 'all 0.3s ease',
    '&:hover': {
        backgroundColor: 'rgba(255, 20, 147, 0.2)',
        color: '#FF69B4',
    },
}));

export const MobileNavLinks = styled(Box)(({ theme }) => ({
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(1.5),
    alignItems: 'stretch',
    '& button': {
        width: '100%',
        justifyContent: 'flex-start',
    },
}));
