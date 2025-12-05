// ...existing code...
import React, { useState, useEffect } from "react";
import Typography from '@mui/material/Typography';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import {
    Root,
    Title,
    List,
    StyledAccordion,
    StyledSummary,
    SummaryText,
    StyledDetails,
} from './PlayerSubmissions.styles';

function PlayerItem({ item, leagueData }) {
    const [rankOpen, setRankOpen] = React.useState(false);
    const [winnersOpen, setWinnersOpen] = React.useState(false);
    const [bonusesOpen, setBonusesOpen] = React.useState(false);

    return (
        <StyledAccordion disableGutters>
            <StyledSummary expandIcon={<ExpandMoreIcon />}>
                <SummaryText>{item.plName}</SummaryText>
            </StyledSummary>

            <StyledDetails>
                <Typography>{item.body}</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Additional mock text: Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                </Typography>

                {/* Controlled Rankings accordion */}
                <StyledAccordion
                    sx={{ mt: 1 }}
                    expanded={rankOpen}
                    onChange={(_, isExpanded) => setRankOpen(isExpanded)}
                    disableGutters
                >
                    <StyledSummary expandIcon={<ExpandMoreIcon />}>
                        <SummaryText>Rankings</SummaryText>
                    </StyledSummary>

                    <StyledDetails>
                        {Array.isArray(item.plRankings) && item.plRankings.length > 0 ? (
                            <ol style={{ margin: 0, paddingLeft: 20 }}>
                                {item.plRankings.map((rank, idx) => (
                                    <li key={idx}>
                                        <Typography component="span">{rank}</Typography>
                                    </li>
                                ))}
                            </ol>
                        ) : (
                            <Typography variant="body2" color="text.secondary">
                                No rankings available.
                            </Typography>
                        )}
                    </StyledDetails>
                </StyledAccordion>

                {/* Stack Winners and Bonuses under Rankings */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 12 }}>
                    <StyledAccordion
                        sx={{ width: '100%' }}
                        expanded={winnersOpen}
                        onChange={(_, isExpanded) => setWinnersOpen(isExpanded)}
                        disableGutters
                    >
                        <StyledSummary expandIcon={<ExpandMoreIcon />}>
                            <SummaryText>Winners</SummaryText>
                        </StyledSummary>

                        <StyledDetails>
                            {Array.isArray(item.plWinners) && item.plWinners.length > 0 ? (
                                <ol style={{ margin: 0, paddingLeft: 20 }}>
                                    {item.plWinners.map((w, i) => (
                                        <li key={i}>
                                            <Typography component="span">{w}</Typography>
                                        </li>
                                    ))}
                                </ol>
                            ) : (
                                <Typography variant="body2" color="text.secondary">
                                    No winners available.
                                </Typography>
                            )}
                        </StyledDetails>
                    </StyledAccordion>

                    <StyledAccordion
                        sx={{ width: '100%' }}
                        expanded={bonusesOpen}
                        onChange={(_, isExpanded) => setBonusesOpen(isExpanded)}
                        disableGutters
                    >
                        <StyledSummary expandIcon={<ExpandMoreIcon />}>
                            <SummaryText>Bonuses</SummaryText>
                        </StyledSummary>

                        <StyledDetails>
                            {Array.isArray(item.plBonuses) && item.plBonuses.length > 0 ? (
                                <ol style={{ margin: 0, paddingLeft: 20 }}>
                                    {item.plBonuses.map((b, i) => (
                                        <li key={i}>
                                            <Typography component="span">{b.split('|')[0]}: {b.split('|')[1]}</Typography>
                                        </li>
                                    ))}
                                </ol>
                            ) : (
                                <Typography variant="body2" color="text.secondary">
                                    No bonuses available.
                                </Typography>
                            )}
                        </StyledDetails>
                    </StyledAccordion>
                </div>
            </StyledDetails>
        </StyledAccordion>
    );
}

export default function PlayerSubmissions(props) {
    const Player = props.playersData
    const League = props.leagueData

    const [playersData, setPlayersData] = useState([]);
    const [leagueData, setLeagueData] = useState({});

    useEffect(() => {
        setPlayersData(Player);
        setLeagueData(League);
    }, [Player, League]);

    return (
        <Root>
            <Title variant="h5">Player Submissions</Title>

            <List>
                {playersData?.map((item) => (
                    <PlayerItem key={item.id} item={item} leagueData={leagueData} />
                ))}
            </List>
        </Root>
    );
}