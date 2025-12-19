import React from 'react';
import Link from 'next/link';
import { Box, Typography, Container } from '@mui/material';
import { NextSeo } from 'next-seo';

export default function TermsPage() {
    return (
        <>
            <NextSeo
                title="Terms of Service — Drag League"
                description="Terms of Service for Drag League: account rules, acceptable use, and limitations of liability."
                canonical="/terms"
            />
            <Container maxWidth="md" sx={{ py: 6 }}>
                <Typography variant="h4" sx={{ fontWeight: 800, mb: 2 }}>Terms of Service</Typography>

                <Typography sx={{ mb: 2 }}>Effective date: {new Date().toLocaleDateString()}</Typography>

                <Typography sx={{ mb: 1, fontWeight: 700 }}>1. Acceptance</Typography>
                <Typography sx={{ mb: 2 }}>
                By using Drag League (the Service), you agree to these Terms. If you do not agree, do not use the Service.
                </Typography>

                <Typography sx={{ mb: 1, fontWeight: 700 }}>2. Accounts</Typography>
                <Typography sx={{ mb: 2 }}>
                You are responsible for your account, password, and activity. Do not share credentials.
                </Typography>

                <Typography sx={{ mb: 1, fontWeight: 700 }}>3. Acceptable Use</Typography>
                <Typography sx={{ mb: 2 }}>
                Do not use the Service to post illegal content, harass others, or attempt to compromise the platform.
                </Typography>

                <Typography sx={{ mb: 1, fontWeight: 700 }}>4. Content</Typography>
                <Typography sx={{ mb: 2 }}>
                You retain rights to content you post; by posting you grant the Service a license to display that content.
                </Typography>

                <Typography sx={{ mb: 1, fontWeight: 700 }}>5. Termination</Typography>
                <Typography sx={{ mb: 2 }}>
                We may suspend or terminate accounts that violate these Terms.
                </Typography>

                <Typography sx={{ mb: 1, fontWeight: 700 }}>6. Disclaimers & Limitation of Liability</Typography>
                <Typography sx={{ mb: 2 }}>
                The Service is provided as is. We disclaim warranties and limit liability to the extent permitted by law.
                </Typography>

                <Typography sx={{ mb: 1, fontWeight: 700 }}>7. Governing Law</Typography>
                <Typography sx={{ mb: 2 }}>
                These Terms are governed by the laws of the jurisdiction where the Service operates.
                </Typography>

                <Box sx={{ mt: 4 }}>
                    <Link href="/">Back to Home</Link>
                </Box>
            </Container>
        </>
    );
}
