import { getCurrentUser } from "@aws-amplify/auth";
import { generateClient } from 'aws-amplify/api'
import { useRouter } from "next/router";
import { getUsers, getLeague, playersByLeagueId } from "@/graphql/queries";
import LoadingWheel from "@/files/LoadingWheel";
import { useEffect, useState } from "react";
import RankingsPage from "@/files/RankingsPage";
import ErrorPopup from '@/files/ErrorPopUp';
import formatError from '@/helpers/formatError';

export default function Rank(){

    const [loading, setLoading] = useState(false);
    const [userData, setUserData] = useState(null);
    const [leagueData, setLeagueData] = useState(null);
    const [playersData, setPlayersData] = useState(null);
    const [leagueNotStarted, setLeagueNotStarted] = useState(true);
    const [isEditMode, setIsEditMode] = useState(false);
    const [errorPopup, setErrorPopup] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    
    
    const router = useRouter();
    const client = generateClient()
    const { id, edit } = router.query; // Get both id and edit query params

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
                            variables: { id: router.query.id }
                        })

                        if(userResults.data.getUsers && leagueResults.data.getLeague) {
                            //set user data here if needed
                            setUserData(userResults.data.getUsers);
                            setLeagueData(leagueResults.data.getLeague);
                            const playersResults = await client.graphql({
                                query: playersByLeagueId,
                                variables: { leagueId: id }
                            })
                            const players = playersResults?.data?.playersByLeagueId?.items
                                                        ?? playersResults?.data?.playersByLeagueId
                                                        ?? [];
                            
                            // Find the current user's player record
                            const currentUserEmail = user.signInDetails.loginId.toLowerCase();
                            const currentPlayer = players.find(p => p.plEmail === currentUserEmail);
                            
                            setPlayersData(currentPlayer);
                            if(leagueResults.data.getLeague.lgFinished === 'not started'){
                                setLeagueNotStarted(true);
                            }
                            
                            // Check if we're in edit mode (user has already submitted)
                            const hasRankings = currentPlayer?.plRankings && Array.isArray(currentPlayer.plRankings) && currentPlayer.plRankings.length > 0;
                            if (edit === 'true' && hasRankings) {
                                setIsEditMode(true);
                            }
                            
                            setLoading(false);
                        }else{
                            router.push('/SignIn')
                        }
                    } catch (error) {
                        console.error('Error fetching user data:', error);
                        setErrorMessage(formatError(error) || 'Failed to load ranking data.');
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


    if(loading){
        return (
            <LoadingWheel />
        )
    }

    if(leagueNotStarted){
        return (
            <>
                <RankingsPage 
                    leagueInfo={leagueData} 
                    userInfo={userData} 
                    playersInfo={playersData} 
                    isEditMode={isEditMode}
                />
                <ErrorPopup open={errorPopup} onClose={() => { setErrorPopup(false); setErrorMessage(''); }} message={errorMessage || 'An error occurred.'} />
            </>
        )
    }else{
        router.push(`/League/${id}`)
    }
}