// ...existing code...
import { styled } from "@mui/material/styles";
import { Box, Tabs, Tab, Typography, Button } from "@mui/material";

export const Container = styled(Box)(({ theme }) => ({
    padding: theme.spacing(3),
    maxWidth: 1100,
    margin: "0 auto",
    boxSizing: "border-box",
    [theme.breakpoints.down('sm')]: {
        padding: theme.spacing(2, 1.5),
    },
}));

export const Header = styled(Box)(({ theme }) => ({
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: theme.spacing(2),
    // ensure right-side contents (timer + buttons) layout nicely
    '& > div:last-child': {
        display: 'flex',
        gap: theme.spacing(1),
        alignItems: 'center',
        '& button': {
            minWidth: 120,
        },
    },
    // mobile: stack title/description above timer + buttons and make buttons full width
    [theme.breakpoints.down('sm')]: {
        flexDirection: 'column',
        alignItems: 'stretch',
        gap: theme.spacing(1),
        '& > div:last-child': {
            // override any inline marginLeft set in JSX (use !important)
            marginLeft: '0 !important',
            marginTop: theme.spacing(0),
            display: 'flex',
            gap: theme.spacing(1),
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            '& .buttonsRow': {
                display: 'flex',
                gap: theme.spacing(1),
                width: '100%',
                justifyContent: 'center',
                alignItems: 'center',
            },
            '& .buttonsRow > button': {
                flex: '1 1 auto',
                minWidth: 0,
                maxWidth: '50%',
            }
        }
    },
}));

export const HeaderTitle = styled(Typography)(({ theme }) => ({
    margin: 0,
    fontSize: 30,
    fontWeight: 700,
    color: '#FF1493',
    lineHeight: 1.1,
    [theme.breakpoints.down('sm')]: {
        fontSize: 22,
    },
}));

export const HeaderSubtitle = styled(Typography)(({ theme }) => ({
    marginTop: 6,
    color: theme.palette.text.secondary,
    fontSize: 18,
    [theme.breakpoints.down('sm')]: {
        fontSize: 16,
    },
}));

export const TabsContainer = styled(Tabs)(({ theme }) => ({
    display: "flex",
    gap: theme.spacing(1),
    marginBottom: theme.spacing(2),
    [theme.breakpoints.down('sm')]: {
        '& .MuiTabs-flexContainer': {
            flexDirection: 'column',
            gap: theme.spacing(1),
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
    "&.Mui-selected": {
        backgroundColor: theme.palette.primary.main,
        color: theme.palette.common.white,
        boxShadow: theme.shadows[1],
    },
    [theme.breakpoints.down('sm')]: {
        minWidth: 'auto',
        width: '100%',
        padding: `${theme.spacing(1.5)} ${theme.spacing(2)}`,
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

export const WinnerBanner = styled(Box)(({ theme }) => ({
    width: '100%',
    maxWidth: '1100px',
    margin: '0 auto',
    padding: theme.spacing(2),
    borderRadius: 12,
    background: 'linear-gradient(90deg, rgba(255,201,0,0.12), rgba(255,20,147,0.06))',
    border: `2px solid rgba(255, 165, 0, 0.18)`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    marginBottom: theme.spacing(2),
    boxShadow: '0 6px 20px rgba(255, 165, 0, 0.06)',
    position: 'relative',
    overflow: 'hidden',
    minHeight: 188,
}));

export const WinnerLabel = styled(Typography)(({ theme }) => ({
    fontSize: 34,
    color: theme.palette.text.secondary,
    marginBottom: theme.spacing(0.5),
    [theme.breakpoints.down('sm')]: {
        fontSize: 18,
    },
}));

export const WinnerName = styled(Typography)(({ theme }) => ({
    fontSize: 60,
    fontWeight: 900,
    color: '#9B30FF',
    lineHeight: 1.05,
    [theme.breakpoints.down('sm')]: {
        fontSize: 20,
    },
}));

export const RevealButton = styled(Button)(({ theme }) => ({
    position: 'absolute',
    left: '50%',
    top: '50%',
    transform: 'translate(-50%, -50%)',
    zIndex: 40,
    background: 'linear-gradient(135deg, #FFD700 0%, #FFB400 100%)',
    color: '#222',
    fontWeight: 800,
    padding: theme.spacing(1.6, 10),
    borderRadius: 999,
    boxShadow: '0 6px 18px rgba(0,0,0,0.12)',
    '&:hover': {
        boxShadow: '0 8px 22px rgba(0,0,0,0.16)'
    }
}));

export const SmallButton = styled('button')(({ theme }) => ({
    padding: '8px 12px',
    borderRadius: 6,
    cursor: 'pointer',
    background: 'transparent',
    border: '1px solid rgba(0,0,0,0.08)',
    '&:disabled': {
        cursor: 'not-allowed',
        opacity: 0.5,
        background: '#ccc'
    }
}));
// ...existing code...