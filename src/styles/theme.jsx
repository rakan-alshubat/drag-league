import { createTheme } from '@mui/material/styles';
import { red } from '@mui/material/colors';
// RuPaul's Drag Race Theme
const theme = createTheme({
    palette: {
        primary: {
            main: '#FF1493', // Hot Pink
            light: '#FFB6C1', // Light Pink
            dark: '#C71585', // Deep Pink
            contrastText: '#ffffff',
        },
        secondary: {
            main: '#FFD700', // Gold
            light: '#FFE55C',
            dark: '#FFA500',
            contrastText: '#1a0033',
        },
        error: {
            main: red.A400,
        },
        info: {
            main: '#00CED1', // Turquoise
        },
        success: {
            main: '#9B30FF', // Purple
        },
        background: {
            default: '#fafafa',
            paper: '#ffffff',
        },
    },
    typography: {
        fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
        h1: {
            fontWeight: 700,
            '@media (max-width:600px)': {
                fontSize: '2.5rem',
            },
        },
        h2: {
            fontWeight: 700,
            '@media (max-width:600px)': {
                fontSize: '2rem',
            },
        },
        h3: {
            fontWeight: 600,
            '@media (max-width:600px)': {
                fontSize: '1.5rem',
            },
        },
    },
    breakpoints: {
        values: {
            xs: 0,
            sm: 600,
            md: 960,
            lg: 1280,
            xl: 1920,
        },
    },
    shadows: [
        'none',
        '0 2px 8px rgba(255, 20, 147, 0.15)',
        '0 4px 12px rgba(255, 20, 147, 0.2)',
        '0 6px 16px rgba(255, 20, 147, 0.25)',
        '0 8px 20px rgba(255, 20, 147, 0.3)',
        '0 10px 24px rgba(255, 20, 147, 0.35)',
        '0 12px 28px rgba(255, 20, 147, 0.4)',
        '0 14px 32px rgba(255, 20, 147, 0.45)',
        '0 16px 36px rgba(255, 20, 147, 0.5)',
        '0 18px 40px rgba(255, 20, 147, 0.55)',
        '0 20px 44px rgba(255, 20, 147, 0.6)',
        '0 22px 48px rgba(255, 20, 147, 0.65)',
        '0 24px 52px rgba(255, 20, 147, 0.7)',
        '0 26px 56px rgba(255, 20, 147, 0.75)',
        '0 28px 60px rgba(255, 20, 147, 0.8)',
        '0 30px 64px rgba(255, 20, 147, 0.85)',
        '0 32px 68px rgba(255, 20, 147, 0.9)',
        '0 34px 72px rgba(255, 20, 147, 0.95)',
        '0 36px 76px rgba(255, 20, 147, 1)',
        '0 38px 80px rgba(255, 20, 147, 1)',
        '0 40px 84px rgba(255, 20, 147, 1)',
        '0 42px 88px rgba(255, 20, 147, 1)',
        '0 44px 92px rgba(255, 20, 147, 1)',
        '0 46px 96px rgba(255, 20, 147, 1)',
        '0 48px 100px rgba(255, 20, 147, 1)',
    ],
});
export default theme;