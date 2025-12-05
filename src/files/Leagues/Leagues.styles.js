// ...existing code...
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
// ...existing code...