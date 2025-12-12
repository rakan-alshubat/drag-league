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

    console.log('Leagues component - userData:', userData);
    console.log('Leagues component - League:', League);
    console.log('Leagues component - User:', User);
    console.log('Leagues component - AllPlayers:', AllPlayers);
    console.log('Leagues component - Current Player:', Player);

    const [userEmail, setUserEmail] = useState(User?.id || '');
    const [isAdmin, setIsAdmin] = useState(() => {
        if(League?.lgAdmin?.includes(userEmail)){
            return true;
        } else {
            return false;
        }
    });

    const isFinished = League?.lgFinished === 'finished';

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
                <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
                    {League?.lgDeadline && (
                        <Countdown
                            deadline={League.lgDeadline}
                            label="Weekly Picks Deadline"
                            compact={true}
                        />
                    )}
                    {!isFinished && (
                        <>
                            <button
                                onClick={() => { setShowSwapPopup(true); setSwapPopupVersion('Submissions'); }}
                                aria-label="Add"
                                disabled={isDeadlinePassed()}
                                style={{
                                    padding: '8px 12px',
                                    borderRadius: 6,
                                    cursor: isDeadlinePassed() ? 'not-allowed' : 'pointer',
                                    opacity: isDeadlinePassed() ? 0.5 : 1,
                                    background: isDeadlinePassed() ? '#ccc' : ''
                                }}
                                title={isDeadlinePassed() ? 'Deadline has passed - waiting for admin to submit results' : 'Submit your weekly pick'}
                            >
                                Submit your weekly pick
                            </button>
                            {isAdmin && (
                                <button onClick={() => { setShowSwapPopup(true); setSwapPopupVersion('Weekly Results'); }} aria-label="Export" style={{ padding: '8px 12px', borderRadius: 6, cursor: 'pointer' }}>
                                    Submit weekly results
                                </button>
                            )}
                        </>
                    )}
                </div>
            </Header>

            {isFinished && winnerDisplay && (
                <>
                    <div style={{ textAlign: 'center', marginBottom: 8 }}>
                        <WinnerLabel>Season Winner</WinnerLabel>
                    </div>
                    <WinnerBanner>
                        <div style={{
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 16,
                            justifyContent: 'center',
                            transition: 'filter 1200ms ease, opacity 1200ms ease',
                            filter: revealed ? 'none' : 'blur(6px)'
                        }}>
                            <EmojiEventsIcon sx={{ color: '#FFD700', fontSize: { xs: 28, sm: 48 } }} />
                            <WinnerName>{winnerDisplay}</WinnerName>
                        </div>
                        {!revealed && (
                            <RevealButton onClick={() => { setRevealed(true); startConfetti({ persistent: true, duration: 60000 }); }} aria-label="Reveal Winner">Reveal Winner</RevealButton>
                        )}
                    </WinnerBanner>
                </>
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
                    {tabIndex === 0 && <PlayerRankings userData={User} leagueData={League} playersData={AllPlayers} />}
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
                    {tabIndex === 4 && <LeagueSettings userData={User} leagueData={League} playersData={AllPlayers} />}
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