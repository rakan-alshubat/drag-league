import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Box from "@mui/material/Box";
import Alert from "@mui/material/Alert";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import Chip from "@mui/material/Chip";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import { generateClient } from 'aws-amplify/api';
import { updatePlayer, updateLeague } from "@/graphql/mutations";
import {
    StyledDialog,
    StyledDialogTitle,
    StyledDialogContent,
    StyledDialogActions,
    Section,
    SectionTitle,
    SectionDesc,
    SectionHeader,
    FinalRankingRow,
    PositionLabel,
    SubmitButton,
    CancelButton,
    AddButton,
    DeleteIconButton,
    BonusCategoryLabel,
    ChipWrapper,
    ErrorText,
    FlexContainer,
    FlexRow,
} from "./SubmissionsPopUp.styles";

function makeRow(id) {
    if (id != null) return { id: String(id), values: [] };
    const uid = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}`;
    return { id: uid, values: [] };
}

function getOrdinal(n) {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

export default function SubmissionsPopup({
    open = false,
    onClose = () => {},
    onSubmit = undefined,
    optionsList =  [],
    initialVersion = "submissions",
    currentPlayerRankings = null,
    playerData = null,
    leagueData = null,
    userData = null
}) {
    const isOpen = !!open;
    const [version, setVersion] = useState(initialVersion || "Submissions");

    // Weekly Picks State (unchanged - already good)
    const [submissionRows, setSubmissionRows] = useState(() => [{ ...makeRow(), disabled: false, value: "" }]);
    const [firstSwap, setFirstSwap] = useState("");
    const [secondSwap, setSecondSwap] = useState("");
    const [swappedResult, setSwappedResult] = useState([]);
    
    // Weekly Results State (redesigned with multi-select)
    const [challengeWinners, setChallengeWinners] = useState([]);
    const [lipSyncWinners, setLipSyncWinners] = useState([]);
    const [eliminatedQueens, setEliminatedQueens] = useState([]);
    
    const [errorMessage, setErrorMessage] = useState('');
    
    // Final Episode State (redesigned with multi-select)
    const [isFinalEpisode, setIsFinalEpisode] = useState(false);
    const [finalRankingRows, setFinalRankingRows] = useState(() => ([
        { ...makeRow() },
        { ...makeRow() }
    ]));
    const [bonusCategoryRows, setBonusCategoryRows] = useState([]);

    // Reset when opened or version changes
    useEffect(() => {
        if (!isOpen) return;
        setVersion(initialVersion || "Submissions");
        setSubmissionRows([{ ...makeRow(), disabled: false, value: "" }]);
        setFirstSwap("");
        setSecondSwap("");
        setSwappedResult([]);
        setErrorMessage('');
        setIsFinalEpisode(false);
        
        // Reset weekly results state
        setChallengeWinners([]);
        setLipSyncWinners([]);
        setEliminatedQueens([]);
        
        // Reset final episode state
        setFinalRankingRows([
            { ...makeRow() },
            { ...makeRow() }
        ]);
        
        // Initialize bonus category rows from leagueData
        if (leagueData?.lgBonusPoints && Array.isArray(leagueData.lgBonusPoints)) {
            const bonusRows = leagueData.lgBonusPoints.map(bonusString => {
                const parts = bonusString.split('|').map(s => s.trim());
                const name = parts[0] || '';
                const points = parts[1] || '';
                const type = parts[2] || '';
                return {
                    id: makeRow().id,
                    name,
                    points,
                    type,
                    value: ''
                };
            });
            setBonusCategoryRows(bonusRows);
        } else {
            setBonusCategoryRows([]);
        }
    }, [isOpen, initialVersion, leagueData]);

    // compute swappedResult when two distinct picks are present
    useEffect(() => {
        if (firstSwap && secondSwap && firstSwap !== secondSwap) {
            // Use the player's rankings if available, otherwise fall back to optionsList
            const base = (currentPlayerRankings && Array.isArray(currentPlayerRankings) && currentPlayerRankings.length > 0) 
                ? [...currentPlayerRankings] 
                : [...optionsList];
            const i = base.indexOf(firstSwap);
            const j = base.indexOf(secondSwap);
            if (i !== -1 && j !== -1) {
                const copy = [...base];
                copy[i] = secondSwap;
                copy[j] = firstSwap;
                setSwappedResult(copy);
                return;
            }
        }
        setSwappedResult([]);
    }, [firstSwap, secondSwap, optionsList, currentPlayerRankings]);

    // check if swaps are allowed based on lgSwap settings
    const checkSwapEligibility = () => {
        if (!leagueData?.lgSwap || leagueData.lgSwap === '') {
            return { allowed: false, message: '' };
        }
        
        const swapParts = leagueData.lgSwap.split('|').map(s => s.trim()).filter(Boolean);
        if (swapParts.length < 2) {
            return { allowed: false, message: '' };
        }
        
        const swapType = swapParts[0];
        const swapValue = Number(swapParts[1]);
        
        if (swapType === 'NumberOfEpisodes') {
            const episodesPassed = (leagueData.lgEliminatedPlayers || []).length;
            if (episodesPassed >= swapValue) {
                return { allowed: false, message: '' };
            }
            const remaining = swapValue - episodesPassed;
            return { 
                allowed: true, 
                message: `You can swap for the first ${swapValue}. (${remaining} episode${remaining === 1 ? '' : 's'} remaining)` 
            };
        } else {
            const totalQueens = (leagueData.lgQueenNames || []).length;
            const eliminatedQueens = (leagueData.lgEliminatedPlayers || []).length;
            const remainingQueens = totalQueens - eliminatedQueens;
            
            if (remainingQueens <= swapValue) {
                return { allowed: false, message: '' };
            }
            const episodesLeft = remainingQueens - swapValue;
            return { 
                allowed: true, 
                message: `You can swap until there are ${swapValue} queens remaining. (${episodesLeft} Queen${episodesLeft === 1 ? '' : 's'} left)` 
            };
        }
    };
    
    const swapEligibility = checkSwapEligibility();

    // helpers
    const getSelectedSet = (rows, ignoreIndex = -1) => {
        const s = new Set();
        rows.forEach((r, idx) => {
            if (idx === ignoreIndex) return;
            if (r.disabled) return;
            if (r.multi) {
                (r.values || []).forEach(v => { if (v) s.add(v); });
            } else {
                if (r.value) s.add(r.value);
            }
        });
        return s;
    };

    const updateSubmissionRow = (index, changes) => {
        setSubmissionRows(prev => {
            const next = [...prev];
            next[index] = { ...next[index], ...changes };
            return next;
        });
    };

    const addSubmissionRow = (afterIndex) => {
        setSubmissionRows(prev => {
            const next = [...prev];
            const insertAt = (typeof afterIndex === 'number') ? Math.min(afterIndex + 1, next.length) : next.length;
            next.splice(insertAt, 0, { ...makeRow(), value: "", disabled: false });
            return next;
        });
    };

    const addFinalRankingRow = () => {
        setFinalRankingRows(prev => [...prev, { ...makeRow(), value: "" }]);
    };
    
    const deleteFinalRankingRow = (rowId) => {
        setFinalRankingRows(prev => prev.filter(r => r.id !== rowId));
    };
    
    const updateFinalRankingValue = (rowId, values) => {
        setFinalRankingRows(prev => prev.map(r => r.id === rowId ? { ...r, values } : r));
    };

    const updateBonusCategoryValue = (id, values) => {
        setBonusCategoryRows(prev => prev.map(row => 
            row.id === id ? { ...row, values } : row
        ));
    };

    const renderOptionsFor = (rows, rowIndex, extraExcludes = []) => {
        const selected = getSelectedSet(rows, rowIndex);
        extraExcludes.forEach(e => { if (e) selected.add(e); });
        return optionsList.map((opt, i) => (
            <MenuItem key={`${rowIndex}-${i}-${String(opt)}`} value={opt} disabled={selected.has(opt)}>
                {opt}
            </MenuItem>
        ));
    };

    // submit handler
    const handleSubmit = async () => {
        const client = generateClient();
        
        if (version === "Submissions") {
            const rows = submissionRows || [];
            const selected = rows.filter(r => !r.disabled && r.value).map(r => r.value.trim()).filter(Boolean);
            const joined = selected.join("|");
            
            // Prepare updates for player (only swap-related)
            const playerUpdates = {};
            
            // Handle swap if both selections exist
            if (firstSwap && secondSwap && firstSwap !== secondSwap) {
                // Update plSwap with the two names separated by |
                playerUpdates.plSwap = `${firstSwap}|${secondSwap}`;
                
                // Perform the swap in plRankings
                const currentRankings = playerData?.plRankings || currentPlayerRankings || [];
                if (currentRankings.length > 0) {
                    const newRankings = [...currentRankings];
                    const i = newRankings.indexOf(firstSwap);
                    const j = newRankings.indexOf(secondSwap);
                    if (i !== -1 && j !== -1) {
                        newRankings[i] = secondSwap;
                        newRankings[j] = firstSwap;
                        playerUpdates.plRankings = newRankings;
                    }
                }
            }
            
            // Update player in GraphQL if there are swap updates and we have a player ID
            if (playerData?.id && Object.keys(playerUpdates).length > 0) {
                try {
                    const playerInput = {
                        id: playerData.id,
                        ...playerUpdates
                    };
                    
                    const playerResult = await client.graphql({
                        query: updatePlayer,
                        variables: { input: playerInput }
                    });
                    console.log('Player updated with swap:', playerResult);
                    
                    // Add history entry for swap
                    if (playerUpdates.plRankings && leagueData?.id) {
                        const currentHistory = leagueData.lgHistory || [];
                        const historyEntry = new Date().toISOString() + '. ' + (playerData.plName || 'Player') + ' swapped ' + firstSwap + ' with ' + secondSwap;
                        await client.graphql({
                            query: updateLeague,
                            variables: {
                                input: {
                                    id: leagueData.id,
                                    lgHistory: [...currentHistory, historyEntry]
                                }
                            }
                        });
                        console.log('History updated for swap');
                    }
                    
                } catch (error) {
                    console.error('Error updating player:', error);
                }
            }
            
            // Add submission to league's lgSubmissions array
            if (selected.length > 0 && leagueData?.id && userData?.id) {
                try {
                    const userEmail = userData.id; // User ID is their email
                    const currentSubmissions = leagueData.lgSubmissions || [];
                    
                    // Remove any existing submissions from this user
                    const filteredSubmissions = currentSubmissions.filter(submission => {
                        const parts = submission.split('|');
                        const submissionEmail = parts[1]; // Email is the second part
                        return submissionEmail !== userEmail;
                    });
                    
                    // Create new submission entries as "queenName|userEmail"
                    const newSubmissions = selected.map(queenName => `${queenName}|${userEmail}`);
                    
                    const leagueInput = {
                        id: leagueData.id,
                        lgSubmissions: [...filteredSubmissions, ...newSubmissions],
                        lgHistory: [...currentHistory, historyEntry]
                    };
                    
                    const leagueResult = await client.graphql({
                        query: updateLeague,
                        variables: { input: leagueInput }
                    });
                    console.log('League submissions updated:', leagueResult);
                    
                } catch (error) {
                    console.error('Error updating league submissions:', error);
                }
            }
            
            if (typeof onSubmit === "function") try { onSubmit({ version, value: joined, playerUpdates }); } catch {}
            try { onClose(joined); } catch { onClose(); }
            return;
        }

        // Handle final episode
        if (version === "Weekly Results" && isFinalEpisode && leagueData?.id) {
            try {
                // Get all rankings from finalRankingRows - each row can have multiple values (ties)
                const rankings = finalRankingRows
                    .flatMap(r => r.values || [])
                    .filter(Boolean);
                
                // Add rankings to lgEliminatedPlayers in reverse order (last to first)
                const currentEliminated = leagueData.lgEliminatedPlayers || [];
                const reversedRankings = [...rankings].reverse();
                const updatedEliminated = [...currentEliminated, ...reversedRankings];
                
                // Process lgSubmissions and map to player plWinners
                const submissions = leagueData.lgSubmissions || [];
                const submissionMap = {};
                submissions.forEach(sub => {
                    const parts = sub.split('|').map(s => s.trim());
                    if (parts.length === 2) {
                        const [queenName, userEmail] = parts;
                        submissionMap[userEmail.toLowerCase()] = queenName;
                    }
                });
                
                const allPlayers = leagueData.players || [];
                if (Array.isArray(allPlayers)) {
                    const updatePromises = allPlayers.map(async (player) => {
                        const playerEmail = player.id.toLowerCase();
                        const submission = submissionMap[playerEmail] || '';
                        const updatedWinners = [...(player.plWinners || []), submission];
                        
                        return await client.graphql({
                            query: updatePlayer,
                            variables: {
                                input: {
                                    id: player.id,
                                    leagueId: player.leagueId,
                                    plWinners: updatedWinners
                                }
                            }
                        });
                    });
                    
                    await Promise.all(updatePromises);
                }
                
                // Add 1st place to lgChallengeWinners
                const currentChallengeWinners = leagueData.lgChallengeWinners || [];
                const firstPlace = rankings.length > 0 ? rankings[0] : "";
                const updatedChallengeWinners = [...currentChallengeWinners, firstPlace];
                
                // Process bonus category results and update lgBonusPoints
                // Original format: "name|points|type"
                // Updated format after admin submits: "name|points|type|result"
                const currentBonusPoints = leagueData.lgBonusPoints || [];
                const updatedBonusPoints = currentBonusPoints.map((bonusStr, idx) => {
                    const parts = bonusStr.split('|');
                    const bonusRow = bonusCategoryRows[idx];
                    
                    // Check if we have values (multi-select support)
                    if (bonusRow && bonusRow.values && bonusRow.values.length > 0 && parts.length === 3) {
                        // Join multiple values with pipe for multi-select
                        const result = bonusRow.values.join('|');
                        return `${parts[0]}|${parts[1]}|${parts[2]}|${result}`;
                    }
                    // If result already exists or no new result submitted, keep as is
                    return bonusStr;
                });
                
                const currentHistory = leagueData.lgHistory || [];
                const bonusHistoryPart = bonusCategoryRows.filter(r => r.values && r.values.length > 0).length > 0
                    ? '. Bonus results: ' + bonusCategoryRows.filter(r => r.values && r.values.length > 0).map(r => `${r.name}: ${r.values.join(', ')}`).join(', ')
                    : '';
                const historyEntry = new Date().toISOString() + '. Final episode results submitted. Winner: ' + firstPlace + bonusHistoryPart;
                
                // Update league: set deadlines to null, lgFinished to 'finished'
                const leagueInput = {
                    id: leagueData.id,
                    lgEliminatedPlayers: updatedEliminated,
                    lgChallengeWinners: updatedChallengeWinners,
                    lgBonusPoints: updatedBonusPoints,
                    lgSubmissions: [],
                    lgDeadline: null,
                    lgRankingDeadline: null,
                    lgFinished: 'finished',
                    lgHistory: [...currentHistory, historyEntry]
                };
                
                await client.graphql({
                    query: updateLeague,
                    variables: { input: leagueInput }
                });
                
            } catch (error) {
                console.error('Error processing final episode:', error);
            }
            
            if (typeof onSubmit === "function") try { onSubmit({ version, value: 'final' }); } catch {}
            try { onClose('final'); } catch { onClose(); }
            return;
        }

        // Handle regular weekly results (non-final episode)
        if (leagueData?.id && version === "Weekly Results" && !isFinalEpisode) {
            try {
                // Get current arrays from league data
                const currentChallengeWinners = leagueData.lgChallengeWinners || [];
                const currentLipSyncWinners = leagueData.lgLipSyncWinners || [];
                const currentEliminatedPlayers = leagueData.lgEliminatedPlayers || [];
                
                // Join multi-selected values with pipes
                const challengeWinnersStr = challengeWinners.join('|') || "";
                const lipSyncWinnersStr = lipSyncWinners.join('|') || "";
                const eliminatedQueensStr = eliminatedQueens.join('|') || "";
                
                // Add new entries to the arrays
                const leagueUpdates = {
                    lgChallengeWinners: [...currentChallengeWinners, challengeWinnersStr],
                    lgLipSyncWinners: [...currentLipSyncWinners, lipSyncWinnersStr],
                    lgEliminatedPlayers: [...currentEliminatedPlayers, eliminatedQueensStr]
                };
                
                const currentHistory = leagueData.lgHistory || [];
                const historyEntry = new Date().toISOString() + '. Weekly results: Challenge Winner: ' + (challengeWinners.join(' & ') || 'None') + ', Lip Sync Winner: ' + (lipSyncWinners.join(' & ') || 'None') + ', Eliminated: ' + (eliminatedQueens.join(' & ') || 'None');
                leagueUpdates.lgHistory = [...currentHistory, historyEntry];
                
                const leagueInput = {
                    id: leagueData.id,
                    ...leagueUpdates
                };
                
                await client.graphql({
                    query: updateLeague,
                    variables: { input: leagueInput }
                });
                
            } catch (error) {
                console.error('Error updating league weekly results:', error);
                setErrorMessage('Error submitting weekly results');
                return;
            }
        }
        
        if (typeof onSubmit === "function") try { onSubmit({ version, value: result }); } catch {}
        try { onClose(result); } catch { onClose(); }
    };

    // render
    return (
        <StyledDialog open={isOpen} onClose={() => onClose()} maxWidth="sm" fullWidth>
            <StyledDialogTitle>
                {version === "Submissions" ? "Submit Weekly Pick" : "Submit Weekly Results"}
            </StyledDialogTitle>

            <StyledDialogContent>
                {version === "Submissions" && (
                    <Section>
                        <SectionDesc variant="body2">
                            {isFinalEpisode 
                                ? "Who will win the season?" 
                                : "Who will win this week's Maxi Challenge?"}
                        </SectionDesc>

                        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, mt: 1 }}>
                            {submissionRows.map((row, idx) => (
                                <Box key={`submission-${idx}-${row.id}`} sx={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                                    <FormControl fullWidth variant="outlined" size="small" disabled={row.disabled}>
                                        <InputLabel id={`label-${row.id}`}>-- select --</InputLabel>
                                        <Select
                                            labelId={`label-${row.id}`}
                                            value={row.value}
                                            label="-- select --"
                                            onChange={(e) => updateSubmissionRow(idx, { value: e.target.value })}
                                        >
                                            <MenuItem value="" disabled>-- select --</MenuItem>
                                            {renderOptionsFor(submissionRows, idx)}
                                        </Select>
                                    </FormControl>
                                </Box>
                            ))}
                        </Box>

                        {swapEligibility.allowed && (
                            <Box sx={{ mt: 2 }}>
                                <SectionTitle>Swap two names</SectionTitle>
                                <SectionDesc>{swapEligibility.message}</SectionDesc>

                                <Box sx={{ display: "flex", gap: 2, mt: 1 }}>
                                    <FormControl fullWidth size="small">
                                        <InputLabel id="first-swap-label">First</InputLabel>
                                        <Select
                                            labelId="first-swap-label"
                                            value={firstSwap}
                                            label="First"
                                            onChange={(e) => setFirstSwap(e.target.value)}
                                        >
                                            <MenuItem value="" disabled>-- select first --</MenuItem>
                                            {optionsList.map((opt, i) => <MenuItem key={`first-${i}-${String(opt)}`} value={opt}>{opt}</MenuItem>)}
                                        </Select>
                                    </FormControl>

                                    <FormControl fullWidth size="small">
                                        <InputLabel id="second-swap-label">Second</InputLabel>
                                        <Select
                                            labelId="second-swap-label"
                                            value={secondSwap}
                                            label="Second"
                                            onChange={(e) => setSecondSwap(e.target.value)}
                                        >
                                            <MenuItem value="" disabled>-- select second --</MenuItem>
                                            {optionsList.map((opt, i) => <MenuItem key={`second-${i}-${String(opt)}`} value={opt} disabled={opt === firstSwap}>{opt}</MenuItem>)}
                                        </Select>
                                    </FormControl>
                                </Box>

                                {firstSwap && secondSwap && firstSwap !== secondSwap && (
                                    <Box sx={{ mt: 2 }}>
                                        <Typography variant="subtitle2">Swapped list</Typography>
                                        <Box component="ul" sx={list}>
                                            {swappedResult.map((name, i) => <li key={`swapped-${i}-${String(name)}`} style={listItem}>{getOrdinal(i + 1)} - {name}</li>)}
                                        </Box>
                                    </Box>
                                )}

                                {firstSwap && secondSwap && firstSwap === secondSwap && (
                                    <ErrorText>The two selections must be different.</ErrorText>
                                )}
                            </Box>
                        )}
                    </Section>
                )} 

                {version === "Weekly Results" && (
                    <Box>
                        {errorMessage && (
                            <Box sx={{ mb: 2 }}>
                                <Alert severity="error">{errorMessage}</Alert>
                            </Box>
                        )}
                        
                        {isFinalEpisode ? (
                            <>
                                <Section>
                                    <SectionHeader>
                                        <SectionTitle>Final Rankings</SectionTitle>
                                        <AddButton size="small" variant="outlined" startIcon={<AddIcon />} onClick={addFinalRankingRow}>
                                            Add Placement
                                        </AddButton>
                                    </SectionHeader>
                                    
                                    <SectionDesc variant="body2">
                                        Enter the final rankings in order from 1st place to last place. Select multiple queens for ties.
                                    </SectionDesc>

                                    <Box sx={{ display: "flex", flexDirection: "column", gap: 1, mt: 1 }}>
                                        {finalRankingRows.map((row, rowIndex) => (
                                            <FinalRankingRow key={`final-${rowIndex}-${row.id}`}>
                                                <PositionLabel>
                                                    {getOrdinal(rowIndex + 1)}
                                                </PositionLabel>
                                                <FormControl fullWidth size="small">
                                                    <InputLabel>Select Queen(s)</InputLabel>
                                                    <Select
                                                        multiple
                                                        value={row.values || []}
                                                        label="Select Queen(s)"
                                                        onChange={(e) => updateFinalRankingValue(row.id, e.target.value)}
                                                        renderValue={(selected) => (
                                                            <ChipWrapper>
                                                                {selected.length === 0 ? (
                                                                    <em style={{ color: '#999' }}>Select queen(s)</em>
                                                                ) : (
                                                                    selected.map((value) => (
                                                                        <Chip key={value} label={value} size="small" />
                                                                    ))
                                                                )}
                                                            </ChipWrapper>
                                                        )}
                                                    >
                                                        {optionsList.map((n, i) => (
                                                            <MenuItem key={`final-${rowIndex}-${row.id}-${i}-${String(n)}`} value={n}>
                                                                <Checkbox checked={(row.values || []).includes(n)} />
                                                                {n}
                                                            </MenuItem>
                                                        ))}
                                                    </Select>
                                                </FormControl>

                                                <DeleteIconButton 
                                                    onClick={() => deleteFinalRankingRow(row.id)}
                                                    size="small"
                                                >
                                                    <DeleteIcon />
                                                </DeleteIconButton>
                                            </FinalRankingRow>
                                        ))}
                                    </Box>
                                </Section>
                                
                                {bonusCategoryRows.length > 0 && (
                                    <Section style={{ marginTop: '24px' }}>
                                        <SectionTitle>Bonus Categories</SectionTitle>
                                        <SectionDesc>
                                            Select the result for each bonus category.
                                        </SectionDesc>

                                        <FlexContainer style={{ gap: '16px' }}>
                                            {bonusCategoryRows.map((bonusRow, idx) => (
                                                <Box key={`bonus-${idx}-${bonusRow.id}`}>
                                                    <BonusCategoryLabel>
                                                        {bonusRow.name} ({bonusRow.points} points)
                                                    </BonusCategoryLabel>
                                                    <FormControl fullWidth size="small">
                                                        <InputLabel>Select Answer{bonusRow.type !== 'Yes/No' ? '(s)' : ''}</InputLabel>
                                                        <Select
                                                            multiple={bonusRow.type !== 'Yes/No'}
                                                            value={bonusRow.type !== 'Yes/No' ? (bonusRow.values || []) : (bonusRow.values?.[0] || '')}
                                                            label={`Select Answer${bonusRow.type !== 'Yes/No' ? '(s)' : ''}`}
                                                            onChange={(e) => {
                                                                if (bonusRow.type !== 'Yes/No') {
                                                                    updateBonusCategoryValue(bonusRow.id, e.target.value);
                                                                } else {
                                                                    updateBonusCategoryValue(bonusRow.id, [e.target.value]);
                                                                }
                                                            }}
                                                            renderValue={(selected) => {
                                                                if (bonusRow.type !== 'Yes/No') {
                                                                    return (
                                                                        <ChipWrapper>
                                                                            {(selected || []).map((value) => (
                                                                                <Chip key={value} label={value} size="small" />
                                                                            ))}
                                                                        </ChipWrapper>
                                                                    );
                                                                }
                                                                return selected;
                                                            }}
                                                        >
                                                            {bonusRow.type === 'Queens' && optionsList.map((n, i) => (
                                                                <MenuItem key={`bonus-${idx}-${i}-${String(n)}`} value={n}>
                                                                    <Checkbox checked={(bonusRow.values || []).includes(n)} />
                                                                    {n}
                                                                </MenuItem>
                                                            ))}
                                                            {bonusRow.type === 'Number' && Array.from({ length: 30 }, (_, i) => i + 1).map((num) => (
                                                                <MenuItem key={`bonus-${idx}-num-${num}`} value={String(num)}>
                                                                    <Checkbox checked={(bonusRow.values || []).includes(String(num))} />
                                                                    {num}
                                                                </MenuItem>
                                                            ))}
                                                            {bonusRow.type === 'Yes/No' && [
                                                                <MenuItem key={`bonus-${idx}-yes`} value="Yes">Yes</MenuItem>,
                                                                <MenuItem key={`bonus-${idx}-no`} value="No">No</MenuItem>
                                                            ]}
                                                        </Select>
                                                    </FormControl>
                                                </Box>
                                            ))}
                                        </FlexContainer>
                                    </Section>
                                )}
                            </>
                        ) : (
                            <>
                                {/* Challenge Winner Section */}
                                <Section>
                                    <SectionTitle>Maxi Challenge Winner</SectionTitle>
                                    <SectionDesc>
                                        Select who won the maxi challenge. Select multiple for ties, or leave empty for no winner.
                                    </SectionDesc>
                                    <FormControl fullWidth size="medium">
                                        <InputLabel>Select Winner(s)</InputLabel>
                                        <Select
                                            multiple
                                            value={challengeWinners}
                                            label="Select Winner(s)"
                                            onChange={(e) => setChallengeWinners(e.target.value)}
                                            renderValue={(selected) => (
                                                <ChipWrapper>
                                                    {selected.length === 0 ? (
                                                        <em style={{ color: '#999' }}>No winner</em>
                                                    ) : (
                                                        selected.map((value) => (
                                                            <Chip key={value} label={value} size="small" />
                                                        ))
                                                    )}
                                                </ChipWrapper>
                                            )}
                                        >
                                            {optionsList.map((queen, i) => (
                                                <MenuItem key={i} value={queen}>
                                                    <Checkbox checked={challengeWinners.includes(queen)} />
                                                    {queen}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </Section>

                                {/* Lip Sync Winner Section */}
                                <Section>
                                    <SectionTitle>Lip Sync Winner</SectionTitle>
                                    <SectionDesc>
                                        Select who won the lip sync. Select multiple for ties, or leave empty for no lip sync.
                                    </SectionDesc>
                                    <FormControl fullWidth size="medium">
                                        <InputLabel>Select Winner(s)</InputLabel>
                                        <Select
                                            multiple
                                            value={lipSyncWinners}
                                            label="Select Winner(s)"
                                            onChange={(e) => setLipSyncWinners(e.target.value)}
                                            renderValue={(selected) => (
                                                <ChipWrapper>
                                                    {selected.length === 0 ? (
                                                        <em style={{ color: '#999' }}>No winner</em>
                                                    ) : (
                                                        selected.map((value) => (
                                                            <Chip key={value} label={value} size="small" />
                                                        ))
                                                    )}
                                                </ChipWrapper>
                                            )}
                                        >
                                            {optionsList.map((queen, i) => (
                                                <MenuItem key={i} value={queen}>
                                                    <Checkbox checked={lipSyncWinners.includes(queen)} />
                                                    {queen}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </Section>

                                {/* Eliminated Queen Section */}
                                <Section>
                                    <SectionTitle>Eliminated Queen(s)</SectionTitle>
                                    <SectionDesc>
                                        Select who was eliminated. Select multiple for ties.
                                    </SectionDesc>
                                    <FormControl fullWidth size="medium">
                                        <InputLabel>Select Eliminated</InputLabel>
                                        <Select
                                            multiple
                                            value={eliminatedQueens}
                                            label="Select Eliminated"
                                            onChange={(e) => setEliminatedQueens(e.target.value)}
                                            renderValue={(selected) => (
                                                <ChipWrapper>
                                                    {selected.length === 0 ? (
                                                        <em style={{ color: '#999' }}>No one eliminated</em>
                                                    ) : (
                                                        selected.map((value) => (
                                                            <Chip key={value} label={value} size="small" />
                                                        ))
                                                    )}
                                                </ChipWrapper>
                                            )}
                                        >
                                            {optionsList.map((queen, i) => (
                                                <MenuItem key={i} value={queen}>
                                                    <Checkbox checked={eliminatedQueens.includes(queen)} />
                                                    {queen}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </Section>
                            </>
                        )}
                    </Box>
                )}
            </StyledDialogContent>

            <StyledDialogActions>
                <Box>
                    {(version === "Weekly Results" || version === "Submissions") && (
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={isFinalEpisode}
                                    onChange={(e) => setIsFinalEpisode(e.target.checked)}
                                    color="primary"
                                />
                            }
                            label="Final Episode?"
                        />
                    )}
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <CancelButton onClick={() => onClose()} variant="outlined">Cancel</CancelButton>
                    <SubmitButton onClick={handleSubmit} variant="contained">Submit</SubmitButton>
                </Box>
            </StyledDialogActions>
        </StyledDialog>
    );
}

SubmissionsPopup.propTypes = {
    open: PropTypes.bool,
    onClose: PropTypes.func,
    onSubmit: PropTypes.func,
    optionsList: PropTypes.array,
    initialVersion: PropTypes.string,
    currentPlayerRankings: PropTypes.array,
    playerData: PropTypes.object,
    leagueData: PropTypes.object,
    userData: PropTypes.object
};
// ...existing code...