import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/router';
import { getCurrentUser } from '@aws-amplify/auth';
import { generateClient } from 'aws-amplify/api';
import { serverLogWarn, serverLogError } from '@/helpers/serverLog';
import { getUsers, listLeagues } from '@/graphql/queries';
import { Typography, TextField, Box, CircularProgress } from '@mui/material';
import FavoriteIcon from '@mui/icons-material/Favorite';
import {
    StyledDialog as PopupDialog,
    StyledDialogTitle,
    StyledDialogContent,
    StyledDialogActions,
    CancelButton
} from '@/files/SubmissionsPopUp/SubmissionsPopUp.styles';
import { SearchResultCard, SearchResultTitle, SearchResultDescription } from '@/files/PlayerPage/PlayerPage.styles';
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
    
    // Search state
    const [searchOpen, setSearchOpen] = useState(false);
    const [searchName, setSearchName] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [searchLoading, setSearchLoading] = useState(false);

    useEffect(() => {
        checkAuthStatus();
    }, []);

    const handleBuyMeCoffeeClick = () => {
        window.open('https://www.buymeacoffee.com/dragleague', '_blank');
    };

    const closeSearch = () => {
        setSearchOpen(false);
        setSearchName('');
        setSearchResults([]);
        setSearchLoading(false);
    };

    // Live search for public leagues when typing in the Search dialog
    useEffect(() => {
        if (!searchOpen) return; // only search when dialog is open

        let active = true;
        if (!searchName || String(searchName).trim().length === 0) {
            setSearchResults([]);
            setSearchLoading(false);
            return;
        }

        setSearchLoading(true);
        const timer = setTimeout(async () => {
            try {
                console.log('Searching for leagues with name:', searchName);
                // Fetch public leagues and apply a case-insensitive filter client-side
                const filter = { lgPublic: { eq: true } };
                
                // Use API Key auth mode for unauthenticated users
                const authMode = isAuthenticated ? undefined : 'apiKey';
                const res = await client.graphql({ 
                    query: listLeagues, 
                    variables: { filter, limit: 100 },
                    authMode: authMode
                });
                
                console.log('GraphQL response:', res);
                const items = res?.data?.listLeagues?.items || [];
                console.log('Total public leagues:', items.length);
                if (!active) return;
                const needle = String(searchName || '').toLowerCase();
                const matched = items.filter(i => (String(i.lgName || i.name || '')).toLowerCase().includes(needle));
                console.log('Matched leagues:', matched.length, matched);
                setSearchResults(matched.slice(0, 5));
            } catch (err) {
                console.error('League search error:', err);
                serverLogError('League search error', { error: err.message, searchName });
                if (active) setSearchResults([]);
            } finally {
                if (active) setSearchLoading(false);
            }
        }, 250);

        return () => {
            active = false;
            clearTimeout(timer);
        };
    }, [searchName, searchOpen, client]);

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
                serverLogWarn('Could not fetch user display name', { error: err.message });
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

                {/* Search Button for all users */}
                <Box sx={{ mt: 3, position: 'relative', zIndex: 1 }}>
                    <StyledButton
                        variant="outlined"
                        size="large"
                        onClick={() => setSearchOpen(true)}
                        sx={{
                            borderColor: 'white',
                            color: 'white',
                            '&:hover': {
                                borderColor: 'white',
                                backgroundColor: 'rgba(255,255,255,0.1)',
                            },
                        }}
                    >
                        🔍 Search Leagues
                    </StyledButton>
                </Box>
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

            {/* Search Dialog */}
            <PopupDialog 
                open={searchOpen} 
                onClose={() => closeSearch()}
                fullWidth
                maxWidth="md"
                PaperProps={{
                    sx: {
                        minWidth: { xs: '90vw !important', sm: '500px !important', md: '600px !important' },
                        width: { xs: '90vw', sm: '80vw', md: '700px' },
                    }
                }}
            >
                <StyledDialogTitle>Search Leagues</StyledDialogTitle>

                <StyledDialogContent>
                    <TextField
                        label="League name"
                        value={searchName}
                        onChange={(e) => setSearchName(e.target.value)}
                        fullWidth
                        autoFocus
                        margin="dense"
                        variant="outlined"
                    />

                    <Box sx={{ mt: 1, width: '100%' }}>
                        {searchLoading ? (
                            <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                                <CircularProgress size={28} sx={{ color: '#FF1493' }} />
                            </Box>
                        ) : (
                            <Box sx={{ width: '100%' }}>
                                {searchResults && searchResults.length > 0 ? (
                                    searchResults.map(r => (
                                        <SearchResultCard
                                            key={r.id}
                                            role="button"
                                            tabIndex={0}
                                            aria-label={`Open league ${r.lgName || r.name || 'Untitled'}`}
                                            onClick={() => { closeSearch(); router.push(`/League/${r.id}`); }}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' || e.key === ' ') {
                                                    e.preventDefault();
                                                    closeSearch();
                                                    router.push(`/League/${r.id}`);
                                                }
                                            }}
                                        >
                                            <SearchResultTitle>{r.lgName || r.name || 'Untitled'}</SearchResultTitle>
                                            {r.lgDescription && (
                                                <SearchResultDescription sx={{ color: '#666' }}>
                                                    {r.lgDescription}
                                                </SearchResultDescription>
                                            )}
                                        </SearchResultCard>
                                    ))
                                ) : (
                                    <Box sx={{ textAlign: 'center', py: 2, color: '#666' }}>No leagues found.</Box>
                                )}
                            </Box>
                        )}
                    </Box>

                </StyledDialogContent>

                <StyledDialogActions>
                    <CancelButton onClick={() => closeSearch()}>Cancel</CancelButton>
                </StyledDialogActions>
            </PopupDialog>
        </PageContainer>
    );
}
