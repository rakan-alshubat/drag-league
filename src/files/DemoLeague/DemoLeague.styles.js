import { styled } from "@mui/material/styles";
import { Box, Tabs, Tab, Typography } from "@mui/material";

export const Container = styled(Box)(({ theme }) => ({
    padding: theme.spacing(3),
    maxWidth: 1100,
    margin: "0 auto",
    boxSizing: "border-box",
    [theme.breakpoints.down('sm')]: {
        padding: theme.spacing(2, 1.5),
    },
}));

export const DemoBanner = styled(Box)(({ theme }) => ({
    background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
    borderRadius: 12,
    padding: theme.spacing(2),
    marginBottom: theme.spacing(3),
    boxShadow: '0 4px 12px rgba(255, 215, 0, 0.3)',
    border: '2px solid #FFD700',
    [theme.breakpoints.down('sm')]: {
        padding: theme.spacing(1.5),
        marginBottom: theme.spacing(2),
    },
}));

export const DemoText = styled(Typography)(({ theme }) => ({
    color: '#1a1a1a',
    fontWeight: 700,
    fontSize: '1.1rem',
    textAlign: 'center',
    margin: 0,
    textShadow: '0 1px 2px rgba(255, 255, 255, 0.5)',
    [theme.breakpoints.down('sm')]: {
        fontSize: '0.95rem',
    },
}));

export const Header = styled(Box)(({ theme }) => ({
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: theme.spacing(2),
}));

export const HeaderTitle = styled(Typography)(({ theme }) => ({
    margin: 0,
    fontSize: 22,
    fontWeight: 700,
    lineHeight: 1.1,
    background: 'linear-gradient(135deg, #FF1493 0%, #9B30FF 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    [theme.breakpoints.down('sm')]: {
        fontSize: 18,
    },
}));

export const HeaderSubtitle = styled(Typography)(({ theme }) => ({
    marginTop: 6,
    color: theme.palette.text.secondary,
    fontSize: 13,
    [theme.breakpoints.down('sm')]: {
        fontSize: 12,
    },
}));

export const TabsContainer = styled(Tabs)(({ theme }) => ({
    display: "flex",
    gap: theme.spacing(1),
    marginBottom: theme.spacing(2),
    '& .MuiTabs-indicator': {
        display: 'none',
    },
    [theme.breakpoints.down('sm')]: {
        '& .MuiTabs-flexContainer': {
            gap: theme.spacing(1),
        },
        '& .MuiTabs-scrollButtons': {
            '&.Mui-disabled': {
                opacity: 0.3,
            },
        },
    },
}));

export const StyledTab = styled(Tab)(({ theme }) => ({
    textTransform: "none",
    minWidth: 140,
    padding: `${theme.spacing(1)} ${theme.spacing(2)}`,
    borderRadius: 8,
    fontWeight: 700,
    color: theme.palette.text.primary,
    backgroundColor: theme.palette.background.paper,
    border: '2px solid rgba(255, 20, 147, 0.2)',
    transition: 'all 0.3s ease',
    "&:hover": {
        borderColor: '#FFB6D9',
        transform: 'translateY(-2px)',
        boxShadow: '0 4px 8px rgba(255, 20, 147, 0.2)',
    },
    "&.Mui-selected": {
        background: 'linear-gradient(135deg, #FF1493 0%, #9B30FF 100%)',
        color: theme.palette.common.white,
        border: '2px solid #FF1493',
        boxShadow: '0 4px 12px rgba(255, 20, 147, 0.4)',
    },
    [theme.breakpoints.down('sm')]: {
        minWidth: 100,
        padding: `${theme.spacing(1.5)} ${theme.spacing(1.5)}`,
        fontSize: '0.85rem',
    },
}));

export const MainContent = styled(Box)(({ theme }) => ({
    minHeight: 240,
}));

export const Panel = styled("div")(({ theme }) => ({
    display: "block",
    padding: theme.spacing(1),
    "&[hidden]": {
        display: "none",
    },
}));

export const EmptyState = styled(Box)(({ theme }) => ({
    border: `1px dashed ${theme.palette.divider}`,
    borderRadius: 8,
    padding: theme.spacing(3),
    color: theme.palette.text.secondary,
    textAlign: "center",
    minHeight: 120,
}));
