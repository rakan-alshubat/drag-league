import React from 'react';
import NextLink from 'next/link';
import { Box, Typography, Link as MUILink } from '@mui/material';

export default function Footer() {
    return (
        <Box
            component="footer"
            sx={{
                mt: 0,
                py: 4,
                px: 2,
                background: 'linear-gradient(180deg, #330066 0%, #1a0033 100%)',
                borderTop: '1px solid rgba(0,0,0,0.12)',
                textAlign: 'center',
            }}
        >
            <Typography variant="body2" sx={{ mb: 1, color: '#FFD700', fontWeight: 700 }}>
                © {new Date().getFullYear()} Drag League
            </Typography>

            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
                <MUILink component={NextLink} href="/privacy" underline="hover" sx={{ color: '#FFD700', fontWeight: 600 }}>
                    Privacy
                </MUILink>
                <MUILink component={NextLink} href="/terms" underline="hover" sx={{ color: '#FFD700', fontWeight: 600 }}>
                    Terms
                </MUILink>
                <MUILink component={NextLink} href="/Support" underline="hover" sx={{ color: '#FFD700', fontWeight: 600 }}>
                    Support
                </MUILink>
            </Box>
        </Box>
    );
}
