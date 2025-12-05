import Leagues from "@/files/Leagues"
import NewLeague from "@/files/NewLeague";
import { getCurrentUser } from "@aws-amplify/auth";
import { generateClient } from 'aws-amplify/api'
import { useRouter } from "next/router";
import { getUsers, getLeague, playersByLeagueId} from "@/graphql/queries";
import LoadingWheel from "@/files/LoadingWheel";
import ErrorPopup from "@/files/ErrorPopUp";
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
                            console.log('Fetched players data:', playersResults);
                            const players = playersResults?.data?.playersByLeagueId?.items
                            ?? playersResults?.data?.playersByLeagueId
                            ?? [];
                            setPlayersData(players);
                            console.log('League Finished Status:', players);
                            if(leagueResults.data.getLeague.lgFinished === 'not started'){
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

    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
                timeoutRef.current = null;
            }
        };
    }, []);

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