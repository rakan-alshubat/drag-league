import Leagues from "@/files/Leagues"
import NewLeague from "@/files/NewLeague";
import { getCurrentUser } from "@aws-amplify/auth";
import { generateClient } from 'aws-amplify/api'
import { useRouter } from "next/router";
import { getUsers, getLeague, playersByLeagueId} from "@/graphql/queries";
import { createPlayer, updateLeague, updateUsers } from "@/graphql/mutations";
import LoadingWheel from "@/files/LoadingWheel";
import ErrorPopup from "@/files/ErrorPopUp";
import PopUp from "@/files/PopUp";
import { Box, Typography } from '@mui/material';
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

export default function League(){

    const [loading, setLoading] = useState(true);
    const [errorPopup, setErrorPopup] = useState(false);
    const [userData, setUserData] = useState(null);
    const [leagueData, setLeagueData] = useState(null);
    const [playersData, setPlayersData] = useState(null);
    const [leagueNotStarted, setLeagueNotStarted] = useState(false);
    const [isPrivate, setIsPrivate] = useState(false);
    const [isPlayerOrAdmin, setIsPlayerOrAdmin] = useState(false);
    const [showRequestPopup, setShowRequestPopup] = useState(false);
    const [isInvited, setIsInvited] = useState(false);
    
    const router = useRouter();
    const client = generateClient()
    const timeoutRef = useRef(null);

    const { id } = router.query;

    useEffect(() => { 
        if (!router.isReady) return;
        getCurrentUser()
            .then(user => {
                async function getUserData() {
                    try {
                        const userResults = await client.graphql({
                            query: getUsers,
                            variables: { id: user.signInDetails.loginId.toLowerCase() }
                        })
                        const leagueResults = await client.graphql({
                            query: getLeague,
                            variables: { id: id }
                        })


                        if(userResults.data.getUsers && leagueResults.data.getLeague) {
                            setUserData(userResults.data.getUsers);
                            setLeagueData(leagueResults.data.getLeague);
                            console.log('Fetching players data for league ID:', id);
                            const playersResults = await client.graphql({
                                query: playersByLeagueId,
                                variables: { leagueId: id }
                            })
                            console.log('Raw players results:', playersResults);
                            const players = playersResults?.data?.playersByLeagueId?.items
                            ?? playersResults?.data?.playersByLeagueId
                            ?? [];
                            console.log('Parsed players array:', players);
                            console.log('Number of players:', players.length);
                            setPlayersData(players);

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

                            // Check if user is invited (in pending players list)
                            const userIsInvited = league.lgPendingPlayers?.includes(userEmail) ||
                                                  userResults.data.getUsers?.pendingLeagues?.includes(id);
                            setIsInvited(userIsInvited);

                            console.log('Privacy check:', { leagueIsPrivate, isAuthorized, userIsAdmin, hasPlayer: !!userPlayer, userIsInvited });

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

                            console.log('League Finished Status:', league.lgFinished);
                            if(league.lgFinished === 'not started'){
                                setLeagueNotStarted(true);
                            }
                        }else{
                            router.push('/SignIn')
                        }
                    } catch (error) {
                        console.error('Error fetching user data:', error);
                        // GraphQL/Network details
                        if (error.errors) console.error('errors:', error.errors);
                        if (error.graphQLErrors) console.error('graphQLErrors:', error.graphQLErrors);
                        if (error.networkError) console.error('networkError:', error.networkError);

                        // show popup with message if available
                        const message =
                          error.message ||
                          (error.graphQLErrors && error.graphQLErrors[0] && error.graphQLErrors[0].message) ||
                          'Failed to load league';
                        setErrorPopup(true);
                    } finally {
                        setLoading(false);
                    }
                }
                getUserData()
            })
            .catch(() => {
                router.push('/SignIn')
            });
    }, [router.isReady, id]);

    // Update leagueNotStarted when leagueData changes
    useEffect(() => {
        if (leagueData) {
            console.log('League data updated, lgFinished:', leagueData.lgFinished);
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

    const handleRequestClose = () => {
        setShowRequestPopup(false);
        router.push('/Player');
    };

    const handleAcceptInvitation = async () => {
        try {
            setLoading(true);
            const userEmail = userData?.id?.toLowerCase();
            const userName = userData?.name || 'Player';

            // Remove from pending players list
            const updatedPending = (leagueData.lgPendingPlayers || []).filter(p => {
                const pl = p.split('|').map(s => s.trim()).filter(Boolean);
                return pl[1]?.toLowerCase() !== userEmail;
            });

            // Create player record
            await client.graphql({
                query: createPlayer,
                variables: {
                    input: {
                        id: userEmail,
                        leagueId: leagueData.id,
                        plName: userName,
                        plEmail: userEmail,
                        plStatus: 'Player'
                    }
                }
            });

            // Add league to user's leagues array
            const leagueEntry = `${new Date().toISOString()}|${leagueData.id}|${leagueData.lgName}`;
            const updatedUserLeagues = [...(userData.leagues || []), leagueEntry];

            // Remove from user's pending leagues
            const updatedPendingLeagues = (userData.pendingLeagues || []).filter(id => id !== leagueData.id);

            // Update user data
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

            // Reload the page to show the league content
            window.location.reload();
        } catch (error) {
            console.error('Error accepting invitation:', error);
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

            // Redirect to player page
            router.push('/Player');
        } catch (error) {
            console.error('Error declining invitation:', error);
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!router.isReady) return;
        const subs = [];

        // watch current user updates
        if (userData?.id) {
            const subU = client.graphql({ query: onUpdateUsers }).subscribe({
                next: ({ value }) => {
                    const updated = value?.data?.onUpdateUsers;
                    if (updated && updated.id === userData.id) {
                        setUserData(updated);
                    }
                },
                error: err => console.warn('user sub error', err)
            });
            subs.push(subU);

            const subUC = client.graphql({ query: onCreateUsers }).subscribe({
                next: ({ value }) => {
                    const created = value?.data?.onCreateUsers;
                    if (created && created.id === userData.id) setUserData(created);
                }
            });
            subs.push(subUC);

            const subUD = client.graphql({ query: onDeleteUsers }).subscribe({
                next: ({ value }) => {
                    const deleted = value?.data?.onDeleteUsers;
                    if (deleted && deleted.id === userData.id) {
                        // user deleted — navigate to sign in or handle appropriately
                        router.push('/SignIn');
                    }
                }
            });
            subs.push(subUD);
        }

        // watch league updates
        const subLeagueU = client.graphql({ query: onUpdateLeague }).subscribe({
            next: ({ value }) => {
                const updated = value?.data?.onUpdateLeague;
                if (updated && updated.id === id) setLeagueData(updated);
            },
            error: err => console.warn('league update sub error', err)
        });
        subs.push(subLeagueU);

        const subLeagueC = client.graphql({ query: onCreateLeague }).subscribe({
            next: ({ value }) => {
                const created = value?.data?.onCreateLeague;
                if (created && created.id === id) setLeagueData(created);
            }
        });
        subs.push(subLeagueC);

        const subLeagueD = client.graphql({ query: onDeleteLeague }).subscribe({
            next: ({ value }) => {
                const deleted = value?.data?.onDeleteLeague;
                if (deleted && deleted.id === id) {
                    // league removed — redirect or show message
                    router.push('/');
                }
            }
        });
        subs.push(subLeagueD);

        // watch players (create, update, delete)
        const subPlayerC = client.graphql({ query: onCreatePlayer }).subscribe({
            next: ({ value }) => {
                const created = value?.data?.onCreatePlayer;
                if (created && String(created.leagueId) === String(id)) {
                    setPlayersData(prev => {
                        const list = Array.isArray(prev) ? prev.slice() : [];
                        // avoid duplicates
                        if (!list.find(p => p.id === created.id)) list.unshift(created);
                        return list;
                    });
                }
            }
        });
        subs.push(subPlayerC);

        const subPlayerU = client.graphql({ query: onUpdatePlayer }).subscribe({
            next: ({ value }) => {
                const updated = value?.data?.onUpdatePlayer;
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
            }
        });
        subs.push(subPlayerU);

        const subPlayerD = client.graphql({ query: onDeletePlayer }).subscribe({
            next: ({ value }) => {
                const deleted = value?.data?.onDeletePlayer;
                if (deleted && String(deleted.leagueId) === String(id)) {
                    setPlayersData(prev => {
                        return (Array.isArray(prev) ? prev.filter(p => p.id !== deleted.id) : prev);
                    });
                }
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
                                {isInvited ? '✉️ League Invitation' : '🔒 Private League'}
                            </Typography>
                            <Typography variant="body1" sx={{ mb: 3, color: 'text.secondary' }}>
                                {isInvited
                                    ? 'You have been invited to join this league! Would you like to accept or decline the invitation?'
                                    : 'This league is private. Would you like to request to join?'}
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                                <button
                                    onClick={isInvited ? handleDeclineInvitation : handleRequestClose}
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
                                    {isInvited ? 'Decline' : 'Cancel'}
                                </button>
                                <button
                                    onClick={isInvited ? handleAcceptInvitation : () => {
                                        // Will use the NewLeague component's request to join function
                                        setShowRequestPopup(false);
                                        setLeagueNotStarted(true);
                                    }}
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
                                    {isInvited ? 'Accept Invitation' : 'Request to Join'}
                                </button>
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
        message="An error occurred while Loading the league."
    />

    if(!leagueNotStarted){
        return (
            <Leagues userData={userData} leagueData={leagueData} playersData={playersData}  />
        )
    }else{
        return (
            <NewLeague userData={userData} leagueData={leagueData} playersData={playersData} />
        )
    }
}