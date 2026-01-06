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
import { Typography } from "@mui/material";
import { generateClient } from 'aws-amplify/api';
import { updatePlayer, updateLeague } from "@/graphql/mutations";
import { serverLogInfo, serverLogError, serverLogWarn } from '@/helpers/serverLog';
import { getLeague } from "@/graphql/queries";
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
    const [lipSyncSelected, setLipSyncSelected] = useState('');
    const [eliminatedQueens, setEliminatedQueens] = useState([]);

    const [errorMessage, setErrorMessage] = useState('');

    // Clear warnings and safely call parent onClose
    const safeOnClose = (arg) => {
        try { setErrorMessage(''); } catch (e) {}
        try { onClose(arg); } catch (e) {}
    };

    // Final Episode State (redesigned with multi-select)
    const [isFinalEpisode, setIsFinalEpisode] = useState(false);
    const [finalRankingRows, setFinalRankingRows] = useState(() => ([
        { ...makeRow() },
        { ...makeRow() }
    ]));
    const [bonusCategoryRows, setBonusCategoryRows] = useState([]);

    // Toggle to show/hide eliminated queens
    const [showEliminatedQueens, setShowEliminatedQueens] = useState(false);

    // Get list of eliminated queens from leagueData
    const getEliminatedQueensList = () => {
        if (!leagueData?.lgEliminatedPlayers) return [];
        const eliminated = [];
        leagueData.lgEliminatedPlayers.forEach(entry => {
            // Each entry can be pipe-separated for ties
            const queens = entry.split('|').map(q => q.trim()).filter(q => q);
            eliminated.push(...queens);
        });
        return eliminated;
    };

    // Filter options based on showEliminatedQueens toggle
    const filteredOptionsList = () => {
        if (showEliminatedQueens) {
            return optionsList;
        }
        const eliminatedList = getEliminatedQueensList();
        return optionsList.filter(queen => !eliminatedList.includes(queen));
    };

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
        setShowEliminatedQueens(false);

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

    // Show a warning immediately when admin opens Weekly Results if players are missing submissions
    useEffect(() => {
        if (!isOpen) return;
        if (version !== "Weekly Results") return;
        if (isFinalEpisode) return;
        if (!leagueData?.players) return;

        const submissions = leagueData.lgSubmissions || [];
        const submissionMap = {};
        submissions.forEach(sub => {
            const parts = String(sub || '').split('|').map(s => s.trim());
            if (parts.length === 2) {
                const [queenName, userEmail] = parts;
                if (userEmail) submissionMap[userEmail.toLowerCase()] = queenName;
            }
        });

        const leaguePlayers = leagueData.players || [];
        if (Array.isArray(leaguePlayers) && leaguePlayers.length > 0) {
            const missing = leaguePlayers.filter(player => {
                const pid = String(player.id || '').toLowerCase();
                const pemail = String(player.plEmail || '').toLowerCase();
                return !(submissionMap[pid] || submissionMap[pemail]);
            });
            if (missing.length > 0) {
                const names = missing.map(p => p.plName || p.plEmail || p.id).join(', ');
                setErrorMessage(`Warning: ${missing.length} player(s) have not submitted: ${names}`);
            } else {
                setErrorMessage('');
            }
        }
    }, [isOpen, version, isFinalEpisode, leagueData]);

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
            if (episodesPassed > swapValue) {
                return { allowed: false, message: '' };
            }
            const remaining = swapValue - episodesPassed;
            const isLastChance = remaining === 0;
            return { 
                allowed: true, 
                message: `You can swap two queens positions in your rankings for the first ${swapValue} episode${remaining === 1 ? '' : 's'}. You can only do this once so use it wisely! You will see a reminder when its your last chance to swap. (${remaining} episode${remaining === 1 ? '' : 's'} remaining)`,
                remaining,
                isLastChance
            };
        } else {
            const totalQueens = (leagueData.lgQueenNames || []).length;
            const eliminatedQueens = (leagueData.lgEliminatedPlayers || []).length;
            const remainingQueens = totalQueens - eliminatedQueens;
            
            if (remainingQueens < swapValue) {
                return { allowed: false, message: '' };
            }
            const episodesLeft = remainingQueens - swapValue;
            const isLastChance = episodesLeft === 0;
            return { 
                allowed: true, 
                message: `You can swap until there are ${swapValue} queens remaining. You can only do this once so use it wisely! You will see a reminder when its your last chance to swap. (${episodesLeft} Queen${episodesLeft === 1 ? '' : 's'} left)`,
                remaining: episodesLeft,
                isLastChance
            };
        }
    };
    
    const swapEligibility = checkSwapEligibility();

    

    // Styles for swapped list display (used in the swap preview)
    const list = {
        listStyle: 'none',
        padding: 0,
        margin: 0,
    };

    const listItem = {
        marginBottom: '6px'
    };
    // helpers
    const getSelectedSet = (rows, ignoreIndex = -1) => {
        const s = new Set();
        rows.forEach((r, idx) => {
            if (idx === ignoreIndex) return;
            if (r.disabled) return;
            // Support rows that store selections in `values` (multi-select) or `value` (single-select)
            if (Array.isArray(r.values) && r.values.length > 0) {
                r.values.forEach(v => { if (v) s.add(v); });
            } else if (r.value) {
                s.add(r.value);
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
        return filteredOptionsList().map((opt, i) => (
            <MenuItem key={`${rowIndex}-${i}-${String(opt)}`} value={opt} disabled={selected.has(opt)}>
                {opt}
            </MenuItem>
        ));
    };

    // submit handler
    const handleSubmit = async () => {
        const client = generateClient();
        const isDemo = String(leagueData?.id || '').toLowerCase().includes('demo');
        
        if (version === "Submissions") {
            await serverLogInfo('Weekly picks submission started', { leagueId: leagueData?.id, userId: userData?.id, playerName: playerData?.plName });
            try {
                const dl = leagueData?.lgDeadline ? new Date(leagueData.lgDeadline) : null;
                if (dl && Date.now() >= dl.getTime()) {
                    await serverLogWarn('Weekly picks submission rejected: deadline passed', { leagueId: leagueData?.id, userId: userData?.id, deadline: dl.toISOString() });
                    setErrorMessage('Submission failed: the Maxi Challenge deadline has passed.');
                    return;
                }
            } catch (e) {
                // silently ignore parsing errors and allow submit to proceed in unclear cases
            }

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

                    if (!isDemo) {
                        const playerResult = await client.graphql({
                            query: updatePlayer,
                            variables: { input: playerInput }
                        });
                        await serverLogInfo('Player swap performed', { leagueId: leagueData?.id, playerId: playerData.id, firstSwap: firstSwap, secondSwap: secondSwap });

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
                            await serverLogInfo('League history updated with swap', { leagueId: leagueData.id, playerName: playerData.plName, firstSwap: firstSwap, secondSwap: secondSwap });
                        }
                    } else {
                        // Demo mode: mutate local objects and log instead of network calls
                        if (playerUpdates.plRankings) playerData.plRankings = playerUpdates.plRankings;
                        if (playerUpdates.plSwap) playerData.plSwap = playerUpdates.plSwap;
                        if (playerUpdates.plRankings && leagueData?.id) {
                            const currentHistory = leagueData.lgHistory || [];
                            const historyEntry = new Date().toISOString() + '. ' + (playerData.plName || 'Player') + ' swapped ' + firstSwap + ' with ' + secondSwap;
                            leagueData.lgHistory = [...currentHistory, historyEntry];
                        }
                    }

                } catch (error) {
                    await serverLogError('Error updating player swap', { error: error.message, leagueId: leagueData?.id, playerId: playerData?.id });
                    setErrorMessage('Error updating player.');
                }
            }
            
            // Add submission to league's lgSubmissions array
            if (selected.length > 0 && leagueData?.id && userData?.id) {
                try {
                    const userEmail = userData.id; // User ID is their email

                    // Fetch latest league from server to avoid overwriting other players' submissions
                    let latestLeague = leagueData;
                    try {
                        const leagueRes = await client.graphql({ query: getLeague, variables: { id: leagueData.id } });
                        if (leagueRes && leagueRes.data && leagueRes.data.getLeague) {
                            latestLeague = leagueRes.data.getLeague;
                        }
                    } catch (fetchErr) {
                        await serverLogWarn('Could not fetch latest league before updating submissions', { error: fetchErr.message });
                    }

                    const currentSubmissions = latestLeague.lgSubmissions || [];

                    // Remove any existing submissions from this user (preserve others)
                    const filteredSubmissions = currentSubmissions.filter(submission => {
                        const parts = String(submission || '').split('|').map(s => s.trim());
                        const submissionEmail = parts[1] || '';
                        return (submissionEmail || '').toLowerCase() !== String(userEmail || '').toLowerCase();
                    });

                    // Create new submission entries as "queenName|userEmail"
                    const newSubmissions = selected.map(queenName => `${queenName}|${userEmail}`);

                    // Create history entry for weekly picks submission
                    const currentHistory = latestLeague.lgHistory || [];
                    const hadPrevious = (currentSubmissions || []).some(submission => {
                        const parts = String(submission || '').split('|').map(s => s.trim());
                        const submissionEmail = parts[1] || '';
                        return (submissionEmail || '').toLowerCase() === String(userEmail || '').toLowerCase();
                    });
                    const actionText = hadPrevious ? 'resubmitted weekly pick' : 'submitted weekly pick';
                    const historyEntry = new Date().toISOString() + '. ' + (playerData?.plName) + ' ' + actionText;

                    const leagueInput = {
                        id: leagueData.id,
                        lgSubmissions: [...filteredSubmissions, ...newSubmissions],
                        lgHistory: [...currentHistory, historyEntry]
                    };

                    if (!isDemo) {
                        const leagueResult = await client.graphql({
                            query: updateLeague,
                            variables: { input: leagueInput }
                        });
                        await serverLogInfo('Weekly picks submitted to league', { leagueId: leagueData.id, userId: userEmail, playerName: playerData?.plName, picksCount: selected.length, action: actionText });
                    } else {
                        // Demo: update local league object and log
                        leagueData.lgSubmissions = leagueInput.lgSubmissions;
                        leagueData.lgHistory = leagueInput.lgHistory;
                    }

                } catch (error) {
                    await serverLogError('Error updating league submissions', { error: error.message, leagueId: leagueData?.id, userId: userData?.id });
                    setErrorMessage('Error updating league submissions.');
                }
            }
            
            if (typeof onSubmit === "function") try { onSubmit({ version, value: joined, playerUpdates }); } catch {}
            try { safeOnClose(joined); } catch {}

            // Reload page to show updates (skip reload in demo mode)
            if (!isDemo) {
                window.location.reload();
            }
            return;
        }

        // Handle final episode
        if (version === "Weekly Results" && isFinalEpisode && leagueData?.id) {
            await serverLogInfo('Final episode submission started', { leagueId: leagueData.id, adminName: userData?.name || userData?.id });
            // Ensure admin ranked all remaining queens before allowing final submission
            const eliminatedListForCheck = getEliminatedQueensList();
            const totalQueens = (leagueData.lgQueenNames || []).length;
            const remainingCount = Math.max(0, totalQueens - eliminatedListForCheck.length);
            const providedList = finalRankingRows.flatMap(r => r.values || []).filter(Boolean);
            const uniqueProvided = Array.from(new Set(providedList));
            if (uniqueProvided.length !== remainingCount) {
                await serverLogWarn('Final episode submission validation failed', { leagueId: leagueData.id, provided: uniqueProvided.length, required: remainingCount });
                setErrorMessage(`You ranked ${uniqueProvided.length} of ${remainingCount} remaining queen${remainingCount === 1 ? '' : 's'}. Please rank all remaining queens before submitting the final episode.`);
                return;
            }

            try {
                // Get rankings per row; each row can contain multiple values (ties).
                // Store ties as a single pipe-separated string (same format as challenge/lipSync winners).
                const currentEliminated = leagueData.lgEliminatedPlayers || [];
                const perRow = finalRankingRows
                    .map(r => (r.values || []).filter(Boolean))
                    .filter(arr => Array.isArray(arr) && arr.length > 0);

                // Convert each placement (possibly a tie) into a pipe-separated string
                const rankingsPerRow = perRow.map(arr => arr.join('|'));

                // Add rankings to lgEliminatedPlayers in reverse order (last to first)
                const reversedRankings = [...rankingsPerRow].reverse();
                const updatedEliminated = [...currentEliminated, ...reversedRankings];
                
                // Process lgSubmissions and map to player plWinners
                const submissions = leagueData.lgSubmissions || [];
                const submissionMap = {};
                submissions.forEach(sub => {
                    const parts = sub.split('|').map(s => s.trim());
                    if (parts.length === 2) {
                        const [queenName, userEmail] = parts;
                        if (userEmail) submissionMap[userEmail.toLowerCase()] = queenName;
                    }
                });

                const allPlayers = leagueData.players || [];
                if (Array.isArray(allPlayers)) {
                    const updatePromises = allPlayers.map(async (player) => {
                        const playerIdLower = String(player.id || '').toLowerCase();
                        const playerEmailLower = String(player.plEmail || '').toLowerCase();
                        const submission = submissionMap[playerIdLower] || submissionMap[playerEmailLower] || '';
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
                    await serverLogInfo('Final episode: all player winners updated', { leagueId: leagueData.id, playerCount: allPlayers.length });
                }
                
                // Add 1st place to lgChallengeWinners (handle ties by joining with pipes)
                const currentChallengeWinners = leagueData.lgChallengeWinners || [];
                const firstPlace = perRow.length > 0 ? perRow[0].join('|') : "";
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
                const firstPlaceDisplay = perRow.length > 0 ? perRow[0].join(' & ') : '';
                const historyEntry = new Date().toISOString() + '. Final episode results submitted. Winner: ' + firstPlaceDisplay + bonusHistoryPart;
                
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
                
                if (!isDemo) {
                    await client.graphql({
                        query: updateLeague,
                        variables: { input: leagueInput }
                    });
                    await serverLogInfo('Final episode completed', { leagueId: leagueData.id, winner: firstPlaceDisplay, bonusCategories: bonusCategoryRows.length });
                } else {
                    // Demo: apply updates locally
                    leagueData.lgEliminatedPlayers = updatedEliminated;
                    leagueData.lgChallengeWinners = updatedChallengeWinners;
                    leagueData.lgBonusPoints = updatedBonusPoints;
                    leagueData.lgSubmissions = [];
                    leagueData.lgDeadline = null;
                    leagueData.lgRankingDeadline = null;
                    leagueData.lgFinished = 'finished';
                    leagueData.lgHistory = [...(leagueData.lgHistory || []), historyEntry];
                }
                
            } catch (error) {
                await serverLogError('Error processing final episode', { error: error.message, leagueId: leagueData.id });
                setErrorMessage('Error processing final episode.');
            }
            
            if (typeof onSubmit === "function") try { onSubmit({ version, value: 'final' }); } catch {}
            try { safeOnClose('final'); } catch {}

            // Reload page to show updates
            window.location.reload();
            return;
        }

        // Handle regular weekly results (non-final episode)
        if (leagueData?.id && version === "Weekly Results" && !isFinalEpisode) {
            await serverLogInfo('Weekly results submission started', { leagueId: leagueData.id, adminName: userData?.name || userData?.id, challengeWinners: challengeWinners.length, lipSyncWinners: lipSyncWinners.length, eliminated: eliminatedQueens.length });
            try {
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
                // Ensure every player has submitted a weekly pick before admin submits results
                const leaguePlayers = leagueData.players || [];
                if (Array.isArray(leaguePlayers) && leaguePlayers.length > 0) {
                    const missing = leaguePlayers.filter(player => {
                        const pid = String(player.id || '').toLowerCase();
                        const pemail = String(player.plEmail || '').toLowerCase();
                        return !(submissionMap[pid] || submissionMap[pemail]);
                    });
                    if (missing.length > 0) {
                        const names = missing.map(p => p.plName || p.plEmail || p.id).join(', ');
                        await serverLogWarn('Weekly results submitted with missing player picks', { leagueId: leagueData.id, missingCount: missing.length, missingPlayers: names });
                        // Show a warning but DO NOT block admin from submitting
                        setErrorMessage(`Warning: ${missing.length} player(s) have not submitted: ${names}`);
                    } else {
                        setErrorMessage('');
                    }
                }

                const allPlayers = leagueData.players || [];

                if (Array.isArray(allPlayers) && allPlayers.length > 0) {
                    const updatePromises = allPlayers.map(async (player) => {

                        // Try both player.id and player.plEmail
                        const playerIdLower = player.id?.toLowerCase();
                        const playerEmailLower = player.plEmail?.toLowerCase();

                        const submission = submissionMap[playerIdLower] || submissionMap[playerEmailLower] || '';
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
                    await serverLogInfo('Weekly results: all player winners updated', { leagueId: leagueData.id, playerCount: allPlayers.length });
                } else {
                    await serverLogWarn('No players array found in leagueData or array is empty');
                }

                // If admin selected a lip sync winner but didn't press +, include it now (unless blank)
                const effectiveLipSyncWinners = (() => {
                    try {
                        const base = Array.isArray(lipSyncWinners) ? [...lipSyncWinners] : [];
                        if (lipSyncSelected && String(lipSyncSelected).trim() !== '' && !base.includes(lipSyncSelected) && !eliminatedQueens.includes(lipSyncSelected)) {
                            base.push(lipSyncSelected);
                        }
                        return base;
                    } catch (e) {
                        return Array.isArray(lipSyncWinners) ? lipSyncWinners : [];
                    }
                })();

                // Get current arrays from league data
                const currentChallengeWinners = leagueData.lgChallengeWinners || [];
                const currentLipSyncWinners = leagueData.lgLipSyncWinners || [];
                const currentEliminatedPlayers = leagueData.lgEliminatedPlayers || [];

                // Join multi-selected values with pipes
                const challengeWinnersStr = challengeWinners.join('|') || "";
                const lipSyncWinnersStr = (effectiveLipSyncWinners || []).join('|') || "";
                const eliminatedQueensStr = eliminatedQueens.join('|') || "";

                // Calculate next week's deadline (7 days from current deadline)
                let nextWeekDeadline = null;
                if (leagueData.lgDeadline) {
                    const currentDeadline = new Date(leagueData.lgDeadline);
                    currentDeadline.setDate(currentDeadline.getDate() + 7);
                    nextWeekDeadline = currentDeadline.toISOString();
                }

                // Add new entries to the arrays and clear lgSubmissions
                const leagueUpdates = {
                    lgChallengeWinners: [...currentChallengeWinners, challengeWinnersStr],
                    lgLipSyncWinners: [...currentLipSyncWinners, lipSyncWinnersStr],
                    // Only append eliminated entry when there's an actual value
                    lgEliminatedPlayers: (eliminatedQueensStr && String(eliminatedQueensStr).trim() !== '') ? [...currentEliminatedPlayers, eliminatedQueensStr] : [...currentEliminatedPlayers],
                    lgSubmissions: [],
                    lgDeadline: nextWeekDeadline
                };

                const currentHistory = leagueData.lgHistory || [];
                const historyEntry = new Date().toISOString() + '. Weekly results: Challenge Winner: ' + (challengeWinners.join(' & ') || 'None') + ', Lip Sync Winner: ' + (lipSyncWinners.join(' & ') || 'None') + ', Eliminated: ' + (eliminatedQueens.join(' & ') || 'None');
                leagueUpdates.lgHistory = [...currentHistory, historyEntry];

                const leagueInput = {
                    id: leagueData.id,
                    ...leagueUpdates
                };

                if (!isDemo) {
                    await client.graphql({
                        query: updateLeague,
                        variables: { input: leagueInput }
                    });
                    await serverLogInfo('Weekly results submitted to league', { leagueId: leagueData.id, challengeWinners: challengeWinners.join(' & '), lipSyncWinners: (effectiveLipSyncWinners || []).join(' & '), eliminated: eliminatedQueens.join(' & '), nextDeadline: nextWeekDeadline });
                } else {
                    // Demo: apply updates locally
                    leagueData.lgChallengeWinners = leagueUpdates.lgChallengeWinners;
                    leagueData.lgLipSyncWinners = leagueUpdates.lgLipSyncWinners;
                    leagueData.lgEliminatedPlayers = leagueUpdates.lgEliminatedPlayers;
                    leagueData.lgSubmissions = leagueUpdates.lgSubmissions;
                    leagueData.lgDeadline = leagueUpdates.lgDeadline;
                    leagueData.lgHistory = [...(leagueData.lgHistory || []), historyEntry];
                }

            } catch (error) {
                await serverLogError('Error updating league weekly results', { error: error.message, leagueId: leagueData?.id });
                setErrorMessage('Error submitting weekly results');
                return;
            }

            if (typeof onSubmit === "function") try { onSubmit({ version, value: 'weekly' }); } catch {}
            try { safeOnClose('weekly'); } catch {}

            // Reload page to show updates (skip in demo)
            if (!isDemo) {
                window.location.reload();
            }
        }
    };

    // render
    return (
        <StyledDialog open={isOpen} onClose={() => safeOnClose()} maxWidth="sm" fullWidth>
            <StyledDialogTitle>
                {version === "Submissions" ? "Submit Weekly Pick" : "Submit Weekly Results"}
            </StyledDialogTitle>

            <StyledDialogContent>
                {version === "Submissions" && (
                    <Section>
                        {(Number(leagueData?.lgChallengePoints || 0) > 0) && (
                            <>
                                <SectionDesc variant="body2">
                                    {isFinalEpisode 
                                        ? "Who will win the season?" 
                                        : "Who will win this week's Maxi Challenge?"}
                                </SectionDesc>

                                <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, mt: 1 }}>
                                    {submissionRows.map((row, idx) => (
                                        <Box key={`submission-${idx}-${row.id}`} sx={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                                            <FormControl fullWidth variant="outlined" size="small" disabled={row.disabled}>
                                                <InputLabel id={`label-${row.id}`}>-- Queens --</InputLabel>
                                                <Select
                                                    labelId={`label-${row.id}`}
                                                    value={row.value}
                                                    label="-- Queens --"
                                                    onChange={(e) => updateSubmissionRow(idx, { value: e.target.value })}
                                                >
                                                    <MenuItem value="" disabled>-- Queens --</MenuItem>
                                                    {renderOptionsFor(submissionRows, idx)}
                                                </Select>
                                            </FormControl>
                                        </Box>
                                    ))}
                                    <Alert severity="info">Your pick will not be visible to you or others in the submission tab until the results are submitted so nobody will see who you picked until everyone picks.</Alert>
                                </Box>
                            </>)}
                        {swapEligibility.allowed && (!playerData?.plSwap || String(playerData.plSwap).trim() === '') && (
                            <Box sx={{ mt: 2 }}>
                                <SectionTitle>Do you want to swap two queens?</SectionTitle>
                                <SectionDesc>{swapEligibility.message}</SectionDesc>

                                {swapEligibility?.isLastChance && swapEligibility?.allowed && (
                                    <Box sx={{ mt: 1, mb: 1, p: 1.5, borderRadius: 2, display: 'flex', gap: 1, alignItems: 'center', background: '#fff0f6', border: '1px solid #ffb3d9' }}>
                                        <Box component="span" sx={{ fontSize: 20 }}>🌟</Box>
                                        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                                            <Typography variant="subtitle2" sx={{ fontWeight: 700, lineHeight: 1 }}>Last chance to swap!</Typography>
                                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>This is your final opportunity to swap two queens — use it wisely 💖</Typography>
                                        </Box>
                                    </Box>
                                )}

                                <Box sx={{ display: "flex", gap: 2, mt: 1 }}>
                                    <FormControl fullWidth size="small">
                                        <InputLabel id="first-swap-label">Queen #1</InputLabel>
                                        <Select
                                            labelId="first-swap-label"
                                            value={firstSwap}
                                            label="Queen #1"
                                            onChange={(e) => setFirstSwap(e.target.value)}
                                        >
                                            <MenuItem value="">None</MenuItem>
                                            {(optionsList || []).map((opt, i) => <MenuItem key={`first-${i}-${String(opt)}`} value={opt}>{opt}</MenuItem>)}
                                        </Select>
                                    </FormControl>

                                    <FormControl fullWidth size="small">
                                        <InputLabel id="second-swap-label">Queen #2</InputLabel>
                                        <Select
                                            labelId="second-swap-label"
                                            value={secondSwap}
                                            label="Queen #2"
                                            onChange={(e) => setSecondSwap(e.target.value)}
                                        >
                                            <MenuItem value="">None</MenuItem>
                                            {(optionsList || []).map((opt, i) => <MenuItem key={`second-${i}-${String(opt)}`} value={opt} disabled={opt === firstSwap}>{opt}</MenuItem>)}
                                        </Select>
                                    </FormControl>
                                </Box>

                                {firstSwap && secondSwap && firstSwap !== secondSwap && (
                                    <Box sx={{ mt: 2 }}>
                                        <Typography variant="subtitle2">Your new rankings</Typography>
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
                                <Alert severity={errorMessage.startsWith('Warning:') ? "warning" : "error"}>{errorMessage}</Alert>
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
                                        Enter the final rankings of the season. Select multiple queens for ties.
                                    </SectionDesc>

                                    <Box sx={{ display: "flex", flexDirection: "column", gap: 1, mt: 1 }}>
                                        {finalRankingRows.map((row, rowIndex) => {
                                            const selectedSet = getSelectedSet(finalRankingRows, rowIndex);
                                            return (
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
                                                            {filteredOptionsList().map((n, i) => (
                                                                <MenuItem key={`final-${rowIndex}-${row.id}-${i}-${String(n)}`} value={n} disabled={selectedSet.has(n)}>
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
                                            );
                                        })}
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
                                                            {bonusRow.type === 'Queens' && (optionsList || []).map((n, i) => (
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
                                        Select who won the maxi challenge this week. Select multiple for ties, or leave empty if nobody won.
                                    </SectionDesc>
                                    <FormControl fullWidth size="medium">
                                        <InputLabel>Select Winner(s)</InputLabel>
                                        <Select
                                            multiple
                                            value={challengeWinners}
                                            label="Select Winner(s)"
                                            onChange={(e) => {
                                                const newChallenges = e.target.value || [];
                                                setChallengeWinners(newChallenges);
                                                // remove any newly-chosen challenge winners from eliminated list
                                                setEliminatedQueens(prev => (Array.isArray(prev) ? prev.filter(q => !newChallenges.includes(q)) : prev));
                                            }}
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
                                            {filteredOptionsList().map((queen, i) => {
                                                const disabled = eliminatedQueens.includes(queen);
                                                return (
                                                    <MenuItem key={i} value={queen} disabled={disabled}>
                                                        <Checkbox checked={challengeWinners.includes(queen)} />
                                                        {queen}
                                                    </MenuItem>
                                                );
                                            })}
                                        </Select>
                                    </FormControl>
                                </Section>

                                {/* Lip Sync Winner Section */}
                                <Section>
                                    <SectionTitle>Lip Sync Winner</SectionTitle>
                                    <SectionDesc>
                                        Select who won the lip sync. Don&apos;t forget to press the + to add their names after selecting them. Select multiple for ties, or leave empty for no lip sync wins. if a queen won multiple times in the same episode, add her name multiple times.
                                    </SectionDesc>
                                    <FormControl fullWidth size="medium">
                                        <InputLabel id="lip-sync-select-label">Add Winner</InputLabel>
                                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                                            <Select
                                                labelId="lip-sync-select-label"
                                                value={lipSyncSelected}
                                                label="Add Winner"
                                                onChange={(e) => setLipSyncSelected(e.target.value)}
                                                sx={{ flex: 1 }}
                                            >
                                                <MenuItem value="">-- Select --</MenuItem>
                                                {filteredOptionsList().map((queen, i) => {
                                                    const disabled = eliminatedQueens.includes(queen);
                                                    return (
                                                        <MenuItem key={i} value={queen} disabled={disabled}>
                                                            {queen}
                                                        </MenuItem>
                                                    );
                                                })}
                                            </Select>
                                            <AddButton size="small" onClick={() => {
                                                if (!lipSyncSelected) return;
                                                if (eliminatedQueens.includes(lipSyncSelected)) return;
                                                setLipSyncWinners(prev => [...prev, lipSyncSelected]);
                                                // if this queen was previously selected as eliminated, remove that eliminated selection
                                                setEliminatedQueens(prev => (Array.isArray(prev) ? prev.filter(q => q !== lipSyncSelected) : prev));
                                                setLipSyncSelected('');
                                            }}>
                                                <AddIcon />
                                            </AddButton>
                                        </Box>

                                        <ChipWrapper sx={{ mt: 1 }}>
                                            {lipSyncWinners.length === 0 ? (
                                                <em style={{ color: '#999' }}>No winner</em>
                                            ) : (
                                                lipSyncWinners.map((value, idx) => (
                                                    <Box key={`${value}-${idx}`} sx={{ display: 'inline-flex', mr: 0.5 }}>
                                                        <Chip label={value} size="small" />
                                                        <DeleteIconButton size="small" onClick={() => {
                                                            // remove only the specific instance at idx
                                                            setLipSyncWinners(prev => prev.filter((_, i) => i !== idx));
                                                        }}>
                                                            <DeleteIcon fontSize="small" />
                                                        </DeleteIconButton>
                                                    </Box>
                                                ))
                                            )}
                                        </ChipWrapper>
                                    </FormControl>
                                </Section>

                                {/* Eliminated Queen Section */}
                                <Section>
                                    <SectionTitle>Eliminated Queen(s)</SectionTitle>
                                    <SectionDesc>
                                        Select the queen(s) that got eliminated. Select multiple for ties.
                                    </SectionDesc>
                                    <FormControl fullWidth size="medium">
                                        <InputLabel>Select Eliminated</InputLabel>
                                        <Select
                                            multiple
                                            value={eliminatedQueens}
                                            label="Select Eliminated"
                                            onChange={(e) => {
                                                const newElims = e.target.value || [];
                                                setEliminatedQueens(newElims);
                                                // ensure eliminated queens are removed from challenge and lip sync winners
                                                setChallengeWinners(prev => (Array.isArray(prev) ? prev.filter(q => !newElims.includes(q)) : prev));
                                                setLipSyncWinners(prev => (Array.isArray(prev) ? prev.filter(q => !newElims.includes(q)) : prev));
                                            }}
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
                                            {filteredOptionsList().map((queen, i) => {
                                                const disabled = challengeWinners.includes(queen) || lipSyncWinners.includes(queen);
                                                return (
                                                    <MenuItem key={i} value={queen} disabled={disabled}>
                                                        <Checkbox checked={eliminatedQueens.includes(queen)} />
                                                        {queen}
                                                    </MenuItem>
                                                );
                                            })}
                                        </Select>
                                    </FormControl>
                                </Section>
                            </>
                        )}
                    </Box>
                )}
            </StyledDialogContent>
            {errorMessage && (
                <Box sx={{ mt: 2 }}>
                    <Alert severity={errorMessage.startsWith('Warning:') ? 'warning' : 'error'}>{errorMessage}</Alert>
                </Box>
            )}
            <StyledDialogActions>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    {(version === "Weekly Results" || version === "Submissions") && (
                        <>
                            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
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
                                {version === "Weekly Results" && (
                                    <Typography variant="caption" sx={{ color: 'text.secondary', ml: 5 }}>
                                        Mark if this submission is for the season finale (rank all remaining queens & enter the bonus results).
                                    </Typography>
                                )}
                            </Box>

                            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                                <FormControlLabel
                                    control={
                                        <Checkbox
                                            checked={showEliminatedQueens}
                                            onChange={(e) => setShowEliminatedQueens(e.target.checked)}
                                            color="secondary"
                                        />
                                    }
                                    label="Show Eliminated Queens"
                                />
                                <Typography variant="caption" sx={{ color: 'text.secondary', ml: 5 }}>
                                    If the eleminated queens are back to compete for whatever reason.
                                </Typography>
                            </Box>
                        </>
                    )}
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <CancelButton onClick={() => safeOnClose()} variant="text" size="small" sx={{ padding: '6px 10px', textTransform: 'none', fontWeight: 600 }}>
                        Cancel
                    </CancelButton>
                    <SubmitButton onClick={handleSubmit} variant="text" size="small" sx={{ padding: '6px 10px', textTransform: 'none', fontWeight: 600, '&.Mui-disabled': { color: 'text.disabled' } }}>
                        Submit
                    </SubmitButton>
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