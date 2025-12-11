import { Box, Typography, Button } from "@mui/material";
import { styled } from "@mui/material/styles";

export const PageContainer = styled(Box)(({ theme }) => ({
    maxWidth: 900,
    margin: "0 auto",
    padding: theme.spacing(3),
    [theme.breakpoints.down('sm')]: {
        padding: theme.spacing(2, 1.5),
    },
}));

export const Title = styled(Typography)(({ theme }) => ({
    textAlign: "center",
    fontWeight: 700,
    marginBottom: theme.spacing(2),
    [theme.breakpoints.down('sm')]: {
        fontSize: '1.5rem',
    },
}));

export const DescriptionBox = styled(Box)(({ theme }) => ({
    maxWidth: 760,
    margin: "0 auto",
    backgroundColor: theme.palette.background.paper,
    padding: theme.spacing(2),
    borderRadius: theme.spacing(1),
    boxShadow: theme.shadows[1],
    textAlign: "center",
    [theme.breakpoints.down('sm')]: {
        padding: theme.spacing(1.5),
    },
}));

export const ButtonRow = styled(Box)(({ theme }) => ({
    display: "flex",
    justifyContent: "flex-end",
    gap: theme.spacing(1),
    marginTop: theme.spacing(1),
    marginBottom: theme.spacing(2),
    [theme.breakpoints.down('sm')]: {
        flexDirection: 'column',
        gap: theme.spacing(1.5),
        '& button': {
            width: '100%',
        },
    },
}));

export const SquareSection = styled(Box)(({ theme }) => ({
    width: "100%",
    borderRadius: theme.spacing(1),
    border: `1px solid ${theme.palette.divider}`,
    display: "flex",
    flexDirection: "column",
    overflow: "visible",
    marginBottom: theme.spacing(2),
    padding: theme.spacing(1),         // inner spacing
    minHeight: 72,                     // small minimum so empty boxes still look ok
    alignItems: "stretch",             // make children fill width
    // children grow/shrink naturally with content
    '& > *': {
        flex: "0 1 auto"
    }
}));

export const SectionHeader = styled(Typography)(({ theme }) => ({
    padding: theme.spacing(2),
    borderBottom: `1px solid ${theme.palette.divider}`,
    fontWeight: 600,
    textAlign: 'center'
}));

export const DynamicGrid = styled(Box)(({ theme, columns = 3, gap = 2 }) => ({
    display: 'grid',
    gridTemplateColumns: `repeat(${Number(columns) || 1}, 1fr)`,
    gap: theme.spacing(gap),
    width: '100%',
    [theme.breakpoints.down('md')]: {
        gridTemplateColumns: `repeat(${Math.min(Number(columns) || 1, 2)}, 1fr)`,
    },
    [theme.breakpoints.down('sm')]: {
        gridTemplateColumns: '1fr',
        gap: theme.spacing(Math.max(1, gap - 1)),
    },
}));

export const GridHeader = styled(Typography)(({ theme }) => ({
    marginBottom: theme.spacing(1),
    fontWeight: 600,
    textAlign: 'center'
}));

export const GridItem = styled(Box)(({ theme }) => ({
    padding: theme.spacing(2),
    borderRadius: theme.spacing(1),
    border: `1px solid ${theme.palette.divider}`,
    backgroundColor: theme.palette.background.paper,
    minHeight: 80,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    whiteSpace: 'normal',
    overflowWrap: 'break-word',
    wordBreak: 'break-word',
    textAlign: 'center',
    [theme.breakpoints.down('sm')]: {
        padding: theme.spacing(1.5),
        minHeight: 60,
    },
}));

export const RowContainer = styled(Box)(({ theme }) => ({
    width: '100%',
    borderRadius: theme.spacing(1),
    overflow: 'hidden',
    marginBottom: theme.spacing(1),
}));

export const RowGrid = styled(Box)(({ theme, columns = 3, gap = 1 }) => ({
    display: 'grid',
    gridTemplateColumns: `repeat(${Number(columns) || 1}, 1fr)`,
    gap: theme.spacing(gap),
    width: '100%',
    [theme.breakpoints.down('md')]: {
        gridTemplateColumns: `repeat(${Math.min(Number(columns) || 1, 2)}, 1fr)`,
    },
    [theme.breakpoints.down('sm')]: {
        gridTemplateColumns: '1fr',
    },
}));

export const ColumnHeader = styled(Typography)(({ theme }) => ({
    fontSize: '0.875rem',
    fontWeight: 600,
    textAlign: 'center',
    padding: theme.spacing(1, 0),
}));

export const RowItem = styled(Box)(({ theme }) => ({
    padding: theme.spacing(1),
    minHeight: 44,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderBottom: `1px solid ${theme.palette.divider}`,
    backgroundColor: theme.palette.background.paper,
    whiteSpace: 'normal',
    overflowWrap: 'break-word',
    wordBreak: 'break-word',
}));

export const DividerContainer = styled(Box)(({ theme }) => ({
    marginTop: theme.spacing(2),
    marginBottom: theme.spacing(2),
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(2),
}));

export const DividerLine = styled(Box)(({ theme }) => ({
    flex: 1,
    height: '1px',
    background: '#9B30FF',
}));

export const DividerText = styled(Typography)(({ theme }) => ({
    color: '#9B30FF',
    fontWeight: 'bold',
}));

export const InviteLinkContainer = styled(Box)(({ theme }) => ({
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(1),
    alignItems: 'center',
}));

export const InviteLinkLabel = styled(Typography)(({ theme }) => ({
    color: '#666',
}));

export const InviteLinkRow = styled(Box)(({ theme }) => ({
    display: 'flex',
    gap: theme.spacing(1),
    width: '100%',
    alignItems: 'center',
    [theme.breakpoints.down('sm')]: {
        flexDirection: 'column',
    },
}));

export const CopyLinkButton = styled(Button)(({ theme }) => ({
    background: 'linear-gradient(135deg, #FF1493 0%, #9B30FF 100%)',
    color: 'white',
    fontWeight: 'bold',
    whiteSpace: 'nowrap',
    '&:hover': {
        background: 'linear-gradient(135deg, #FF1493 20%, #9B30FF 120%)',
    },
    [theme.breakpoints.down('sm')]: {
        width: '100%',
    },
}));