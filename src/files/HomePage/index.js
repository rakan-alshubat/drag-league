import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/router';
import { getCurrentUser } from '@aws-amplify/auth';
import { generateClient } from 'aws-amplify/api';
import { serverLogWarn } from '@/helpers/serverLog';
import { getUsers } from '@/graphql/queries';
import { Typography } from '@mui/material';
import FavoriteIcon from '@mui/icons-material/Favorite';
import { 
    PageContainer,
    HeroSection,
    Title,
    Subtitle,
    ButtonGroup,
    StyledButton,
    InfoSection,
    FeatureGrid,
    FeatureCard,
    SupportSection,
    SectionTitle,
    SectionDescription,
    IconWrapper,
    StyledIcon,
    CoffeeButton,
    HighlightBox,
    HighlightTitle,
    HighlightText
} from './HomePage.styles';

export default function HomePage() {
    const router = useRouter();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);
    const [userName, setUserName] = useState('');
    const client = useMemo(() => generateClient(), []);

    useEffect(() => {
        checkAuthStatus();
    }, []);

    const handleBuyMeCoffeeClick = () => {
        window.open('https://www.buymeacoffee.com/dragleague', '_blank');
    };

    const checkAuthStatus = async () => {
        try {
            const user = await getCurrentUser();
            setIsAuthenticated(true);

            // try to fetch display name from the Users table (if available)
            try {
                const id = (user?.signInDetails?.loginId || user?.username || '').toLowerCase();
                if (id) {
                    const res = await client.graphql({ query: getUsers, variables: { id } });
                    const userRec = res?.data?.getUsers;
                    if (userRec?.name) setUserName(userRec.name);
                }
            } catch (err) {
                // non-fatal — we still want to show the page even if name lookup fails
                await serverLogWarn('Could not fetch user display name', { error: err.message });
            }

        } catch {
            setIsAuthenticated(false);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return null;
    }

    

    return (
        <PageContainer>
            <HeroSection>
                {isAuthenticated ? (
                    <>
                        <Title>{userName ? `Welcome Back, ${userName}!` : 'Welcome Back!'}</Title>
                        <Subtitle>
                            Ready to manage your Drag Race fantasy leagues? Check out your leagues or create a new one.
                        </Subtitle>
                        <ButtonGroup>
                            <StyledButton 
                                variant="contained" 
                                color="secondary"
                                size="large"
                                href="/Player"
                                onClick={() => router.push('/Player')}
                            >
                                My Leagues
                            </StyledButton>
                            <StyledButton 
                                variant="outlined" 
                                size="large"
                                href="/CreateLeague"
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
                    </>
                ) : (
                    <>
                        <Title>Drag League</Title>
                        <Subtitle>
                            Create and manage your own Drag Race fantasy leagues. Compete with friends, track queens, and crown your winner!
                        </Subtitle>
                        <ButtonGroup>
                            <StyledButton 
                                variant="contained" 
                                color="secondary"
                                size="large"
                                href="/SignIn"
                                onClick={() => router.push('/SignIn')}
                            >
                                Sign Up
                            </StyledButton>
                            <StyledButton 
                                variant="outlined" 
                                size="large"
                                href="/SignIn"
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
                    </>
                )}
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
