import Leagues from "@/files/Leagues"
import { NextSeo } from 'next-seo';
import NewLeague from "@/files/NewLeague";
import { getCurrentUser, fetchAuthSession } from "@aws-amplify/auth";
import { generateClient } from 'aws-amplify/api'
import { useRouter } from "next/router";
import { SESClient, SendTemplatedEmailCommand } from '@aws-sdk/client-ses';
import { getUsers, getLeague, playersByLeagueId} from "@/graphql/queries";
import { createPlayer, updateLeague, updateUsers } from "@/graphql/mutations";
import { serverLogInfo, serverLogError, serverLogWarn } from '@/helpers/serverLog';
import LoadingWheel from "@/files/LoadingWheel";
import ErrorPopup from "@/files/ErrorPopUp";
import PopUp from "@/files/PopUp";
import { Box, Typography, TextField } from '@mui/material';
import { useEffect, useState, useRef } from "react";
import {
    onCreatePlayer,
    onUpdatePlayer,
    onDeletePlayer,
    onCreateLeague,
    onUpdateLeague,
    onDeleteLeague,
    onCreateUsers,
    onUpdateUsers,
    onDeleteUsers
} from "@/graphql/subscriptions";

// Helper: subscribe with exponential backoff + jitter and safe unsubscribe
function subscribeWithReconnect({
    client,
    query,
    variables = {},
    authMode,
    onNext = () => {},
    onError = () => {},
    maxRetries = 8,
    baseDelay = 1000,
    maxDelay = 30000
}) {
    let attempt = 0;
    let sub = null;
    let stopped = false;

    const jitter = (n) => n + Math.floor(Math.random() * 300);

    const scheduleReconnect = (err) => {
        if (stopped) return;
        if (maxRetries && attempt >= maxRetries) {
            serverLogWarn('subscribeWithReconnect: max retries reached', { attempt, err });
            return;
        }
        const delay = Math.min(baseDelay * Math.pow(2, Math.max(0, attempt - 1)), maxDelay);
        const wait = jitter(delay);
        setTimeout(() => {
            if (!stopped) start();
        }, wait);
    };

    const start = () => {
        if (stopped) return;
        attempt++;
        try {
            sub = client.graphql({ query, variables, authMode }).subscribe({
                next(payload) {
                    // treat any successful message as connection success and reset attempts
                    attempt = 0;
                    try { onNext(payload); } catch (e) { serverLogError('onNext handler error', e); }
                },
                error(err) {
                    try { onError(err); } catch (e) {}
                    scheduleReconnect(err);
                }
            });
        } catch (err) {
            try { onError(err); } catch (e) {}
            scheduleReconnect(err);
        }
    };

    const unsubscribe = () => {
        stopped = true;
        try { if (sub && typeof sub.unsubscribe === 'function') sub.unsubscribe(); } catch (e) {}
    };

    start();
    return { unsubscribe };
}

