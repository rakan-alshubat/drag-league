// ...existing code...
import React from 'react';
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
} from './SeasonInfo.styles';

export default function SeasonInfo(props) {
    const { leagueData } = props;

    const eliminated = Array.isArray(leagueData?.lgEliminatedPlayers) ? leagueData.lgEliminatedPlayers : [];
    const challengeWinners = Array.isArray(leagueData?.lgChallengeWinners) ? leagueData.lgChallengeWinners : [];
    const lipSyncWinners = Array.isArray(leagueData?.lgLipSyncWinners) ? leagueData.lgLipSyncWinners : [];

    return (
        <Root>
            <Title variant="h5">Season Info</Title>

            <List>
                <StyledAccordion disableGutters>
                    <StyledSummary expandIcon={<ExpandMoreIcon />}>
                        <SummaryText>Eliminated Players ({eliminated.length})</SummaryText>
                    </StyledSummary>
                    <StyledDetails>
                        {eliminated.length > 0 ? (
                            <ul style={{ margin: 0, paddingLeft: 20 }}>
                                {eliminated.map((name, i) => (
                                    <li key={i}>
                                        <Typography component="span">Episode {i + 1}: {name}</Typography>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <Typography variant="body2" color="text.secondary">
                                No eliminated players yet.
                            </Typography>
                        )}
                    </StyledDetails>
                </StyledAccordion>

                <StyledAccordion disableGutters>
                    <StyledSummary expandIcon={<ExpandMoreIcon />}>
                        <SummaryText>Challenge Winners ({challengeWinners.length})</SummaryText>
                    </StyledSummary>
                    <StyledDetails>
                        {challengeWinners.length > 0 ? (
                            <ul style={{ margin: 0, paddingLeft: 20 }}>
                                {challengeWinners.map((name, i) => (
                                    <li key={i}>
                                        <Typography component="span">Episode {i + 1}: {name}</Typography>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <Typography variant="body2" color="text.secondary">
                                No challenge winners yet.
                            </Typography>
                        )}
                    </StyledDetails>
                </StyledAccordion>

                <StyledAccordion disableGutters>
                    <StyledSummary expandIcon={<ExpandMoreIcon />}>
                        <SummaryText>Lip Sync Winners ({lipSyncWinners.length})</SummaryText>
                    </StyledSummary>
                    <StyledDetails>
                        {lipSyncWinners.length > 0 ? (
                            <ul style={{ margin: 0, paddingLeft: 20 }}>
                                {lipSyncWinners.map((name, i) => (
                                    <li key={i}>
                                        <Typography component="span">Episode {i + 1}: {name}</Typography>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <Typography variant="body2" color="text.secondary">
                                No lip sync winners yet.
                            </Typography>
                        )}
                    </StyledDetails>
                </StyledAccordion>
            </List>
        </Root>
    );
}