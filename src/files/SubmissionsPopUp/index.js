// ...existing code...
import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Alert from "@mui/material/Alert";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import { generateClient } from 'aws-amplify/api';
import { updatePlayer, updateLeague } from "@/graphql/mutations";
import { 
    dialogPaper, 
    section as sectionStyle, 
    sectionText, 
    sectionHeader, 
    sectionTitle, 
    sectionTitleSmall, 
    row as rowStyle, 
    select, 
    list, 
    listItem 
} from "./SubmissionsPopUp.styles";

function makeRow(id) {
    if (id != null) return { id: String(id), value: "" };
    const uid = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}`;
    return { id: uid, value: "" };
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
    // state declarations (mimic CreationPage ordering/style)
    const isOpen = !!open;
    const [version, setVersion] = useState(initialVersion || "Submissions");

    const [submissionRows, setSubmissionRows] = useState(() => [{ ...makeRow(), disabled: false }]);
    const [sections, setSections] = useState([
        { key: "Maxi Challenge Winner", title: "Maxi Challenge Winner", rows: [makeRow()] },
        { key: "Lip Sync Winner", title: "Lip Sync Winner", rows: [makeRow()] },
        { key: "Eliminated Queen", title: "Eliminated Queen", rows: [makeRow()] },
    ]);

    const [firstSwap, setFirstSwap] = useState("");
    const [secondSwap, setSecondSwap] = useState("");
    const [swappedResult, setSwappedResult] = useState([]);
    const [swapsEnabled] = useState(true);
    
    const [errorMessage, setErrorMessage] = useState('');
    
    const [isFinalEpisode, setIsFinalEpisode] = useState(false);
    const [finalRankingRows, setFinalRankingRows] = useState(() => ([
        { ...makeRow(), value: "" },
        { ...makeRow(), value: "" }
    ]));
    const [bonusCategoryRows, setBonusCategoryRows] = useState([]);

    const [threeRows, setThreeRows] = useState(() => ([
        { ...makeRow(), value: "", disabled: false },
        { ...makeRow(), value: "", disabled: false },
        { ...makeRow(), value: "", disabled: false }
    ]));

    // reset when opened or version changes
    useEffect(() => {
        if (!isOpen) return;
        setVersion(initialVersion || "Submissions");
        setSubmissionRows([{ ...makeRow(), disabled: false }]);
        setFirstSwap("");
        setSecondSwap("");
        setSwappedResult([]);
        setErrorMessage('');
        setIsFinalEpisode(false);
        setFinalRankingRows([
            { ...makeRow(), value: "" },
            { ...makeRow(), value: "" }
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
        
        setSections([
            { key: "Maxi Challenge Winner", title: "Maxi Challenge Winner", rows: [makeRow()] },
            { key: "Lip Sync Winner", title: "Lip Sync Winner", rows: [makeRow()] },
            { key: "Eliminated Queen", title: "Eliminated Queen", rows: [makeRow()] },
        ]);
        setThreeRows([
            { ...makeRow(), value: "", disabled: false },
            { ...makeRow(), value: "", disabled: false },
            { ...makeRow(), value: "", disabled: false }
        ]);
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

    const addRowToSection = (sectionKey) => {
        setSections(prev => prev.map(s => {
            if (s.key !== sectionKey) return s;
            return { ...s, rows: [...s.rows, makeRow()] };
        }));
    };

    const deleteRowFromSection = (sectionKey, rowId) => {
        setSections(prev => prev.map(s => {
            if (s.key !== sectionKey) return s;
            const rows = s.rows.filter(r => r.id !== rowId);
            return { ...s, rows };
        }));
    };

    const updateSectionValue = (sectionKey, rowId, value) => {
        setSections(prev => prev.map(s => {
            if (s.key !== sectionKey) return s;
            return { ...s, rows: s.rows.map(r => r.id === rowId ? { ...r, value } : r) };
        }));
    };
    
    const addFinalRankingRow = () => {
        setFinalRankingRows(prev => [...prev, { ...makeRow(), value: "" }]);
    };
    
    const deleteFinalRankingRow = (rowId) => {
        setFinalRankingRows(prev => prev.filter(r => r.id !== rowId));
    };
    
    const updateFinalRankingValue = (rowId, value) => {
        setFinalRankingRows(prev => prev.map(r => r.id === rowId ? { ...r, value } : r));
    };

    const updateBonusCategoryValue = (id, value) => {
        setBonusCategoryRows(prev => prev.map(row => 
            row.id === id ? { ...row, value } : row
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
        if (version === "Weekly Results" && isFinalEpisode && leagueData?.id && Player && Array.isArray(Player)) {
            try {
                const rankings = finalRankingRows.map(r => (r.value || "").trim()).filter(Boolean);
                
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
                    console.log('Player final episode updated:', playerResult);
                    return playerResult;
                });
                
                await Promise.all(updatePromises);
                
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
                    
                    // Only update if we haven't already added a result (check if it has 4 parts already)
                    if (bonusRow && bonusRow.value && bonusRow.value.trim() !== '' && parts.length === 3) {
                        // Append result: name|points|type|result
                        return `${parts[0]}|${parts[1]}|${parts[2]}|${bonusRow.value}`;
                    }
                    // If result already exists or no new result submitted, keep as is
                    return bonusStr;
                });
                
                const currentHistory = leagueData.lgHistory || [];
                const bonusHistoryPart = bonusCategoryRows.filter(r => r.value).length > 0
                    ? '. Bonus results: ' + bonusCategoryRows.filter(r => r.value).map(r => `${r.name}: ${r.value}`).join(', ')
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

        // three / sections mode
        const result = {};
        const hasBlankRows = [];
        
        sections.forEach(s => {
            const allVals = (s.rows || []).map(r => (r.value || "").trim());
            const filledVals = allVals.filter(Boolean);
            
            // Check if there are any blank rows
            if (allVals.length > filledVals.length) {
                hasBlankRows.push(s.title);
            }
            
            result[s.key] = filledVals.join("|");
        });
        
        // Show error if there are blank rows but still proceed with update
        if (hasBlankRows.length > 0) {
            setErrorMessage(`Please delete the blank rows in: ${hasBlankRows.join(', ')}`);
        }
        
        // Update league with weekly results
        if (leagueData?.id && version === "Weekly Results") {
            try {
                const leagueUpdates = {};
                
                // Get current arrays from league data
                const currentChallengeWinners = leagueData.lgChallengeWinners || [];
                const currentLipSyncWinners = leagueData.lgLipSyncWinners || [];
                const currentEliminatedPlayers = leagueData.lgEliminatedPlayers || [];
                
                // Add new entries to the arrays (add blank string if empty)
                leagueUpdates.lgChallengeWinners = [...currentChallengeWinners, result["Maxi Challenge Winner"] || ""];
                leagueUpdates.lgLipSyncWinners = [...currentLipSyncWinners, result["Lip Sync Winner"] || ""];
                leagueUpdates.lgEliminatedPlayers = [...currentEliminatedPlayers, result["Eliminated Queen"] || ""];
                
                const currentHistory = leagueData.lgHistory || [];
                const historyEntry = new Date().toISOString() + '. Weekly results: Challenge Winner: ' + (result["Maxi Challenge Winner"] || 'None') + ', Lip Sync Winner: ' + (result["Lip Sync Winner"] || 'None') + ', Eliminated: ' + (result["Eliminated Queen"] || 'None');
                leagueUpdates.lgHistory = [...currentHistory, historyEntry];
                
                const leagueInput = {
                    id: leagueData.id,
                    ...leagueUpdates
                };
                
                const leagueResult = await client.graphql({
                    query: updateLeague,
                    variables: { input: leagueInput }
                });
                console.log('League weekly results updated:', leagueResult);
                
            } catch (error) {
                console.error('Error updating league weekly results:', error);
            }
        }
        
        if (typeof onSubmit === "function") try { onSubmit({ version, value: result }); } catch {}
        try { onClose(result); } catch { onClose(); }
    };

    // render
    return (
        <Dialog open={isOpen} onClose={() => onClose()} PaperProps={{ sx: dialogPaper }}>
            <DialogTitle>
                <Typography variant="h6">{version === "Submissions" ? "Submissions" : "Weekly Results"}</Typography>
            </DialogTitle>

            <DialogContent dividers>
                {version === "Submissions" && (
                    <Box sx={sectionStyle}>
                        <Typography variant="body2" sx={sectionText}>
                            {isFinalEpisode 
                                ? "Who will win?" 
                                : "Pick one or more submission options from the list. Use \"Pick none\" to opt-out per row."}
                        </Typography>

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
                                            sx={select}
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
                                <Typography sx={sectionTitle}>Swap two names</Typography>
                                <Typography sx={sectionText}>{swapEligibility.message}</Typography>

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
                                    <Typography sx={{ color: "#b71c1c", mt: 1 }}>The two selections must be different.</Typography>
                                )}
                            </Box>
                        )}
                    </Box>
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
                                <Box sx={sectionStyle}>
                                    <Box sx={sectionHeader}>
                                        <Typography sx={sectionTitle}>Final Rankings</Typography>
                                        <Button size="small" variant="outlined" onClick={addFinalRankingRow}>Add</Button>
                                    </Box>
                                    
                                    <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
                                        Enter the final rankings in order from 1st place to last place. The first selection will be the winner.
                                    </Typography>

                                    <Box sx={{ display: "flex", flexDirection: "column", gap: 1, mt: 1 }}>
                                        {finalRankingRows.map((row, rowIndex) => (
                                            <Box key={`final-${rowIndex}-${row.id}`} sx={rowStyle}>
                                                <Typography sx={{ minWidth: '50px', fontWeight: 'bold' }}>
                                                    {getOrdinal(rowIndex + 1)}
                                                </Typography>
                                                <FormControl fullWidth size="small">
                                                    <InputLabel id={`final-${row.id}`}>-- select --</InputLabel>
                                                    <Select
                                                        labelId={`final-${row.id}`}
                                                        value={row.value}
                                                        label="-- select --"
                                                        onChange={(e) => updateFinalRankingValue(row.id, e.target.value)}
                                                    >
                                                        <MenuItem value="" disabled>-- select --</MenuItem>
                                                        {optionsList.map((n, i) => <MenuItem key={`final-${rowIndex}-${row.id}-${i}-${String(n)}`} value={n}>{n}</MenuItem>)}
                                                    </Select>
                                                </FormControl>

                                                <Button size="small" variant="outlined" color="error" onClick={() => deleteFinalRankingRow(row.id)}>
                                                    Delete
                                                </Button>
                                            </Box>
                                        ))}
                                    </Box>
                                </Box>
                                
                                {bonusCategoryRows.length > 0 && (
                                    <Box sx={{ ...sectionStyle, mt: 3 }}>
                                        <Typography sx={sectionTitle}>Bonus Categories</Typography>
                                        <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
                                            Select the result for each bonus category.
                                        </Typography>

                                        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
                                            {bonusCategoryRows.map((bonusRow, idx) => (
                                                <Box key={`bonus-${idx}-${bonusRow.id}`}>
                                                    <Typography sx={{ fontWeight: 'bold', mb: 1 }}>
                                                        {bonusRow.name} ({bonusRow.points} points)
                                                    </Typography>
                                                    <FormControl fullWidth size="small">
                                                        <InputLabel id={`bonus-${bonusRow.id}`}>-- select --</InputLabel>
                                                        <Select
                                                            labelId={`bonus-${bonusRow.id}`}
                                                            value={bonusRow.value}
                                                            label="-- select --"
                                                            onChange={(e) => updateBonusCategoryValue(bonusRow.id, e.target.value)}
                                                        >
                                                            <MenuItem value="" disabled>-- select --</MenuItem>
                                                            {bonusRow.type === 'Queens' && optionsList.map((n, i) => 
                                                                <MenuItem key={`bonus-${idx}-${i}-${String(n)}`} value={n}>{n}</MenuItem>
                                                            )}
                                                            {bonusRow.type === 'Number' && Array.from({ length: 100 }, (_, i) => i + 1).map((num) => 
                                                                <MenuItem key={`bonus-${idx}-num-${num}`} value={String(num)}>{num}</MenuItem>
                                                            )}
                                                            {bonusRow.type === 'Yes/No' && [
                                                                <MenuItem key={`bonus-${idx}-yes`} value="Yes">Yes</MenuItem>,
                                                                <MenuItem key={`bonus-${idx}-no`} value="No">No</MenuItem>
                                                            ]}
                                                        </Select>
                                                    </FormControl>
                                                </Box>
                                            ))}
                                        </Box>
                                    </Box>
                                )}
                            </>
                        ) : (
                            sections.map((section) => (
                                <Box key={section.key} sx={sectionStyle}>
                                    <Box sx={sectionHeader}>
                                        <Typography sx={sectionTitle}>{section.title}</Typography>
                                        <Button size="small" variant="outlined" onClick={() => addRowToSection(section.key)}>Add</Button>
                                    </Box>

                                    <Box sx={{ display: "flex", flexDirection: "column", gap: 1, mt: 1 }}>
                                        {section.rows.map((row, rowIndex) => (
                                            <Box key={`${section.key}-${rowIndex}-${row.id}`} sx={rowStyle}>
                                                <FormControl fullWidth size="small">
                                                    <InputLabel id={`sec-${section.key}-${row.id}`}>-- select --</InputLabel>
                                                    <Select
                                                        labelId={`sec-${section.key}-${row.id}`}
                                                        value={row.value}
                                                        label="-- select --"
                                                        onChange={(e) => updateSectionValue(section.key, row.id, e.target.value)}
                                                    >
                                                        <MenuItem value="" disabled>-- select --</MenuItem>
                                                        {optionsList.map((n, i) => <MenuItem key={`${section.key}-${rowIndex}-${row.id}-${i}-${String(n)}`} value={n}>{n}</MenuItem>)}
                                                    </Select>
                                                </FormControl>

                                                <Button size="small" variant="outlined" color="error" onClick={() => deleteRowFromSection(section.key, row.id)}>
                                                    Delete
                                                </Button>
                                            </Box>
                                        ))}
                                    </Box>
                                </Box>
                            ))
                        )}
                    </Box>
                )}
            </DialogContent>

            <DialogActions sx={{ px: 3, py: 2, justifyContent: 'space-between' }}>
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
                    <Button onClick={() => onClose()} variant="outlined">Cancel</Button>
                    <Button onClick={handleSubmit} variant="contained">Submit</Button>
                </Box>
            </DialogActions>
        </Dialog>
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