import { useEffect, useState, useMemo } from 'react';
import { useRouter } from "next/router";
import { getCurrentUser, signOut } from "aws-amplify/auth";
import LoadingWheel from "@/files/LoadingWheel";
import parseToArray from '@/helpers/parseToArray';
import { generateClient } from 'aws-amplify/api'
import { getUsers, getLeague, listLeagues } from "@/graphql/queries";
import { createUsers, updateUsers, deleteUsers } from '@/graphql/mutations';
import ErrorPopup from "../ErrorPopUp";
import { onCreateUsers, onUpdateUsers, onDeleteUsers, onUpdateLeague } from '@/graphql/subscriptions';
import { serverLogInfo, serverLogError } from '@/helpers/serverLog';
import { Box, Typography, Button, Tabs, Tab, TextField, Stack, List, ListItemButton, ListItemText, CircularProgress, Chip } from '@mui/material';
import {
    StyledDialog as PopupDialog,
    StyledDialogTitle,
    StyledDialogContent,
    StyledDialogActions,
    CancelButton
} from '@/files/SubmissionsPopUp/SubmissionsPopUp.styles';
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
import { SearchResultCard, SearchResultTitle, SearchResultDescription, SearchResultMeta } from './PlayerPage.styles';

export default function PlayerPage() {
    const [loading, setLoading] = useState(true);
    const [errorPopup, setErrorPopup] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const router = useRouter();
    const client = useMemo(() => generateClient(), []);

    const [userID, setUserID] = useState('');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [leagues, setLeagues] = useState([]);
    const [pendingLeagues, setPendingLeagues] = useState([]);
    const [pendingLeaguesWithNames, setPendingLeaguesWithNames] = useState([]);
    const [leaguesWithMeta, setLeaguesWithMeta] = useState([]);
    const [tabIndex, setTabIndex] = useState(0);
    const [nameInput, setNameInput] = useState('');
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [searchOpen, setSearchOpen] = useState(false);
    const [searchName, setSearchName] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [searchLoading, setSearchLoading] = useState(false);

    const closeSearch = () => {
        setSearchOpen(false);
        setSearchName('');
        setSearchResults([]);
        setSearchLoading(false);
    }
    
    
    useEffect(() => {
        getCurrentUser()
            .then(user => {
                async function checkAndSaveUser() {
                    try {
                        const results = await client.graphql({
                            query: getUsers,
                            variables: { id: user.signInDetails.loginId.toLowerCase() }
                        })
            
                        if(results.data.getUsers === null) {
                            const newUser = {
                                id: user.signInDetails.loginId.toLowerCase(),
                            }
                            const createResult = await client.graphql({
                                query: createUsers,
                                variables: { input: newUser }
                            });
                            setUserID(newUser.id);
                        }else{
                            setUserID(results.data.getUsers.id || '');
                            setName(results.data.getUsers.name || '');
                            setEmail(results.data.getUsers.email || '');
                            setLeagues(results.data.getUsers.leagues || []); 
                            setPendingLeagues(results.data.getUsers.pendingLeagues || []);
                        }

                    } catch (error){
                        await serverLogError('Error with user data', { error: error.message });
                        setErrorMessage('Error loading user data.');
                        setErrorPopup(true);
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
            error: err => serverLogWarn('onUpdateUsers sub error', { error: err?.message })
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
            error: err => serverLogWarn('onCreateUsers sub error', { error: err?.message })
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
            error: err => serverLogWarn('onDeleteUsers sub error', { error: err?.message })
        });
        subs.push(subDelete);

        return () => {
            subs.forEach(s => s && typeof s.unsubscribe === 'function' && s.unsubscribe());
        };
    }, [userID, client, router]);

    useEffect(() => {
        setNameInput(name || '');
    }, [name]);

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
                // Fetch public leagues and apply a case-insensitive filter client-side
                const filter = { lgPublic: { eq: true } };
                const res = await client.graphql({ query: listLeagues, variables: { filter, limit: 100 } });
                const items = res?.data?.listLeagues?.items || [];
                if (!active) return;
                const needle = String(searchName || '').toLowerCase();
                const matched = items.filter(i => (String(i.lgName || i.name || '')).toLowerCase().includes(needle));
                setSearchResults(matched.slice(0, 5));
            } catch (err) {
                await serverLogError('League search error', { error: err.message, searchName });
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

    // Fetch league metadata for pending leagues and determine invited/requested
    useEffect(() => {
        if (!pendingLeagues || pendingLeagues.length === 0) {
            setPendingLeaguesWithNames([]);
            return;
        }

        async function fetchPendingLeagueNames() {
            const leaguesWithNames = [];

            await Promise.all(pendingLeagues.map(async (leagueId) => {
                try {
                    const result = await client.graphql({
                        query: getLeague,
                        variables: { id: leagueId }
                    });

                    const league = result.data.getLeague;
                    if (league) {
                        // determine pending type: check league.lgPendingPlayers for an entry matching this user
                        let status = 'requested';
                        try {
                            const pendingList = Array.isArray(league.lgPendingPlayers) ? league.lgPendingPlayers : [];
                            for (const raw of pendingList) {
                                if (!raw) continue;
                                const parts = String(raw).split('|').map(s => s.trim()).filter(Boolean);
                                if (parts.length === 0) continue;
                                if (parts.length === 1) {
                                    if (parts[0].toLowerCase() === userID) { status = 'invited'; break; }
                                    continue;
                                }
                                const email = parts[1] ? String(parts[1]).toLowerCase() : '';
                                const type = parts[0] ? String(parts[0]).toLowerCase() : '';
                                if (email === (userID || '').toLowerCase()) {
                                    status = type === 'requested' ? 'requested' : 'invited';
                                    break;
                                }
                            }
                        } catch (e) {
                            // ignore
                        }

                        leaguesWithNames.push({
                            id: leagueId,
                            name: league.lgName,
                            date: league.createdAt || new Date().toISOString(),
                            status
                        });
                    }
                } catch (error) {
                    await serverLogError(`Error fetching league ${leagueId}`, { leagueId: leagueId, error: error.message });
                }
            }));

            setPendingLeaguesWithNames(leaguesWithNames);
        }

        fetchPendingLeagueNames();
    }, [pendingLeagues, client, userID]);

    // Fetch league metadata for joined leagues to detect admin status
    useEffect(() => {
        if (!leagues || leagues.length === 0) {
            setLeaguesWithMeta([]);
            return;
        }

        async function fetchLeaguesMeta() {
            const results = [];
            const parsed = sortedLeagues(leagues);
            
            // Log leagues being loaded
            await serverLogInfo('Player viewing leagues', {
                userId: userID,
                leagueCount: parsed.length,
                leagueIds: parsed.map(l => l.id)
            });
            
            await Promise.all(parsed.map(async (entry) => {
                try {
                    const r = await client.graphql({ query: getLeague, variables: { id: entry.id } });
                    const league = r.data.getLeague;
                    if (league) {
                        const isAdmin = Array.isArray(league.lgAdmin) && league.lgAdmin.map(a => String(a||'').toLowerCase()).includes((userID || '').toLowerCase());
                        results.push({
                            id: entry.id,
                            name: league.lgName || entry.name,
                            date: league.createdAt || entry.date,
                            isAdmin,
                            finished: league.lgFinished === 'finished',
                            started: league.lgFinished !== 'not started',
                            rankingDeadline: league.lgRankingDeadline || null
                        });
                    } else {
                        results.push({ id: entry.id, name: entry.name, date: entry.date, isAdmin: false, finished: false, started: false, rankingDeadline: null });
                    }
                } catch (err) {
                    await serverLogError('Failed to fetch league metadata', {
                        userId: userID,
                        leagueId: entry.id,
                        error: err.message
                    });
                    setErrorMessage('Failed to fetch league meta.');
                    setErrorPopup(true);
                    results.push({ id: entry.id, name: entry.name, date: entry.date, isAdmin: false });
                }
            }));
            setLeaguesWithMeta(results.sort((a,b)=> new Date(b.date)-new Date(a.date)));
        }

        fetchLeaguesMeta();

        // Subscribe to league updates so names update live for the user's leagues
        const subLeagueU = client.graphql({ query: onUpdateLeague }).subscribe({
            next: ({ value }) => {
                try {
                    const updated = value?.data?.onUpdateLeague;
                    if (!updated) return;
                    const parsed = sortedLeagues(leagues || []);
                    const ids = parsed.map(p => p.id);
                    if (ids.includes(updated.id)) {
                        setLeaguesWithMeta(prev => prev.map(item => item.id === updated.id ? { ...item, name: updated.lgName || item.name, finished: updated.lgFinished === 'finished', started: updated.lgFinished !== 'not started', rankingDeadline: updated.lgRankingDeadline || null } : item));
                    }

                    // update pending names too in case a pending league changed
                    setPendingLeaguesWithNames(prev => (prev || []).map(p => p.id === updated.id ? { ...p, name: updated.lgName || p.name } : p));
                } catch (e) {
                    serverLogWarn('onUpdateLeague subscription handler error', { error: e.message });
                }
            },
            error: err => serverLogWarn('onUpdateLeague sub error', { error: err?.message })
        });

        return () => {
            try { subLeagueU && typeof subLeagueU.unsubscribe === 'function' && subLeagueU.unsubscribe(); } catch(e){}
        }
    }, [leagues, client, userID]);

    const handleSignOut = async () => {
        try{
            await signOut()
            router.push('/').then(() => { if (typeof window !== 'undefined') window.location.reload(); });
        } catch (error) {
            await serverLogError('Could not sign out', { error: error.message });
            setErrorMessage('Could not sign out.');
            setErrorPopup(true);
        }
    }

    const handleSaveSettings = async () => {
        if (!userID) return;
        setSaving(true);
        try {
            const input = { id: userID, name: (nameInput || '').trim() };
            await client.graphql({ query: updateUsers, variables: { input } });
            await serverLogInfo('User updated name in settings', { userId: userID, newName: nameInput });
            setName(nameInput || '');
        } catch (err) {
            await serverLogError('Save settings error', { error: err.message });
            setErrorMessage('Failed to save settings.');
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
            await serverLogInfo('User account deleted', { userId: userID });
            router.push('/SignIn');
        } catch (err) {
            await serverLogError('Delete account error', { error: err.message });
            setErrorMessage('Failed to delete account.');
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
                        {leaguesWithMeta.length > 0 ? (
                            <LeagueList>
                                {leaguesWithMeta.map((league) => (
                                    <LeagueLink key={league.id} href={`/League/${league.id}`} onClick={() => router.push(`/League/${league.id}`)}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Box>{league.name}</Box>
                                            {league.isAdmin && (
                                                <Box component="span" sx={{ ml: 1, px: '6px', py: '2px', borderRadius: '12px', fontSize: '0.75rem', background: 'rgba(155,48,255,0.12)', color: '#9B30FF', fontWeight: 700, textShadow: '0 1px 0 rgba(0,0,0,0.1)', WebkitTextStroke: '0.35px rgba(0,0,0,0.6)' }}>
                                                    Admin
                                                </Box>
                                            )}
                                            {league.finished && (
                                                <Chip label="Finished" size="small" sx={{ ml: 1, background: 'linear-gradient(135deg,#9B30FF 0%, #6A0DAD 100%)', color: 'white', fontWeight: 700 }} />
                                            )}
                                            {!league.started && (
                                                <Chip label="Not started" size="small" sx={{ ml: 1, background: 'linear-gradient(135deg,#FFC107 0%, #FF9800 100%)', color: '#333', fontWeight: 700 }} />
                                            )}
                                        </Box>
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
                        {pendingLeaguesWithNames.length > 0 ? (
                            <LeagueList>
                                {pendingLeaguesWithNames.sort((a, b) => new Date(b.date) - new Date(a.date)).map((league) => (
                                    <LeagueLink key={league.id} href={`/League/${league.id}`} onClick={() => router.push(`/League/${league.id}`)}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Box>{league.name}</Box>
                                            {league.status === 'invited' ? (
                                                <Box component="span" sx={{ ml: 1, px: '6px', py: '2px', borderRadius: '12px', fontSize: '0.75rem', background: 'rgba(0,200,83,0.08)', color: '#00C853', fontWeight: 700, textShadow: '0 1px 0 rgba(0,0,0,0.6)', WebkitTextStroke: '0.35px rgba(0,0,0,0.6)' }}>
                                                    Invited
                                                </Box>
                                            ) : (
                                                <Box component="span" sx={{ ml: 1, px: '6px', py: '2px', borderRadius: '12px', fontSize: '0.75rem', background: 'rgba(255,193,7,0.08)', color: '#FFC107', fontWeight: 700, textShadow: '0 1px 0 rgba(0,0,0,0.6)', WebkitTextStroke: '0.35px rgba(0,0,0,0.6)' }}>
                                                    Requested
                                                </Box>
                                            )}
                                        </Box>
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
                    <>
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
                                    minWidth: { xs: '100%', sm: '220px' },
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

                            <Button
                                variant="contained"
                                onClick={() => setSearchOpen(true)}
                                sx={{
                                    background: 'linear-gradient(135deg, #FF1493 0%, #9B30FF 100%)',
                                    color: 'white',
                                    fontWeight: 600,
                                    padding: '12px 32px',
                                    minWidth: '220px',
                                    fontSize: '1rem',
                                    boxShadow: '0 4px 15px rgba(255, 20, 147, 0.3)',
                                    '&:hover': {
                                        background: 'linear-gradient(135deg, #E0127D 0%, #8520E0 100%)',
                                        boxShadow: '0 6px 20px rgba(255, 20, 147, 0.4)',
                                        transform: 'translateY(-2px)',
                                    },
                                    transition: 'all 0.3s ease',
                                    marginLeft: { xs: 0, sm: 2 },
                                }}
                            >
                                Search Leagues
                            </Button>
                        </ButtonContainer>

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
                    </>
                )}
            </ContentContainer>

            <ErrorPopup
                open={errorPopup}
                onClose={() => { setErrorPopup(false); setErrorMessage(''); }}
                message={errorMessage || 'An error occurred.'}
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