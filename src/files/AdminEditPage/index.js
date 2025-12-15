import React, { useState } from 'react';
import { useRouter } from 'next/router';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Select,
    MenuItem,
    FormControl,
    Chip,
    IconButton,
    TextField,
    Typography,
    Box,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import { generateClient } from 'aws-amplify/api';
import { updateLeague, updatePlayer } from '@/graphql/mutations';
import {
    Container,
    ContentWrapper,
    Title,
    ChoiceContainer,
    ChoiceCard,
    ChoiceTitle,
    ChoiceDescription,
    BackButton,
    EditorContainer,
    Section,
    SectionTitle,
    EntryRow,
    EntryLabel,
    PlayerListContainer,
    PlayerCard,
    PlayerName,
    ActionButtons,
    ConfirmButton,
    CancelButton,
    SummaryDialog,
    SummarySection,
    SummaryTitle,
    SummaryItem,
    ChangeIndicator,
} from './AdminEditPage.styles';

const client = generateClient();

function getOrdinal(n) {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

export default function AdminEditPage({ leagueData, allPlayers, currentPlayer, userData, onUpdate }) {
    const router = useRouter();
    const [mode, setMode] = useState(null); // 'league' or 'player'
    const [selectedPlayer, setSelectedPlayer] = useState(null);
    const [showSummary, setShowSummary] = useState(false);
    const [changes, setChanges] = useState({});
    const [submitting, setSubmitting] = useState(false);

    // League editing state
    const [editedEliminatedPlayers, setEditedEliminatedPlayers] = useState([]);
    const [editedChallengeWinners, setEditedChallengeWinners] = useState([]);
    const [editedLipSyncWinners, setEditedLipSyncWinners] = useState([]);

    // Player editing state
    const [editedRankings, setEditedRankings] = useState([]);
    const [editedWinners, setEditedWinners] = useState([]);
    const [editedBonuses, setEditedBonuses] = useState([]);

    const allQueens = leagueData?.lgQueenNames || [];

    // Initialize league editing
    const handleEditLeague = () => {
        setEditedEliminatedPlayers([...(leagueData.lgEliminatedPlayers || [])]);
        setEditedChallengeWinners([...(leagueData.lgChallengeWinners || [])]);
        setEditedLipSyncWinners([...(leagueData.lgLipSyncWinners || [])]);
        setMode('league');
    };

    // Initialize player editing
    const handleEditPlayer = (player) => {
        setSelectedPlayer(player);
        setEditedRankings([...(player.plRankings || [])]);
        setEditedWinners([...(player.plWinners || [])]);
        setEditedBonuses([...(player.plBonuses || [])]);
        setMode('player');
    };

    const handleBack = () => {
        setMode(null);
        setSelectedPlayer(null);
        setChanges({});
    };

    // Detect changes for league
    const getLeagueChanges = () => {
        const changes = {};
        
        // Check eliminated players
        const originalEliminated = leagueData.lgEliminatedPlayers || [];
        if (JSON.stringify(originalEliminated) !== JSON.stringify(editedEliminatedPlayers)) {
            changes.eliminatedPlayers = {
                original: originalEliminated,
                new: editedEliminatedPlayers,
            };
        }

        // Check challenge winners
        const originalChallenge = leagueData.lgChallengeWinners || [];
        if (JSON.stringify(originalChallenge) !== JSON.stringify(editedChallengeWinners)) {
            changes.challengeWinners = {
                original: originalChallenge,
                new: editedChallengeWinners,
            };
        }

        // Check lip sync winners
        const originalLipSync = leagueData.lgLipSyncWinners || [];
        if (JSON.stringify(originalLipSync) !== JSON.stringify(editedLipSyncWinners)) {
            changes.lipSyncWinners = {
                original: originalLipSync,
                new: editedLipSyncWinners,
            };
        }

        return changes;
    };

    // Detect changes for player
    const getPlayerChanges = () => {
        const changes = {};
        
        // Check rankings
        const originalRankings = selectedPlayer.plRankings || [];
        if (JSON.stringify(originalRankings) !== JSON.stringify(editedRankings)) {
            changes.rankings = {
                original: originalRankings,
                new: editedRankings,
            };
        }

        // Check winners
        const originalWinners = selectedPlayer.plWinners || [];
        if (JSON.stringify(originalWinners) !== JSON.stringify(editedWinners)) {
            changes.winners = {
                original: originalWinners,
                new: editedWinners,
            };
        }

        // Check bonuses
        const originalBonuses = selectedPlayer.plBonuses || [];
        if (JSON.stringify(originalBonuses) !== JSON.stringify(editedBonuses)) {
            changes.bonuses = {
                original: originalBonuses,
                new: editedBonuses,
            };
        }

        return changes;
    };

    const handlePreviewChanges = () => {
        const detectedChanges = mode === 'league' ? getLeagueChanges() : getPlayerChanges();
        setChanges(detectedChanges);
        setShowSummary(true);
    };

    const handleConfirmChanges = async () => {
        setSubmitting(true);
        try {
            if (mode === 'league') {
                await submitLeagueChanges();
            } else if (mode === 'player') {
                await submitPlayerChanges();
            }
            setShowSummary(false);
            setMode(null);
            setSelectedPlayer(null);
            setChanges({});
            if (onUpdate) onUpdate();
        } catch (error) {
            console.error('Error submitting changes:', error);
            alert('Error submitting changes. Please try again.');
        }
        setSubmitting(false);
    };

    const submitLeagueChanges = async () => {
        const changeDetails = [];
        const totalQueens = allQueens.length;
        
        // Format eliminated players changes
        if (changes.eliminatedPlayers) {
            const original = changes.eliminatedPlayers.original;
            const updated = changes.eliminatedPlayers.new;
            
            updated.forEach((entry, idx) => {
                const origEntry = original[idx] || '';
                if (entry !== origEntry) {
                    const newQueens = entry.split('|').filter(Boolean);
                    const oldQueens = origEntry.split('|').filter(Boolean);
                    
                    // Calculate placement
                    let queensEliminatedBefore = 0;
                    for (let i = 0; i < idx; i++) {
                        const queensInEntry = updated[i].split('|').filter(Boolean);
                        queensEliminatedBefore += queensInEntry.length;
                    }
                    const placement = totalQueens - queensEliminatedBefore - (newQueens.length - 1);
                    const ordinal = getOrdinal(placement);
                    
                    if (oldQueens.length === 0 && newQueens.length > 0) {
                        changeDetails.push(`Added ${formatQueenNames(entry)} as ${ordinal} place`);
                    } else if (newQueens.length === 0 && oldQueens.length > 0) {
                        changeDetails.push(`Removed ${formatQueenNames(origEntry)} from ${ordinal} place`);
                    } else {
                        changeDetails.push(`Changed ${ordinal} place from ${formatQueenNames(origEntry)} to ${formatQueenNames(entry)}`);
                    }
                }
            });
        }
        
        // Format challenge winners changes
        if (changes.challengeWinners) {
            const original = changes.challengeWinners.original;
            const updated = changes.challengeWinners.new;
            
            updated.forEach((entry, idx) => {
                const origEntry = original[idx] || '';
                if (entry !== origEntry) {
                    const weekNum = idx + 1;
                    const newWinners = entry.split('|').filter(Boolean);
                    const oldWinners = origEntry.split('|').filter(Boolean);
                    
                    if (oldWinners.length === 0 && newWinners.length > 0) {
                        changeDetails.push(`Added Week ${weekNum} Challenge Winner: ${formatQueenNames(entry)}`);
                    } else if (newWinners.length === 0 && oldWinners.length > 0) {
                        changeDetails.push(`Removed Week ${weekNum} Challenge Winner`);
                    } else {
                        changeDetails.push(`Changed Week ${weekNum} Challenge Winner from ${formatQueenNames(origEntry)} to ${formatQueenNames(entry)}`);
                    }
                }
            });
        }
        
        // Format lip sync winners changes
        if (changes.lipSyncWinners) {
            const original = changes.lipSyncWinners.original;
            const updated = changes.lipSyncWinners.new;
            
            updated.forEach((entry, idx) => {
                const origEntry = original[idx] || '';
                if (entry !== origEntry) {
                    const weekNum = idx + 1;
                    const newWinners = entry.split('|').filter(Boolean);
                    const oldWinners = origEntry.split('|').filter(Boolean);
                    
                    if (oldWinners.length === 0 && newWinners.length > 0) {
                        changeDetails.push(`Added Week ${weekNum} Lip Sync Winner: ${formatQueenNames(entry)}`);
                    } else if (newWinners.length === 0 && oldWinners.length > 0) {
                        changeDetails.push(`Removed Week ${weekNum} Lip Sync Winner`);
                    } else {
                        changeDetails.push(`Changed Week ${weekNum} Lip Sync Winner from ${formatQueenNames(origEntry)} to ${formatQueenNames(entry)}`);
                    }
                }
            });
        }

        const currentHistory = leagueData.lgHistory || [];
        const adminName = currentPlayer?.plName || 'Admin';
        const historyEntry = `${new Date().toISOString()}. [ADMIN EDIT] Admin ${adminName} edited league entries: ${changeDetails.join('; ')}`;

        const leagueInput = {
            id: leagueData.id,
            lgEliminatedPlayers: editedEliminatedPlayers,
            lgChallengeWinners: editedChallengeWinners,
            lgLipSyncWinners: editedLipSyncWinners,
            lgHistory: [...currentHistory, historyEntry],
        };

        await client.graphql({
            query: updateLeague,
            variables: { input: leagueInput }
        });
    };

    const submitPlayerChanges = async () => {
        const changeDetails = [];
        const totalQueens = allQueens.length;
        
        // Format rankings changes
        if (changes.rankings) {
            const original = changes.rankings.original;
            const updated = changes.rankings.new;
            
            updated.forEach((queen, idx) => {
                const origQueen = original[idx] || '';
                if (queen !== origQueen) {
                    const placement = totalQueens - idx;
                    const ordinal = getOrdinal(placement);
                    
                    if (!origQueen && queen) {
                        changeDetails.push(`Set ${ordinal} place to ${queen}`);
                    } else if (origQueen && !queen) {
                        changeDetails.push(`Removed ${queen} from ${ordinal} place`);
                    } else {
                        changeDetails.push(`Changed ${ordinal} place from ${origQueen} to ${queen}`);
                    }
                }
            });
        }
        
        // Format weekly winners changes
        if (changes.winners) {
            const original = changes.winners.original;
            const updated = changes.winners.new;
            
            updated.forEach((winner, idx) => {
                const origWinner = original[idx] || '';
                if (winner !== origWinner) {
                    const weekNum = idx + 1;
                    
                    if (!origWinner && winner) {
                        changeDetails.push(`Set Week ${weekNum} prediction to ${winner}`);
                    } else if (origWinner && !winner) {
                        changeDetails.push(`Removed Week ${weekNum} prediction`);
                    } else {
                        changeDetails.push(`Changed Week ${weekNum} prediction from ${origWinner} to ${winner}`);
                    }
                }
            });
        }
        
        // Format bonus predictions changes
        if (changes.bonuses) {
            const original = changes.bonuses.original;
            const updated = changes.bonuses.new;
            
            updated.forEach((bonus, idx) => {
                const origBonus = original[idx] || '';
                if (bonus !== origBonus) {
                    const bonusParts = bonus.split('|');
                    const origParts = origBonus.split('|');
                    const category = bonusParts[0] || origParts[0];
                    const newAnswer = bonusParts[1] || '';
                    const oldAnswer = origParts[1] || '';
                    
                    if (!oldAnswer && newAnswer) {
                        changeDetails.push(`Set "${category}" to ${newAnswer}`);
                    } else if (oldAnswer && !newAnswer) {
                        changeDetails.push(`Removed "${category}" prediction`);
                    } else {
                        changeDetails.push(`Changed "${category}" from ${oldAnswer} to ${newAnswer}`);
                    }
                }
            });
        }

        const currentHistory = leagueData.lgHistory || [];
        const adminName = currentPlayer?.plName || 'Admin';
        const historyEntry = `${new Date().toISOString()}. [ADMIN EDIT] Admin ${adminName} edited player ${selectedPlayer.plName}'s entries: ${changeDetails.join('; ')}`;

        // Update player
        const playerInput = {
            id: selectedPlayer.id,
            leagueId: selectedPlayer.leagueId,
            plRankings: editedRankings,
            plWinners: editedWinners,
            plBonuses: editedBonuses,
        };

        await client.graphql({
            query: updatePlayer,
            variables: { input: playerInput }
        });

        // Update league history
        const leagueInput = {
            id: leagueData.id,
            lgHistory: [...currentHistory, historyEntry],
        };

        await client.graphql({
            query: updateLeague,
            variables: { input: leagueInput }
        });
    };

    // Format multiple queens with commas and ampersand
    const formatQueenNames = (value) => {
        if (!value) return '(empty)';
        const queens = value.split('|').filter(Boolean);
        if (queens.length === 0) return '(empty)';
        if (queens.length === 1) return queens[0];
        if (queens.length === 2) return `${queens[0]} & ${queens[1]}`;
        const lastQueen = queens[queens.length - 1];
        const otherQueens = queens.slice(0, -1).join(', ');
        return `${otherQueens}, & ${lastQueen}`;
    };

    // Render summary dialog
    const renderSummaryDialog = () => (
        <Dialog
            open={showSummary}
            onClose={() => setShowSummary(false)}
            maxWidth="md"
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: '16px',
                    border: '2px solid rgba(255, 20, 147, 0.3)',
                }
            }}
        >
            <DialogTitle sx={{
                background: 'linear-gradient(135deg, #FF1493 0%, #9B30FF 100%)',
                color: 'white',
                fontWeight: 600,
            }}>
                Review Changes
            </DialogTitle>
            <DialogContent sx={{ mt: 2 }}>
                <SummaryDialog>
                    {mode === 'league' ? (
                        <>
                            {changes.eliminatedPlayers && (
                                <SummarySection>
                                    <SummaryTitle>Eliminated Players Changes:</SummaryTitle>
                                    {changes.eliminatedPlayers.original.map((orig, idx) => {
                                        const newVal = changes.eliminatedPlayers.new[idx];
                                        if (orig !== newVal) {
                                            return (
                                                <SummaryItem key={idx}>
                                                    Episode {idx + 1}: <ChangeIndicator>{formatQueenNames(orig)}</ChangeIndicator> → <ChangeIndicator>{formatQueenNames(newVal)}</ChangeIndicator>
                                                </SummaryItem>
                                            );
                                        }
                                        return null;
                                    })}
                                </SummarySection>
                            )}
                            {changes.challengeWinners && (
                                <SummarySection>
                                    <SummaryTitle>Challenge Winners Changes:</SummaryTitle>
                                    {changes.challengeWinners.original.map((orig, idx) => {
                                        const newVal = changes.challengeWinners.new[idx];
                                        if (orig !== newVal) {
                                            return (
                                                <SummaryItem key={idx}>
                                                    Episode {idx + 1}: <ChangeIndicator>{formatQueenNames(orig)}</ChangeIndicator> → <ChangeIndicator>{formatQueenNames(newVal)}</ChangeIndicator>
                                                </SummaryItem>
                                            );
                                        }
                                        return null;
                                    })}
                                </SummarySection>
                            )}
                            {changes.lipSyncWinners && (
                                <SummarySection>
                                    <SummaryTitle>Lip Sync Winners Changes:</SummaryTitle>
                                    {changes.lipSyncWinners.original.map((orig, idx) => {
                                        const newVal = changes.lipSyncWinners.new[idx];
                                        if (orig !== newVal) {
                                            return (
                                                <SummaryItem key={idx}>
                                                    Episode {idx + 1}: <ChangeIndicator>{formatQueenNames(orig)}</ChangeIndicator> → <ChangeIndicator>{formatQueenNames(newVal)}</ChangeIndicator>
                                                </SummaryItem>
                                            );
                                        }
                                        return null;
                                    })}
                                </SummarySection>
                            )}
                        </>
                    ) : (
                        <>
                            {changes.rankings && (
                                <SummarySection>
                                    <SummaryTitle>Rankings Changes:</SummaryTitle>
                                    {changes.rankings.original.map((orig, idx) => {
                                        const newVal = changes.rankings.new[idx];
                                        if (orig !== newVal) {
                                            return (
                                                <SummaryItem key={idx}>
                                                    {getOrdinal(idx + 1)}: <ChangeIndicator>{orig}</ChangeIndicator> → <ChangeIndicator>{newVal}</ChangeIndicator>
                                                </SummaryItem>
                                            );
                                        }
                                        return null;
                                    })}
                                </SummarySection>
                            )}
                            {changes.winners && (
                                <SummarySection>
                                    <SummaryTitle>Weekly Winners Changes:</SummaryTitle>
                                    {changes.winners.original.map((orig, idx) => {
                                        const newVal = changes.winners.new[idx];
                                        if (orig !== newVal) {
                                            return (
                                                <SummaryItem key={idx}>
                                                    Week {idx + 1}: <ChangeIndicator>{orig || '(no submission)'}</ChangeIndicator> → <ChangeIndicator>{newVal || '(no submission)'}</ChangeIndicator>
                                                </SummaryItem>
                                            );
                                        }
                                        return null;
                                    })}
                                </SummarySection>
                            )}
                            {changes.bonuses && (
                                <SummarySection>
                                    <SummaryTitle>Bonus Predictions Changes:</SummaryTitle>
                                    {changes.bonuses.original.map((orig, idx) => {
                                        const newVal = changes.bonuses.new[idx];
                                        if (orig !== newVal) {
                                            return (
                                                <SummaryItem key={idx}>
                                                    <ChangeIndicator>{orig}</ChangeIndicator> → <ChangeIndicator>{newVal}</ChangeIndicator>
                                                </SummaryItem>
                                            );
                                        }
                                        return null;
                                    })}
                                </SummarySection>
                            )}
                        </>
                    )}
                    
                    <SummarySection sx={{ mt: 3, background: 'rgba(255, 20, 147, 0.1)' }}>
                        <SummaryTitle sx={{ color: '#9B30FF' }}>⚠️ Important</SummaryTitle>
                        <div style={{ fontSize: '0.95rem', color: '#666' }}>
                            These changes will be recorded in the league history with your name for transparency.
                            All players will be able to see that these edits were made.
                        </div>
                    </SummarySection>
                </SummaryDialog>
            </DialogContent>
            <DialogActions sx={{ p: 3, gap: 2 }}>
                <CancelButton variant="outlined" onClick={() => setShowSummary(false)}>
                    Go Back
                </CancelButton>
                <ConfirmButton
                    variant="contained"
                    onClick={handleConfirmChanges}
                    disabled={submitting}
                >
                    {submitting ? 'Submitting...' : 'Confirm Changes'}
                </ConfirmButton>
            </DialogActions>
        </Dialog>
    );

    // Render initial choice screen
    if (!mode) {
        return (
            <>
                <Container>
                    <ContentWrapper>
                        <BackButton 
                            variant="outlined" 
                            onClick={() => router.push(`/League/${leagueData.id}`)}
                        >
                        ← Back to League
                        </BackButton>
                        <Title>Admin Edit Panel</Title>
                        <ChoiceContainer>
                            <ChoiceCard onClick={handleEditLeague}>
                                <ChoiceTitle>Edit League Entries</ChoiceTitle>
                                <ChoiceDescription>
                                Modify eliminated queens, challenge winners, and lip sync winners for all episodes
                                </ChoiceDescription>
                            </ChoiceCard>
                            <ChoiceCard onClick={() => setMode('player-select')}>
                                <ChoiceTitle>Edit Player Entries</ChoiceTitle>
                                <ChoiceDescription>
                                Modify a specific player&apos;s rankings, weekly picks, and bonus predictions
                                </ChoiceDescription>
                            </ChoiceCard>
                        </ChoiceContainer>
                    </ContentWrapper>
                </Container>
                {renderSummaryDialog()}
            </>
        );
    }

    // Render player selection screen
    if (mode === 'player-select') {
        return (
            <>
                <Container>
                    <ContentWrapper>
                        <BackButton variant="outlined" onClick={handleBack}>
                        ← Back
                        </BackButton>
                        <Title>Select Player to Edit</Title>
                        <PlayerListContainer>
                            {allPlayers.map(player => (
                                <PlayerCard key={player.id} onClick={() => handleEditPlayer(player)}>
                                    <PlayerName>{player.plName}</PlayerName>
                                </PlayerCard>
                            ))}
                        </PlayerListContainer>
                    </ContentWrapper>
                </Container>
                {renderSummaryDialog()}
            </>
        );
    }

    // Render league editor
    if (mode === 'league') {
        // Calculate placement for eliminated queens (counting from bottom up)
        const totalQueens = allQueens.length;
        
        // Get already eliminated queens to prevent repetition
        const getAlreadyEliminatedQueens = (currentIndex) => {
            const eliminated = new Set();
            editedEliminatedPlayers.forEach((entry, idx) => {
                // Skip the current index being edited, but include all others
                if (idx !== currentIndex) {
                    entry.split('|').filter(Boolean).forEach(q => eliminated.add(q));
                }
            });
            return Array.from(eliminated);
        };

        return (
            <>
                <Container>
                    <ContentWrapper>
                        <BackButton variant="outlined" onClick={handleBack}>
                        ← Back
                        </BackButton>
                        <Title>Edit League Entries</Title>
                    
                        <EditorContainer>
                            <Section>
                                <SectionTitle>Eliminated Queens by Placement (First to Last)</SectionTitle>
                                <Typography variant="body2" sx={{ mb: 2, color: '#666', fontSize: '0.9rem' }}>
                                Edit which queen(s) were eliminated at each placement, from first eliminated to winner. Multiple queens can be selected for ties. Queens already eliminated won&apos;t appear in later placements.
                                </Typography>
                                {[...editedEliminatedPlayers].reverse().map((entry, reversedIndex) => {
                                // Get the actual index in the original array
                                    const index = editedEliminatedPlayers.length - 1 - reversedIndex;
                                
                                    // Get the number of queens in this entry
                                    const queensInThisEntry = entry.split('|').filter(Boolean);
                                    const queensInThisEntryCount = queensInThisEntry.length;
                                
                                    // Calculate placement (counting from bottom, but showing first to last)
                                    // Count all queens eliminated in earlier entries
                                    let queensEliminatedBefore = 0;
                                    for (let i = 0; i < index; i++) {
                                        const queensInEntry = editedEliminatedPlayers[i].split('|').filter(Boolean);
                                        queensEliminatedBefore += queensInEntry.length;
                                    }
                                
                                    // The placement is the highest placement of the tied group
                                    // If 2 queens tie, they both get the higher placement number
                                    const placement = totalQueens - queensEliminatedBefore - (queensInThisEntryCount - 1);
                                
                                    // Get available queens (not yet eliminated)
                                    const alreadyEliminated = getAlreadyEliminatedQueens(index);
                                    const availableQueens = allQueens.filter(q => !alreadyEliminated.includes(q));
                                
                                    return (
                                        <EntryRow key={index}>
                                            <EntryLabel>{getOrdinal(placement)} Place:</EntryLabel>
                                            <FormControl fullWidth>
                                                <Select
                                                    multiple
                                                    value={entry ? entry.split('|').filter(Boolean) : []}
                                                    onChange={(e) => {
                                                        const newEliminated = [...editedEliminatedPlayers];
                                                        newEliminated[index] = e.target.value.join('|');
                                                        setEditedEliminatedPlayers(newEliminated);
                                                    }}
                                                    renderValue={(selected) => (
                                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                                                            {selected.length === 0 ? (
                                                                <span style={{ color: '#999' }}>Select queen(s)</span>
                                                            ) : (
                                                                selected.map((value) => (
                                                                    <Chip key={value} label={value} size="small" />
                                                                ))
                                                            )}
                                                        </div>
                                                    )}
                                                >
                                                    {availableQueens.length === 0 ? (
                                                        <MenuItem disabled>No queens available</MenuItem>
                                                    ) : (
                                                        availableQueens.map((queen) => (
                                                            <MenuItem key={queen} value={queen}>
                                                                {queen}
                                                            </MenuItem>
                                                        ))
                                                    )}
                                                </Select>
                                            </FormControl>
                                            <IconButton
                                                onClick={() => {
                                                    const newEliminated = editedEliminatedPlayers.filter((_, i) => i !== index);
                                                    setEditedEliminatedPlayers(newEliminated);
                                                }}
                                                color="error"
                                            >
                                                <DeleteIcon />
                                            </IconButton>
                                        </EntryRow>
                                    );
                                })}
                                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
                                    <ConfirmButton
                                        variant="outlined"
                                        onClick={() => {
                                            setEditedEliminatedPlayers([...editedEliminatedPlayers, '']);
                                        }}
                                        startIcon={<AddIcon />}
                                    >
                                    Add Placement
                                    </ConfirmButton>
                                </Box>
                            </Section>

                            <Section>
                                <SectionTitle>Challenge Winners by Week</SectionTitle>
                                <Typography variant="body2" sx={{ mb: 2, color: '#666', fontSize: '0.9rem' }}>
                                Edit which queen(s) won the maxi challenge each week. Select &quot;No Winner&quot; if no one won that week. Multiple queens can be selected for ties.
                                </Typography>
                                {[...editedChallengeWinners].reverse().map((entry, reversedIndex) => {
                                    const index = editedChallengeWinners.length - 1 - reversedIndex;
                                    return (
                                        <EntryRow key={index}>
                                            <EntryLabel>Week {index + 1}:</EntryLabel>
                                            <FormControl fullWidth>
                                                <Select
                                                    multiple
                                                    value={entry ? entry.split('|').filter(Boolean) : []}
                                                    onChange={(e) => {
                                                        const values = e.target.value;
                                                        // If "No Winner" is selected, clear everything else
                                                        if (values.includes('__NO_WINNER__')) {
                                                            const newWinners = [...editedChallengeWinners];
                                                            newWinners[index] = '';
                                                            setEditedChallengeWinners(newWinners);
                                                        } else {
                                                            const newWinners = [...editedChallengeWinners];
                                                            newWinners[index] = values.join('|');
                                                            setEditedChallengeWinners(newWinners);
                                                        }
                                                    }}
                                                    renderValue={(selected) => (
                                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                                                            {selected.length === 0 ? (
                                                                <Chip label="No Winner" size="small" sx={{ background: '#f0f0f0' }} />
                                                            ) : (
                                                                selected.map((value) => (
                                                                    <Chip key={value} label={value} size="small" />
                                                                ))
                                                            )}
                                                        </div>
                                                    )}
                                                >
                                                    <MenuItem value="__NO_WINNER__" sx={{ fontStyle: 'italic', color: '#999' }}>
                                                No Winner
                                                    </MenuItem>
                                                    {allQueens.length === 0 ? (
                                                        <MenuItem disabled>No queens available</MenuItem>
                                                    ) : (
                                                        allQueens.map((queen) => (
                                                            <MenuItem key={queen} value={queen}>
                                                                {queen}
                                                            </MenuItem>
                                                        ))
                                                    )}
                                                </Select>
                                            </FormControl>
                                        </EntryRow>
                                    );
                                })}
                            </Section>

                            <Box sx={{ mt: 3, mb: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 2 }}>
                                <ConfirmButton
                                    variant="outlined"
                                    onClick={() => {
                                        // Add a week to both challenge and lip sync winners
                                        setEditedChallengeWinners([...editedChallengeWinners, '']);
                                        setEditedLipSyncWinners([...editedLipSyncWinners, '']);
                                    }}
                                    startIcon={<AddIcon />}
                                >
                                    Add Week
                                </ConfirmButton>
                                <CancelButton
                                    variant="outlined"
                                    onClick={() => {
                                        // Remove the last week from both challenge and lip sync winners
                                        if (editedChallengeWinners.length > 0 && editedLipSyncWinners.length > 0) {
                                            setEditedChallengeWinners(editedChallengeWinners.slice(0, -1));
                                            setEditedLipSyncWinners(editedLipSyncWinners.slice(0, -1));
                                        }
                                    }}
                                    startIcon={<RemoveIcon />}
                                >
                                    Remove Week
                                </CancelButton>
                            </Box>

                            <Section>
                                <SectionTitle>Lip Sync Winners by Week</SectionTitle>
                                <Typography variant="body2" sx={{ mb: 2, color: '#666', fontSize: '0.9rem' }}>
                                Edit which queen(s) won the lip sync each week. Select &quot;No Winner&quot; if there was no lip sync that week. Multiple queens can be selected for ties.
                                </Typography>
                                {[...editedLipSyncWinners].reverse().map((entry, reversedIndex) => {
                                    const index = editedLipSyncWinners.length - 1 - reversedIndex;
                                    return (
                                        <EntryRow key={index}>
                                            <EntryLabel>Week {index + 1}:</EntryLabel>
                                            <FormControl fullWidth>
                                                <Select
                                                    multiple
                                                    value={entry ? entry.split('|').filter(Boolean) : []}
                                                    onChange={(e) => {
                                                        const values = e.target.value;
                                                        // If "No Winner" is selected, clear everything else
                                                        if (values.includes('__NO_WINNER__')) {
                                                            const newWinners = [...editedLipSyncWinners];
                                                            newWinners[index] = '';
                                                            setEditedLipSyncWinners(newWinners);
                                                        } else {
                                                            const newWinners = [...editedLipSyncWinners];
                                                            newWinners[index] = values.join('|');
                                                            setEditedLipSyncWinners(newWinners);
                                                        }
                                                    }}
                                                    renderValue={(selected) => (
                                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                                                            {selected.length === 0 ? (
                                                                <Chip label="No Winner" size="small" sx={{ background: '#f0f0f0' }} />
                                                            ) : (
                                                                selected.map((value) => (
                                                                    <Chip key={value} label={value} size="small" />
                                                                ))
                                                            )}
                                                        </div>
                                                    )}
                                                >
                                                    <MenuItem value="__NO_WINNER__" sx={{ fontStyle: 'italic', color: '#999' }}>
                                                No Winner
                                                    </MenuItem>
                                                    {allQueens.length === 0 ? (
                                                        <MenuItem disabled>No queens available</MenuItem>
                                                    ) : (
                                                        allQueens.map((queen) => (
                                                            <MenuItem key={queen} value={queen}>
                                                                {queen}
                                                            </MenuItem>
                                                        ))
                                                    )}
                                                </Select>
                                            </FormControl>
                                        </EntryRow>
                                    );
                                })}
                            </Section>

                            <ActionButtons>
                                <CancelButton variant="outlined" onClick={handleBack}>
                                Cancel
                                </CancelButton>
                                <ConfirmButton
                                    variant="contained"
                                    onClick={handlePreviewChanges}
                                    disabled={Object.keys(getLeagueChanges()).length === 0}
                                >
                                Review Changes
                                </ConfirmButton>
                            </ActionButtons>
                        </EditorContainer>
                    </ContentWrapper>
                </Container>
                {renderSummaryDialog()}
            </>
        );
    }

    // Render player editor
    if (mode === 'player' && selectedPlayer) {
        const totalQueens = allQueens.length;
        const handleRankingChange = (index, value) => {
            const next = [...editedRankings];
            // Clear any other occurrences of this queen to prevent duplication
            for (let i = 0; i < next.length; i++) {
                if (i !== index && next[i] === value) next[i] = '';
            }
            next[index] = value;
            setEditedRankings(next);
        };
        
        return (
            <>
                <Container>
                    <ContentWrapper>
                        <BackButton variant="outlined" onClick={handleBack}>
                        ← Back to Player List
                        </BackButton>
                        <Title>Edit {selectedPlayer.plName}&apos;s Entries</Title>
                    
                        <EditorContainer>
                            <Section>
                                <SectionTitle>Elimination Order Rankings (First Eliminated to Winner)</SectionTitle>
                                <Typography variant="body2" sx={{ mb: 2, color: '#666', fontSize: '0.9rem' }}>
                                Edit the player&apos;s predicted elimination order from first eliminated to winner.
                                </Typography>
                                {[...editedRankings].reverse().map((queen, reversedIndex) => {
                                    const index = editedRankings.length - 1 - reversedIndex;
                                    // Calculate placement from total queens
                                    const placement = totalQueens - index;
                                    return (
                                        <EntryRow key={index}>
                                            <EntryLabel>{getOrdinal(placement)} Place:</EntryLabel>
                                            <FormControl fullWidth>
                                                <Select
                                                    value={queen || ''}
                                                    onChange={(e) => handleRankingChange(index, e.target.value)}
                                                >
                                                    <MenuItem value="">
                                                        <em style={{ color: '#999' }}>Select a queen</em>
                                                    </MenuItem>
                                                    {allQueens.map((q) => {
                                                        const otherSelected = new Set(editedRankings.map((val, i) => (i !== index ? val : null)).filter(Boolean));
                                                        const isTaken = otherSelected.has(q);
                                                        return (
                                                            <MenuItem
                                                                key={q}
                                                                value={q}
                                                                sx={isTaken ? { color: '#999', opacity: 0.7 } : {}}
                                                            >
                                                                {q}
                                                            </MenuItem>
                                                        );
                                                    })}
                                                </Select>
                                            </FormControl>
                                        </EntryRow>
                                    );
                                })}
                            </Section>

                            <Section>
                                <SectionTitle>Weekly Winners Predictions</SectionTitle>
                                <Typography variant="body2" sx={{ mb: 2, color: '#666', fontSize: '0.9rem' }}>
                                Edit the player&apos;s weekly challenge winner predictions.
                                </Typography>
                                {[...editedWinners].reverse().map((entry, reversedIndex) => {
                                    const index = editedWinners.length - 1 - reversedIndex;
                                    return (
                                        <EntryRow key={index}>
                                            <EntryLabel>Week {index + 1}:</EntryLabel>
                                            <FormControl fullWidth>
                                                <Select
                                                    value={entry || ''}
                                                    onChange={(e) => {
                                                        const newWinners = [...editedWinners];
                                                        newWinners[index] = e.target.value;
                                                        setEditedWinners(newWinners);
                                                    }}
                                                >
                                                    <MenuItem value="">
                                                        <em style={{ color: '#999' }}>No submission</em>
                                                    </MenuItem>
                                                    {allQueens.map((queen) => (
                                                        <MenuItem key={queen} value={queen}>
                                                            {queen}
                                                        </MenuItem>
                                                    ))}
                                                </Select>
                                            </FormControl>
                                        </EntryRow>
                                    );
                                })}
                            </Section>

                            <Section>
                                <SectionTitle>Bonus Predictions</SectionTitle>
                                <Typography variant="body2" sx={{ mb: 2, color: '#666', fontSize: '0.9rem' }}>
                                Edit the player&apos;s bonus category predictions.
                                </Typography>
                                {editedBonuses.map((entry, index) => {
                                    const parts = entry.split('|');
                                    const category = parts[0] || '';
                                    const answer = parts[1] || '';
                                
                                    // Get the type from the league's bonus points data
                                    const bonusPoints = leagueData?.lgBonusPoints || [];
                                    const bonusArr = Array.isArray(bonusPoints) ? bonusPoints : (bonusPoints ? [bonusPoints] : []);
                                    const matchingBonus = bonusArr.find(bp => bp.split('|')[0] === category);
                                    const bonusType = matchingBonus ? matchingBonus.split('|')[2]?.toLowerCase().trim() : 'queens';
                                
                                    return (
                                        <EntryRow key={index}>
                                            <EntryLabel>{category}:</EntryLabel>
                                            <FormControl fullWidth>
                                                {bonusType === 'number' ? (
                                                    <Select
                                                        value={answer || ''}
                                                        onChange={(e) => {
                                                            const newBonuses = [...editedBonuses];
                                                            newBonuses[index] = `${category}|${e.target.value}`;
                                                            setEditedBonuses(newBonuses);
                                                        }}
                                                    >
                                                        <MenuItem value="">
                                                            <em style={{ color: '#999' }}>Select a number</em>
                                                        </MenuItem>
                                                        {Array.from({ length: 30 }, (_, i) => i + 1).map((num) => (
                                                            <MenuItem key={num} value={num.toString()}>
                                                                {num}
                                                            </MenuItem>
                                                        ))}
                                                    </Select>
                                                ) : bonusType === 'yes/no' ? (
                                                    <Select
                                                        value={answer?.toLowerCase() || ''}
                                                        onChange={(e) => {
                                                            const newBonuses = [...editedBonuses];
                                                            newBonuses[index] = `${category}|${e.target.value}`;
                                                            setEditedBonuses(newBonuses);
                                                        }}
                                                    >
                                                        <MenuItem value="">
                                                            <em style={{ color: '#999' }}>Select Yes or No</em>
                                                        </MenuItem>
                                                        <MenuItem value="yes">Yes</MenuItem>
                                                        <MenuItem value="no">No</MenuItem>
                                                    </Select>
                                                ) : (
                                                    <Select
                                                        value={answer || ''}
                                                        onChange={(e) => {
                                                            const newBonuses = [...editedBonuses];
                                                            newBonuses[index] = `${category}|${e.target.value}`;
                                                            setEditedBonuses(newBonuses);
                                                        }}
                                                    >
                                                        <MenuItem value="">
                                                            <em style={{ color: '#999' }}>Select a Queen</em>
                                                        </MenuItem>
                                                        {allQueens.map((queen) => (
                                                            <MenuItem key={queen} value={queen}>
                                                                {queen}
                                                            </MenuItem>
                                                        ))}
                                                    </Select>
                                                )}
                                            </FormControl>
                                        </EntryRow>
                                    );
                                })}
                            </Section>

                            <ActionButtons>
                                <CancelButton variant="outlined" onClick={handleBack}>
                                Cancel
                                </CancelButton>
                                <ConfirmButton
                                    variant="contained"
                                    onClick={handlePreviewChanges}
                                    disabled={Object.keys(getPlayerChanges()).length === 0}
                                >
                                Review Changes
                                </ConfirmButton>
                            </ActionButtons>
                        </EditorContainer>
                    </ContentWrapper>
                </Container>
                {renderSummaryDialog()}
            </>
        );
    }

    // Return null if no mode matches
    return null;
}
