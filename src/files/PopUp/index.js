import React from "react";
import {
    StyledDialog,
    TitleRow,
    ContentBox,
    ActionRow,
    ConfirmButton,
    CancelButton,
} from "./PopUp.styles";
import { Typography, CircularProgress, Box } from "@mui/material";
import { DescriptionText } from "./PopUp.styles";

/**
 * ConfirmDialog (reusable)
 * Props:
 *  - open: boolean
 *  - title: string
 *  - children: node (description/content)
 *  - confirmText: string
 *  - cancelText: string
 *  - onConfirm: function
 *  - onCancel: function
 *  - loading: boolean (disables confirm and shows spinner)
 */
export default function PopUp({
    open,
    title = "Confirm",
    children = null,
    confirmText = "Confirm",
    cancelText = "Cancel",
    onConfirm = () => {},
    onCancel = () => {},
    loading = false,
    confirmVariant = 'primary'
}) {
    return (
        <StyledDialog
            open={!!open}
            onClose={() => { if (!loading) onCancel(); }}
            aria-labelledby="confirm-dialog-title"
            disableEscapeKeyDown={loading}
            disableAutoFocus
            disableEnforceFocus
            disableRestoreFocus
        >
            <TitleRow id="confirm-dialog-title">
                <Typography variant="subtitle1">{title}</Typography>
            </TitleRow>

            <ContentBox dividers>
                {typeof children === "string" ? (
                    <DescriptionText>{children}</DescriptionText>
                ) : (
                    children
                )}
            </ContentBox>

            <ActionRow>
                {cancelText ? (
                    <CancelButton
                        type="button"
                        onClick={(e) => { e.stopPropagation(); e.preventDefault(); onCancel(); }}
                        variant="outlined"
                        disabled={loading}
                    >
                        {cancelText}
                    </CancelButton>
                ) : null}

                <ConfirmButton
                    type="button"
                    onClick={onConfirm}
                    variant="contained"
                    disabled={loading}
                    variantstyle={confirmVariant}
                    startIcon={loading ? <CircularProgress color="inherit" size={16} /> : null}
                >
                    {confirmText}
                </ConfirmButton>
            </ActionRow>
        </StyledDialog>
    );
}