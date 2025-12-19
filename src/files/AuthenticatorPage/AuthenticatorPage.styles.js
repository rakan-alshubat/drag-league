import { Box } from "@mui/material";
import { styled } from "@mui/material/styles";

// Clean, site-consistent authenticator styling
export const SignInBox = styled(Box)(({ theme }) => ({
    background: 'linear-gradient(180deg, #1a0033 0%, #330066 100%)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    padding: theme.spacing(4),

    // Amplify root
    '& [data-amplify-authenticator]': {
        width: '100%',
        display: 'flex',
        justifyContent: 'center',

        // central card that matches site look (light card over dark background)
        '& .amplify-container, & .amplify-form': {
            backgroundColor: theme.palette.background.paper,
            color: theme.palette.text.primary,
            padding: theme.spacing(4),
            borderRadius: theme.spacing(2),
            width: 'min(520px, 96%)',
            boxShadow: theme.shadows[6],
            border: `2px solid ${theme.palette.primary.main}`,
        },

        // Header / title
        '& .amplify-form-header, & .amplify-form-section h3, & h1, & h2': {
            color: theme.palette.primary.main,
            fontWeight: 700,
            marginBottom: theme.spacing(1),
        },

        // Section spacing
        '& .amplify-form-section': {
            marginBottom: theme.spacing(2),
        },

        // Inputs: ensure email/password show visible border and rounded corners
        '& .amplify-input, & .amplify-form-section input, & input[type="email"], & input[type="password"]': {
            display: 'block',
            width: '100%',
            padding: `${theme.spacing(1)} ${theme.spacing(1.5)}`,
            borderRadius: 10,
            border: `1px solid rgba(0,0,0,0.12)`,
            background: theme.palette.background.paper,
            boxSizing: 'border-box',
            fontSize: '1rem',
        },
        '& .amplify-input input:focus, & .amplify-form-section input:focus': {
            outline: 'none',
            boxShadow: `0 6px 24px rgba(197,21,133,0.12)`,
            border: `1px solid ${theme.palette.primary.main}`,
        },

        // Buttons: round, roomy, site gradient
        '& .amplify-button, & button': {
            borderRadius: 12,
            padding: `${theme.spacing(1.25)} ${theme.spacing(3)}`,
            minHeight: 44,
            fontSize: '1rem',
            textTransform: 'none',
            color: theme.palette.primary.contrastText,
            background: `linear-gradient(90deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
            boxShadow: theme.shadows[4],
            border: 'none',
            cursor: 'pointer',
        },

        // Tabs / auth method buttons
        '& [role="tablist"]': {
            display: 'flex',
            gap: theme.spacing(1),
            marginBottom: theme.spacing(2),
        },
        '& [role="tab"]': {
            borderRadius: 12,
            padding: `${theme.spacing(0.5)} ${theme.spacing(2)}`,
            background: 'transparent',
            border: `1px solid rgba(0,0,0,0.06)`,
            color: theme.palette.text.primary,
        },
        '& [role="tab"][aria-selected="true"]': {
            background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
            color: theme.palette.primary.contrastText,
            boxShadow: theme.shadows[3],
        },

        // Links & helper text
        '& .amplify-link, & a': {
            color: theme.palette.primary.main,
            textDecoration: 'none',
        },
        '& .amplify-helptext, & .amplify-form-field': {
            color: theme.palette.text.secondary,
            fontSize: '0.9rem',
        }
    }
}));