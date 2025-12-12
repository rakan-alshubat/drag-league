import React from "react";
import { useState } from "react";
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

    // Check if deadline has passed (for disabling submissions)
    const isDeadlinePassed = () => {
        if (!League?.lgDeadline) return false;
        const deadlineDate = new Date(League.lgDeadline);
        const now = new Date();
        return now >= deadlineDate;
    };

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