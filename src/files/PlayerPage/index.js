import { useEffect, useState } from 'react';
import { useRouter } from "next/router";
import { getCurrentUser, signOut } from "aws-amplify/auth";
import LoadingWheel from "@/files/LoadingWheel";
import parseToArray from '@/helpers/parseToArray';
import { generateClient } from 'aws-amplify/api'
import { getUsers } from "@/graphql/queries";
import { createUsers, updateUsers, deleteUsers } from '@/graphql/mutations';
import ErrorPopup from "../ErrorPopUp";
import { onCreateUsers, onUpdateUsers, onDeleteUsers } from '@/graphql/subscriptions';
import { Box, Typography, Button, Tabs, Tab, TextField, Stack } from '@mui/material';
import {
    WelcomeBanner,
    WelcomeText,
    ContentContainer,
    LeagueSection,
    LeagueList,
    LeagueLink,
    ButtonContainer,
    EmptyState,
    EmptyStateIcon,
    EmptyStateTitle,
    EmptyStateDescription } from './PlayerPage.styles';

export default function PlayerPage() {
    const [loading, setLoading] = useState(true);
    const [errorPopup, setErrorPopup] = useState(false);
    const router = useRouter();
    const client = generateClient()

    const [userID, setUserID] = useState('');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [leagues, setLeagues] = useState([]);
    const [pendingLeagues, setPendingLeagues] = useState([]);
    const [tabIndex, setTabIndex] = useState(0);
    const [nameInput, setNameInput] = useState('');
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    
    
    useEffect(() => {
        getCurrentUser()
            .then(user => {
                async function checkAndSaveUser() {
                    try {
                        const results = await client.graphql({
                            query: getUsers,
                            variables: { id: user.signInDetails.loginId.toLowerCase() }
                        })
                        console.log('User fetch result:', results);
            
                        if(results.data.getUsers === null) {
                            const newUser = {
                                id: user.signInDetails.loginId.toLowerCase(),
                            }
                            const createResult = await client.graphql({
                                query: createUsers,
                                variables: { input: newUser }
                            });
                            console.log('New user created:', createResult);
                            setUserID(newUser.id);
                        }else{
                            setUserID(results.data.getUsers.id || '');
                            setName(results.data.getUsers.name || '');
                            setEmail(results.data.getUsers.email || '');
                            setLeagues(results.data.getUsers.leagues || []); 
                            setPendingLeagues(results.data.getUsers.pendingLeagues || []);
                        }

                    } catch (error){
                        console.error('Error with user data:', error);
                    } finally {
                        setLoading(false)
                    }
                }
                checkAndSaveUser();
            })
            .catch(() => {
                router.push('/SignIn')
            });
    }, []);

    useEffect(() => {
        if (!userID) return;
        const subs = [];

        const subUpdate = client.graphql({ query: onUpdateUsers }).subscribe({
            next: ({ value }) => {
                const updated = value?.data?.onUpdateUsers;
                if (updated && updated.id === userID) {
                    setName(updated.name || '');
                    setEmail(updated.email || '');
                    setLeagues(updated.leagues || []);
                    setPendingLeagues(updated.pendingLeagues || []);
                }
            },
            error: err => console.warn('onUpdateUsers sub error', err)
        });
        subs.push(subUpdate);

        const subCreate = client.graphql({ query: onCreateUsers }).subscribe({
            next: ({ value }) => {
                const created = value?.data?.onCreateUsers;
                if (created && created.id === userID) {
                    setName(created.name || '');
                    setEmail(created.email || '');
                    setLeagues(created.leagues || []);
                    setPendingLeagues(created.pendingLeagues || []);
                }
            },
            error: err => console.warn('onCreateUsers sub error', err)
        });
        subs.push(subCreate);

        const subDelete = client.graphql({ query: onDeleteUsers }).subscribe({
            next: ({ value }) => {
                const deleted = value?.data?.onDeleteUsers;
                if (deleted && deleted.id === userID) {
                    // user deleted — send them to sign-in
                    router.push('/SignIn');
                }
            },
            error: err => console.warn('onDeleteUsers sub error', err)
        });
        subs.push(subDelete);

        return () => {
            subs.forEach(s => s && typeof s.unsubscribe === 'function' && s.unsubscribe());
        };
    }, [userID, client, router]);

    useEffect(() => {
        setNameInput(name || '');
    }, [name]);

    const handleSignOut = async () => {
        try{
            await signOut()
            router.push('/')
        } catch (error) {
            console.error('Could not sign out')
        }
    }

    const handleSaveSettings = async () => {
        if (!userID) return;
        setSaving(true);
        try {
            const input = { id: userID, name: (nameInput || '').trim() };
            await client.graphql({ query: updateUsers, variables: { input } });
            setName(nameInput || '');
        } catch (err) {
            console.error('Save settings error', err);
            setErrorPopup(true);
        } finally {
            setSaving(false);
        }
    }

    const handleDeleteAccount = async () => {
        if (!userID) return;
        const ok = window.confirm('Delete your account? This cannot be undone.');
        if (!ok) return;
        setDeleting(true);
        try {
            await client.graphql({ query: deleteUsers, variables: { input: { id: userID } } });
            router.push('/SignIn');
        } catch (err) {
            console.error('Delete account error', err);
            setErrorPopup(true);
        } finally {
            setDeleting(false);
        }
    }

    
    
    if(loading){
        return (
            <LoadingWheel />
        )
    }

    return (
        <Box>
            <WelcomeBanner>
                <WelcomeText>{name && name.trim() ? `Welcome, ${name.trim()}` : 'Welcome, Player'}</WelcomeText>
            </WelcomeBanner>

            <ContentContainer>
                <Tabs value={tabIndex} onChange={(_, v) => setTabIndex(v)} sx={{ mb: 2 }}>
                    <Tab label="Leagues" />
                    <Tab label="Settings" />
                </Tabs>

                {tabIndex === 0 && (
                    <LeagueSection>
                        <Typography variant="h5" sx={{ fontWeight: 700, color: '#FF1493', mb: 2 }}>
                        Your Leagues
                        </Typography>
                        {sortedLeagues(leagues).length > 0 ? (
                            <LeagueList>
                                {sortedLeagues(leagues).map((league) => (
                                    <LeagueLink key={league.id} href={`/League/${league.id}`} onClick={() => router.push(`/League/${league.id}`)}>
                                        {league.name}
                                    </LeagueLink>
                                ))}
                            </LeagueList>
                        ) : (
                            <EmptyState>
                                <EmptyStateIcon>👑</EmptyStateIcon>
                                <EmptyStateTitle>No Leagues Yet</EmptyStateTitle>
                                <EmptyStateDescription>
                                You haven&apos;t joined any leagues yet. Create your own or search for existing leagues to get started!
                                </EmptyStateDescription>
                            </EmptyState>
                        )}

                        <Typography variant="h5" sx={{ fontWeight: 700, color: '#9B30FF', mt: 4, mb: 2 }}>
                        Pending Requests
                        </Typography>
                        {sortedLeagues(pendingLeagues).length > 0 ? (
                            <LeagueList>
                                {sortedLeagues(pendingLeagues).map((league) => (
                                    <LeagueLink key={league.id} href={`/League/${league.id}`} onClick={() => router.push(`/League/${league.id}`)}>
                                        {league.name}
                                        <Typography component="span" sx={{ ml: 1, fontSize: '0.85rem', color: '#9B30FF', fontWeight: 500 }}>
                                        (Pending)
                                        </Typography>
                                    </LeagueLink>
                                ))}
                            </LeagueList>
                        ) : (
                            <EmptyState>
                                <EmptyStateIcon>⏳</EmptyStateIcon>
                                <EmptyStateTitle>No Pending Requests</EmptyStateTitle>
                                <EmptyStateDescription>
                                You don&apos;t have any pending league requests at the moment.
                                </EmptyStateDescription>
                            </EmptyState>
                        )}
                    </LeagueSection>
                )}

                {tabIndex === 1 && (
                    <Box sx={{ mt: 2 }}>
                        <Stack spacing={2}>
                            <TextField label="Display Name" value={nameInput} onChange={(e) => setNameInput(e.target.value)} fullWidth />
                            <Box sx={{ display: 'flex', gap: 2 }}>
                                <Button variant="contained" onClick={handleSaveSettings} disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button>
                                <Button variant="outlined" onClick={handleSignOut}>Sign Out</Button>
                                <Button variant="outlined" color="error" onClick={handleDeleteAccount} disabled={deleting}>{deleting ? 'Deleting...' : 'Delete Account'}</Button>
                            </Box>
                        </Stack>
                    </Box>
                )}

                {tabIndex === 0 && (
                    <ButtonContainer>
                        <Button
                            variant="contained"
                            href="/CreateLeague"
                            onClick={() => { router.push('/CreateLeague'); }}
                            sx={{
                                background: 'linear-gradient(135deg, #FF1493 0%, #9B30FF 100%)',
                                color: 'white',
                                fontWeight: 600,
                                padding: '12px 32px',
                                fontSize: '1rem',
                                boxShadow: '0 4px 15px rgba(255, 20, 147, 0.3)',
                                '&:hover': {
                                    background: 'linear-gradient(135deg, #E0127D 0%, #8520E0 100%)',
                                    boxShadow: '0 6px 20px rgba(255, 20, 147, 0.4)',
                                    transform: 'translateY(-2px)',
                                },
                                transition: 'all 0.3s ease',
                            }}
                        >
                            Create League
                        </Button>
                    </ButtonContainer>
                )}
            </ContentContainer>

            <ErrorPopup
                open={errorPopup}
                onClose={() => setErrorPopup(false)}
                message="An error occurred while creating the league."
            />
        </Box>
    );
}

function sortedLeagues(leagueArray) {
    let sortedLeagues = [];
    leagueArray.forEach((element) => {
        sortedLeagues.push({
            date: parseToArray(element)[0],
            id: parseToArray(element)[1],
            name: parseToArray(element)[2],
        });
    })
    return sortedLeagues.sort((a, b) => new Date(b.date) - new Date(a.date));
}