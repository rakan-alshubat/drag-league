import React, { useMemo } from 'react';
import { useTheme, useMediaQuery } from '@mui/material';
import calculatePoints from '../../helpers/calculatePoints';
import { BarChart } from '@mui/x-charts/BarChart';
import {
    everyoneZeroMessage,
    customLabelRow,
    customLabelItem,
    customLabelText,
    topLabelRow,
    topLabelItem,
    topLabelText,
} from './PlayerRankings.styles';

export default function PlayerRankings(props) {
    const data = useMemo(() => {
        const players = props.playersData || [];
        const gameData = props.leagueData || {};
        return players.map((p) => {
            let pts = calculatePoints(p, gameData);
            if (typeof pts !== 'number' || isNaN(pts)) pts = 0;
            return {
                id: p.id || p.playerId || p.name,
                name: p.plName || '',
                points: pts,
            };
        });
    }, [props.playersData, props.leagueData]);

    const allPointsAreZero = useMemo(() => {
        if (!Array.isArray(data) || data.length === 0) return true;
        return data.every((d) => Number(d.points || 0) === 0);
    }, [data]);

    const VISUAL_POWER = 1.5;

    const podiumData = useMemo(() => {
        const sorted = [...data].sort((a, b) => b.points - a.points);

        const joinNames = (names = []) => {
            if (!names || names.length === 0) return '';
            if (names.length === 1) return names[0];
            if (names.length === 2) return `${names[0]} & ${names[1]}`;
            return `${names.slice(0, -1).join(', ')} & ${names[names.length - 1]}`;
        };

        const uniquePoints = Array.from(new Set(sorted.map((p) => p.points)));
        const topPointVals = uniquePoints.slice(0, 3);
        const groups = topPointVals.map((pts) => sorted.filter((p) => p.points === pts));
        while (groups.length < 3) groups.push([]);
        const orderedGroups = [groups[2] || [], groups[0] || [], groups[1] || []];

        return orderedGroups.map((group, idx) => {
            const names = group.map((p) => p.name);
            const ids = group.map((p) => p.id).join('-');
            const points = group.length > 0 ? group[0].points : 0;
            const full = joinNames(names);
            return {
                playerFullName: full || '',
                playerDisplay: full || '',
                totalPoints: points,
                visualPoints: Math.pow(points || 0, VISUAL_POWER),
                id: ids || `empty-${idx}`,
            };
        });
    }, [data]);

    const bottomPlayers = useMemo(() => {
        const sorted = [...data].sort((a, b) => b.points - a.points);
        // prevent names that appear in the podium from repeating in the bottom list
        const podiumNamesSet = new Set(
            (podiumData || []).flatMap((d) => {
                const raw = d.playerFullName || '';
                return raw.split(/\s*(?:\||,|&|and)\s*/i).map((s) => s.trim()).filter(Boolean);
            })
        );

        const rest = sorted.filter((p) => !podiumNamesSet.has(p.name));
        const truncateEnd = (str = '', max = 18) => {
            if (!str) return '';
            if (str.length <= max) return str;
            return `${str.slice(0, max)}...`;
        };

        return rest.map((p) => ({
            playerName: p.name,
            playerFullName: p.name,
            playerNameShort: truncateEnd(p.name, 18),
            playerNameShortMobile: truncateEnd(p.name, 12),
            totalPoints: p.points,
            visualPoints: Math.pow(p.points || 0, VISUAL_POWER),
            id: p.id,
        }));
    }, [data, podiumData]);

    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const bottomPlayersChartHeight = Math.max(300, Math.min(1200, bottomPlayers.length * 96));
    const mobileBottomChartHeight = Math.max(240, Math.min(800, bottomPlayers.length * 64));
    const bottomChartLeftMargin = isMobile ? 96 : 200;
    const bottomChartHeight = isMobile ? mobileBottomChartHeight : bottomPlayersChartHeight;
    const shouldShowBottomChart = (data || []).length > 3;

    // render a group of small stars randomly scattered across a broader podium area
    // spreadX/spreadY are percentages for horizontal/vertical spread around the base point
    const renderStarsFor = (baseLeftPct, baseBottomPct, count = 8, delayBase = 0, spreadX = 20, spreadY = 36) => {
        return Array.from({ length: count }).map((_, i) => {
            // position as percentages so stars can cover the whole podium area
            const leftPct = baseLeftPct + (Math.random() * 2 - 1) * spreadX; // e.g., ±20%
            const bottomPct = baseBottomPct + (Math.random() * 2 - 1) * spreadY; // e.g., ±36%
            const left = `${Math.max(0, Math.min(100, leftPct))}%`;
            const bottom = `${Math.max(0, Math.min(100, bottomPct))}%`;
            const size = Math.round(5 + Math.random() * 8); // 5-13px
            const delay = `${Math.round(Math.random() * 800 + delayBase)}ms`;
            return (
                <div
                    key={`star-${baseLeftPct}-${i}-${delay}`}
                    style={{
                        position: 'absolute',
                        left,
                        bottom,
                        width: size,
                        height: size,
                        opacity: 0,
                        transformOrigin: 'center',
                        animation: `starPop 1800ms ease-in-out ${delay} infinite`,
                        pointerEvents: 'none',
                    }}
                >
                    <svg viewBox="0 0 20 20" width={size} height={size} style={{ display: 'block' }}>
                        <use href="#star" fill="rgba(255,255,255,0.92)" />
                    </svg>
                </div>
            );
        });
    };

    return (
        <div>
            {allPointsAreZero ? (
                <div style={everyoneZeroMessage}>
                    All players currently have zero points. Rankings will be available once points are
                    earned.
                </div>
            ) : (
                <div>
                    <div style={topLabelRow}>
                        {podiumData.map((d, i) => {
                            const label = i === 0 ? '3rd' : i === 1 ? '1st' : '2nd';
                            const emoji = i === 1 ? '🥇' : i === 2 ? '🥈' : '🥉';
                            return (
                                <div key={`top-label-${d.id || i}`} style={topLabelItem}>
                                    <div style={{ textAlign: 'center' }}>
                                        <div
                                            style={{
                                                fontSize: 36,
                                                lineHeight: 1,
                                                filter: "drop-shadow(0 6px 18px rgba(155,48,255,0.2))",
                                            }}
                                        >
                                            {emoji}
                                        </div>
                                        <div style={topLabelText}>{label}</div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div style={{ position: 'relative' }}>
                        {/* pulsing glow + star-pop overlay for top-3 podium */}
                        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 30 }}>
                            <style>{`
                                    @keyframes pulseGlow {
                                        0% { transform: scale(0.96); opacity: 0.6 }
                                        50% { transform: scale(1.06); opacity: 1 }
                                        100% { transform: scale(0.96); opacity: 0.6 }
                                    }
                                    @keyframes starPop {
                                        0% { transform: scale(0.6) translateY(0); opacity: 0 }
                                        30% { transform: scale(1.05) translateY(-6px); opacity: 1 }
                                        100% { transform: scale(0.85) translateY(-14px); opacity: 0 }
                                    }
                                `}</style>

                            {/* subtle dotted glitter base for texture */}
                            <div style={{
                                position: 'absolute',
                                inset: 0,
                                backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.95) 1px, rgba(255,255,255,0.12) 2px, transparent 3px), radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 2px)',
                                backgroundSize: '18px 18px, 36px 36px',
                                mixBlendMode: 'screen',
                                opacity: 0.18,
                            }} />

                            {/* left (bronze) pulsing glow */}
                            <div style={{
                                position: 'absolute',
                                left: '16%',
                                bottom: '24%',
                                width: 120,
                                height: 120,
                                borderRadius: '50%',
                                background: 'radial-gradient(circle, rgba(205,127,50,0.22), rgba(205,127,50,0.06) 40%, transparent 60%)',
                                filter: 'blur(14px)',
                                animation: 'pulseGlow 2600ms ease-in-out infinite'
                            }} />

                            {/* center (gold) pulsing glow */}
                            <div style={{
                                position: 'absolute',
                                left: '48%',
                                bottom: '30%',
                                width: 160,
                                height: 160,
                                borderRadius: '50%',
                                background: 'radial-gradient(circle, rgba(255,215,0,0.28), rgba(255,215,0,0.08) 40%, transparent 60%)',
                                filter: 'blur(16px)',
                                animation: 'pulseGlow 3000ms ease-in-out 120ms infinite'
                            }} />

                            {/* right (silver) pulsing glow */}
                            <div style={{
                                position: 'absolute',
                                left: '80%',
                                bottom: '26%',
                                width: 110,
                                height: 110,
                                borderRadius: '50%',
                                background: 'radial-gradient(circle, rgba(192,192,192,0.2), rgba(192,192,192,0.06) 40%, transparent 60%)',
                                filter: 'blur(13px)',
                                animation: 'pulseGlow 2400ms ease-in-out 200ms infinite'
                            }} />

                            {/* subtle star pops (SVG) above each glow, staggered */}
                            <svg width="0" height="0" style={{ position: 'absolute' }}>
                                <defs>
                                    <g id="star" fill="white">
                                        <path d="M10 0 L12.4 6.8 L19.5 7.2 L13.8 11.6 L15.6 18.4 L10 14.2 L4.4 18.4 L6.2 11.6 L0.5 7.2 L7.6 6.8 Z" />
                                    </g>
                                </defs>
                            </svg>

                            {/* randomized star groups for each podium */}
                            {renderStarsFor(18, 46, 10, 0)}
                            {renderStarsFor(50, 54, 12, 80)}
                            {renderStarsFor(82, 48, 9, 180)}
                        </div>

                        <BarChart
                            dataset={podiumData}
                            xAxis={[
                                {
                                    scaleType: 'band',
                                    dataKey: 'playerFullName',
                                    tickFontSize: 24,
                                    colorMap: { type: 'ordinal', colors: ['#CD7F32', '#FFD700', '#C0C0C0'] },
                                },
                            ]}
                            yAxis={[
                                {
                                    label: 'RuPeter Badges',
                                    disableLine: true,
                                    disableTicks: true,
                                    labelFontSize: 20,
                                },
                            ]}
                            series={[{ dataKey: 'totalPoints', color: theme.palette.primary.main }]}
                            barLabel="value"
                            borderRadius={19}
                            height={520}
                            sx={{
                                pointerEvents: isMobile ? 'none' : 'auto',
                                '& .MuiChartsAxis-left .MuiChartsAxis-tickLabel': { display: 'none' },
                                '& .MuiChartsAxis-bottom .MuiChartsAxis-tickLabel': { display: 'none' },
                                '& .MuiCharts-root': { paddingBottom: 6 },
                                '& .MuiChartsBar-barLabel': { fontWeight: 800, fontSize: 14, fill: '#111' },
                                '& .MuiChartsAxis-tickContainer .MuiChartsAxis-tickLabel': {},
                                '& .MuiChartsAxis-bottom .MuiChartsAxis-line': { stroke: '#0000FF', strokeWidth: 0.4 },
                                '& .MuiChartsAxis-left .MuiChartsAxis-line': { stroke: '#00000FF', strokeWidth: 0.4 },
                                '& .MuiChartsAxis-left .MuiChartsAxis-label': {
                                    fill: theme.palette.primary.main,
                                    fontFamily: theme.typography.fontFamily,
                                    fontSize: 36,
                                    fontWeight: 900,
                                    letterSpacing: '2px',
                                    paintOrder: 'stroke fill',
                                    stroke: 'rgba(0,0,0,0.12)',
                                    strokeWidth: 4,
                                    filter: 'drop-shadow(0 10px 30px rgba(155,48,255,0.18))',
                                },
                                '@keyframes podiumPop': {
                                    '0%': { transform: 'scaleY(0.25)' },
                                    '60%': { transform: 'scaleY(1.08)' },
                                    '100%': { transform: 'scaleY(1)' },
                                },
                                '& .MuiChartsBar-root .MuiChartsBar-bar:nth-of-type(1) rect': {
                                    fill: '#CD7F32',
                                    transformOrigin: 'bottom',
                                    animation: 'podiumPop 900ms ease',
                                    filter: "drop-shadow(0 6px 18px rgba(205,127,50,0.25))",
                                },
                                '& .MuiChartsBar-root .MuiChartsBar-bar:nth-of-type(2) rect': {
                                    fill: '#FFD700',
     
                                    transformOrigin: 'bottom',
                                    animation: 'podiumPop 1000ms ease 100ms',
                                    filter: "drop-shadow(0 10px 30px rgba(255,215,0,0.35))",
                                },
                                '& .MuiChartsBar-root .MuiChartsBar-bar:nth-of-type(3) rect': {
                                    fill: '#C0C0C0',
                                    transformOrigin: 'bottom',
                                    animation: 'podiumPop 900ms ease 180ms',
                                    filter: "drop-shadow(0 6px 18px rgba(192,192,192,0.22))",
                                },
                                // ensure podium / player names use the site font
                                '& .MuiChartsAxis-bottom .MuiChartsAxis-tickLabel, & .MuiChartsAxis-bottom .MuiChartsAxis-tickLabel *': {
                                    fontFamily: theme.typography.fontFamily,
                                },
                            }}
                        />

                        <div style={customLabelRow}>
                            {podiumData.map((d, i) => {
                                const podiumColors = ['#CD7F32', '#FFD700', '#C0C0C0'];
                                const podiumShadows = ['rgba(205,127,50,0.16)', 'rgba(255,215,0,0.16)', 'rgba(192,192,192,0.12)'];
                                const color = podiumColors[i] || theme.palette.primary.main;
                                const shadow = podiumShadows[i] || 'rgba(155,48,255,0.12)';
                                return (
                                    <div key={d.id} style={customLabelItem} title={d.playerFullName}>
                                        <div style={{
                                            ...customLabelText,
                                            fontWeight: 800,
                                            color,
                                            textShadow: `0 6px 18px ${shadow}`,
                                        }}>{d.playerDisplay}</div>
                                    </div>
                                );
                            })}
                        </div>

                        {shouldShowBottomChart && (
                            <BarChart
                                dataset={bottomPlayers}
                                layout="horizontal"
                                margin={{ left: bottomChartLeftMargin }}
                                yAxis={[
                                    {
                                        scaleType: 'band',
                                        dataKey: isMobile ? 'playerNameShortMobile' : 'playerNameShort',
                                        tickLabelStyle: isMobile ? { angle: 0, fontSize: 12, textAnchor: 'end', maxWidth: 120 } : { angle: 0, fontSize: 16, textAnchor: 'end', maxWidth: 220 },
                                        tickLabelProps: { style: { whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: isMobile ? 120 : 220 } },

                                    },
                                ]}
                                series={[{ dataKey: 'totalPoints', color: theme.palette.primary.main }]}
                                barLabel={(v) => `${v.value}`}
                                height={bottomChartHeight}
                                sx={{
                                    pointerEvents: isMobile ? 'none' : 'auto',
                                    '& .MuiCharts-root, & .MuiCharts-root *': {
                                        pointerEvents: isMobile ? 'none' : 'auto',
                                    },
                                    '& svg': { pointerEvents: isMobile ? 'none' : 'auto' },
                                    '& .MuiChartsAxis-left .MuiChartsAxis-tickLabel': {
                                        transform: isMobile ? 'translateX(-8px)' : 'translateX(-12px)',
                                        whiteSpace: 'normal',
                                        wordWrap: 'break-word',
                                        maxWidth: isMobile ? '120px' : '220px',
                                        fontSize: isMobile ? '12px' : '16px',
                                        fontFamily: theme.typography.fontFamily,
                                        fontWeight: 700,
                                        fill: theme.palette.primary.main,
                                        paintOrder: 'stroke fill',
                                        // subtle glow consistent with podium visuals
                                        textShadow: '0 6px 18px rgba(155,48,255,0.12)',
                                    },
                                    '& .MuiChartsBar-barLabel': { fontWeight: 700, fontSize: 14, fill: '#111' },
                                    '& .MuiChartsBar-root': { gap: 8 },
                                    // apply site colors to bottom bars
                                    '& .MuiChartsBar-root .MuiChartsBar-bar rect': {
                                        fill: theme.palette.primary.main,
                                        transition: 'fill 220ms ease',
                                        filter: 'drop-shadow(0 6px 14px rgba(255,20,147,0.18))',
                                    },
                                    '& .MuiChartsBar-root .MuiChartsBar-bar:hover rect': {
                                        fill: theme.palette.secondary.main,
                                        filter: 'drop-shadow(0 10px 24px rgba(255,215,0,0.18))',
                                    },
                                }}
                            />
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}