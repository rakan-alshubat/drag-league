import React, { useEffect, useState } from 'react';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import computeLeagueStats from '../../helpers/computeStats';
import { Root, Title, StatRow } from './SeasonalStats.styles';

export default function SeasonalStats({ leagueData, playersData = [] }){
    const [stats, setStats] = useState(null);

    useEffect(() => {
        try {
            const result = computeLeagueStats(leagueData || {}, playersData || []);
            setStats(result);
        } catch (e) {
            setStats(null);
        }
    }, [leagueData, playersData]);

    if (!leagueData) return (
        <Root>
            <Title variant="h5">Seasonal Stats</Title>
            <Typography variant="body2">No league data available.</Typography>
        </Root>
    );

    const best = stats?.bestRankingPlayer || null;
    const accurate = stats?.mostAccurateRankingPrediction || null;

    return (
        <Root>
            <Title variant="h5">Seasonal Stats</Title>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <StatRow>
                    <Typography sx={{ fontWeight: 700 }}>Best Ranking:</Typography>
                    <Typography sx={{ marginLeft: 8 }}>{best ? `${best.name} — ${best.rankingPoints} pts` : 'N/A'}</Typography>
                </StatRow>

                <StatRow>
                    <Typography sx={{ fontWeight: 700 }}>Most Accurate Prediction:</Typography>
                    <Typography sx={{ marginLeft: 8 }}>{accurate ? `${accurate.name} — MAE ${accurate.rankingMAE}` : 'N/A'}</Typography>
                </StatRow>

                <Typography variant="caption" color="text.secondary">(Basic stats only — no visualizations yet)</Typography>
            </Box>
        </Root>
    );
}
