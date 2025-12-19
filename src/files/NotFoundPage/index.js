import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import {
    PageContainer,
    ContentBox,
    ErrorCode,
    ErrorTitle,
    ErrorMessage,
    RedirectMessage,
    HomeButton,
    CountdownText
} from './NotFoundPage.styles';

export default function NotFoundPage() {
    const router = useRouter();
    const [countdown, setCountdown] = useState(10);

    useEffect(() => {
        // Start countdown
        const timer = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    router.push('/');
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        // Cleanup
        return () => clearInterval(timer);
    }, [router]);

    const handleGoHome = () => {
        router.push('/');
    };

    return (
        <PageContainer>
            <ContentBox>
                <ErrorCode>404</ErrorCode>
                <ErrorTitle>Page Not Found</ErrorTitle>
                <ErrorMessage>
                    Oops! This queen has left the building. 👑<br />
                    The page you&apos;re looking for doesn&apos;t exist.
                </ErrorMessage>
                <RedirectMessage>
                    Redirecting to home in <CountdownText>{countdown}</CountdownText> seconds...
                </RedirectMessage>
                <HomeButton
                    variant="contained"
                    onClick={handleGoHome}
                >
                    Go Home Now
                </HomeButton>
            </ContentBox>
        </PageContainer>
    );
}
