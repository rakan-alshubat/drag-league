import React, { useEffect, useState } from 'react';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import Tooltip from '@mui/material/Tooltip';
import Avatar from '@mui/material/Avatar';
import Stack from '@mui/material/Stack';
import Popover from '@mui/material/Popover';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import CloseIcon from '@mui/icons-material/Close';

import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import CalculateIcon from '@mui/icons-material/Calculate';
import MilitaryTechIcon from '@mui/icons-material/MilitaryTech';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WhatshotIcon from '@mui/icons-material/Whatshot';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import StarIcon from '@mui/icons-material/Star';
import MicIcon from '@mui/icons-material/Mic';
import BlockIcon from '@mui/icons-material/Block';
import RepeatIcon from '@mui/icons-material/Repeat';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import PeopleIcon from '@mui/icons-material/People';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import computeLeagueStats from '../../helpers/computeStats';
import calculatePoints from '../../helpers/calculatePoints';
import { Line } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title as ChartTitle,
    Tooltip as ChartTooltip,
    Legend as ChartLegend
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, ChartTitle, ChartTooltip, ChartLegend);
import { Root, Title, StatRow } from './SeasonalStats.styles';

export default function SeasonalStats({ leagueData, playersData = [] }){
    const [stats, setStats] = useState(null);
    const [anchorEl, setAnchorEl] = useState(null);
    const [popoverContent, setPopoverContent] = useState({ title: '', items: [] });

    useEffect(() => {
        try {
            const result = computeLeagueStats(leagueData || {}, playersData || []);
            setStats(result);
        } catch (e) {
            setStats(null);        }
    }, [leagueData, playersData]);

    // Listen for manual league update events so stats refresh immediately
    useEffect(() => {
        const handler = (ev) => {
            try {
                const payload = ev?.detail || null;
                // if payload matches this league, recompute using payload + current playersData
                if (payload && leagueData && (String(payload.id) === String(leagueData.id) || String(payload.leagueId) === String(leagueData.id))) {
                    const freshLeague = payload;
                    const freshPlayers = Array.isArray(payload.playersByLeagueId?.items) ? payload.playersByLeagueId.items : (Array.isArray(payload.playersByLeagueId) ? payload.playersByLeagueId : playersData || []);
                    try {
                        const result = computeLeagueStats(freshLeague || {}, freshPlayers || playersData || []);
                        setStats(result);
                        // also expose for debugging
                        try { window.__seasonal_last_stats = result; window.__seasonal_last_league = freshLeague; window.__seasonal_last_playersCount = (freshPlayers || playersData || []).length; } catch (e) {}
                        console.log('SeasonalStats: recomputed stats from manual event', { leagueId: leagueData.id, players: (freshPlayers || playersData || []).length });
                    } catch (e) {
                        console.warn('SeasonalStats: failed to recompute from manual event', e);
                    }
                }
            } catch (e) {}
        };
        try { window.addEventListener('dragleague:leagueUpdated', handler); } catch (e) {}
        return () => { try { window.removeEventListener('dragleague:leagueUpdated', handler); } catch (e) {} };
    }, [leagueData, playersData]);

    if (!leagueData) return (
        <Root>
            <Title variant="h5">Seasonal Stats</Title>
            <Typography variant="body2">No league data available.</Typography>
        </Root>
    );

    if (!stats || !Array.isArray(stats.players) || stats.players.length === 0) {
        return (
            <Root>
                <Title variant="h5">Seasonal Stats</Title>
                <Typography variant="body2">No stats available yet — check back later!</Typography>
            </Root>
        );
    }

    const bestList = stats?.bestRankingPlayers || (stats?.bestRankingPlayer ? [stats.bestRankingPlayer] : []);

    const fmtNames = (arr) => {
        if (!arr || arr.length === 0) return null;
        if (arr.length === 1) return arr[0].name || 'unknown';
        if (arr.length === 2) return `${arr[0].name} & ${arr[1].name}`;
        const names = arr.map(a => a.name || 'unknown');
        return `${names.slice(0, -1).join(', ')}, & ${names[names.length - 1]}`;
    };

    const best = bestList.length ? { names: fmtNames(bestList), points: bestList[0].rankingPoints } : null;
    const mostWinsList = stats?.mostWinsPlayers || (stats?.mostWinsPlayer ? [stats.mostWinsPlayer] : []);
    const mostWins = mostWinsList.length ? { names: fmtNames(mostWinsList), count: (typeof stats?.mostWinsCount === 'number' ? stats.mostWinsCount : (mostWinsList[0].challengeCorrectCount || 0)) } : null;
    const bestChallengeList = stats?.bestChallengePlayers || (stats?.bestChallengePlayer ? [stats.bestChallengePlayer] : []);
    const bestChallenge = bestChallengeList.length ? { names: fmtNames(bestChallengeList), percent: bestChallengeList[0].challengeAccuracyPercent, count: bestChallengeList[0].challengeCorrectCount || 0 } : null;
    const streaks = stats?.streakHolders || [];
    const bestSwapList = stats?.bestSwapPlayers || (stats?.bestSwap ? [stats.bestSwap] : []);
    const bestSwap = bestSwapList.length ? { names: fmtNames(bestSwapList.map(p => ({ name: p.playerName }))), gain: bestSwapList[0].gain, swap: bestSwapList[0].swap } : null;
    const mostPicked = stats?.mostPickedFormatted || null;
    const bestBonusList = stats?.bestBonusPlayers || (stats?.bestBonusPlayer ? [stats.bestBonusPlayer] : []);
    const bestBonus = bestBonusList.length ? { names: fmtNames(bestBonusList), pts: bestBonusList[0].bonusPoints } : null;
    const bestLipSyncList = stats?.bestLipSyncPlayers || (stats?.bestLipSyncPlayer ? [stats.bestLipSyncPlayer] : []);
    const bestLipSync = bestLipSyncList.length ? { names: fmtNames(bestLipSyncList), pts: bestLipSyncList[0].lipSyncPoints } : null;
    const longestList = stats?.longestStreakPlayers || (stats?.longestStreakPlayer ? [stats.longestStreakPlayer] : []);
    const longest = longestList.length ? { names: fmtNames(longestList), streak: longestList[0].longestChallengeStreak } : null;
    const mostMissedList = stats?.mostMissedPlayers || (stats?.mostMissedPlayer ? [stats.mostMissedPlayer] : []);
    const mostMissed = mostMissedList.length ? { names: fmtNames(mostMissedList), missed: mostMissedList[0].missedChallengeCount } : null;
    const earliest = stats?.earliestSurprises || (stats?.earliestSurprise ? [stats.earliestSurprise] : []);
    const latest = stats?.latestSurprises || (stats?.latestSurprise ? [stats.latestSurprise] : []);
    const earliestFmt = earliest && earliest.length ? earliest.map(e => `${e.name} (avg ${Number(e.avgPredicted).toFixed(1)} → actual ${e.actualRanking} , Δ ${Number(e.delta).toFixed(1)})`).join(', ') : null;
    const latestFmt = latest && latest.length ? latest.map(e => `${e.name} (avg ${Number(e.avgPredicted).toFixed(1)} → actual ${e.actualRanking} , Δ ${Number(e.delta).toFixed(1)})`).join(', ') : null;
    const biggestGainersList = stats?.biggestRankGainers || (stats?.biggestRankGainer ? [stats.biggestRankGainer] : []);
    const biggestGainers = biggestGainersList.length ? { names: fmtNames(biggestGainersList), change: biggestGainersList[0].rankChange } : null;
    const biggestLosersList = stats?.biggestRankLosers || (stats?.biggestRankLoser ? [stats.biggestRankLoser] : []);
    const biggestLosers = biggestLosersList.length ? { names: fmtNames(biggestLosersList), change: biggestLosersList[0].rankChange } : null;
    const mostRepeatedList = stats?.mostRepeatedPlayers || (stats?.mostRepeatedPlayer ? [stats.mostRepeatedPlayer] : []);
    const mostRepeated = mostRepeatedList.length ? { names: fmtNames(mostRepeatedList), queen: mostRepeatedList[0].mostRepeatedPickQueen, count: mostRepeatedList[0].mostRepeatedPickCount } : null;
    const worstList = stats?.worstPredictions || (stats?.worstPrediction ? [stats.worstPrediction] : []);
    const worstFmt = worstList && worstList.length ? worstList.map(w => `${w.playerName}: ${w.queen} (pred ${w.predicted} → actual ${w.actual}, Δ ${w.diff})`).join(', ') : null;

    // prepare points-per-week chart data
    const makeColor = (i) => {
        const palette = ['#1976d2','#dc004e','#ff9800','#7b1fa2','#388e3c','#f50057','#0288d1','#c2185b','#f57c00','#455a64'];
        return palette[i % palette.length];
    };

    const weeksCount = Math.max(
        Array.isArray(leagueData?.lgChallengeWinners) ? leagueData.lgChallengeWinners.length : 0,
        Array.isArray(leagueData?.lgLipSyncWinners) ? leagueData.lgLipSyncWinners.length : 0,
        Array.isArray(leagueData?.lgBonusPoints) ? leagueData.lgBonusPoints.filter(b => String(b || '').split('|').map(s=>s.trim()).length >= 4).length : 0
    );

    let chart = null;
    if (weeksCount > 0 && Array.isArray(playersData) && playersData.length > 0) {
        const labels = Array.from({ length: weeksCount }, (_, i) => `W${i+1}`);
        const datasets = (playersData || []).map((pl, idx) => {
            const data = [];
            for (let w = 1; w <= weeksCount; w++) {
                // build league snapshot up to week w
                const snap = {};
                if (Array.isArray(leagueData.lgChallengeWinners)) snap.lgChallengeWinners = leagueData.lgChallengeWinners.slice(0, w);
                if (Array.isArray(leagueData.lgLipSyncWinners)) snap.lgLipSyncWinners = leagueData.lgLipSyncWinners.slice(0, w);
                if (Array.isArray(leagueData.lgEliminatedPlayers)) snap.lgEliminatedPlayers = leagueData.lgEliminatedPlayers.slice(0, w);
                if (Array.isArray(leagueData.lgBonusPoints)) snap.lgBonusPoints = leagueData.lgBonusPoints.slice(0, w);
                snap.lgQueenNames = leagueData.lgQueenNames || [];
                snap.lgChallengePoints = leagueData.lgChallengePoints;
                snap.lgLipSyncPoints = leagueData.lgLipSyncPoints;
                const pts = Number(calculatePoints(pl, snap) || 0);
                data.push(pts);
            }
            return {
                label: pl.plName || pl.plEmail || pl.id || 'unknown',
                data,
                borderColor: makeColor(idx),
                backgroundColor: makeColor(idx),
                tension: 0.3,
                pointRadius: 2,
                borderWidth: 2
            };
        });

        const chartData = { labels, datasets };
        const options = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: 'bottom' } },
            scales: { y: { beginAtZero: true } }
        };

        chart = (
            <Box sx={{ height: 320, width: '100%', mt: 2 }}>
                <Line data={chartData} options={options} />
            </Box>
        );
    }

    // build stat cards for grid
    const statCards = [
        { title: 'Best Ranking', value: best ? `${best.names} — ${best.points} pts` : 'N/A', hint: 'Highest current points', icon: EmojiEventsIcon, color: '#FFD700' },
        { title: 'Most Wins', value: mostWins ? `${mostWins.names} — ${mostWins.count} wins` : 'N/A', icon: MilitaryTechIcon, color: 'secondary.main' },
        { title: 'Best Challenge Predictor', value: bestChallenge ? `${bestChallenge.names} — ${bestChallenge.percent}% (${bestChallenge.count} wins)` : 'N/A', icon: CheckCircleIcon, color: 'success.main' },
        { title: 'Active Streaks', value: streaks.length > 0 ? streaks.map(s => `${s.name} (${s.streak})`).join(', ') : 'None', icon: WhatshotIcon, color: 'error.main' },
        { title: 'Longest Challenge Streak', value: longest ? `${longest.names} — ${longest.streak}` : 'N/A', icon: MilitaryTechIcon, color: '#6a1b9a' },
        { title: 'Best Swap', value: bestSwap ? `${bestSwap.names} — ${bestSwap.gain} pts${bestSwap.swap ? ` (${bestSwap.swap})` : ''}` : 'N/A', icon: SwapHorizIcon, color: 'primary.main' },
        { title: 'Top Bonus Earners', value: bestBonus ? `${bestBonus.names} — ${bestBonus.pts} pts` : 'N/A', icon: StarIcon, color: 'warning.main' },
        { title: 'Lip Sync Assassin', value: bestLipSync ? `${bestLipSync.names} — ${bestLipSync.pts} pts` : 'N/A', icon: MicIcon, color: 'secondary.dark' },
        { title: 'Most Missed Picks', value: mostMissed ? `${mostMissed.names} — ${mostMissed.missed} missed` : 'N/A', icon: BlockIcon, color: 'text.secondary' },
        { title: 'Most Repetitive Predictor', value: mostRepeated ? `${mostRepeated.names} — ${mostRepeated.queen} (${mostRepeated.count} picks)` : 'N/A', icon: RepeatIcon, color: 'info.dark' },
        { title: 'Eliminated Earlier Than Expected', value: earliestFmt || 'N/A', icon: ArrowDownwardIcon, color: '#c62828' },
        { title: 'Made It Further Than Predicted', value: latestFmt || 'N/A', icon: ArrowUpwardIcon, color: '#2e7d32' },
        { title: 'Most Picked Challenge Winner', value: mostPicked || 'N/A', icon: PeopleIcon, color: 'primary.light' },
        { title: 'Most Incorrect Predictions', value: (() => { const list = stats?.mostIncorrectPlayers || (stats?.mostIncorrectPlayer ? [stats.mostIncorrectPlayer] : []); return list.length ? `${fmtNames(list)} — ${list[0].challengeIncorrectCount || 0} wrong` : 'N/A'; })(), icon: ErrorOutlineIcon, color: '#8e24aa' },
        { title: 'Worst Single Prediction', value: worstFmt || 'N/A', icon: ErrorOutlineIcon, color: '#8e24aa' }
    ];

    return (
        <Root>
            <Title variant="h5">Seasonal Stats</Title>
            <Grid container spacing={2}>
                {statCards.map((s, idx) => (
                    <Grid item xs={12} sm={6} key={s.title}>
                        <Card
                            variant="outlined"
                            sx={{ height: '100%', cursor: 'pointer' }}
                            onClick={(e) => {
                                // prepare popover details based on stat type
                                const title = s.title;
                                let items = [];
                                try {
                                    if (title === 'Best Ranking') {
                                        const ranked = (playersData || []).map(p => ({ name: p.plName || p.plEmail || p.id, pts: Number(calculatePoints(p, leagueData) || 0) }));
                                        items = ranked.sort((a,b)=>b.pts - a.pts).slice(0,6).map(r => `${r.name} — ${r.pts} pts`);
                                    } else if (title === 'Most Wins') {
                                        items = (stats?.players || []).slice().sort((a,b) => (b.challengeCorrectCount || 0) - (a.challengeCorrectCount || 0)).slice(0,6).map(p => `${p.name || p.plName || p.plEmail} — ${p.challengeCorrectCount || 0} wins`);
                                    } else if (title === 'Most Incorrect Predictions') {
                                        items = (stats?.players || []).slice().sort((a,b) => (b.challengeIncorrectCount || 0) - (a.challengeIncorrectCount || 0)).slice(0,6).map(p => `${p.name || p.plName || p.plEmail} — ${p.challengeIncorrectCount || 0} wrong`);
                                    } else if (title === 'Longest Challenge Streak') {
                                        items = (stats?.players || []).slice().sort((a,b) => (b.longestChallengeStreak || 0) - (a.longestChallengeStreak || 0)).slice(0,6).map(p => `${p.name || p.plName || p.plEmail} — ${p.longestChallengeStreak || 0}`);
                                    } else if (title === 'Top Bonus Earners') {
                                        items = (stats?.players || []).slice().sort((a,b) => (b.bonusPoints || 0) - (a.bonusPoints || 0)).slice(0,6).map(p => `${p.name || p.plName || p.plEmail} — ${p.bonusPoints || 0} pts`);
                                    } else if (title === 'Lip Sync Assassin') {
                                        items = (stats?.players || []).slice().sort((a,b) => (b.lipSyncPoints || 0) - (a.lipSyncPoints || 0)).slice(0,6).map(p => `${p.name || p.plName || p.plEmail} — ${p.lipSyncPoints || 0} pts`);
                                    } else if (title === 'Best Swap') {
                                        items = (stats?.bestSwapPlayers || (stats?.bestSwap ? [stats.bestSwap] : [])).slice(0,6).map(p => `${p.playerName} — ${p.gain} pts (${p.swap})`);
                                    } else if (typeof s.value === 'string' && s.value && s.value !== 'N/A') {
                                        items = [s.value];
                                    }
                                } catch (err) { items = [s.value]; }
                                setPopoverContent({ title, items });
                                setAnchorEl(e.currentTarget);
                            }}
                        >
                            <CardContent>
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <Stack direction="row" spacing={1} alignItems="center">
                                        <Avatar sx={{ bgcolor: s.color, width: 36, height: 36 }}>
                                            {s.icon ? <s.icon fontSize="small" /> : null}
                                        </Avatar>
                                        <Tooltip title={s.hint || ''} arrow>
                                            <Typography sx={{ fontWeight: 700 }}>{s.title}</Typography>
                                        </Tooltip>
                                    </Stack>
                                    {(() => {
                                        const fullLabel = (typeof s.value === 'string' ? s.value : String(s.value || ''));
                                        return (
                                            <Tooltip title={fullLabel} arrow>
                                                <Chip
                                                    label={
                                                        <Box sx={{ whiteSpace: 'normal', display: 'inline-block', textAlign: 'left', lineHeight: 1.2 }}>{fullLabel}</Box>
                                                    }
                                                    size="small"
                                                    sx={{ flexShrink: 0, maxWidth: 320, whiteSpace: 'normal', height: 'auto', py: 0.5, px: 1 }}
                                                />
                                            </Tooltip>
                                        );
                                    })()}
                                </Box>
                                {typeof s.value === 'string' && s.value.length > 80 ? (
                                    <Typography variant="body2" sx={{ mt: 1 }}>{s.value}</Typography>
                                ) : null}
                            </CardContent>
                        </Card>
                    </Grid>
                ))}

                { (leagueData?.lgChallengeWinners && leagueData.lgChallengeWinners.length >= 2) && (
                    <>
                        <Grid item xs={12}>
                            <Card variant="outlined">
                                <CardContent>
                                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                                        <Box sx={{ flex: 1 }}>
                                            <Typography sx={{ fontWeight: 700 }}>Weekly Point Changes</Typography>
                                            <Box sx={{ mt: 1 }}>
                                                                        {stats?.weeklyPointChanges && stats.weeklyPointChanges.length > 0 ? (
                                                                            // sort by final position (afterRank) ascending: 1 === top
                                                                            stats.weeklyPointChanges.slice().sort((a,b) => {
                                                                                const ar = (a.afterRank == null) ? 9999 : Number(a.afterRank);
                                                                                const br = (b.afterRank == null) ? 9999 : Number(b.afterRank);
                                                                                return ar - br;
                                                                            }).map(w => {
                                                                                const deltaPts = (w.after || 0) - (w.before || 0);
                                                                                const rankChange = Number(w.rankChange || 0);
                                                                                const afterRank = w.afterRank != null ? w.afterRank : '-';
                                                                                return (
                                                                                    <Box key={w.id || w.name} sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 0.75, overflow: 'visible' }}>
                                                                                        <Box sx={{ width: 36, textAlign: 'center' }}>
                                                                                            <Typography sx={{ fontWeight: 800 }}>{afterRank}</Typography>
                                                                                        </Box>
                                                                                        <Box sx={{ flex: 1 }}>
                                                                                            <Typography variant="body2" sx={{ fontWeight: 700 }}>{w.name}</Typography>
                                                                                            <Typography variant="caption" color="text.secondary">{`${w.before} → ${w.after} pts`}</Typography>
                                                                                        </Box>
                                                                                        {(() => {
                                                                                            const label = `${rankChange > 0 ? '+' : ''}${rankChange} spots`;
                                                                                            return (
                                                                                                <Tooltip title={label} arrow>
                                                                                                    <Chip
                                                                                                        size="small"
                                                                                                        icon={rankChange > 0 ? <ArrowUpwardIcon sx={{ color: 'white' }} /> : (rankChange < 0 ? <ArrowDownwardIcon sx={{ color: 'white' }} /> : null)}
                                                                                                        label={<Box sx={{ whiteSpace: 'normal', lineHeight: 1.1 }}>{label}</Box>}
                                                                                                        sx={{ flexShrink: 0, bgcolor: rankChange > 0 ? 'success.main' : (rankChange < 0 ? 'error.main' : 'grey.300'), color: rankChange !== 0 ? 'common.white' : 'text.primary', minWidth: 96 }}
                                                                                                    />
                                                                                                </Tooltip>
                                                                                            );
                                                                                        })()}
                                                                                    </Box>
                                                                                );
                                                                            })
                                                                        ) : (
                                                                            <Typography variant="body2">No weekly changes available.</Typography>
                                                                        )}
                                            </Box>
                                        </Box>
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>

                        <Grid item xs={12}>
                            {chart}
                        </Grid>
                    </>
                )}

            <Popover
                open={Boolean(anchorEl)}
                anchorEl={anchorEl}
                onClose={() => setAnchorEl(null)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Box sx={{ width: 320, p: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography sx={{ fontWeight: 800 }}>{popoverContent.title}</Typography>
                        <IconButton size="small" onClick={() => setAnchorEl(null)}><CloseIcon fontSize="small" /></IconButton>
                    </Box>
                    <List dense>
                        {popoverContent.items && popoverContent.items.length > 0 ? popoverContent.items.map((it, i) => (
                            <ListItem key={i}><ListItemText primary={it} /></ListItem>
                        )) : <ListItem><ListItemText primary="No details available." /></ListItem>}
                    </List>
                </Box>
            </Popover>
            </Grid>
        </Root>
    );
}
