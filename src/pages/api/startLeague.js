import { Amplify } from 'aws-amplify';
import { generateClient } from 'aws-amplify/api';
import awsExports from '@/aws-exports';
import { updateLeague, deletePlayer } from '@/graphql/mutations';
import { getLeague, playersByLeagueId } from '@/graphql/queries';

// Configure Amplify for this API route
// Note: In production, you might want to use AWS SDK directly or configure credentials differently
Amplify.configure({
    ...awsExports,
    ssr: true
});

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { leagueId } = req.body;

    if (!leagueId) {
        return res.status(400).json({ error: 'League ID is required' });
    }

    const client = generateClient();

    try {
        // Fetch the league
        const leagueResult = await client.graphql({
            query: getLeague,
            variables: { id: leagueId }
        });

        const league = leagueResult.data.getLeague;

        if (!league) {
            return res.status(404).json({ error: 'League not found' });
        }

        // Check if league already started
        if (league.lgFinished === 'active' || league.lgFinished === 'finished') {
            return res.status(200).json({ 
                success: true, 
                message: 'League already started',
                alreadyStarted: true 
            });
        }

        // Check if deadline has passed
        const deadlineDate = new Date(league.lgRankingDeadline);
        const now = new Date();

        if (now < deadlineDate) {
            return res.status(400).json({ 
                error: 'Deadline has not passed yet',
                deadline: league.lgRankingDeadline 
            });
        }

        // Fetch all players in the league
        const playersResult = await client.graphql({
            query: playersByLeagueId,
            variables: { leagueId: leagueId }
        });

        const players = playersResult?.data?.playersByLeagueId?.items 
            ?? playersResult?.data?.playersByLeagueId 
            ?? [];

        // Find players without rankings
        const playersWithoutRankings = players.filter(player => 
            !player.plRankings || !Array.isArray(player.plRankings) || player.plRankings.length === 0
        );

        // Delete players without rankings
        const deletedPlayers = [];
        for (const player of playersWithoutRankings) {
            try {
                await client.graphql({
                    query: deletePlayer,
                    variables: { 
                        input: { 
                            id: player.id 
                        } 
                    }
                });
                deletedPlayers.push(player.plName || player.plEmail);
            } catch (error) {
                console.error(`Error deleting player ${player.plName}:`, error);
            }
        }

        // Update league to active status
        const currentHistory = league.lgHistory || [];
        let historyEntry = new Date().toISOString() + '. Ranking deadline passed - league automatically started';
        if (deletedPlayers.length > 0) {
            historyEntry += ` (${deletedPlayers.length} player${deletedPlayers.length > 1 ? 's' : ''} removed for not submitting)`;
        }

        const updateResult = await client.graphql({
            query: updateLeague,
            variables: { 
                input: { 
                    id: leagueId, 
                    lgFinished: 'active',
                    lgHistory: [...currentHistory, historyEntry]
                } 
            }
        });

        return res.status(200).json({ 
            success: true,
            message: 'League started successfully',
            deletedPlayers: deletedPlayers,
            league: updateResult.data.updateLeague
        });

    } catch (error) {
        console.error('Error starting league:', error);
        return res.status(500).json({ 
            error: 'Failed to start league',
            details: error.message 
        });
    }
}
