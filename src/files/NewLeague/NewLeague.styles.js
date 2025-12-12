import { styled } from "@mui/material/styles";
import { Box, Typography, Button, Paper, Chip } from "@mui/material";

// Page Container
export const PageContainer = styled(Box)(({ theme }) => ({
    maxWidth: 1200,
    margin: "0 auto",
    padding: theme.spacing(4, 3),
    [theme.breakpoints.down('md')]: {
        padding: theme.spacing(3, 2),
    },
    [theme.breakpoints.down('sm')]: {
        padding: theme.spacing(2, 1.5),
    },
}));

// Title with gradient
export const Title = styled(Typography)(({ theme }) => ({
    textAlign: "center",
    fontWeight: 700,
    marginBottom: theme.spacing(3),
    background: 'linear-gradient(135deg, #FF1493 0%, #9B30FF 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    [theme.breakpoints.down('sm')]: {
        fontSize: '2rem',
        marginBottom: theme.spacing(2),
    },
}));

// Hero Banner Section (replaces DescriptionBox)
export const HeroBanner = styled(Paper)(({ theme }) => ({
    background: 'linear-gradient(135deg, #FF1493 0%, #9B30FF 50%, #FFD700 100%)',
    padding: theme.spacing(4),
    borderRadius: theme.spacing(2),
    boxShadow: '0 8px 30px rgba(255, 20, 147, 0.4)',
    border: '3px solid rgba(255, 215, 0, 0.5)',
    marginBottom: theme.spacing(4),
    position: 'relative',
    overflow: 'hidden',
    '&::before': {
        content: '""',
        position: 'absolute',
        top: '-50%',
        right: '-50%',
        width: '200%',
        height: '200%',
        background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)',
        animation: 'sparkle 8s linear infinite',
    },
    '@keyframes sparkle': {
        '0%': { transform: 'rotate(0deg)' },
        '100%': { transform: 'rotate(360deg)' },
    },
    [theme.breakpoints.down('sm')]: {
        padding: theme.spacing(3, 2),
        marginBottom: theme.spacing(3),
    },
}));

export const HeroText = styled(Typography)(({ theme }) => ({
    color: 'white',
    textAlign: 'center',
    fontWeight: 500,
    fontSize: '1.125rem',
    lineHeight: 1.6,
    position: 'relative',
    zIndex: 1,
    textShadow: '0 2px 8px rgba(0,0,0,0.2)',
    [theme.breakpoints.down('sm')]: {
        fontSize: '1rem',
    },
}));

// Info Banner for deadlines and alerts
export const InfoBanner = styled(Box)(({ theme }) => ({
    background: 'linear-gradient(135deg, rgba(255, 20, 147, 0.08) 0%, rgba(155, 48, 255, 0.08) 100%)',
    padding: theme.spacing(3),
    borderRadius: theme.spacing(2),
    border: '2px solid rgba(255, 20, 147, 0.3)',
    marginBottom: theme.spacing(4),
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: theme.spacing(1),
    [theme.breakpoints.down('sm')]: {
        padding: theme.spacing(2),
        marginBottom: theme.spacing(3),
    },
}));

// Action Button Row
export const ActionRow = styled(Box)(({ theme }) => ({
    display: "flex",
    gap: theme.spacing(2),
    justifyContent: "center",
    marginBottom: theme.spacing(4),
    flexWrap: 'wrap',
    [theme.breakpoints.down('sm')]: {
        flexDirection: 'column',
        marginBottom: theme.spacing(3),
    },
}));

// Primary Gradient Button
export const PrimaryButton = styled(Button)(({ theme }) => ({
    background: 'linear-gradient(135deg, #FF1493 0%, #9B30FF 100%)',
    color: 'white',
    fontWeight: 600,
    padding: '12px 32px',
    fontSize: '1rem',
    borderRadius: '50px',
    boxShadow: '0 4px 15px rgba(255, 20, 147, 0.3)',
    textTransform: 'none',
    transition: 'all 0.3s ease',
    '&:hover': {
        background: 'linear-gradient(135deg, #E0127D 0%, #8520E0 100%)',
        boxShadow: '0 6px 20px rgba(255, 20, 147, 0.4)',
        transform: 'translateY(-2px)',
    },
    '&:disabled': {
        background: 'rgba(0, 0, 0, 0.12)',
        color: 'rgba(0, 0, 0, 0.26)',
    },
    [theme.breakpoints.down('sm')]: {
        width: '100%',
        padding: '10px 24px',
    },
}));

// Secondary Gold Button
export const SecondaryButton = styled(Button)(({ theme }) => ({
    background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
    color: '#1a0033',
    fontWeight: 600,
    padding: '12px 32px',
    fontSize: '1rem',
    borderRadius: '50px',
    boxShadow: '0 4px 15px rgba(255, 215, 0, 0.3)',
    textTransform: 'none',
    transition: 'all 0.3s ease',
    '&:hover': {
        background: 'linear-gradient(135deg, #E6C200 0%, #E69500 100%)',
        boxShadow: '0 6px 20px rgba(255, 215, 0, 0.4)',
        transform: 'translateY(-2px)',
    },
    [theme.breakpoints.down('sm')]: {
        width: '100%',
        padding: '10px 24px',
    },
}));

