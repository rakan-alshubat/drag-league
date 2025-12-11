import React from "react";
import { useState } from "react";
import PlayerRankings from "../PlayerRankings";
import PlayerSubmissions from "../PlayerSubmissions";
import SeasonInfo from "../SeasonInfo";
import History from "../History";
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
                    {/* Demo: Deadline and buttons are disabled or for show only */}
                    {League?.lgDeadline && (
                        <span style={{ opacity: 0.5 }}>
                            <b>Weekly Picks Deadline:</b> {League.lgDeadline}
                        </span>
                    )}
                    <button disabled style={{ padding: '8px 12px', borderRadius: 6, cursor: 'not-allowed', opacity: 0.5 }}>
                        Submit your weekly pick
                    </button>
                    <button disabled style={{ padding: '8px 12px', borderRadius: 6, cursor: 'not-allowed', opacity: 0.5 }}>
                        Submit weekly results
                    </button>
                </div>
            </Header>

            <TabsContainer
                value={tabIndex}
                onChange={(e, v) => setTabIndex(v)}
                aria-label="Demo Leagues tabs"
                variant="standard"
                TabIndicatorProps={{ style: { display: 'none' } }}
                sx={{
                    '& .MuiTabs-scrollButtons': { display: 'none !important' },
                }}
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
                    {tabIndex === 4 && (
                        <div style={{ opacity: 0.5, textAlign: 'center', padding: 32 }}>
                            <b>League Settings (Demo Only)</b>
                            <div style={{ marginTop: 12 }}>
                                Settings are disabled in demo mode.
                            </div>
                        </div>
                    )}
                </Panel>
            </MainContent>
        </Container>
    );
}
