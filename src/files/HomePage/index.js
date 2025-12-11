import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { getCurrentUser } from '@aws-amplify/auth';
import { Typography } from '@mui/material';
import { 
    PageContainer,
    HeroSection,
    Title,
    Subtitle,
    ButtonGroup,
    StyledButton,
    InfoSection,
    FeatureGrid,
    FeatureCard
} from './HomePage.styles';

export default function HomePage() {
    const router = useRouter();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkAuthStatus();
    }, []);

    const checkAuthStatus = async () => {
        try {
            await getCurrentUser();
            setIsAuthenticated(true);
        } catch {
            setIsAuthenticated(false);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return null;
    }

    if (isAuthenticated) {
        return (
            <PageContainer>
                <HeroSection>
                    <Title>Welcome Back!</Title>
                    <Subtitle>
                        Ready to manage your Drag Race fantasy leagues? Check out your leagues or create a new one.
                    </Subtitle>
                    <ButtonGroup>
                        <StyledButton 
                            variant="contained" 
                            color="secondary"
                            size="large"
                            onClick={() => router.push('/Player')}
                        >
                            My Leagues
                        </StyledButton>
                        <StyledButton 
                            variant="outlined" 
                            size="large"
                            onClick={() => router.push('/CreateLeague')}
                            sx={{ 
                                borderColor: 'white', 
                                color: 'white',
                                '&:hover': { 
                                    borderColor: 'white', 
                                    backgroundColor: 'rgba(255,255,255,0.1)' 
                                }
                            }}
                        >
                            Create League
                        </StyledButton>
                    </ButtonGroup>
                </HeroSection>
            </PageContainer>
        );
    }

    return (
        <PageContainer>
            <HeroSection>
                <Title>Drag League</Title>
                <Subtitle>
                    Create and manage your own Drag Race fantasy leagues. Compete with friends, track queens, and crown your winner!
                </Subtitle>
                <ButtonGroup>
                    <StyledButton 
                        variant="contained" 
                        color="secondary"
                        size="large"
                        onClick={() => router.push('/SignIn')}
                    >
                        Sign Up
                    </StyledButton>
                    <StyledButton 
                        variant="outlined" 
                        size="large"
                        onClick={() => router.push('/SignIn')}
                        sx={{ 
                            borderColor: 'white', 
                            color: 'white',
                            '&:hover': { 
                                borderColor: 'white', 
                                backgroundColor: 'rgba(255,255,255,0.1)' 
                            }
                        }}
                    >
                        Log In
                    </StyledButton>
                </ButtonGroup>
            </HeroSection>

            <InfoSection>
                <Typography variant="h3" gutterBottom fontWeight={600} sx={{ color: 'white' }}>
                    How It Works
                </Typography>
                <Typography variant="h6" paragraph sx={{ color: '#FFD700', fontWeight: 500 }}>
                    Fantasy leagues for RuPaul&apos;s Drag Race fans
                </Typography>

                <FeatureGrid>
                    <FeatureCard>
                        <Typography variant="h5" gutterBottom fontWeight={600} color="primary">
                            🏆 Create Leagues
                        </Typography>
                        <Typography sx={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                            Set up custom leagues with your own rules, scoring, and bonus categories
                        </Typography>
                    </FeatureCard>

                    <FeatureCard>
                        <Typography variant="h5" gutterBottom fontWeight={600} color="primary">
                            🏁 Rank Queens
                        </Typography>
                        <Typography sx={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                            Predict the elimination order and earn points based on your accuracy
                        </Typography>
                    </FeatureCard>

                    <FeatureCard>
                        <Typography variant="h5" gutterBottom fontWeight={600} color="primary">
                            🎯 Compete
                        </Typography>
                        <Typography sx={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                            Invite friends, track scores, and see who has the best predictions
                        </Typography>
                    </FeatureCard>
                </FeatureGrid>
            </InfoSection>
        </PageContainer>
    );
}