// Danger Button
export const DangerButton = styled(Button)(({ theme }) => ({
    background: 'linear-gradient(135deg, #ff4444 0%, #cc0000 100%)',
    color: 'white',
    fontWeight: 600,
    padding: '12px 32px',
    fontSize: '1rem',
    borderRadius: '50px',
    boxShadow: '0 4px 15px rgba(255, 68, 68, 0.3)',
    textTransform: 'none',
    transition: 'all 0.3s ease',
    '&:hover': {
        background: 'linear-gradient(135deg, #e63939 0%, #b30000 100%)',
        boxShadow: '0 6px 20px rgba(255, 68, 68, 0.4)',
        transform: 'translateY(-2px)',
    },
    [theme.breakpoints.down('sm')]: {
        width: '100%',
        padding: '10px 24px',
    },
}));

// Card Section
export const CardSection = styled(Paper)(({ theme }) => ({
    padding: theme.spacing(3),
    borderRadius: theme.spacing(2),
    marginBottom: theme.spacing(3),
    border: `2px solid ${theme.palette.divider}`,
    boxShadow: '0 4px 15px rgba(255, 20, 147, 0.1)',
    transition: 'all 0.3s ease',
    '&:hover': {
        boxShadow: '0 6px 20px rgba(255, 20, 147, 0.15)',
        borderColor: 'rgba(255, 20, 147, 0.3)',
    },
    [theme.breakpoints.down('sm')]: {
        padding: theme.spacing(2),
        marginBottom: theme.spacing(2),
    },
}));

// Section Header
export const SectionHeader = styled(Typography)(({ theme }) => ({
    fontWeight: 700,
    fontSize: '1.5rem',
    marginBottom: theme.spacing(2.5),
    color: theme.palette.primary.main,
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
    [theme.breakpoints.down('sm')]: {
        fontSize: '1.25rem',
        marginBottom: theme.spacing(2),
    },
}));

// Grid Layout for Queens and Rules
export const GridLayout = styled(Box)(({ theme, columns = 3 }) => ({
    display: 'grid',
    gridTemplateColumns: `repeat(${columns}, 1fr)`,
    gap: theme.spacing(2),
    width: '100%',
    [theme.breakpoints.down('md')]: {
        gridTemplateColumns: `repeat(${Math.min(columns, 2)}, 1fr)`,
    },
    [theme.breakpoints.down('sm')]: {
        gridTemplateColumns: '1fr',
        gap: theme.spacing(1.5),
    },
}));

// Grid Item Card
export const GridCard = styled(Paper)(({ theme }) => ({
    padding: theme.spacing(2.5),
    borderRadius: theme.spacing(1.5),
    border: `2px solid ${theme.palette.divider}`,
    backgroundColor: theme.palette.background.paper,
    minHeight: 100,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    transition: 'all 0.3s ease',
    '&:hover': {
        transform: 'translateY(-4px)',
        boxShadow: '0 8px 20px rgba(255, 20, 147, 0.15)',
        borderColor: theme.palette.primary.light,
        background: 'linear-gradient(135deg, rgba(255, 20, 147, 0.03) 0%, rgba(155, 48, 255, 0.03) 100%)',
    },
    [theme.breakpoints.down('sm')]: {
        padding: theme.spacing(2),
        minHeight: 80,
    },
}));

export const GridCardText = styled(Typography)(({ theme }) => ({
    fontWeight: 500,
    fontSize: '1.0625rem',
    lineHeight: 1.7,
    color: theme.palette.text.primary,
    letterSpacing: '0.01em',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    '& strong, & b': {
        fontWeight: 700,
        color: theme.palette.primary.main,
        background: 'linear-gradient(135deg, rgba(255, 20, 147, 0.08) 0%, rgba(155, 48, 255, 0.08) 100%)',
        padding: '2px 6px',
        borderRadius: '4px',
    },
    [theme.breakpoints.down('sm')]: {
        fontSize: '0.9375rem',
        lineHeight: 1.6,
    },
}));

export const QueenNameText = styled(Typography)(({ theme }) => ({
    fontWeight: 600,
    fontSize: '1.0625rem',
    lineHeight: 1.4,
    color: theme.palette.text.primary,
    letterSpacing: '0.015em',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    textAlign: 'center',
    background: 'linear-gradient(135deg, rgba(255, 20, 147, 0.05) 0%, rgba(155, 48, 255, 0.05) 100%)',
    padding: '4px 8px',
    borderRadius: '6px',
    [theme.breakpoints.down('sm')]: {
        fontSize: '0.9375rem',
    },
}));

// Player Table Container
export const TableContainer = styled(Box)(({ theme }) => ({
    width: '100%',
    overflowX: 'auto',
    borderRadius: theme.spacing(1),
    border: `1px solid ${theme.palette.divider}`,
    backgroundColor: theme.palette.background.paper,
}));

