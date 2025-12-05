import { getCurrentUser } from "@aws-amplify/auth";
import { generateClient } from 'aws-amplify/api'
import { useRouter } from "next/router";
import { getUsers, getLeague, playersByLeagueId } from "@/graphql/queries";
import LoadingWheel from "@/files/LoadingWheel";
import { useEffect, useState } from "react";
import RankingsPage from "@/files/RankingsPage";

export default function Rank(){

    const [loading, setLoading] = useState(false);
    const [userData, setUserData] = useState(null);
    const [leagueData, setLeagueData] = useState(null);
    const [playersData, setPlayersData] = useState(null);
    const [leagueNotStarted, setLeagueNotStarted] = useState(true);
    
    
    const router = useRouter();
    const client = generateClient()
    const { id } = router.query;

    useEffect(() => {
        if (!router.isReady) return; 
        getCurrentUser()
            .then(user => {
                async function getUserData() {
                    try {
                        console.log('Fetching user and league data for user ID:', user, 'and league ID:', router.query.id);
                        const userResults = await client.graphql({
                            query: getUsers,
                            variables: { id: user.signInDetails.loginId.toLowerCase() }
                        })
                        const leagueResults = await client.graphql({
                            query: getLeague,
                            variables: { id: router.query.id }
                        })
                        console.log('Fetched league dat2a:', leagueResults);
                        console.log('Fetched user dat2a:', userResults);

                        if(userResults.data.getUsers && leagueResults.data.getLeague) {
                            //set user data here if needed
                            setUserData(userResults.data.getUsers);
                            setLeagueData(leagueResults.data.getLeague);
                            const playersResults = await client.graphql({
                                query: playersByLeagueId,
                                variables: { leagueId: id }
                            })
                            console.log('Fetched players data:', playersResults);
                            const players = playersResults?.data?.playersByLeagueId?.items
                                                        ?? playersResults?.data?.playersByLeagueId
                                                        ?? [];
                            setPlayersData(players);
                            if(leagueResults.data.getLeague.lgFinished === 'not started'){
                                setLeagueNotStarted(true);
                            }
                            setLoading(false);
                        }else{
                            router.push('/SignIn')
                        }
                    } catch (error) {
                        console.error('Error fetching user data:', error);
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
            <RankingsPage leagueInfo={leagueData} userInfo={userData} playersInfo={playersData} />
        )
    }else{
        router.push(`/League/${id}`)
    }
}