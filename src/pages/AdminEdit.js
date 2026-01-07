import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Amplify } from 'aws-amplify';
import { generateClient } from 'aws-amplify/api';
import { fetchAuthSession } from 'aws-amplify/auth';
import awsExports from '@/aws-exports';
import AdminEditPage from '@/files/AdminEditPage';
import { getLeague, getPlayer, playersByLeagueId } from '@/graphql/queries';

Amplify.configure(awsExports);
const client = generateClient();

export default function AdminEdit() {
    const router = useRouter();
    const { leagueId } = router.query;
    const [leagueData, setLeagueData] = useState(null);
    const [allPlayers, setAllPlayers] = useState([]);
    const [currentPlayer, setCurrentPlayer] = useState(null);
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (leagueId) {
            fetchData();
        }
    }, [leagueId]);

    const fetchData = async () => {
        try {
            setLoading(true);
            
            // Get current user
            const session = await fetchAuthSession();
            const userEmail = session?.tokens?.idToken?.payload?.email;
            setUserData({ email: userEmail });

            const leagueResult = await client.graphql({
                query: getLeague,
                variables: { id: leagueId }
            });

            const league = leagueResult.data.getLeague;
            setLeagueData(league);

            // Fetch all players in this league
            const playersResult = await client.graphql({
                query: playersByLeagueId,
                variables: { leagueId: leagueId }
            });

            const players = playersResult.data.playersByLeagueId.items;
            setAllPlayers(players);

            // Find current player
            const player = players.find(p => p.plEmail?.toLowerCase() === userEmail?.toLowerCase());
            setCurrentPlayer(player);

            setLoading(false);
        } catch (error) {
            await serverLogError('Error fetching data', { error: error.message });
            setLoading(false);
        }
    };

    // Check if current user is admin
    const isAdmin = leagueData?.lgAdmin?.some(email => 
        email?.toLowerCase() === userData?.email?.toLowerCase()
    ) || leagueData?.lgUserEmail?.toLowerCase() === userData?.email?.toLowerCase();

    if (loading) {
        return (
            <div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>
        );
    }

    if (!isAdmin) {
        return (
            <div style={{ padding: '2rem', textAlign: 'center' }}>
                <h2>Access Denied</h2>
                <p>Only league administrators can access this page.</p>
            </div>
        );
    }

    return (
        <AdminEditPage
            leagueData={leagueData}
            allPlayers={allPlayers}
            currentPlayer={currentPlayer}
            userData={userData}
            onUpdate={fetchData}
        />
    );
}
