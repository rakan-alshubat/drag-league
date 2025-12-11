import React from "react";
import { useState, useEffect } from "react";
import { generateClient } from 'aws-amplify/api'
import { updateLeague, updatePlayer } from '@/graphql/mutations';
import PlayerRankings from "../PlayerRankings";
import PlayerSubmissions from "../PlayerSubmissions";
import LeagueSettings from "../LeagueSettings";
import SeasonInfo from "../SeasonInfo";
import SubmissionsPopup from '../SubmissionsPopUp';
import Countdown from "../Countdown";
import History from "../History";
import {
    Container,
    Header,
    HeaderTitle,
    HeaderSubtitle,
    TabsContainer,
    StyledTab,
    MainContent,
    Panel,
} from "./Leagues.styles";

const DEADLINE_CHECK_INTERVAL_MS = 60000; // Check deadline every 60 seconds

export default function Leagues( userData, leagueData ) {
    const [tabIndex, setTabIndex] = useState(0);
    const tabs = ["Player Rankings", "Player Submissions", "Season Info", "History", "League Settings"];

    const [showSwapPopup, setShowSwapPopup] = useState(false);
    const [swapPopupVersion, setSwapPopupVersion] = useState('');

    const League = userData.leagueData
    const User = userData.userData
    const Player = userData.playersData

    const client = generateClient();

    const [userEmail, setUserEmail] = useState(User?.id || '');
    const [isAdmin, setIsAdmin] = useState(() => {
        if(League?.lgAdmin?.includes(userEmail)){
            return true;
        } else {
            return false;
        }
    });

    useEffect(() => {
        if (!League?.lgDeadline || !Player || !Array.isArray(Player)) return;
        
        const checkAndProcessDeadline = async () => {
            const deadlineDate = new Date(League.lgDeadline);
            const now = new Date();
            
            if (now >= deadlineDate) {
                try {
                    const nextWeekDeadline = new Date(deadlineDate);
                    nextWeekDeadline.setDate(nextWeekDeadline.getDate() + 7);
                    const newDeadlineISO = nextWeekDeadline.toISOString();
                    
                    const submissions = League.lgSubmissions || [];
                    const submissionMap = {};
                    submissions.forEach(sub => {
                        const parts = sub.split('|').map(s => s.trim());
                        if (parts.length === 2) {
                            const [queenName, userEmail] = parts;
                            submissionMap[userEmail.toLowerCase()] = queenName;
                        }
                    });
                    
                    const updatePromises = Player.map(async (player) => {
                        const playerEmail = player.id.toLowerCase();
                        const submission = submissionMap[playerEmail] || '';
                        const updatedWinners = [...(player.plWinners || []), submission];
                        
                        const playerResult = await client.graphql({
                            query: updatePlayer,
                            variables: {
                                input: {
                                    id: player.id,
                                    leagueId: player.leagueId,
                                    plWinners: updatedWinners
                                }
                            }
                        });
                        console.log('Player weekly submission processed:', playerResult);
                        return playerResult;
                    });
                    
                    await Promise.all(updatePromises);
                    
                    const currentHistory = League.lgHistory || [];
                    const historyEntry = new Date().toISOString() + '. Weekly deadline passed - submissions automatically processed';
                    
                    const leagueResult = await client.graphql({
                        query: updateLeague,
                        variables: {
                            input: {
                                id: League.id,
                                lgDeadline: newDeadlineISO,
                                lgSubmissions: [],
                                lgHistory: [...currentHistory, historyEntry]
                            }
                        }
                    });
                    console.log('League deadline processed:', leagueResult);
                    
                } catch (err) {
                    console.error('Error processing weekly deadline:', err);
                }
            }
        };

        checkAndProcessDeadline();
        const interval = setInterval(checkAndProcessDeadline, DEADLINE_CHECK_INTERVAL_MS);
        
        return () => clearInterval(interval);
    }, [League?.lgDeadline, League?.lgSubmissions, League?.id, Player, client]);

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
                    <button onClick={() => { setShowSwapPopup(true); setSwapPopupVersion('Submissions'); }} aria-label="Add" style={{ padding: '8px 12px', borderRadius: 6, cursor: 'pointer' }}>
                        Submit your weekly pick
                    </button>
                    {isAdmin && (
                        <button onClick={() => { setShowSwapPopup(true); setSwapPopupVersion('Weekly Results'); }} aria-label="Export" style={{ padding: '8px 12px', borderRadius: 6, cursor: 'pointer' }}>
                            Submit weekly results
                        </button>
                    )}
                </div>
            </Header>

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
                    {tabIndex === 0 && <PlayerRankings userData={User} leagueData={League} playersData={Player} />}
                </Panel>

                <Panel role="tabpanel" hidden={tabIndex !== 1} aria-hidden={tabIndex !== 1}>
                    {tabIndex === 1 && <PlayerSubmissions leagueData={League} playersData={Player} />}
                </Panel>

                <Panel role="tabpanel" hidden={tabIndex !== 2} aria-hidden={tabIndex !== 2}>
                    {tabIndex === 2 && <SeasonInfo leagueData={League} />}
                </Panel>

                <Panel role="tabpanel" hidden={tabIndex !== 3} aria-hidden={tabIndex !== 3}>
                    {tabIndex === 3 && <History leagueData={League} />}
                </Panel>

                <Panel role="tabpanel" hidden={tabIndex !== 4} aria-hidden={tabIndex !== 4}>
                    {tabIndex === 4 && <LeagueSettings userData={User} leagueData={League} playersData={Player} />}
                </Panel>
            </MainContent>

            <SubmissionsPopup
                open={showSwapPopup}
                onClose={() => setShowSwapPopup(false)}
                optionsList={(League?.lgQueenNames && League?.lgQueenNames.length) ? League?.lgQueenNames : ['No options']}
                initialVersion={swapPopupVersion}
                currentPlayerRankings={Player?.plRankings}
                playerData={Player}
                leagueData={League}
                userData={User}
            />
        </Container>
    );
}