export default function League(){

    const [loading, setLoading] = useState(true);
    const [errorPopup, setErrorPopup] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [userData, setUserData] = useState(null);
    const [leagueData, setLeagueData] = useState(null);
    const [playersData, setPlayersData] = useState(null);
    const lastNonEmptyPlayersRef = useRef(null);
    const [leagueNotStarted, setLeagueNotStarted] = useState(false);
    const [isPrivate, setIsPrivate] = useState(false);
    const [isPlayerOrAdmin, setIsPlayerOrAdmin] = useState(false);
    const [showRequestPopup, setShowRequestPopup] = useState(false);
    const [isInvited, setIsInvited] = useState(false);
    const [pendingType, setPendingType] = useState(null); // 'invited' | 'requested' | null
    const [requestName, setRequestName] = useState('');
    const [requestError, setRequestError] = useState('');

    // disable request button when name is empty (only for request-to-join variant)
    const requestDisabled = !isInvited && (!requestName || String(requestName).trim() === '');
    
    const router = useRouter();
    const client = generateClient()
    const timeoutRef = useRef(null);
    const prevLeagueFinishedRef = useRef(null);

    // Normalize various payload shapes to an array of players
    const normalizeToPlayers = (val) => {
        if (!val) return [];
        if (Array.isArray(val)) return val;
        if (typeof val === 'object') {
            // GraphQL connection shape
            if (Array.isArray(val.items)) return val.items;
            // Amplify sometimes returns a ModelPlayerConnection object with nextToken/__typename and no items
            if (String(val.__typename || '').includes('Model') && !val.id && !val.plEmail) return [];
            // single player object (has id or email)
            if (val.id || val.plEmail) return [val];
            return [];
        }
        return [];
    };

    const { id } = router.query;

    useEffect(() => { 
        if (!router.isReady) return;
        
        // First, check if league is public using API key (unauthenticated)
        async function checkLeagueAccess() {
            try {
                // Use API key to check league privacy without requiring authentication
                const leagueCheckResult = await client.graphql({
                    query: getLeague,
                    variables: { id: id },
                    authMode: 'apiKey'
                });

                const league = leagueCheckResult.data.getLeague;
                if (!league) {
                    setErrorMessage('League not found.');
                    setErrorPopup(true);
                    setLoading(false);
                    router.replace('/404');
                    return;
                }

                const leagueIsPublic = league.lgPublic === true;

                // If league is private, require authentication
                if (!leagueIsPublic) {
                    try {
                        const user = await getCurrentUser();
                        await loadAuthenticatedData(user, league);
                    } catch (error) {
                        // User not authenticated, show basic league info with private message
                        await loadPrivateLeagueForUnauthenticated(league);
                        return;
                    }
                } else {
                    // League is public, try to get user data if authenticated, but don't require it
                    try {
                        const user = await getCurrentUser();
                        await loadAuthenticatedData(user, league);
                    } catch (error) {
                        // User not authenticated, load public data only
                        await loadPublicData(league);
                    }
                }
            } catch (error) {
                serverLogError('Error checking league access', { error: error.message, leagueId: id });
                setErrorMessage('Failed to load league.');
                setErrorPopup(true);
                setLoading(false);
            }
        }

        async function loadAuthenticatedData(user, preloadedLeague = null) {
            try {
                const userResults = await client.graphql({
                    query: getUsers,
                    variables: { id: user.signInDetails.loginId.toLowerCase() }
                });
                
                const leagueResults = preloadedLeague ? { data: { getLeague: preloadedLeague } } : await client.graphql({
                    query: getLeague,
                    variables: { id: id }
                });


                if(userResults.data.getUsers && leagueResults.data.getLeague) {
                    setUserData(userResults.data.getUsers);
                    setLeagueData(leagueResults.data.getLeague);
                    const playersResults = await client.graphql({
                        query: playersByLeagueId,
                        variables: { leagueId: id }
                    })
                    const players = playersResults?.data?.playersByLeagueId?.items
                    ?? playersResults?.data?.playersByLeagueId
                    ?? [];
                    setPlayersData(normalizeToPlayers(players));

                    const league = leagueResults.data.getLeague;
                    const userEmail = user.signInDetails.loginId.toLowerCase();
                    
                    // Check if league is private
                    const leagueIsPrivate = !league.lgPublic;
                    setIsPrivate(leagueIsPrivate);

                    // Check if user is a player or admin in this league
                    const userPlayer = players.find(p => p.plEmail === userEmail);
                    const userIsAdmin = league.lgAdmin?.includes(userEmail);
                    const isAuthorized = userIsAdmin || userPlayer;
                    setIsPlayerOrAdmin(!!isAuthorized);

                    // Determine pending type for the current user (invited vs requested)
                    let pendingForUser = null;
                    const pendingList = Array.isArray(league.lgPendingPlayers) ? league.lgPendingPlayers : [];
                    for (const p of pendingList) {
                        const parts = String(p || '').split('|').map(s => s.trim()).filter(Boolean);
                        // parts format: [type, email, name]
                        if (parts[1] && parts[1].toLowerCase() === userEmail) {
                            const t = (parts[0] || '').toLowerCase();
                            pendingForUser = t === 'requested' ? 'requested' : 'invited';
                            break;
                        }
                        // fallback: plain email stored directly
                        if (String(p).toLowerCase() === userEmail) {
                            pendingForUser = 'invited';
                            break;
                        }
                    }
                    // If not found in league pending list, but user's pendingLeagues includes the league, treat as requested
                    if (!pendingForUser && userResults.data.getUsers?.pendingLeagues?.includes(id)) {
                        pendingForUser = 'requested';
                    }

                    setPendingType(pendingForUser);
                    setIsInvited(pendingForUser === 'invited');

                    // If private and user is not authorized
                    if (leagueIsPrivate && !isAuthorized) {
                        // Check if league has started
                        if (league.lgFinished === 'not started') {
                            // Show request to join popup
                            setShowRequestPopup(true);
                        } else {
                            // League already started, just redirect
                            setLoading(false);
                            return;
                        }
                    }

                    if(league.lgFinished === 'not started'){
                        setLeagueNotStarted(true);
                    }
                } else {
                    setErrorMessage('Failed to load league data.');
                    setErrorPopup(true);
                }
            } catch (error) {
                serverLogError('Error fetching authenticated data', { 
                    error: error.message, 
                    errors: error.errors, 
                    graphQLErrors: error.graphQLErrors,
                    networkError: error.networkError,
                    leagueId: league?.id
                });

                setErrorMessage('Failed to load league.');
                setErrorPopup(true);
            } finally {
                setLoading(false);
            }
        }

        async function loadPublicData(league) {
            try {
                setLeagueData(league);
                
                // For public leagues, load players using API key
                const playersResults = await client.graphql({
                    query: playersByLeagueId,
                    variables: { leagueId: id },
                    authMode: 'apiKey'
                });
                
                const players = playersResults?.data?.playersByLeagueId?.items
                ?? playersResults?.data?.playersByLeagueId
                ?? [];
                setPlayersData(normalizeToPlayers(players));

                // Check if league is private (should be false for public leagues)
                const leagueIsPrivate = !league.lgPublic;
                setIsPrivate(leagueIsPrivate);
                
                // No user data for unauthenticated users
                setIsPlayerOrAdmin(false);

                if(league.lgFinished === 'not started'){
                    setLeagueNotStarted(true);
                }
            } catch (error) {
                serverLogError('Error fetching public data', { error: error.message, leagueId: league?.id });
                setErrorMessage('Failed to load league.');
                setErrorPopup(true);
            } finally {
                setLoading(false);
            }
        }

        async function loadPrivateLeagueForUnauthenticated(league) {
            try {
                setLeagueData(league);
                setIsPrivate(true);
                setIsPlayerOrAdmin(false);
                
                // Load players using API key to show basic info
                const playersResults = await client.graphql({
                    query: playersByLeagueId,
                    variables: { leagueId: id },
                    authMode: 'apiKey'
                });
                
                const players = playersResults?.data?.playersByLeagueId?.items
                ?? playersResults?.data?.playersByLeagueId
                ?? [];
                setPlayersData(normalizeToPlayers(players));

                if(league.lgFinished === 'not started'){
                    setLeagueNotStarted(true);
                }

                // Show the private league message/popup
                setShowRequestPopup(true);
            } catch (error) {
                serverLogError('Error fetching private league data', { error: error.message, leagueId: league?.id });
                setErrorMessage('This is a private league. Please sign in to request access.');
                setErrorPopup(true);
            } finally {
                setLoading(false);
            }
        }

        checkLeagueAccess();
    }, [router.isReady, id]);

    // Update leagueNotStarted when leagueData changes
    useEffect(() => {
        if (leagueData) {
            setLeagueNotStarted(leagueData.lgFinished === 'not started');
        }
    }, [leagueData]);

    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
                timeoutRef.current = null;
            }
        };
    }, []);

    // Persist last non-empty players list so transient subscription updates
    // (e.g. lgPendingPlayers changes) don't cause the UI to flash an empty list.
    useEffect(() => {
        try {
            serverLogInfo('playersData changed:', playersData);
            localStorage.setItem('dragleague_last_playersData', JSON.stringify(playersData));
        } catch (e) {}
        if (Array.isArray(playersData) && playersData.length > 0) {
            lastNonEmptyPlayersRef.current = playersData;
        }
    }, [playersData]);

    const handleRequestClose = () => {
        setShowRequestPopup(false);
        router.push('/Player');
    };

    const handleAcceptInvitation = async () => {
        try {
            setLoading(true);
            const userEmail = userData?.id?.toLowerCase();

            // Prefer the name supplied in the league's pending entry (admin-provided)
            let userName = userData?.name || 'Player';
            try {
                const pending = Array.isArray(leagueData.lgPendingPlayers) ? leagueData.lgPendingPlayers : [];
                for (const raw of pending) {
                    if (!raw) continue;
                    const parts = String(raw || '').split('|').map(s => s.trim()).filter(Boolean);
                    // expected format: [type, email, name]
                    const emailPart = parts[1] ? String(parts[1]).toLowerCase() : '';
                    const namePart = parts[2] ? parts[2] : '';
                    if (emailPart && emailPart === userEmail && namePart) {
                        userName = namePart;
                        break;
                    }
                }
            } catch (e) {
                // ignore and fall back to userData.name
            }

            // Remove from pending players list
            const updatedPending = (leagueData.lgPendingPlayers || []).filter(p => {
                const pl = String(p || '').split('|').map(s => s.trim()).filter(Boolean);
                return pl[1]?.toLowerCase() !== userEmail;
            });

            // Create player record (let backend generate id; store email in plEmail)
            const createRes = await client.graphql({
                query: createPlayer,
                variables: {
                    input: {
                        leagueId: leagueData.id,
                        plName: userName,
                        plEmail: userEmail,
                        plStatus: 'Player'
                    }
                }
            });
            const createdPlayer = createRes?.data?.createPlayer || createRes?.data?.onCreatePlayer || null;

            // Add league to user's leagues array
            const leagueEntry = `${new Date().toISOString()}|${leagueData.id}|${leagueData.lgName}`;
            const updatedUserLeagues = [...(userData?.leagues || []), leagueEntry];

            // Remove from user's pending leagues
            const updatedPendingLeagues = (userData?.pendingLeagues || []).filter(id => id !== leagueData.id);

            // Update user data on backend
            await client.graphql({
                query: updateUsers,
                variables: {
                    input: {
                        id: userEmail,
                        leagues: updatedUserLeagues,
                        pendingLeagues: updatedPendingLeagues
                    }
                }
            });

            // Update local user state so UI no longer treats this user as pending
            try {
                setUserData(prev => ({ ...(prev || {}), leagues: updatedUserLeagues, pendingLeagues: updatedPendingLeagues }));
                setIsPlayerOrAdmin(true);
            } catch (e) {}

            // Add created player locally so UI shows immediately (subscriptions will also deliver this)
            try {
                if (createdPlayer && (createdPlayer.id || createdPlayer.plEmail)) {
                    setPlayersData(prev => {
                        const list = Array.isArray(prev) ? prev.slice() : [];
                        if (!list.find(p => p.id === createdPlayer.id)) list.unshift(createdPlayer);
                        return list;
                    });
                }
            } catch (e) {}

            // Update league history
            const currentHistory = leagueData.lgHistory || [];
            const historyEntry = new Date().toISOString() + '. ' + userName + ' accepted invitation and joined the league';

            await client.graphql({
                query: updateLeague,
                variables: {
                    input: {
                        id: leagueData.id,
                        lgPendingPlayers: updatedPending,
                        lgHistory: [...currentHistory, historyEntry]
                    }
                }
            });
            serverLogInfo('Invitation accepted on league page', { leagueId: leagueData.id, userId: userEmail, userName: userName });

            // Update local leagueData immediately so pending list is removed without needing a refresh
            try {
                setLeagueData(prev => ({ ...(prev || {}), lgPendingPlayers: updatedPending, lgHistory: [...currentHistory, historyEntry] }));
            } catch (e) {}

            // Ensure loading is cleared and refresh the page so subscriptions / data pick up the new player
            setLoading(false);
            setShowRequestPopup(false);
            try { router.replace(router.asPath); } catch (e) {}

        } catch (error) {
            serverLogError('Error accepting invitation', { error: error.message });
            setErrorMessage('Failed to accept invitation.');
            setErrorPopup(true);
            setLoading(false);
        }
    };

    const handleDeclineInvitation = async () => {
        try {
            setLoading(true);
            const userEmail = userData?.id?.toLowerCase();
            const userName = userData?.name || 'Player';

            // Remove from pending players list
            const updatedPending = (leagueData.lgPendingPlayers || []).filter(p => {
                const pl = p.split('|').map(s => s.trim()).filter(Boolean);
                return pl[1]?.toLowerCase() !== userEmail;
            });

            // Remove from user's pending leagues
            const updatedPendingLeagues = (userData.pendingLeagues || []).filter(id => id !== leagueData.id);

            // Update user data
            await client.graphql({
                query: updateUsers,
                variables: {
                    input: {
                        id: userEmail,
                        pendingLeagues: updatedPendingLeagues
                    }
                }
            });

            // Update league history
            const currentHistory = leagueData.lgHistory || [];
            const historyEntry = new Date().toISOString() + '. ' + userName + ' declined invitation';

            await client.graphql({
                query: updateLeague,
                variables: {
                    input: {
                        id: leagueData.id,
                        lgPendingPlayers: updatedPending,
                        lgHistory: [...currentHistory, historyEntry]
                    }
                }
            });
            serverLogInfo('Invitation declined on league page', { leagueId: leagueData.id, userId: userEmail, userName: userName });

            // Update local leagueData immediately so pending list is removed without needing a refresh
            try {
                setLeagueData(prev => ({ ...(prev || {}), lgPendingPlayers: updatedPending, lgHistory: [...currentHistory, historyEntry] }));
            } catch (e) {}

            // Redirect to player page
            router.push('/Player');
        } catch (error) {
            serverLogError('Error declining invitation', { error: error.message });
            setErrorMessage('Failed to decline invitation.');
            setErrorPopup(true);
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!router.isReady) return;
        
        // Only set up subscriptions for authenticated users
        if (!userData) {
            return;
        }
        
        const subs = [];

        // watch current user updates (with reconnect/backoff)
        const subU = subscribeWithReconnect({
            client,
            query: onUpdateUsers,
            onNext: (payload) => {
                const value = payload?.value || payload;
                const updated = value?.data?.onUpdateUsers ?? value?.data ?? value;
                if (updated && updated.id === userData.id) {
                    setUserData(updated);
                }
            },
            onError: err => serverLogWarn('user sub error', { error: err?.message })
        });
        subs.push(subU);

        const subUC = subscribeWithReconnect({
            client,
            query: onCreateUsers,
            onNext: (payload) => {
                const value = payload?.value || payload;
                const created = value?.data?.onCreateUsers ?? value?.data ?? value;
                if (created && created.id === userData.id) setUserData(created);
            },
            onError: err => serverLogWarn('user create sub error', { error: err?.message })
        });
        subs.push(subUC);

        const subUD = subscribeWithReconnect({
            client,
            query: onDeleteUsers,
            onNext: (payload) => {
                const value = payload?.value || payload;
                const deleted = value?.data?.onDeleteUsers ?? value?.data ?? value;
                if (deleted && deleted.id === userData.id) {
                    router.push('/SignIn');
                }
            },
            onError: err => serverLogWarn('user delete sub error', { error: err?.message })
        });
        subs.push(subUD);

        // watch league updates (with reconnect/backoff)
        const subLeagueU = subscribeWithReconnect({
            client,
            query: onUpdateLeague,
            onNext: (payload) => {
                try { localStorage.setItem('dragleague_last_subLeagueU', JSON.stringify(payload)); } catch (e) {}
                const updated = payload?.value?.data?.onUpdateLeague
                    ?? payload?.data?.onUpdateLeague
                    ?? payload?.data
                    ?? payload?.value?.onUpdateLeague
                    ?? payload?.onUpdateLeague
                    ?? payload;
                if (updated && (String(updated.id) === String(id) || String(updated?.leagueId) === String(id))) {
                    const normalized = updated?.data ? updated.data : updated;
                    setLeagueData(normalized);
                }
            },
            onError: err => serverLogWarn('league update sub error', { error: err?.message })
        });
        subs.push(subLeagueU);

        const subLeagueC = subscribeWithReconnect({
            client,
            query: onCreateLeague,
            onNext: (payload) => {
                const value = payload?.value || payload;
                const created = value?.data?.onCreateLeague ?? value?.data ?? value;
                if (created && created.id === id) setLeagueData(created);
            },
            onError: err => serverLogWarn('league create sub error', { error: err?.message })
        });
        subs.push(subLeagueC);

        const subLeagueD = subscribeWithReconnect({
            client,
            query: onDeleteLeague,
            onNext: (payload) => {
                const value = payload?.value || payload;
                const deleted = value?.data?.onDeleteLeague ?? value?.data ?? value;
                if (deleted && deleted.id === id) {
                    router.push('/');
                }
            },
            onError: err => serverLogWarn('league delete sub error', { error: err?.message })
        });
        subs.push(subLeagueD);

        // watch players (create, update, delete)
        const subPlayerC = subscribeWithReconnect({
            client,
            query: onCreatePlayer,
            onNext: (payload) => {
                const created = payload?.value?.data?.onCreatePlayer
                    ?? payload?.data?.onCreatePlayer
                    ?? payload?.data
                    ?? payload?.value?.onCreatePlayer
                    ?? payload?.onCreatePlayer
                    ?? payload;
                if (created && String(created.leagueId) === String(id)) {
                    setPlayersData(prev => {
                        const list = Array.isArray(prev) ? prev.slice() : [];
                        if (!list.find(p => p.id === created.id)) list.unshift(created);
                        return list;
                    });
                }
            },
            onError: err => {
                serverLogWarn('onCreatePlayer sub error', { error: err?.message || err });
            }
        });
        subs.push(subPlayerC);

        const subPlayerU = subscribeWithReconnect({
            client,
            query: onUpdatePlayer,
            onNext: (payload) => {
                const updated = payload?.value?.data?.onUpdatePlayer
                    ?? payload?.data?.onUpdatePlayer
                    ?? payload?.data
                    ?? payload?.value?.onUpdatePlayer
                    ?? payload?.onUpdatePlayer
                    ?? payload;
                if (updated && String(updated.leagueId) === String(id)) {
                    setPlayersData(prev => {
                        const list = Array.isArray(prev) ? prev.slice() : [];
                        const idx = list.findIndex(p => p.id === updated.id);
                        if (idx >= 0) {
                            list[idx] = updated;
                        } else {
                            list.unshift(updated);
                        }
                        return list;
                    });
                }
            },
            onError: err => {
                serverLogWarn('onUpdatePlayer sub error', { error: err?.message || err });
            }
        });
        subs.push(subPlayerU);

        const subPlayerD = subscribeWithReconnect({
            client,
            query: onDeletePlayer,
            onNext: (payload) => {
                serverLogInfo('subPlayerD raw payload:', payload);
                try { localStorage.setItem('dragleague_last_subPlayerD', JSON.stringify(payload)); } catch (e) {}
                const deleted = payload?.value?.data?.onDeletePlayer
                    ?? payload?.data?.onDeletePlayer
                    ?? payload?.data
                    ?? payload?.value?.onDeletePlayer
                    ?? payload?.onDeletePlayer
                    ?? payload;
                if (deleted && String(deleted.leagueId) === String(id)) {
                    const deletedId = deleted.id;
                    const deletedEmail = String(deleted.plEmail || deleted.id || '').toLowerCase();
                    setPlayersData(prev => {
                        const list = Array.isArray(prev) ? prev.slice() : [];
                        return list.filter(p => p.id !== deletedId);
                    });

                    try {
                        const currentUserEmail = String(userData?.id || '').toLowerCase();
                        if (currentUserEmail && deletedEmail === currentUserEmail) {
                            router.push('/Player');
                        }
                    } catch (e) {
                        // ignore routing errors
                    }
                }
            },
            onError: err => {
                serverLogWarn('onDeletePlayer sub error', { error: err?.message || err });
            }
        });
        subs.push(subPlayerD);

        return () => {
            subs.forEach(s => s && typeof s.unsubscribe === 'function' && s.unsubscribe());
        };
    }, [router.isReady, id, userData?.id, client]);


    if(loading){
        return (
            <LoadingWheel />
        )
    }

    // Private league - user not authorized
    if (isPrivate && !isPlayerOrAdmin) {
        if (leagueData?.lgFinished === 'not started') {
            // League hasn't started - show request popup
            return (
                <>
                    <NextSeo
                        title={leagueData?.lgName ? `${leagueData.lgName} — Drag League` : 'League — Drag League'}
                        description={leagueData?.lgDescription || 'League details, players, and standings on Drag League.'}
                        canonical={typeof window !== 'undefined' && window.location ? window.location.href : `https://dr91fo3klsf8b.amplifyapp.com/League/${id}`}
                    />
            
                    <Box
                        sx={{
                            position: 'fixed',
                            inset: 0,
                            backdropFilter: 'blur(10px)',
                            backgroundColor: 'rgba(0, 0, 0, 0.3)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: 9999
                        }}
                    >
                        <Box
                            sx={{
                                backgroundColor: 'white',
                                padding: 4,
                                borderRadius: 2,
                                maxWidth: 500,
                                textAlign: 'center',
                                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)'
                            }}
                        >
                            <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', color: '#FF1493' }}>
                                {pendingType === 'invited' ? '✉️ League Invitation' : (pendingType === 'requested' ? '⏳ Request Pending' : '🔒 Private League')}
                            </Typography>
                            <Typography variant="body1" sx={{ mb: 3, color: 'text.secondary' }}>
                                {pendingType === 'invited'
                                    ? 'You have been invited to join this league! Would you like to accept or decline the invitation?'
                                    : (pendingType === 'requested'
                                        ? 'Your request to join this league is pending. The admins have not accepted you yet.'
                                        : 'This league is private. Would you like to request to join?')}
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexDirection: 'column', alignItems: 'stretch' }}>
                                {pendingType === null && (
                                    <Box sx={{ mb: 2 }}>
                                        <TextField
                                            fullWidth
                                            label="Your display name"
                                            value={requestName}
                                            onChange={(e) => { setRequestName(e.target.value); setRequestError(''); }}
                                            placeholder="How should other players see you?"
                                            variant="outlined"
                                            error={!!requestError}
                                            helperText={requestError || ''}
                                        />
                                    </Box>
                                )}
                                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                                    <button
                                        onClick={pendingType === 'invited' ? handleDeclineInvitation : handleRequestClose}
                                        style={{
                                            padding: '10px 24px',
                                            borderRadius: 8,
                                            border: '2px solid #FF1493',
                                            backgroundColor: 'white',
                                            color: '#FF1493',
                                            cursor: 'pointer',
                                            fontWeight: 600
                                        }}
                                    >
                                        {pendingType === 'invited' ? 'Decline' : 'Back to My Leagues'}
                                    </button>

                                    {pendingType === 'invited' && (
                                        <button
                                            disabled={requestDisabled}
                                            onClick={async () => { await handleAcceptInvitation(); }}
                                            style={{
                                                padding: '10px 24px',
                                                borderRadius: 8,
                                                border: 'none',
                                                backgroundColor: '#FF1493',
                                                color: 'white',
                                                cursor: requestDisabled ? 'not-allowed' : 'pointer',
                                                opacity: requestDisabled ? 0.6 : 1,
                                                fontWeight: 600
                                            }}
                                        >
                                            Accept Invitation
                                        </button>
                                    )}

                                    {pendingType === 'requested' && (
                                        <Box sx={{ display: 'flex', alignItems: 'center', color: 'text.secondary', pl: 1 }}>
                                            <Typography variant="body2">Your request is pending — admins have not accepted you yet.</Typography>
                                        </Box>
                                    )}

                                    {pendingType === null && (
                                        <button
                                            disabled={requestDisabled}
                                            onClick={async () => {
                                                // Request to join flow: require a display name
                                                if (!requestName || String(requestName).trim() === '') {
                                                    setRequestError('Please enter a display name to request to join.');
                                                    return;
                                                }

                                                setLoading(true);
                                                try {
                                                    const userEmail = (userData?.id || '').toLowerCase();
                                                    const userName = String(requestName).trim();

                                                    // Update league pending players (avoid duplicates)
                                                    const leaguePending = Array.isArray(leagueData?.lgPendingPlayers) ? leagueData.lgPendingPlayers.slice() : [];
                                                    const already = leaguePending.some(p => {
                                                        const parts = String(p || '').split('|').map(s => s.trim()).filter(Boolean);
                                                        return parts[1]?.toLowerCase() === userEmail;
                                                    });

                                                    if (!already) {
                                                        leaguePending.push(`requested|${userEmail}|${userName}`);
                                                        const currentHistory = leagueData?.lgHistory || [];
                                                        const historyEntry = new Date().toISOString() + '. ' + userName + ' requested to join the league';

                                                        await client.graphql({
                                                            query: updateLeague,
                                                            variables: {
                                                                input: {
                                                                    id: leagueData.id,
                                                                    lgPendingPlayers: leaguePending,
                                                                    lgHistory: [...currentHistory, historyEntry]
                                                                }
                                                            }
                                                        });
                                                        serverLogInfo('Join request submitted on league page', { leagueId: leagueData.id, userId: userEmail, userName: userName });

                                                        // Send email notification to all admins
                                                        try {
                                                            const adminEmails = Array.isArray(leagueData?.lgAdmin) ? leagueData.lgAdmin : [];
                                                            const leagueUrl = `${window.location.origin}/League/${leagueData.id}`;

                                                            // Get AWS credentials from Amplify Auth
                                                            const session = await fetchAuthSession();
                                                            const credentials = session.credentials;

                                                            // Create SES client
                                                            const sesClient = new SESClient({
                                                                region: 'us-west-2',
                                                                credentials: credentials
                                                            });

                                                            // Get all players to find admin names
                                                            const playersResult = await client.graphql({ query: playersByLeagueId, variables: { leagueId: leagueData.id, limit: 1000 } });
                                                            const players = playersResult?.data?.playersByLeagueId?.items || [];

                                                            // Send email to each admin
                                                            for (const adminEmail of adminEmails) {
                                                                try {
                                                                    // Get admin's player name in the league if available
                                                                    let adminName = 'Admin';
                                                                    const adminPlayer = players.find(p => (p.plEmail || '').toLowerCase() === adminEmail.toLowerCase());
                                                                    if (adminPlayer && adminPlayer.plName) {
                                                                        adminName = adminPlayer.plName;
                                                                    } else {
                                                                        // Fallback to user name
                                                                        try {
                                                                            const adminRes = await client.graphql({ query: getUsers, variables: { id: adminEmail.toLowerCase() } });
                                                                            adminName = adminRes?.data?.getUsers?.name;
                                                                        } catch (e) {
                                                                            adminName = 'Admin';
                                                                        }
                                                                    }

                                                                    const command = new SendTemplatedEmailCommand({
                                                                        Source: '"Drag League" <noreply@drag-league.com>',
                                                                        Destination: {
                                                                            ToAddresses: [adminEmail],
                                                                        },
                                                                        Template: 'DragLeagueJoinRequest',
                                                                        TemplateData: JSON.stringify({
                                                                            adminName: adminName,
                                                                            requesterName: userName,
                                                                            requesterEmail: userEmail,
                                                                            leagueName: leagueData.lgName || 'a league',
                                                                            leagueUrl: leagueUrl,
                                                                            supportUrl: `${window.location.origin}/Support`,
                                                                            faqUrl: `${window.location.origin}/FAQ`
                                                                        }),
                                                                        ReplyToAddresses: ['noreply@drag-league.com']
                                                                    });

                                                                    await sesClient.send(command);
                                                                    serverLogInfo('Join request notification email sent', {
                                                                        leagueId: leagueData.id,
                                                                        adminEmail: adminEmail,
                                                                        requesterName: userName,
                                                                        requesterEmail: userEmail
                                                                    });
                                                                } catch (emailError) {
                                                                    serverLogError('Failed to send join request email to admin', {
                                                                        leagueId: leagueData.id,
                                                                        adminEmail: adminEmail,
                                                                        error: emailError.message
                                                                    });
                                                                }
                                                            }
                                                        } catch (emailError) {
                                                            serverLogError('Failed to send join request emails', {
                                                                leagueId: leagueData.id,
                                                                error: emailError.message
                                                            });
                                                            // Don't block the request flow if email fails
                                                        }
                                                    }

                                                    // Update user's pendingLeagues (avoid duplicates)
                                                    try {
                                                        const userPending = Array.isArray(userData?.pendingLeagues) ? userData.pendingLeagues.slice() : [];
                                                        if (!userPending.includes(leagueData.id)) {
                                                            await client.graphql({
                                                                query: updateUsers,
                                                                variables: {
                                                                    input: {
                                                                        id: userEmail,
                                                                        pendingLeagues: [...userPending, leagueData.id]
                                                                    }
                                                                }
                                                            });
                                                        }
                                                    } catch (e) {
                                                        serverLogWarn('Failed to update user pendingLeagues', { error: e.message });
                                                    }

                                                    // Store entered name locally and redirect user back to Player page
                                                    setUserData(prev => ({ ...(prev || {}), name: userName }));
                                                    setRequestName('');
                                                    setRequestError('');
                                                    setShowRequestPopup(false);
                                                    router.push('/Player');
                                                } catch (err) {
                                                    serverLogError('Failed to submit join request', { error: err.message });
                                                    setRequestError('Failed to submit request. Try again.');
                                                } finally {
                                                    setLoading(false);
                                                }
                                            }}
                                            style={{
                                                padding: '10px 24px',
                                                borderRadius: 8,
                                                border: 'none',
                                                backgroundColor: '#FF1493',
                                                color: 'white',
                                                cursor: requestDisabled ? 'not-allowed' : 'pointer',
                                                opacity: requestDisabled ? 0.6 : 1,
                                                fontWeight: 600
                                            }}
                                        >
                                            Request to Join
                                        </button>
                                    )}
                                </Box>
                            </Box>
                        </Box>
                    </Box>
                </>
            );
        } else {
            // League already started - show message and redirect
            return (
                <Box
                    sx={{
                        position: 'fixed',
                        inset: 0,
                        backdropFilter: 'blur(10px)',
                        backgroundColor: 'rgba(0, 0, 0, 0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 9999
                    }}
                >
                    <Box
                        sx={{
                            backgroundColor: 'white',
                            padding: 4,
                            borderRadius: 2,
                            maxWidth: 500,
                            textAlign: 'center',
                            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)'
                        }}
                    >
                        <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', color: '#FF1493' }}>
                            🔒 Private League
                        </Typography>
                        <Typography variant="body1" sx={{ mb: 3, color: 'text.secondary' }}>
                            This league is private and has already started. Only players and admins can view it.
                        </Typography>
                        <button
                            onClick={() => router.push('/Player')}
                            style={{
                                padding: '10px 24px',
                                borderRadius: 8,
                                border: 'none',
                                backgroundColor: '#FF1493',
                                color: 'white',
                                cursor: 'pointer',
                                fontWeight: 600
                            }}
                        >
                            Back to My Leagues
                        </button>
                    </Box>
                </Box>
            );
        }
    }

    <ErrorPopup
        open={errorPopup}
        onClose={() => { setErrorPopup(false); setErrorMessage(''); }}
        message={errorMessage || 'An error occurred while loading the league.'}
    />

    if(!leagueNotStarted){
        return (
            <>
                <NextSeo
                    title={leagueData?.lgName || 'League'}
                    description={leagueData?.lgDescription || 'League details, players, and standings on Drag League.'}
                    canonical={typeof window !== 'undefined' && window.location ? window.location.href : `https://dr91fo3klsf8b.amplifyapp.com/League/${id}`}
                />
                <Leagues userData={userData} leagueData={leagueData} playersData={(Array.isArray(playersData) && playersData.length > 0) ? playersData : (Array.isArray(lastNonEmptyPlayersRef.current) ? lastNonEmptyPlayersRef.current : playersData)}  />
            </>
        )
    }else{
        return (
            <>
                <NextSeo
                    title={leagueData?.lgName || 'League'}
                    description={leagueData?.lgDescription || 'League details, players, and standings on Drag League.'}
                    canonical={typeof window !== 'undefined' && window.location ? window.location.href : `https://dr91fo3klsf8b.amplifyapp.com/League/${id}`}
                />
                <NewLeague userData={userData} leagueData={leagueData} playersData={(Array.isArray(playersData) && playersData.length > 0) ? playersData : (Array.isArray(lastNonEmptyPlayersRef.current) ? lastNonEmptyPlayersRef.current : playersData)} setPlayersData={setPlayersData} />
            </>
        )
    }
}