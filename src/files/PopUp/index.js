import React from "react";
import {
    StyledDialog,
    TitleRow,
    ContentBox,
    ActionRow,
    ConfirmButton,
    CancelButton,
} from "./PopUp.styles";
import { Typography, CircularProgress } from "@mui/material";

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
}) {
    return (
        <StyledDialog
            open={!!open}
            onClose={() => { if (!loading) onCancel(); }}
            aria-labelledby="confirm-dialog-title"
            disableEscapeKeyDown={loading}
        >
            <TitleRow id="confirm-dialog-title">
                <Typography variant="subtitle1">{title}</Typography>
            </TitleRow>

            <ContentBox dividers>
                {typeof children === "string" ? (
                    <Typography variant="body2">{children}</Typography>
                ) : (
                    children
                )}
            </ContentBox>

            <ActionRow>
                <CancelButton
                    onClick={onCancel}
                    variant="outlined"
                    disabled={loading}
                >
                    {cancelText}
                </CancelButton>

                <ConfirmButton
                    onClick={onConfirm}
                    variant="contained"
                    color="primary"
                    disabled={loading}
                    startIcon={loading ? <CircularProgress color="inherit" size={16} /> : null}
                >
                    {confirmText}
                </ConfirmButton>
            </ActionRow>
        </StyledDialog>
    );
}