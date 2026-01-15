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

export default function SeasonalStats({ leagueData, playersData = [] }){
    const [stats, setStats] = useState(null);
    const [isPortraitMobile, setIsPortraitMobile] = useState(false);
    const [anchorEl, setAnchorEl] = useState(null);
    const [popoverContent, setPopoverContent] = useState({ title: '', items: [] });

    useEffect(() => {
        try {
            const result = computeLeagueStats(leagueData || {}, playersData || []);
            setStats(result);
        } catch (e) {
            setStats(null);        }
    }, [leagueData, playersData]);

    // detect portrait mobile state using matchMedia and keep a JS flag so
    // we only mount one chart instance at a time (avoids Chart.js sizing issues)
    useEffect(() => {
        try {
            const mq = window.matchMedia('(orientation: portrait) and (max-width:900px)');
            const handler = () => {
                setIsPortraitMobile(Boolean(mq.matches));
                // give Chart.js a moment to layout then trigger resize
                setTimeout(() => { try { window.dispatchEvent(new Event('resize')); } catch (e) {} }, 120);
            };
            handler();
            if (mq.addEventListener) mq.addEventListener('change', handler); else mq.addListener(handler);
            return () => { if (mq.removeEventListener) mq.removeEventListener('change', handler); else mq.removeListener(handler); };
        } catch (e) { setIsPortraitMobile(false); }
    }, []);

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
        <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="h5" sx={{ fontWeight: 800, background: 'linear-gradient(135deg, #E91E63 0%, #9C27B0 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Seasonal Stats
            </Typography>
            <Typography variant="body2" sx={{ mt: 2 }}>No league data available.</Typography>
        </Box>
    );

    if (!stats || !Array.isArray(stats.players) || stats.players.length === 0) {
        return (
            <Box sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="h5" sx={{ fontWeight: 800, background: 'linear-gradient(135deg, #E91E63 0%, #9C27B0 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    Seasonal Stats
                </Typography>
                <Typography variant="body2" sx={{ mt: 2 }}>No stats available yet — check back later!</Typography>
            </Box>
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

    const humanizeMs = (ms) => {
        const totalMins = Math.round((Number(ms) || 0) / 60000);
        const days = Math.floor(totalMins / 1440);
        const hrs = Math.floor((totalMins % 1440) / 60);
        const mins = Math.abs(totalMins % 60);
        const parts = [];
        if (days) parts.push(`${days}d`);
        if (hrs) parts.push(`${hrs}h`);
        if (mins || parts.length === 0) parts.push(`${mins}m`);
        return parts.join(' ');
    };

    const formatLeadFallback = (arr) => {
        if (!arr || !Array.isArray(arr) || arr.length === 0) return null;
        const strs = arr.map(a => `${a.name} (${humanizeMs(a.avgLead)} before)`);
        if (strs.length === 1) return strs[0];
        if (strs.length === 2) return `${strs[0]} & ${strs[1]}`;
        return `${strs.slice(0, -1).join(', ')}, & ${strs[strs.length - 1]}`;
    };

    const best = bestList.length ? { names: stats?.bestRankingFormatted || fmtNames(bestList), points: bestList[0].rankingPoints } : null;
    const mostWinsList = stats?.mostWinsPlayers || (stats?.mostWinsPlayer ? [stats.mostWinsPlayer] : []);
    const mostWins = mostWinsList.length ? { names: stats?.mostWinsFormatted || fmtNames(mostWinsList), count: (typeof stats?.mostWinsCount === 'number' ? stats.mostWinsCount : (mostWinsList[0].challengeCorrectCount || 0)), percent: (typeof mostWinsList[0]?.challengeAccuracyPercent === 'number' ? Number(mostWinsList[0].challengeAccuracyPercent).toFixed(2) : null) } : null;
    const streaks = stats?.streakHolders || [];
    const bestSwapList = stats?.bestSwapPlayers || (stats?.bestSwap ? [stats.bestSwap] : []);
    const bestSwap = bestSwapList.length ? { names: stats?.bestSwapFormatted || fmtNames(bestSwapList.map(p => ({ name: p.playerName }))), gain: bestSwapList[0].gain, swap: bestSwapList[0].swap } : null;
    const mostPicked = stats?.mostPickedFormatted || null;
    const bestBonusList = stats?.bestBonusPlayers || (stats?.bestBonusPlayer ? [stats.bestBonusPlayer] : []);
    const bestBonus = bestBonusList.length ? { names: stats?.bestBonusFormatted || fmtNames(bestBonusList), pts: bestBonusList[0].bonusPoints } : null;
    const bestLipSyncList = stats?.bestLipSyncPlayers || (stats?.bestLipSyncPlayer ? [stats.bestLipSyncPlayer] : []);
    const bestLipSync = bestLipSyncList.length ? { names: stats?.bestLipSyncFormatted || fmtNames(bestLipSyncList), pts: bestLipSyncList[0].lipSyncPoints } : null;
    const longestList = stats?.longestStreakPlayers || (stats?.longestStreakPlayer ? [stats.longestStreakPlayer] : []);
    const longest = longestList.length ? { names: stats?.longestStreakFormatted || fmtNames(longestList), streak: longestList[0].longestChallengeStreak } : null;
    const mostMissedList = stats?.mostMissedPlayers || (stats?.mostMissedPlayer ? [stats.mostMissedPlayer] : []);
    const mostMissed = mostMissedList.length ? { names: stats?.mostMissedFormatted || fmtNames(mostMissedList), missed: mostMissedList[0].missedChallengeCount } : null;
    const earliest = stats?.earliestSurprises || (stats?.earliestSurprise ? [stats.earliestSurprise] : []);
    const latest = stats?.latestSurprises || (stats?.latestSurprise ? [stats.latestSurprise] : []);
    const earliestFmt = earliest && earliest.length ? earliest.map(e => `${e.name} (avg ${Number(e.avgPredicted).toFixed(1)} → actual ${e.actualRanking})`).join(', ') : null;
    const latestFmt = latest && latest.length ? latest.map(e => `${e.name} (avg ${Number(e.avgPredicted).toFixed(1)} → actual ${e.actualRanking})`).join(', ') : null;
    const biggestGainersList = stats?.biggestRankGainers || (stats?.biggestRankGainer ? [stats.biggestRankGainer] : []);
    const biggestGainers = biggestGainersList.length ? { names: stats?.biggestRankGainersFormatted || fmtNames(biggestGainersList), change: biggestGainersList[0].rankChange } : null;
    const biggestLosersList = stats?.biggestRankLosers || (stats?.biggestRankLoser ? [stats.biggestRankLoser] : []);
    const biggestLosers = biggestLosersList.length ? { names: stats?.biggestRankLosersFormatted || fmtNames(biggestLosersList), change: biggestLosersList[0].rankChange } : null;
    const mostRepeatedList = stats?.mostRepeatedPlayers || (stats?.mostRepeatedPlayer ? [stats.mostRepeatedPlayer] : []);
    const mostRepeated = mostRepeatedList.length ? { names: stats?.mostRepeatedFormatted || fmtNames(mostRepeatedList), queen: mostRepeatedList[0].mostRepeatedPickQueen, count: mostRepeatedList[0].mostRepeatedPickCount } : null;
    const worstList = stats?.worstPredictions || (stats?.worstPrediction ? [stats.worstPrediction] : []);
    const worstFmt = worstList && worstList.length ? (stats?.worstPredictionsFormatted || worstList.map(w => `${w.playerName}: ${w.queen} (pred ${w.predicted} → actual ${w.actual})`).join(', ')) : null;

    // prepare points-per-week chart data
    // deterministic color per player id (stable across ordering)
    const hashStringToInt = (s) => {
        let h = 2166136261 >>> 0;
        for (let i = 0; i < (s || '').length; i++){
            h ^= (s.charCodeAt(i) >>> 0);
            h += (h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24);
            h >>>= 0;
        }
        return h >>> 0;
    };

    const hslToHex = (h, s, l, a = 1) => {
        h = h / 360; s /= 100; l /= 100;
        const k = n => (n + h * 12) % 12;
        const a_ = s * Math.min(l, 1 - l);
        const f = n => {
            const val = l - a_ * Math.max(Math.min(k(n) - 3, 9 - k(n), 1), -1);
            return Math.round(255 * val).toString(16).padStart(2, '0');
        };
        const r = f(0), g = f(8), b = f(4);
        if (a === 1) return `#${r}${g}${b}`;
        const alpha = Math.round(a * 255).toString(16).padStart(2, '0');
        return `#${r}${g}${b}${alpha}`;
    };

    // Assign visually distinct hues per player using deterministic golden-angle ordering.
    // Sort players by hash(playerId) to get a stable order, then assign hues = i * GOLDEN % 360.
    const assignHues = (players) => {
        const GOLDEN = 137.508; // golden angle in degrees
        const items = (players || []).map(pl => ({ id: String(pl?.id || ''), weight: hashStringToInt(String(pl?.id || '')) }));
        items.sort((a,b) => a.weight - b.weight);
        const hueMap = {};
        for (let i = 0; i < items.length; i++) {
            const h = Math.round((i * GOLDEN) % 360);
            hueMap[items[i].id] = h;
        }
        return hueMap;
    };

    const weeksCount = Math.max(
        Array.isArray(leagueData?.lgChallengeWinners) ? leagueData.lgChallengeWinners.length : 0,
        Array.isArray(leagueData?.lgLipSyncWinners) ? leagueData.lgLipSyncWinners.length : 0,
        Array.isArray(leagueData?.lgBonusPoints) ? leagueData.lgBonusPoints.filter(b => String(b || '').split('|').map(s=>s.trim()).length >= 4).length : 0
    );

    let chart = null;
    if (weeksCount > 0 && Array.isArray(playersData) && playersData.length > 0) {
        const labels = Array.from({ length: weeksCount }, (_, i) => `W${i+1}`);
        const hueMap = assignHues(playersData || []);
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
            const h = hueMap[String(pl.id || '')];
            const col = { border: hslToHex(h, 62, 48, 1), fill: hslToHex(h, 62, 48, 1) };
            try { console.log('SeasonalStats color:', pl.plName || pl.plEmail || pl.id || 'unknown', col); } catch (e) {}
            return {
                label: pl.plName || pl.plEmail || pl.id || 'unknown',
                data,
                borderColor: col.border,
                backgroundColor: col.fill,
                tension: 0.3,
                pointRadius: 3,
                borderWidth: 3
            };
        });

        const chartData = { labels, datasets };
        const options = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { 
                legend: { 
                    position: 'bottom',
                    labels: { color: '#1a1a2e', font: { size: 12, weight: 600 } }
                } 
            },
            scales: { 
                y: { 

                    grid: { color: 'rgba(0,0,0,0.1)' },
                    ticks: { color: '#5a6c7d' }
                },
                x: {
                    grid: { color: 'rgba(0,0,0,0.1)' },
                    ticks: { color: '#5a6c7d' }
                }
            }
        };

        // On small screens allow horizontal scrolling by giving the inner chart
        // a larger fixed minWidth proportional to number of weeks so it will
        // always overflow and become scrollable on narrow viewports.
        const minChartWidth = Math.max(480, weeksCount * 90);
        // Use JS-driven portrait/mobile detection so we mount only one Line
        // chart instance at a time (prevents Chart.js from sizing to the
        // wrong hidden container). When `isPortraitMobile` is true we render
        // the rotated chart; otherwise render the normal horizontal chart.
        if (isPortraitMobile) {
            chart = (
                <Box sx={{ width: '100%', mt: 2, overflow: 'hidden', height: `${minChartWidth}px`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Box sx={{ transform: 'rotate(90deg)', transformOrigin: 'center center', width: `${minChartWidth}px`, height: { xs: 240, md: 400 } }}>
                        <Line data={chartData} options={options} />
                    </Box>
                </Box>
            );
        } else {
            chart = (
                <Box sx={{ width: '100%', mt: 2, overflowX: 'auto' }}>
                    <Box sx={{ minWidth: `${minChartWidth}px`, height: { xs: 240, md: 400 } }}>
                        <Line data={chartData} options={options} />
                    </Box>
                </Box>
            );
        }
    }

    // build stat cards for grid
    const statCards = [
        { title: '👑 Best Ranking', value: best ? `${best.names} — ${best.points} pts` : 'N/A', hint: 'Highest current points', icon: EmojiEventsIcon, gradient: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)' },
        { title: '🏆 Most Maxi Challenge Wins', value: mostWins ? `${mostWins.names} — ${mostWins.count} wins${mostWins.percent ? ` (${mostWins.percent}%)` : ''}` : 'N/A', icon: MilitaryTechIcon, gradient: 'linear-gradient(135deg, #E91E63 0%, #AD1457 100%)' },
        { title: '🔥 Active Streaks', value: streaks.length > 0 ? streaks.map(s => `${s.name} (${s.streak})`).join(', ') : 'None', icon: WhatshotIcon, gradient: 'linear-gradient(135deg, #FF5722 0%, #D84315 100%)' },
        { title: '⚡ Longest Maxi Challenge Streak', value: longest ? `${longest.names} — ${Number(longest.streak) || 0} week${(Number(longest.streak) === 1) ? '' : 's'}` : 'N/A', icon: MilitaryTechIcon, gradient: 'linear-gradient(135deg, #9C27B0 0%, #6A1B9A 100%)' },
        { title: '💫 Best Swap', value: bestSwap ? `${bestSwap.names} — ${Number(bestSwap.gain) > 0 ? `gained ${Number(bestSwap.gain)} pts` : Number(bestSwap.gain) < 0 ? `lost ${Math.abs(Number(bestSwap.gain))} pts` : 'no change'}${bestSwap.swap ? ` (${bestSwap.swap})` : ''}` : 'N/A', icon: SwapHorizIcon, gradient: 'linear-gradient(135deg, #3F51B5 0%, #283593 100%)' },
        { title: '⭐ Top Bonus Earners', value: bestBonus ? `${bestBonus.names} — ${bestBonus.pts} pts` : 'N/A', icon: StarIcon, gradient: 'linear-gradient(135deg, #FFC107 0%, #FF6F00 100%)' },
        { title: '❌ Missed The Most Weekly Submissions', value: mostMissed ? `${mostMissed.names} — ${mostMissed.missed} missed` : 'N/A', icon: BlockIcon, gradient: 'linear-gradient(135deg, #607D8B 0%, #455A64 100%)' },
        { title: '🔁 Most Repetitive Predictor', value: mostRepeated ? `${mostRepeated.names} — ${mostRepeated.queen} (${mostRepeated.count} picks)` : 'N/A', icon: RepeatIcon, gradient: 'linear-gradient(135deg, #00BCD4 0%, #0097A7 100%)' },
        { title: '📉 Eliminated Earlier Than Predicted', value: earliestFmt || 'N/A', icon: ArrowDownwardIcon, gradient: 'linear-gradient(135deg, #F44336 0%, #C62828 100%)' },
        { title: '📈 Made It Further Than Predicted', value: latestFmt || 'N/A', icon: ArrowUpwardIcon, gradient: 'linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%)' },
        { title: '👥 Most Picked Maxi Challenge Winner', value: mostPicked || 'N/A', icon: PeopleIcon, gradient: 'linear-gradient(135deg, #2196F3 0%, #1565C0 100%)' },
        { title: '🔄 Most Resubmissions', value: stats?.resubmissionPlayersFormatted || (stats?.resubmissionPlayers && stats.resubmissionPlayers.length ? stats.resubmissionPlayers.map(s => `${s.name} (${s.count})`).join(', ') : 'N/A'), icon: RepeatIcon, gradient: 'linear-gradient(135deg, #FF9800 0%, #EF6C00 100%)' },
        { title: '⏰ Earliest Weekly Submitter', value: stats?.earliestSubmittersFormatted || formatLeadFallback(stats?.earliestSubmitters) || 'N/A', icon: PeopleIcon, gradient: 'linear-gradient(135deg, #00BCD4 0%, #0097A7 100%)' },
        { title: '⏱️ Last Minute Weekly Submitter', value: stats?.latestSubmittersFormatted || formatLeadFallback(stats?.latestSubmitters) || 'N/A', icon: PeopleIcon, gradient: 'linear-gradient(135deg, #607D8B 0%, #455A64 100%)' },
        { title: '❗ Most Incorrect Predictions', value: (() => { const list = stats?.mostIncorrectPlayers || (stats?.mostIncorrectPlayer ? [stats.mostIncorrectPlayer] : []); return list.length ? `${fmtNames(list)} — ${list[0].challengeIncorrectCount || 0} wrong` : 'N/A'; })(), icon: ErrorOutlineIcon, gradient: 'linear-gradient(135deg, #AB47BC 0%, #7B1FA2 100%)' },
        { title: '💀 Worst Single Prediction', value: worstFmt || 'N/A', icon: ErrorOutlineIcon, gradient: 'linear-gradient(135deg, #8E24AA 0%, #6A1B9A 100%)' }
    ];

    return (
        <Box sx={{ 
            minHeight: '100vh',
            p: { xs: 2, md: 4 },
            position: 'relative',
            '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'radial-gradient(circle at 20% 50%, rgba(233, 30, 99, 0.05) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(156, 39, 176, 0.05) 0%, transparent 50%)',
                pointerEvents: 'none'
            }
        }}>
            <Typography variant="h5" sx={{     margin: 0,
                marginBottom: 6,
                fontSize: '1.5rem',
                fontWeight: 700,
                background: 'linear-gradient(135deg, #FF1493 0%, #9B30FF 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
            }}>Seasonal stats</Typography>

            {/* Weekly Point Changes */}
            {(leagueData?.lgChallengeWinners && leagueData.lgChallengeWinners.length >= 2) && (
                <Card sx={{ 
                    mb: 4, 
                    background: '#ffffff',
                    backdropFilter: 'blur(10px)',
                    border: '2px solid rgba(233, 30, 99, 0.15)',
                    borderRadius: 3,
                    boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
                }}>
                    <CardContent sx={{ p: 3 }}>
                        <Typography variant="h5" sx={{ 
                            fontWeight: 800, 
                            mb: 3,
                            background: 'linear-gradient(135deg, #E91E63 0%, #9C27B0 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent'
                        }}>
                                💫 Weekly Point Changes
                        </Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            {stats?.weeklyPointChanges && stats.weeklyPointChanges.length > 0 ? (
                                stats.weeklyPointChanges.slice().sort((a,b) => {
                                    const ar = (a.afterRank == null) ? 9999 : Number(a.afterRank);
                                    const br = (b.afterRank == null) ? 9999 : Number(b.afterRank);
                                    return ar - br;
                                }).map((w, idx) => {
                                    const deltaPts = (w.after || 0) - (w.before || 0);
                                    const rankChange = Number(w.rankChange || 0);
                                    const afterRank = w.afterRank != null ? w.afterRank : '-';
                                    return (
                                        <Box key={w.id || w.name} sx={{ 
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            gap: 2,
                                            p: 2,
                                            borderRadius: 2,
                                            background: idx % 2 === 0 ? 'rgba(233, 30, 99, 0.04)' : 'transparent',
                                            transition: 'all 0.3s ease',
                                            flexWrap: { xs: 'wrap', md: 'nowrap' },
                                            '&:hover': {
                                                background: 'rgba(233, 30, 99, 0.08)',
                                                transform: 'translateX(8px)'
                                            }
                                        }}>
                                            <Box sx={{ 
                                                width: { xs: 44, sm: 50 },
                                                minWidth: { xs: 44, sm: 50 },
                                                height: { xs: 44, sm: 50 },
                                                minHeight: { xs: 44, sm: 50 },
                                                flex: '0 0 auto',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                borderRadius: '50%',
                                                aspectRatio: '1/1',
                                                background: afterRank === 1 ? 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)' : 
                                                    afterRank === 2 ? 'linear-gradient(135deg, #C0C0C0 0%, #A8A8A8 100%)' :
                                                        afterRank === 3 ? 'linear-gradient(135deg, #CD7F32 0%, #B87333 100%)' :
                                                            '#FF1493',
                                                fontWeight: 900,
                                                fontSize: { xs: '1.1rem', sm: '1.5rem' },
                                                lineHeight: 1,
                                                color: 'white',
                                                boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
                                            }}>
                                                {afterRank}
                                            </Box>
                                            <Box sx={{ flex: 1 }}>
                                                <Typography variant="body1" sx={{ fontWeight: 700, color: '#1a1a2e' }}>
                                                    {w.name}
                                                </Typography>
                                                <Typography variant="caption" sx={{ color: '#5a6c7d' }}>
                                                    {`${w.before} → ${w.after} pts`}
                                                </Typography>
                                            </Box>
                                            <Tooltip title={`${rankChange > 0 ? '+' : ''}${rankChange} spots`} arrow>
                                                <Chip
                                                    size="small"
                                                    icon={rankChange > 0 ? <ArrowUpwardIcon sx={{ color: 'white !important' }} /> : 
                                                        rankChange < 0 ? <ArrowDownwardIcon sx={{ color: 'white !important' }} /> : null}
                                                    label={<Box sx={{ whiteSpace: 'normal', lineHeight: 1.1, textAlign: { xs: 'center', sm: 'left' } }}>{`${rankChange > 0 ? '+' : ''}${rankChange} spots`}</Box>}
                                                    sx={{
                                                        bgcolor: rankChange > 0 ? '#00C853' : rankChange < 0 ? '#D32F2F' : '#9B30FF',
                                                        color: 'white',
                                                        fontWeight: 700,
                                                        boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                                                        width: { xs: '100%', sm: 'auto' },
                                                        minWidth: { xs: '0px', sm: 96 },
                                                        mt: { xs: 1, sm: 0 },
                                                        justifyContent: 'center'
                                                    }}
                                                />
                                            </Tooltip>
                                        </Box>
                                    );
                                })
                            ) : (
                                <Typography variant="body2" sx={{ color: '#5a6c7d' }}>No weekly changes available.</Typography>
                            )}
                        </Box>
                    </CardContent>
                </Card>
            )}
            {/* Stats Grid */}
            <Grid container spacing={3}>
                {(() => {
                    const isLeagueDone = Boolean(
                        leagueData?.lgFinished === 'finished'
                    );
                    const cleaned = statCards.map((s, i) => ({ ...s, _idx: i })).filter(s => {
                        const v = s.value;
                        if (v == null) return false;
                        if (typeof v === 'string') {
                            const t = v.trim().toLowerCase();
                            if (!t) return false;
                            if (t === 'n/a' || t === 'none' || t === '0' || t === '-' || t === 'na') return false;
                            return true;
                        }
                        if (typeof v === 'number') return v !== 0;
                        if (Array.isArray(v)) return v.length > 0;
                        return Boolean(v);
                    }).filter(s => {
                        // Always hide active/running streak card when the league is finished
                        if (isLeagueDone && s.title && /active streak/i.test(String(s.title))) return false;
                        return (s._idx < 4) || isLeagueDone;
                    });
                    return cleaned.map((s, idx) => (
                        <Grid item xs={12} sm={6} md={4} key={s.title}>
                            <Card
                                sx={{
                                    height: '100%',
                                    cursor: 'pointer',
                                    background: s.gradient,
                                    borderRadius: 3,
                                    position: 'relative',
                                    overflow: 'hidden',
                                    transition: 'all 0.3s ease',
                                    boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
                                    '&:hover': {
                                        transform: 'translateY(-8px) scale(1.02)',
                                        boxShadow: '0 16px 48px rgba(0,0,0,0.4)'
                                    },
                                    '&::before': {
                                        content: '""',
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        right: 0,
                                        bottom: 0,
                                        background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 100%)',
                                        pointerEvents: 'none'
                                    }
                                }}
                                onClick={(e) => {
                                // prepare popover details based on stat type
                                    const title = s.title;
                                    let items = [];
                                    try {
                                        if (title.includes('Best Ranking')) {
                                            const ranked = (playersData || []).map(p => ({ name: p.plName || 'Player', pts: Number(calculatePoints(p, leagueData) || 0) }));
                                            items = ranked.sort((a,b)=>b.pts - a.pts).slice(0,6).map(r => `${r.name} — ${r.pts} pts`);
                                        } else if (title.includes('Most Maxi Challenge Wins')) {
                                            items = (stats?.players || []).slice().sort((a,b) => (b.challengeCorrectCount || 0) - (a.challengeCorrectCount || 0)).slice(0,6).map(p => `${p.plName || 'Player'} — ${p.challengeCorrectCount || 0} wins`);
                                        } else if (title.includes('Most Incorrect')) {
                                            items = (stats?.players || []).slice().sort((a,b) => (b.challengeIncorrectCount || 0) - (a.challengeIncorrectCount || 0)).slice(0,6).map(p => `${p.plName || 'Player'} — ${p.challengeIncorrectCount || 0} wrong`);
                                        } else if (title.includes('Longest Maxi Challenge Streak')) {
                                            items = (stats?.players || []).slice().sort((a,b) => (b.longestChallengeStreak || 0) - (a.longestChallengeStreak || 0)).slice(0,6).map(p => `${p.plName || 'Player'} — ${p.longestChallengeStreak || 0}`);
                                        } else if (title.includes('Top Bonus')) {
                                            items = (stats?.players || []).slice().sort((a,b) => (b.bonusPoints || 0) - (a.bonusPoints || 0)).slice(0,6).map(p => `${p.plName || 'Player'} — ${p.bonusPoints || 0} pts`);
                                        } else if (title.includes('Best Swap')) {
                                            items = (stats?.bestSwapPlayers || (stats?.bestSwap ? [stats.bestSwap] : [])).slice(0,6).map(p => `${p.playerName} — ${p.gain} pts (${p.swap})`);
                                        } else if (title.includes('Earliest Weekly')) {
                                            items = (stats?.earliestSubmitters || []).slice(0,6).map(s => `${s.name} — avg lead ${humanizeMs(s.avgLead)} over ${s.weeks} weeks`);
                                        } else if (title.includes('Latest Weekly')) {
                                            items = (stats?.latestSubmitters || []).slice(0,6).map(s => `${s.name} — avg lead ${humanizeMs(s.avgLead)} over ${s.weeks} weeks`);
                                        } else if (title.includes('Resubmissions')) {
                                            items = (stats?.resubmissionPlayers || []).slice(0,6).map(s => `${s.name} — ${s.count} resubmissions`);
                                        } else if (typeof s.value === 'string' && s.value && s.value !== 'N/A') {
                                            items = [s.value];
                                        }
                                    } catch (err) { items = [s.value]; }
                                    setPopoverContent({ title, items });
                                    setAnchorEl(e.currentTarget);
                                }}
                            >
                                <CardContent sx={{ position: 'relative', zIndex: 1 }}>
                                    <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                                        <Avatar sx={{ 
                                            bgcolor: 'rgba(255,255,255,0.3)', 
                                            width: 56, 
                                            height: 56,
                                            boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                                        }}>
                                            {s.icon && <s.icon sx={{ fontSize: 32, color: 'white' }} />}
                                        </Avatar>
                                        <Typography variant="h6" sx={{ 
                                            fontWeight: 800, 
                                            color: 'white',
                                            textShadow: '0 2px 8px rgba(0,0,0,0.3)',
                                            flex: 1,
                                            fontSize: { xs: '0.95rem', sm: '1.1rem' }
                                        }}>
                                            {s.title}
                                        </Typography>
                                    </Stack>
                                    <Tooltip title={s.hint || s.value} arrow>
                                        <Typography variant="body1" sx={{ 
                                            color: 'white',
                                            fontWeight: 600,
                                            fontSize: '1rem',
                                            textShadow: '0 2px 4px rgba(0,0,0,0.2)',
                                            lineHeight: 1.4,
                                            wordBreak: 'break-word'
                                        }}>
                                            {s.value}
                                        </Typography>
                                    </Tooltip>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))
                })()}
            </Grid>

            {/* Chart */}
            {chart && (
                <Card sx={{ 
                    mt: 4,
                    background: 'linear-gradient(135deg, rgba(233, 30, 99, 0.1) 0%, rgba(156, 39, 176, 0.1) 100%)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 3,
                    boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
                }}>
                    <CardContent sx={{ p: 3 }}>
                        <Typography variant="h5" sx={{ 
                            fontWeight: 800, 
                            mb: 3,
                            background: 'linear-gradient(135deg, #E91E63 0%, #9C27B0 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent'
                        }}>
                            📈 Points Over Time
                        </Typography>
                        {chart}
                    </CardContent>
                </Card>
            )}

            {/* Popover */}
            <Popover
                open={Boolean(anchorEl)}
                anchorEl={anchorEl}
                onClose={() => setAnchorEl(null)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                transformOrigin={{ vertical: 'top', horizontal: 'center' }}
            >
                <Box sx={{ 
                    width: 350, 
                    p: 2,
                    background: '#ffffff',
                    border: '2px solid rgba(233, 30, 99, 0.2)'
                }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography sx={{ 
                            fontWeight: 800,
                            color: '#1a1a2e',
                            fontSize: '1.1rem'
                        }}>
                            {popoverContent.title}
                        </Typography>
                        <IconButton size="small" onClick={() => setAnchorEl(null)} sx={{ color: '#1a1a2e' }}>
                            <CloseIcon fontSize="small" />
                        </IconButton>
                    </Box>
                    <List dense>
                        {popoverContent.items && popoverContent.items.length > 0 ? 
                            popoverContent.items.map((it, i) => (
                                <ListItem key={i}>
                                    <ListItemText 
                                        primary={it} 
                                        sx={{ 
                                            '& .MuiListItemText-primary': { 
                                                color: '#1a1a2e',
                                                fontSize: '0.95rem'
                                            } 
                                        }} 
                                    />
                                </ListItem>
                            )) : 
                            <ListItem>
                                <ListItemText 
                                    primary="No details available." 
                                    sx={{ 
                                        '& .MuiListItemText-primary': { 
                                            color: '#1a1a2e' 
                                        } 
                                    }} 
                                />
                            </ListItem>
                        }
                    </List>
                </Box>
            </Popover>
        </Box>
    );
}