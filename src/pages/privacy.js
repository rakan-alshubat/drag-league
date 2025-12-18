import React from 'react';
import Link from 'next/link';
import { Box, Typography, Container } from '@mui/material';
import { NextSeo } from 'next-seo';

export default function PrivacyPage() {
    return (
        <>
            <NextSeo
                title="Privacy Policy — Drag League"
                description="Read Drag League's Privacy Policy to learn how we handle user data, cookies, and your rights."
                canonical="/privacy"
            />
            <Container maxWidth="md" sx={{ py: 6 }}>
                <Typography variant="h4" sx={{ fontWeight: 800, mb: 2 }}>Privacy Policy</Typography>

                <Typography sx={{ mb: 2 }}>Effective date: {new Date().toLocaleDateString()}</Typography>

                <Typography sx={{ mb: 1, fontWeight: 700 }}>1. Introduction</Typography>
                <Typography sx={{ mb: 2 }}>
                This Privacy Policy explains how we collect, use, disclose, and protect information when you use the Drag League website (the Service). By using the Service you agree to the terms described here.
                </Typography>

                <Typography sx={{ mb: 1, fontWeight: 700 }}>2. Information We Collect</Typography>
                <Typography sx={{ mb: 2 }}>
                - Account information: email, username, display name when you register or sign in via third-party authentication.
                    <br />- Profile data: information you provide for your player profile and leagues you create or join.
                    <br />- Usage data: analytics about how you use the Service, such as pages visited and actions performed (we may use third-party analytics providers).
                    <br />- Communications: support requests or other messages you send to us.
                </Typography>

                <Typography sx={{ mb: 1, fontWeight: 700 }}>3. How We Use Your Information</Typography>
                <Typography sx={{ mb: 2 }}>
                We use information to provide and improve the Service, communicate with you, personalize content, prevent abuse, and comply with legal obligations.
                </Typography>

                <Typography sx={{ mb: 1, fontWeight: 700 }}>4. Sharing & Third Parties</Typography>
                <Typography sx={{ mb: 2 }}>
                We may share data with service providers (hosting, analytics, email), and when required by law. We do not sell personal data.
                </Typography>

                <Typography sx={{ mb: 1, fontWeight: 700 }}>5. Cookies & Tracking</Typography>
                <Typography sx={{ mb: 2 }}>
                We use cookies and similar technologies for authentication, analytics, and to remember preferences. You can control cookies through your browser settings.
                </Typography>

                <Typography sx={{ mb: 1, fontWeight: 700 }}>6. Your Rights</Typography>
                <Typography sx={{ mb: 2 }}>
                Subject to local law, you may have the right to access, correct, or delete your personal information. Contact us using the details below to exercise these rights.
                </Typography>

                <Typography sx={{ mb: 1, fontWeight: 700 }}>7. Security</Typography>
                <Typography sx={{ mb: 2 }}>
                We implement reasonable administrative and technical measures to protect your data, but no method is 100% secure.
                </Typography>

                <Typography sx={{ mb: 1, fontWeight: 700 }}>8. Children</Typography>
                <Typography sx={{ mb: 2 }}>
                The Service is not intended for children under 13. We do not knowingly collect personal information from children.
                </Typography>

                <Typography sx={{ mb: 1, fontWeight: 700 }}>9. Changes</Typography>
                <Typography sx={{ mb: 2 }}>
                We may update this policy; we will post the revised policy with a new effective date.
                </Typography>

                <Typography sx={{ mb: 2 }}>
                Contact: If you have questions, please visit the <Link href="/Support">Support</Link> page.
                </Typography>

                <Box sx={{ mt: 4 }}>
                    <Link href="/">Back to Home</Link>
                </Box>
            </Container>
        </>
    );
}
