import { Typography, Box, TextField, Select, Checkbox, FormControlLabel, Button, Alert } from "@mui/material";
import { styled } from "@mui/material/styles";

export const CreationTitleBox = styled(Typography)(({ theme }) => ({
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing(4),
    fontSize: '2rem',
    fontWeight: 'bold',
    [theme.breakpoints.down('sm')]: {
        fontSize: '1.6rem',
        marginBottom: theme.spacing(3),
    },
}));

export const FormContainer = styled(Box)(({ theme }) => ({
    display: 'flex',
    flexDirection: 'column',
    maxWidth: '800px',
    margin: '0 auto',
    padding: theme.spacing(2),
    position: 'relative',
    paddingBottom: theme.spacing(15),
    [theme.breakpoints.down('sm')]: {
        padding: theme.spacing(1.5),
        paddingBottom: theme.spacing(12),
        maxWidth: '100%',
    },
}));

export const FormSection = styled(Box)(({ theme }) => ({
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(2)
}));

export const SectionTitle = styled(Typography)(({ theme }) => ({
    fontSize: '1.2rem',
    fontWeight: 'bold',
    marginTop: theme.spacing(2),
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    flex: '0 0 auto',
    [theme.breakpoints.down('sm')]: {
        fontSize: '1.1rem',
        whiteSpace: 'normal',
    },
}));

export const StyledTextField = styled(TextField)(({ theme }) => ({
    '& .MuiInputBase-root': {
        borderRadius: theme.spacing(1)
    }
}));

export const StyledSelect = styled(Select)(({ theme }) => ({
    '& .MuiInputBase-root': {
        borderRadius: theme.spacing(1)
    }
}));

export const InputGroup = styled(Box)(({ theme }) => ({
    display: 'flex',
    gap: theme.spacing(2),
    alignItems: 'center',
    [theme.breakpoints.down('sm')]: {
        flexDirection: 'column',
        gap: theme.spacing(1.5),
        alignItems: 'stretch',
    },
}));

export const StyledCheckbox = styled(Checkbox)(({ theme }) => ({
    '&.MuiCheckbox-root': {
        color: theme.palette.primary.main,
    },
    '&.Mui-checked': {
        color: theme.palette.primary.main,
    }
}));

export const CheckboxLabel = styled(FormControlLabel)(({ theme }) => ({
    marginRight: theme.spacing(2),
    userSelect: 'none'
}));

export const InputGroupWithCheckbox = styled(Box)(({ theme }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(2),
    '& .MuiTextField-root': {
        flexGrow: 1
    }
}));

export const BonusPointContainer = styled(Box)(({ theme }) => ({
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(2),
    marginLeft: theme.spacing(4)
}));

export const BonusPointRow = styled(Box)(({ theme }) => ({
    display: 'flex',
    gap: theme.spacing(2),
    alignItems: 'center',
    '& .MuiTextField-root': {
        flexGrow: 1,
        minWidth: '200px'
    },
    '& .MuiSelect-root': {
        minWidth: '100px'
    },
    [theme.breakpoints.down('sm')]: {
        flexDirection: 'column',
        gap: theme.spacing(1.5),
        alignItems: 'stretch',
        '& .MuiTextField-root': {
            minWidth: 'auto',
            width: '100%',
        },
        '& .MuiSelect-root': {
            minWidth: 'auto',
            width: '100%',
        },
    },
}));

export const SubmitContainer = styled(Box)(({ theme }) => ({
    position: 'absolute', 
    left: theme.spacing(2),
    right: theme.spacing(2),
    bottom: theme.spacing(3),
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing(1),
    [theme.breakpoints.down('sm')]: {
        flexDirection: 'column-reverse',
        gap: theme.spacing(1.5),
        position: 'relative',
        left: 0,
        right: 0,
        bottom: 0,
        marginTop: theme.spacing(3),
    },
}));

export const SubmitButton = styled(Button)(({ theme }) => ({
    padding: theme.spacing(1, 3),
    borderRadius: theme.spacing(1),
    boxShadow: theme.shadows[2],
    [theme.breakpoints.down('sm')]: {
        width: '100%',
        padding: theme.spacing(1.5, 3),
    },
}));

export const CancelButton = styled(Button)(({ theme }) => ({
    padding: theme.spacing(1, 3),
    borderRadius: theme.spacing(1),
    boxShadow: theme.shadows[2],
    backgroundColor: theme.palette.background.paper,
    color: theme.palette.text.primary,
    '&:hover': {
        backgroundColor: theme.palette.action.hover,
    },
    [theme.breakpoints.down('sm')]: {
        width: '100%',
        padding: theme.spacing(1.5, 3),
    },
}));

export const SectionWrapper = styled(Box)(({ theme }) => ({
    padding: theme.spacing(2),
    borderRadius: theme.spacing(1),
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(1.5),
    // alternating backgrounds for sibling sections
    '&:nth-of-type(odd)': {
        backgroundColor: theme.palette.action.hover, // subtle alternate
    },
    '&:nth-of-type(even)': {
        backgroundColor: 'grey',
    },
    // ensure inputs inside have full width
    '& .MuiTextField-root, & .MuiSelect-root': {
        width: '100%',
    },
    margin: 0,
}));

export const ExplanationText = styled(Typography)(({ theme }) => ({
    fontSize: '0.875rem',
    color: theme.palette.text.secondary,
    marginBottom: theme.spacing(1),
    lineHeight: 1.4,
}));

export const DescriptionBox = styled(Box)(({ theme }) => ({
    width: '800px',
    margin: '0 auto',
    backgroundColor: '#f5f5f5',
    padding: theme.spacing(2),
    borderRadius: theme.spacing(1),
    boxShadow: theme.shadows[1],
    textAlign: 'center',
    marginBottom: theme.spacing(2),
}));

export const DescriptionText = styled(Typography)(({ theme }) => ({
    color: theme.palette.text.secondary,
    fontSize: '1rem',
}));

export const TitleRow = styled(Box)(({ theme }) => ({
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'start',
    gap: theme.spacing(2),
    width: '100%'
}));

export const ErrorAlert = styled(Alert)(({ theme }) => ({
    display: 'flex',
    alignItems: 'center',
    padding: theme.spacing(0.5, 1),
    fontSize: '0.9rem',
    flex: 1,
    minWidth: 0,
    '& .MuiAlert-message': {
        padding: 0,
        whiteSpace: 'normal'
    },
    '& .MuiAlert-icon': {
        marginRight: theme.spacing(1)
    },
    wordBreak: 'break-word'
}));