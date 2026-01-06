// ...existing code...
import React from 'react';
import PropTypes from 'prop-types';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import {
    StyledDialog,
    Content,
    ErrorIconWrapper,
    Message,
    CloseButton,
} from './ErrorPopUp.styles';

export default function ErrorPopup({ open, onClose, message }) {
    return (
        <StyledDialog open={open} onClose={onClose} aria-labelledby="error-popup">
            <Content>
                <ErrorIconWrapper>
                    <ErrorOutlineIcon sx={{ fontSize: 32 }} />
                </ErrorIconWrapper>

                <Message variant="body1">
                    {message || 'An unexpected error occurred.'}
                </Message>

                {typeof onClose === 'function' && (
                    <CloseButton variant="contained" color="primary" onClick={(e) => { e.stopPropagation(); e.preventDefault(); onClose(); }}>
                        Close
                    </CloseButton>
                )}
            </Content>
        </StyledDialog>
    );
}

ErrorPopup.propTypes = {
    open: PropTypes.bool,
    onClose: PropTypes.func,
    message: PropTypes.string,
};

ErrorPopup.defaultProps = {
    open: false,
    message: '',
};