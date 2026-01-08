import React from "react";
import { useState } from "react";
import PlayerRankings from "../PlayerRankings";
import PlayerSubmissions from "../PlayerSubmissions";
import SeasonInfo from "../SeasonInfo";
import History from "../History";
import SubmissionsPopup from '../SubmissionsPopUp';
import Countdown from "../Countdown";
import calculatePoints from '../../helpers/calculatePoints';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import LeagueSettings from "../LeagueSettings";
import { Box, Alert } from '@mui/material';
import { demoLeagueData, demoPlayersData, demoUserData } from "@/data/demoData";
import {
    Container,
    Header,
    HeaderTitle,
    HeaderSubtitle,
    TabsContainer,
    StyledTab,
    MainContent,
    Panel,
    DemoBanner,
    DemoText,
} from "./DemoLeague.styles";


export default function DemoLeague() {
    const [tabIndex, setTabIndex] = useState(0);
    const tabs = ["Player Rankings", "Player Submissions", "Season Info", "History", "League Settings"];

    const League = demoLeagueData;
    const User = demoUserData;
    const Players = demoPlayersData;
    const AllPlayers = Players || [];

    const Player = AllPlayers?.find(p => p.plEmail?.toLowerCase() === (User?.id || '').toLowerCase()) || null;

    const [showSwapPopup, setShowSwapPopup] = useState(false);
    const [swapPopupVersion, setSwapPopupVersion] = useState('');

    const userEmail = User?.id || '';
    const isAdmin = (League?.lgAdmin || []).includes(userEmail);
    const isFinished = League?.lgFinished === 'finished';

    // detect admin edits between deadlines (demo uses same logic)
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
            return false;
        }
        return false;
    })();

    // compute winner display similar to Leagues
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
    if (!winnerDisplay) {
        const challengeArr = League?.lgChallengeWinners || [];
        if (Array.isArray(challengeArr) && challengeArr.length > 0) {
            const lastNonEmpty = [...challengeArr].reverse().find(v => v && v.trim() !== '') || '';
            if (lastNonEmpty) winnerDisplay = String(lastNonEmpty).replace(/\|/g, ' & ');
        }
    }

    return (
        <Container>
            <DemoBanner>
                <DemoText>
                    🎭 Demo League - This is a sample league to show you how the fantasy league works!
                </DemoText>
            </DemoBanner>

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
                            leagueName={League?.lgName || 'Demo League'}
                            leagueUrl={typeof window !== 'undefined' ? window.location.href : ''}
                        />
                    )}
                    {!isFinished && (
                        <div style={{ display: 'flex', gap: 8 }}>
                            <button
                                onClick={() => { setShowSwapPopup(true); setSwapPopupVersion('Submissions'); }}
                                aria-label="Add"
                                disabled={false}
                                style={{ padding: '8px 12px', borderRadius: 6 }}
                                title={'Submit your weekly pick'}
                            >
                                Submit your weekly pick
                            </button>
                            {isAdmin && (
                                <button onClick={() => { setShowSwapPopup(true); setSwapPopupVersion('Weekly Results'); }} aria-label="Export" style={{ padding: '8px 12px', borderRadius: 6, cursor: 'pointer' }}>
                                    Submit weekly results
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </Header>

            <TabsContainer
                value={tabIndex}
                onChange={(e, v) => setTabIndex(v)}
                aria-label="Demo Leagues tabs"
            >
                {tabs.map((t, i) => (
                    <StyledTab key={t} label={t} aria-selected={tabIndex === i} />
                ))}
            </TabsContainer>

            <MainContent>
                <Panel role="tabpanel" hidden={tabIndex !== 0} aria-hidden={tabIndex !== 0}>
                    {tabIndex === 0 && <PlayerRankings userData={User} leagueData={League} playersData={Players} />}
                </Panel>

                <Panel role="tabpanel" hidden={tabIndex !== 1} aria-hidden={tabIndex !== 1}>
                    {tabIndex === 1 && <PlayerSubmissions leagueData={League} playersData={Players} />}
                </Panel>

                <Panel role="tabpanel" hidden={tabIndex !== 2} aria-hidden={tabIndex !== 2}>
                    {tabIndex === 2 && <SeasonInfo leagueData={League} />}
                </Panel>

                <Panel role="tabpanel" hidden={tabIndex !== 3} aria-hidden={tabIndex !== 3}>
                    {tabIndex === 3 && <History leagueData={League} />}
                </Panel>

                <Panel role="tabpanel" hidden={tabIndex !== 4} aria-hidden={tabIndex !== 4}>
                    {tabIndex === 4 && <LeagueSettings userData={User} leagueData={League} playersData={Players} />}
                </Panel>
            </MainContent>
            
            {adminEditBetweenDeadlines && (
                <Box sx={{ mt: 1, mb: 2 }}>
                    <Alert severity="info">An admin made changes since the last deadline — check the History tab for details.</Alert>
                </Box>
            )}

            {isFinished && winnerDisplay && (
                <>
                    <div style={{ textAlign: 'center', marginBottom: 8 }}>
                        <div style={{ color: '#FF1493', fontWeight: 700 }}>                                    
                            {`The winner of ${League?.lgName || ''} is...`}
                        </div>
                    </div>
                    <div style={{ textAlign: 'center', marginBottom: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'center' }}>
                            <EmojiEventsIcon sx={{ color: '#FFD700', fontSize: { xs: 44, sm: 60 } }} />
                            <div style={{ fontSize: 22, fontWeight: 700 }}>{winnerDisplay}</div>
                        </div>
                    </div>
                </>
            )}

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
