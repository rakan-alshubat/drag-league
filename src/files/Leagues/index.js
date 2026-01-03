import React, { useState, useEffect, useRef } from "react";
import PlayerRankings from "../PlayerRankings";
import PlayerSubmissions from "../PlayerSubmissions";
import LeagueSettings from "../LeagueSettings";
import SeasonInfo from "../SeasonInfo";
import SubmissionsPopup from '../SubmissionsPopUp';
import Countdown from "../Countdown";
import History from "../History";
import calculatePoints from '../../helpers/calculatePoints';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import { Box, Alert, Typography, Button } from '@mui/material';
import {
    Container,
    Header,
    HeaderTitle,
    HeaderSubtitle,
    TabsContainer,
    StyledTab,
    MainContent,
    Panel,
    WinnerBanner,
    WinnerLabel,
    WinnerName,
    RevealButton,
    EmptyState,
} from "./Leagues.styles";

export default function Leagues({ userData, leagueData, playersData }) {
    const [tabIndex, setTabIndex] = useState(0);
    
    const tabs = ["Player Rankings", "Player Submissions", "Season Info", "History", "League Settings"];

    const [showSwapPopup, setShowSwapPopup] = useState(false);
    const [swapPopupVersion, setSwapPopupVersion] = useState('');

    const League = leagueData
    const User = userData
    const AllPlayers = playersData

    // Find current user's player object
    const Player = AllPlayers?.find(p => p.plEmail?.toLowerCase() === User?.id?.toLowerCase()) || null;

    const isPlayer = !!Player;

    const [userEmail, setUserEmail] = useState(User?.id || '');
    const [isAdmin, setIsAdmin] = useState(() => {
        if(League?.lgAdmin?.includes(userEmail)){
            return true;
        } else {
            return false;
        }
    });

    const isFinished = League?.lgFinished === 'finished';

    // Detect admin edits between previous and current deadline (used to show a banner)
    const adminEditBetweenDeadlines = (() => {
        try {
            const history = League?.lgHistory || [];
            if (!League?.lgDeadline || !history || history.length === 0) return false;

            const currentDeadline = new Date(League.lgDeadline);
            const lastDeadline = new Date(currentDeadline);
            lastDeadline.setDate(lastDeadline.getDate() - 7);

            for (const entry of history) {
                if (!entry || typeof entry !== 'string') continue;
                const parts = entry.split('. ');
                const dateStr = parts[0];
                const text = parts.slice(1).join('. ') || '';
                const parsed = new Date(dateStr);
                if (isNaN(parsed.getTime())) continue;

                if (!text.startsWith('[ADMIN EDIT]')) continue;

                if (parsed > lastDeadline && parsed <= currentDeadline) return true;
            }
        } catch (e) {
            console.warn('Error checking admin edit history:', e);
        }
        return false;
    })();

    // Check for recent announcements or admin edits in the past week
    const recentUpdates = (() => {
        try {
            const history = League?.lgHistory || [];
            if (!history || history.length === 0) return { hasUpdates: false, count: 0, types: [] };

            // Calculate one week ago from deadline, or from today if no deadline
            const endDate = League?.lgDeadline ? new Date(League.lgDeadline) : new Date();
            const startDate = new Date(endDate);
            startDate.setDate(startDate.getDate() - 7);

            let announcementCount = 0;
            let adminEditCount = 0;

            for (const entry of history) {
                if (!entry || typeof entry !== 'string') continue;
                const parts = entry.split('. ');
                const dateStr = parts[0];
                const text = parts.slice(1).join('. ') || '';
                const parsed = new Date(dateStr);
                if (isNaN(parsed.getTime())) continue;

                // Check if entry is within the past week
                if (parsed > startDate && parsed <= endDate) {
                    if (text.startsWith('[ANNOUNCEMENT]')) announcementCount++;
                    if (text.startsWith('[ADMIN EDIT]')) adminEditCount++;
                }
            }

            const totalCount = announcementCount + adminEditCount;
            const types = [];
            if (announcementCount > 0) types.push(`${announcementCount} announcement${announcementCount > 1 ? 's' : ''}`);
            if (adminEditCount > 0) types.push(`${adminEditCount} admin edit${adminEditCount > 1 ? 's' : ''}`);

            return {
                hasUpdates: totalCount > 0,
                count: totalCount,
                types: types,
                announcementCount,
                adminEditCount
            };
        } catch (e) {
            console.warn('Error checking recent updates:', e);
            return { hasUpdates: false, count: 0, types: [] };
        }
    })();

    // compute display name(s) for the season winner(s) by points
    let winnerDisplay = '';
    const playersList = Array.isArray(AllPlayers) ? AllPlayers : [];
    if (playersList.length > 0) {
        const scored = playersList.map(p => {
            let pts = 0;
            try { pts = Number(calculatePoints(p, League) || 0); } catch (e) { pts = 0; }
            return { id: p.id, name: p.plName || p.plEmail || '', points: pts };
        });
        const maxPts = scored.reduce((m, s) => (s.points > m ? s.points : m), -Infinity);
        if (maxPts !== -Infinity && maxPts > 0) {
            const winners = scored.filter(s => s.points === maxPts).map(s => s.name).filter(Boolean);
            if (winners.length > 0) {
                if (winners.length === 1) winnerDisplay = winners[0];
                else if (winners.length === 2) winnerDisplay = `${winners[0]} & ${winners[1]}`;
                else winnerDisplay = `${winners.slice(0, -1).join(', ')} & ${winners[winners.length - 1]}`;
            }
        }
    }
    // fallback to last challenge/elimination if no points available
    if (!winnerDisplay) {
        const challengeArr = League?.lgChallengeWinners || [];
        if (Array.isArray(challengeArr) && challengeArr.length > 0) {
            const lastNonEmpty = [...challengeArr].reverse().find(v => v && v.trim() !== '') || '';
            if (lastNonEmpty) winnerDisplay = String(lastNonEmpty).replace(/\|/g, ' & ');
        }
    }

    const displayLeagueName = (() => {
        let raw = (League?.lgName || '').toString().trim();
        if (!raw) return '';
        // if name does not already contain the word 'league' (anywhere), append it
        if (!/\bleague\b/i.test(raw)) {
            raw = `${raw} league`;
        }
        // if first word is 'the' (case-insensitive), keep as-is; otherwise prefix with 'the '
        return (/^the\b/i.test(raw) ? raw : `the ${raw}`);
    })();
    if (!winnerDisplay) {
        const eliminated = League?.lgEliminatedPlayers || [];
        if (Array.isArray(eliminated) && eliminated.length > 0) {
            const lastElim = eliminated[eliminated.length - 1] || '';
            if (lastElim) winnerDisplay = String(lastElim).replace(/\|/g, ' & ');
        }
    }

    // Check if deadline has passed (for disabling submissions)
    const isDeadlinePassed = () => {
        if (!League?.lgDeadline) return false;
        const deadlineDate = new Date(League.lgDeadline);
        const now = new Date();
        return now >= deadlineDate;
    };

    const [revealed, setRevealed] = useState(false);

    // Confetti refs and helpers
    const confettiRef = useRef({});

    const startConfetti = ({ duration = 4000, persistent = false } = {}) => {
        if (typeof window === 'undefined') return;

        // ensure any previous confetti is cleaned up
        stopConfetti();

        const canvas = document.createElement('canvas');
        canvas.style.position = 'fixed';
        canvas.style.left = '0';
        canvas.style.top = '0';
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        canvas.style.pointerEvents = 'none';
        canvas.style.zIndex = 9999;
        document.body.appendChild(canvas);

        const ctx = canvas.getContext('2d');
        const DPR = window.devicePixelRatio || 1;
        const resize = () => {
            canvas.width = window.innerWidth * DPR;
            canvas.height = window.innerHeight * DPR;
            ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
        };
        resize();
        window.addEventListener('resize', resize);

        const colors = ['#FFD700', '#FF1493', '#9B30FF', '#50C878', '#FF8C00'];
        const particles = [];
        const rand = (min, max) => Math.random() * (max - min) + min;

        const spawn = (count) => {
            for (let i = 0; i < count; i++) {
                particles.push({
                    x: rand(window.innerWidth * 0.2, window.innerWidth * 0.8),
                    y: rand(-20, window.innerHeight * 0.2),
                    vx: rand(-6, 6),
                    vy: rand(-8, -2),
                    size: rand(6, 12),
                    color: colors[Math.floor(rand(0, colors.length))],
                    rot: rand(0, Math.PI * 2),
                    vr: rand(-0.2, 0.2),
                });
            }
        };

        spawn(120);

        let start = performance.now();
        const gravity = 0.18;

        // keep rendering while particles exist or while interval is active
        const render = (now) => {
            const elapsed = now - start;
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            for (let i = particles.length - 1; i >= 0; i--) {
                const p = particles[i];
                p.vy += gravity * (p.size / 8);
                p.x += p.vx;
                p.y += p.vy;
                p.rot += p.vr;

                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.rotate(p.rot);
                ctx.fillStyle = p.color;
                ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
                ctx.restore();

                if (p.y > window.innerHeight + 50 || elapsed > duration + 2000) {
                    particles.splice(i, 1);
                }
            }

            // continue rendering if there are particles or we're still spawning
            if (particles.length > 0 || confettiRef.current.intervalId) {
                confettiRef.current.rafId = requestAnimationFrame(render);
            } else {
                window.removeEventListener('resize', resize);
                if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
            }
        };

        confettiRef.current.canvas = canvas;
        confettiRef.current.rafId = requestAnimationFrame(render);

        // spawn periodic small bursts while running so confetti looks continuous
        const intervalId = setInterval(() => spawn(12), 350);
        confettiRef.current.intervalId = intervalId;

        // schedule auto-stop (stop after duration ms)
        confettiRef.current.timerId = setTimeout(() => {
            stopConfetti();
        }, duration);
    };

    const stopConfetti = () => {
        const ref = confettiRef.current || {};
        if (ref.rafId) cancelAnimationFrame(ref.rafId);
        if (ref.timerId) clearTimeout(ref.timerId);
        if (ref.canvas) {
            try { window.removeEventListener('resize', ref.resize); } catch (e) {}
            if (ref.canvas.parentNode) ref.canvas.parentNode.removeChild(ref.canvas);
        }
        confettiRef.current = {};
    };

    useEffect(() => {
        return () => stopConfetti();
    }, []);

    return (
        <Container>
            <Header>
                <div>
                    <HeaderTitle>{League?.lgName || ''}</HeaderTitle>
                    <HeaderSubtitle>{League?.lgDescription || ''}</HeaderSubtitle>
                </div>
                <div className="headerRight" style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
                    {League?.lgDeadline && (
                        <Countdown
                            deadline={League.lgDeadline}
                            label="Weekly Picks Deadline"
                            compact={true}
                        />
                    )}
                    {!isFinished && (
                        <>
                            <div className="buttonsRow" style={{ display: 'flex', gap: 8 }}>
                                {isPlayer && (Number(League?.lgChallengePoints || 0) > 0 || (League?.lgSwap && String(League.lgSwap).trim() !== '' && !isDeadlinePassed()) )&& (
                                    (() => {
                                        const swapsEnabled = Boolean(League?.lgSwap && String(League.lgSwap).trim() !== '');
                                        const hasChallengePoints = Number(League?.lgChallengePoints || 0) > 0;
                                        const label = (!hasChallengePoints && swapsEnabled) ? 'Submit swaps' : 'Submit your Maxi Challenge pick';
                                        const title = isDeadlinePassed() ? 'Deadline has passed - waiting for admin to submit results' : label;
                                        return (
                                            <Button
                                                onClick={() => { setShowSwapPopup(true); setSwapPopupVersion('Submissions'); }}
                                                aria-label="submit-weekly"
                                                disabled={isDeadlinePassed()}
                                                variant="contained"
                                                color="primary"
                                                size="small"
                                                title={title}
                                                sx={{
                                                    padding: '6px 12px',
                                                    borderRadius: 2,
                                                    textTransform: 'none',
                                                    fontWeight: 700,
                                                    boxShadow: 'none',
                                                    minWidth: 160,
                                                    backgroundColor: 'primary.main',
                                                    color: 'primary.contrastText',
                                                    '&:hover': { boxShadow: 'none', transform: 'translateY(-1px)' },
                                                    '&.Mui-disabled': { backgroundColor: 'grey.200', color: 'text.disabled' }
                                                }}
                                            >
                                                {title}
                                            </Button>
                                        );
                                    })()
                                )}
                                {isAdmin && (
                                    <Button
                                        onClick={() => { setShowSwapPopup(true); setSwapPopupVersion('Weekly Results'); }}
                                        aria-label="submit-results"
                                        variant="contained"
                                        color="primary"
                                        size="small"
                                        sx={{
                                            padding: '6px 12px',
                                            borderRadius: 2,
                                            textTransform: 'none',
                                            fontWeight: 700,
                                            boxShadow: 'none',
                                            minWidth: 160,
                                            backgroundColor: 'primary.main',
                                            color: 'primary.contrastText',
                                            '&:hover': { boxShadow: 'none', transform: 'translateY(-1px)' }
                                        }}
                                    >
                                        Submit weekly results
                                    </Button>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </Header>

            {adminEditBetweenDeadlines && (
                <Box sx={{ mt: 1, mb: 2 }}>
                    <Alert severity="info">An admin made changes since the last deadline — check the History tab for details.</Alert>
                </Box>
            )}

            {isFinished && winnerDisplay && (
                <>
                    <div style={{ textAlign: 'center', marginBottom: 8 }}>
                        <WinnerLabel>                                   
                            {`The winner of ${displayLeagueName} is...`}
                        </WinnerLabel>
                    </div>
                    <WinnerBanner>
                        <div style={{
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 16,
                            justifyContent: 'center',
                            transition: 'filter 1200ms ease, opacity 1200ms ease',
                            filter: revealed ? 'none' : 'blur(12px)'
                        }}>
                            <EmojiEventsIcon sx={{ color: '#FFD700', fontSize: { xs: 60, sm: 68 } }} />
                            <WinnerName>{winnerDisplay}</WinnerName>
                        </div>
                        {!revealed && (
                            <RevealButton onClick={() => { setRevealed(true); startConfetti({ persistent: true, duration: 60000 }); }} aria-label="Reveal Winner">Reveal Winner</RevealButton>
                        )}
                    </WinnerBanner>
                </>
            )}

            {recentUpdates.hasUpdates && (
                <Box
                    sx={{
                        mt: 2,
                        mb: 2,
                        padding: '16px 20px',
                        borderRadius: '12px',
                        background: 'linear-gradient(135deg, rgba(74, 144, 226, 0.12) 0%, rgba(123, 104, 238, 0.12) 100%)',
                        border: '1px solid rgba(74, 144, 226, 0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2,
                        transition: 'all 0.3s ease',
                        cursor: 'pointer',
                        '&:hover': {
                            background: 'linear-gradient(135deg, rgba(74, 144, 226, 0.18) 0%, rgba(123, 104, 238, 0.18) 100%)',
                            borderColor: 'rgba(74, 144, 226, 0.5)',
                            transform: 'translateY(-2px)',
                            boxShadow: '0 4px 12px rgba(74, 144, 226, 0.2)',
                        }
                    }}
                    onClick={() => setTabIndex(3)}
                >
                    <NotificationsActiveIcon 
                        sx={{ 
                            color: '#4A90E2',
                            fontSize: 28,
                            animation: 'pulse 2s ease-in-out infinite',
                            '@keyframes pulse': {
                                '0%, 100%': { transform: 'scale(1)' },
                                '50%': { transform: 'scale(1.1)' },
                            }
                        }} 
                    />
                    <Box sx={{ flex: 1 }}>
                        <Typography 
                            sx={{ 
                                fontWeight: 700, 
                                color: '#4A90E2',
                                fontSize: '1rem',
                                mb: 0.5
                            }}
                        >
                            Recent Updates
                        </Typography>
                        <Typography 
                            sx={{ 
                                fontSize: '0.9rem', 
                                color: '#555',
                                lineHeight: 1.4
                            }}
                        >
                            {recentUpdates.types.join(' and ')} in the past week. Click to view in History.
                        </Typography>
                    </Box>
                    <Button
                        variant="contained"
                        size="small"
                        sx={{
                            background: 'linear-gradient(135deg, #4A90E2 0%, #7B68EE 100%)',
                            color: 'white',
                            fontWeight: 600,
                            textTransform: 'none',
                            padding: '6px 16px',
                            borderRadius: '8px',
                            boxShadow: 'none',
                            '&:hover': {
                                background: 'linear-gradient(135deg, #3A80D2 0%, #6B58DE 100%)',
                                boxShadow: '0 2px 8px rgba(74, 144, 226, 0.3)',
                            }
                        }}
                    >
                        View History
                    </Button>
                </Box>
            )}

            <TabsContainer
                value={tabIndex}
                onChange={(e, v) => setTabIndex(v)}
                aria-label="Leagues tabs"
                variant="scrollable"
                scrollButtons="auto"
            >
                {tabs.map((t, i) => (
                    <StyledTab key={t} label={t} aria-selected={tabIndex === i} />
                ))}
            </TabsContainer>

            <MainContent>
                <Panel role="tabpanel" hidden={tabIndex !== 0} aria-hidden={tabIndex !== 0}>
                    {tabIndex === 0 && (
                        <div style={{ filter: (isFinished && !revealed) ? 'blur(12px)' : 'none', transition: 'filter 1200ms ease' }}>
                            <PlayerRankings userData={User} leagueData={League} playersData={AllPlayers} />
                        </div>
                    )}
                </Panel>

                <Panel role="tabpanel" hidden={tabIndex !== 1} aria-hidden={tabIndex !== 1}>
                    {tabIndex === 1 && <PlayerSubmissions leagueData={League} playersData={AllPlayers} />}
                </Panel>

                <Panel role="tabpanel" hidden={tabIndex !== 2} aria-hidden={tabIndex !== 2}>
                    {tabIndex === 2 && <SeasonInfo leagueData={League} />}
                </Panel>

                <Panel role="tabpanel" hidden={tabIndex !== 3} aria-hidden={tabIndex !== 3}>
                    {tabIndex === 3 && <History leagueData={League} />}
                </Panel>

                <Panel role="tabpanel" hidden={tabIndex !== 4} aria-hidden={tabIndex !== 4}>
                    {tabIndex === 4 && (
                        isAdmin
                            ? <LeagueSettings userData={User} leagueData={League} playersData={AllPlayers} />
                            : (
                                <EmptyState>
                                    <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary', mb: 1 }}>Admins only</Typography>
                                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>League settings are only visible to admins. Contact an admin to manage this league.</Typography>
                                </EmptyState>
                            )
                    )}
                </Panel>
            </MainContent>

            <SubmissionsPopup
                open={showSwapPopup}
                onClose={() => setShowSwapPopup(false)}
                optionsList={(League?.lgQueenNames && League?.lgQueenNames.length) ? League?.lgQueenNames : ['No options']}
                initialVersion={swapPopupVersion}
                currentPlayerRankings={Player?.plRankings}
                playerData={Player}
                leagueData={{ ...League, players: AllPlayers }}
                userData={User}
            />
        </Container>
    );
}