// Table Header Row
export const TableHeaderRow = styled(Box)(({ theme }) => ({
    display: 'grid',
    gridTemplateColumns: '2fr 1.5fr 1.5fr',
    gap: theme.spacing(1),
    padding: theme.spacing(2),
    background: 'linear-gradient(135deg, rgba(255, 20, 147, 0.1) 0%, rgba(155, 48, 255, 0.1) 100%)',
    borderBottom: `2px solid ${theme.palette.primary.main}`,
    fontWeight: 700,
    [theme.breakpoints.down('sm')]: {
        gridTemplateColumns: '1fr',
        padding: theme.spacing(1.5),
        gap: 0,
    },
}));

export const TableHeaderCell = styled(Typography)(({ theme }) => ({
    fontWeight: 700,
    fontSize: '1rem',
    color: theme.palette.primary.main,
    textAlign: 'center',
    [theme.breakpoints.down('sm')]: {
        fontSize: '0.875rem',
        '&:not(:first-of-type)': {
            display: 'none',
        },
    },
}));

// Table Data Row
export const TableRow = styled(Box)(({ theme }) => ({
    display: 'grid',
    gridTemplateColumns: '2fr 1.5fr 1.5fr',
    gap: theme.spacing(1),
    padding: theme.spacing(2),
    borderBottom: `1px solid ${theme.palette.divider}`,
    alignItems: 'center',
    transition: 'background-color 0.2s ease',
    '&:hover': {
        backgroundColor: 'rgba(255, 20, 147, 0.03)',
    },
    '&:last-child': {
        borderBottom: 'none',
    },
    [theme.breakpoints.down('sm')]: {
        gridTemplateColumns: '1fr',
        padding: theme.spacing(1.5),
        gap: theme.spacing(1),
    },
}));

export const TableCell = styled(Box)(({ theme }) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing(1),
    textAlign: 'center',
    fontSize: '0.9375rem',
    [theme.breakpoints.down('sm')]: {
        justifyContent: 'flex-start',
        fontSize: '0.875rem',
    },
}));

// Status Chip
export const StatusChip = styled(Chip)(({ theme, statuscolor }) => {
    const colors = {
        submitted: { bg: 'rgba(76, 175, 80, 0.1)', color: '#2e7d32', border: '#4caf50' },
        pending: { bg: 'rgba(255, 152, 0, 0.1)', color: '#e65100', border: '#ff9800' },
        invited: { bg: 'rgba(33, 150, 243, 0.1)', color: '#1565c0', border: '#2196f3' },
        requested: { bg: 'rgba(156, 39, 176, 0.1)', color: '#6a1b9a', border: '#9c27b0' },
        admin: { bg: 'rgba(255, 20, 147, 0.1)', color: '#c71585', border: '#FF1493' },
        player: { bg: 'rgba(96, 125, 139, 0.1)', color: '#37474f', border: '#607d8b' },
    };
    const selectedColor = colors[statuscolor] || colors.player;

    return {
        backgroundColor: selectedColor.bg,
        color: selectedColor.color,
        border: `2px solid ${selectedColor.border}`,
        fontWeight: 600,
        fontSize: '0.8125rem',
        height: '28px',
        '& .MuiChip-icon': {
            color: selectedColor.color,
        },
    };
});

// Empty State
export const EmptyState = styled(Box)(({ theme }) => ({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing(6, 3),
    textAlign: 'center',
    minHeight: '200px',
    background: 'linear-gradient(135deg, rgba(255, 20, 147, 0.03) 0%, rgba(255, 215, 0, 0.03) 100%)',
    borderRadius: theme.spacing(2),
    border: `2px dashed ${theme.palette.primary.light}`,
    [theme.breakpoints.down('sm')]: {
        padding: theme.spacing(4, 2),
        minHeight: '150px',
    },
}));

export const EmptyStateText = styled(Typography)(({ theme }) => ({
    color: theme.palette.text.secondary,
    fontSize: '1rem',
    marginTop: theme.spacing(1),
}));

// Bottom Action Bar
export const BottomActionBar = styled(Box)(({ theme }) => ({
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: theme.spacing(4),
    padding: theme.spacing(3),
    borderRadius: theme.spacing(2),
    background: 'linear-gradient(135deg, rgba(255, 245, 248, 0.6) 0%, rgba(245, 235, 255, 0.6) 100%)',
    border: `2px solid ${theme.palette.divider}`,
    [theme.breakpoints.down('sm')]: {
        flexDirection: 'column-reverse',
        gap: theme.spacing(2),
        padding: theme.spacing(2),
        marginTop: theme.spacing(3),
    },
}));

// Invite Section Header with Button
export const InviteSectionHeader = styled(Box)(({ theme }) => ({
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing(2.5),
    flexWrap: 'wrap',
    gap: theme.spacing(2),
    [theme.breakpoints.down('sm')]: {
        flexDirection: 'column',
        alignItems: 'stretch',
    },
}));
