import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { serverLogError, serverLogInfo } from '@/helpers/serverLog';
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
import ErrorPopup from '../ErrorPopUp';

import { updateLeague, updatePlayer } from '@/graphql/mutations';
import {
    Container,
    ContentWrapper,
    Title,
    
    // existing styled components
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

// Small inline warning banner used across Admin Edit screens
function AdminWarningBanner() {
    return (
        <Box sx={{ mt: 1, mb: 2, p: 2, borderRadius: 1, background: 'linear-gradient(90deg, rgba(255,243,205,0.9), rgba(255,236,229,0.9))', border: '1px solid rgba(255,193,7,0.2)', textAlign: 'center' }}>
            <Typography sx={{ fontWeight: 700, color: '#8a5800', mb: 0.5 }}>Powerful Admin Tool — Use With Caution</Typography>
            <Typography variant="body2" sx={{ color: '#6b4a00' }}>
                This interface lets you make direct edits to league and player data. Only use these controls when necessary — incorrect changes can produce unexpected or wonky results. If something unexpected happens after editing, contact me through the <Link href="/Support" style={{ color: '#6b4a00', textDecoration: 'underline' }}>Support</Link> page for help.
            </Typography>
        </Box>
    );
}

const client = generateClient();

function getOrdinal(n) {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

export default function AdminEditPage({ leagueData, allPlayers, currentPlayer, userData, onUpdate }) {
    const router = useRouter();
    const [mode, setMode] = useState(null); // 'league' or 'player'
    const [errorPopup, setErrorPopup] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [selectedPlayer, setSelectedPlayer] = useState(null);
    const [showSummary, setShowSummary] = useState(false);
    const [changes, setChanges] = useState({});
    const [submitting, setSubmitting] = useState(false);

    // League editing state
    const [editedEliminatedPlayers, setEditedEliminatedPlayers] = useState([]);
    const [editedChallengeWinners, setEditedChallengeWinners] = useState([]);
    const [editedLipSyncWinners, setEditedLipSyncWinners] = useState([]);
    // League metadata state
    const [editedLgName, setEditedLgName] = useState('');
    const [editedLgDescription, setEditedLgDescription] = useState('');
    const [editedChallengePoints, setEditedChallengePoints] = useState(null);
    const [editedLipSyncPoints, setEditedLipSyncPoints] = useState(null);
    const [editedBonusPoints, setEditedBonusPoints] = useState([]);
    const [editedLgSwapType, setEditedLgSwapType] = useState('');
    const [editedLgSwapPoints, setEditedLgSwapPoints] = useState('');
    const [editedLgDeadline, setEditedLgDeadline] = useState('');

    // Player editing state
    const [editedRankings, setEditedRankings] = useState([]);
    const [editedWinners, setEditedWinners] = useState([]);
    const [editedBonuses, setEditedBonuses] = useState([]);
    const [editedPlName, setEditedPlName] = useState('');

    const allQueens = leagueData?.lgQueenNames || [];

    // Initialize league editing
    const handleEditLeague = () => {
        setEditedEliminatedPlayers([...(leagueData.lgEliminatedPlayers || [])]);
        setEditedChallengeWinners([...(leagueData.lgChallengeWinners || [])]);
        setEditedLipSyncWinners([...(leagueData.lgLipSyncWinners || [])]);
        setEditedLgName(leagueData.lgName || '');
        setEditedLgDescription(leagueData.lgDescription || '');
        setEditedChallengePoints(leagueData.lgChallengePoints ?? null);
        setEditedLipSyncPoints(leagueData.lgLipSyncPoints ?? null);
        setEditedBonusPoints([...(leagueData.lgBonusPoints || [])]);
        // parse lgSwap (format: type|points) and ensure numeric state for points
        const swapRaw = (leagueData.lgSwap || '').trim();
        if (!swapRaw) {
            setEditedLgSwapType('');
            setEditedLgSwapPoints('');
        } else {
            // split but keep empty parts so we can detect a trailing '|'
            const rawParts = swapRaw.split('|').map(s => s.trim());
            const swapParts = rawParts.filter((p) => p !== undefined && p !== null && p !== '');
            let parsedType = '';
            let parsedPoints;

            // Legacy numeric-only (e.g., "3")
            if (swapParts.length === 1 && !isNaN(parseInt(swapParts[0], 10)) && rawParts.length === 1) {
                parsedType = '';
                parsedPoints = parseInt(swapParts[0], 10);
            } else {
                // Expect format "Type|Points" or "Type|"
                parsedType = swapParts[0] || '';
                if (rawParts.length > 1 && rawParts[1] !== '' && !isNaN(parseInt(rawParts[1], 10))) {
                    parsedPoints = parseInt(rawParts[1], 10);
                } else {
                    parsedPoints = undefined; // keep empty state when no explicit points provided
                }
            }

            setEditedLgSwapType(parsedType);
            setEditedLgSwapPoints(parsedPoints !== undefined ? parsedPoints : '');

            // Auto-fill a sensible default when type exists but points are missing
            if ((parsedPoints === undefined || parsedPoints === '') && parsedType) {
                let defaultPoints = '';
                if (parsedType === 'NumberOfEpisodes') {
                    const weeks = Math.max((leagueData.lgChallengeWinners || []).length, (leagueData.lgLipSyncWinners || []).length);
                    defaultPoints = weeks > 0 ? weeks : '';
                } else if (parsedType === 'NumberOfQueensRemaining') {
                    defaultPoints = allQueens.length || '';
                }
                if (defaultPoints !== '') {
                    setEditedLgSwapPoints(defaultPoints);
                }
            }
        }
        setEditedLgDeadline(leagueData.lgDeadline || '');
        setMode('league');
    };

    // Initialize player editing
    const handleEditPlayer = (player) => {
        setSelectedPlayer(player);
        setEditedRankings([...(player.plRankings || [])]);
        setEditedWinners([...(player.plWinners || [])]);
        setEditedBonuses([...(player.plBonuses || [])]);
        setEditedPlName(player.plName || '');
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

        // Check league metadata fields
        if ((leagueData.lgName || '') !== (editedLgName || '')) {
            changes.lgName = { original: leagueData.lgName || '', new: editedLgName || '' };
        }
        if ((leagueData.lgDescription || '') !== (editedLgDescription || '')) {
            changes.lgDescription = { original: leagueData.lgDescription || '', new: editedLgDescription || '' };
        }
        if ((leagueData.lgChallengePoints ?? null) !== (editedChallengePoints ?? null)) {
            changes.lgChallengePoints = { original: leagueData.lgChallengePoints ?? null, new: editedChallengePoints ?? null };
        }
        if ((leagueData.lgLipSyncPoints ?? null) !== (editedLipSyncPoints ?? null)) {
            changes.lgLipSyncPoints = { original: leagueData.lgLipSyncPoints ?? null, new: editedLipSyncPoints ?? null };
        }
        if (JSON.stringify(leagueData.lgBonusPoints || []) !== JSON.stringify(editedBonusPoints || [])) {
            changes.lgBonusPoints = { original: leagueData.lgBonusPoints || [], new: editedBonusPoints || [] };
        }
        const composedSwap = editedLgSwapType ? `${editedLgSwapType}|${editedLgSwapPoints}` : '';
        if ((leagueData.lgSwap || '') !== (composedSwap || '')) {
            changes.lgSwap = { original: leagueData.lgSwap || '', new: composedSwap || '' };
        }
        if ((leagueData.lgDeadline || '') !== (editedLgDeadline || '')) {
            changes.lgDeadline = { original: leagueData.lgDeadline || '', new: editedLgDeadline || '' };
        }

        return changes;
    };

    // Detect changes for player
    const getPlayerChanges = () => {
        const changes = {};
        // Check player name
        if (selectedPlayer && (selectedPlayer.plName || '') !== (editedPlName || '')) {
            changes.plName = { original: selectedPlayer.plName || '', new: editedPlName || '' };
        }
        
        // Check rankings (normalize to total queens so blank->filled is detected)
        const totalQueens = allQueens.length || 0;
        const originalRankingsRaw = selectedPlayer.plRankings || [];
        const normalizedOriginalRankings = (originalRankingsRaw && originalRankingsRaw.length) ? originalRankingsRaw.slice() : Array.from({ length: totalQueens }, () => '');
        const normalizedEditedRankings = (editedRankings && editedRankings.length) ? editedRankings.slice() : Array.from({ length: totalQueens }, () => '');
        if (JSON.stringify(normalizedOriginalRankings) !== JSON.stringify(normalizedEditedRankings)) {
            changes.rankings = {
                original: normalizedOriginalRankings,
                new: normalizedEditedRankings,
            };
        }

        // Check winners (normalize to number of challenge weeks)
        const numWeeks = Array.isArray(leagueData?.lgChallengeWinners) ? leagueData.lgChallengeWinners.length : 0;
        const originalWinnersRaw = selectedPlayer.plWinners || [];
        const normalizedOriginalWinners = (originalWinnersRaw && originalWinnersRaw.length) ? originalWinnersRaw.slice() : Array.from({ length: numWeeks }, () => '');
        const normalizedEditedWinners = (editedWinners && editedWinners.length) ? editedWinners.slice() : Array.from({ length: numWeeks }, () => '');
        if (JSON.stringify(normalizedOriginalWinners) !== JSON.stringify(normalizedEditedWinners)) {
            changes.winners = {
                original: normalizedOriginalWinners,
                new: normalizedEditedWinners,
            };
        }

        // Check bonuses (normalize to league bonus categories)
        const bonusPoints = leagueData?.lgBonusPoints || [];
        const bonusArr = Array.isArray(bonusPoints) ? bonusPoints : (bonusPoints ? [bonusPoints] : []);
        const originalBonusesRaw = selectedPlayer.plBonuses || [];
        const normalizedOriginalBonuses = (originalBonusesRaw && originalBonusesRaw.length) ? originalBonusesRaw.slice() : bonusArr.map(bp => {
            const cat = String(bp || '').split('|')[0] || '';
            return `${cat}|`;
        });
        const normalizedEditedBonuses = (editedBonuses && editedBonuses.length) ? editedBonuses.slice() : bonusArr.map(bp => {
            const cat = String(bp || '').split('|')[0] || '';
            return `${cat}|`;
        });
        if (JSON.stringify(normalizedOriginalBonuses) !== JSON.stringify(normalizedEditedBonuses)) {
            changes.bonuses = {
                original: normalizedOriginalBonuses,
                new: normalizedEditedBonuses,
            };
        }

        return changes;
    };

    // Validate league entries: eliminated players must not be empty
    const validateLeague = () => {
        const errors = [];
        const entries = editedEliminatedPlayers || [];
        entries.forEach((entry, idx) => {
            if (!entry || entry.trim() === '') {
                errors.push(`Placement ${idx + 1} is empty.`);
            }
        });
        return { valid: errors.length === 0, errors };
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
            await serverLogError('Error submitting changes', { error: error.message, leagueId: leagueData?.id });
            setErrorMessage('Error submitting changes. Please try again.');
            setErrorPopup(true);
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

        // Format league metadata changes (name, description, points, bonuses, swap, deadline)
        if (changes.lgName) {
            changeDetails.push(`Changed League Name from ${changes.lgName.original || '(empty)'} to ${changes.lgName.new || '(empty)'}`);
        }
        if (changes.lgDescription) {
            changeDetails.push(`Changed League Description`);
        }
        if (changes.lgChallengePoints) {
            changeDetails.push(`Changed Challenge Points from ${changes.lgChallengePoints.original} to ${changes.lgChallengePoints.new}`);
        }
        if (changes.lgLipSyncPoints) {
            changeDetails.push(`Changed Lip Sync Points from ${changes.lgLipSyncPoints.original} to ${changes.lgLipSyncPoints.new}`);
        }
        if (changes.lgBonusPoints) {
            const orig = changes.lgBonusPoints.original || [];
            const next = changes.lgBonusPoints.new || [];
            next.forEach((n, idx) => {
                const o = orig[idx] || '';
                if (o !== n) {
                    const oParts = (o || '').split('|');
                    const nParts = (n || '').split('|');
                    const category = nParts[0] || oParts[0] || `Bonus ${idx+1}`;
                    const oldPoints = oParts[1] || '(none)';
                    const newPoints = nParts[1] || '(none)';
                    changeDetails.push(`Changed "${category}" bonus points from ${oldPoints} to ${newPoints}`);
                }
            });
        }
        if (changes.lgSwap) {
            changeDetails.push(`Changed Swap Rules from ${changes.lgSwap.original || '(empty)'} to ${changes.lgSwap.new || '(empty)'}`);
        }
        if (changes.lgDeadline) {
            const fmt = (s) => s ? new Date(s).toLocaleString() : '(empty)';
            changeDetails.push(`Changed Submission Deadline from ${fmt(changes.lgDeadline.original)} to ${fmt(changes.lgDeadline.new)}`);
        }

        const currentHistory = leagueData.lgHistory || [];
        const adminName = currentPlayer?.plName || 'Admin';
        let composedSwap = '';
        if (editedLgSwapType) composedSwap = `${editedLgSwapType}|${editedLgSwapPoints}`;
        else if (editedLgSwapPoints !== '' && editedLgSwapPoints !== null && editedLgSwapPoints !== undefined) composedSwap = String(editedLgSwapPoints);

        const leagueInput = {
            id: leagueData.id,
            lgEliminatedPlayers: editedEliminatedPlayers,
            lgChallengeWinners: editedChallengeWinners,
            lgLipSyncWinners: editedLipSyncWinners,
            lgName: editedLgName,
            lgDescription: editedLgDescription,
            lgChallengePoints: editedChallengePoints,
            lgLipSyncPoints: editedLipSyncPoints,
            lgBonusPoints: editedBonusPoints,
            lgSwap: composedSwap,
            lgDeadline: editedLgDeadline,
        };

        // Append league history only when there are change details
        if (changeDetails.length > 0) {
            const historyEntry = `${new Date().toISOString()}. [ADMIN EDIT] Admin ${adminName} edited league entries: ${changeDetails.join('; ')}`;
            leagueInput.lgHistory = [...currentHistory, historyEntry];
        }

        await client.graphql({
            query: updateLeague,
            variables: { input: leagueInput }
        });
        await serverLogInfo('Admin edited league settings', { leagueId: leagueData.id, leagueName: leagueData.lgName, adminName, changeCount: changeDetails.length });
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
        const displayPlayerName = editedPlName || selectedPlayer.plName;

        // Update player
        const playerInput = {
            id: selectedPlayer.id,
            leagueId: selectedPlayer.leagueId,
            plName: editedPlName,
            plRankings: editedRankings,
            plWinners: editedWinners,
            plBonuses: editedBonuses,
        };

        await client.graphql({
            query: updatePlayer,
            variables: { input: playerInput }
        });
        await serverLogInfo('Admin edited player data', { playerId: selectedPlayer.id, playerName: displayPlayerName, leagueId: leagueData.id });

        // Name change (add after updates so it's always recorded if present)
        if (changes.plName) {
            changeDetails.push(`Changed player name from ${changes.plName.original || '(empty)'} to ${changes.plName.new || '(empty)'}`);
        }

        // Update league history only if we have change details to record
        if (changeDetails.length > 0) {
            const historyEntry = `${new Date().toISOString()}. [ADMIN EDIT] Admin ${adminName} edited player ${displayPlayerName}'s entries: ${changeDetails.join('; ')}`;
            const leagueInput = {
                id: leagueData.id,
                lgHistory: [...currentHistory, historyEntry],
            };

            await client.graphql({
                query: updateLeague,
                variables: { input: leagueInput }
            });
            await serverLogInfo('Admin edit recorded in league history', { leagueId: leagueData.id, playerName: displayPlayerName, adminName });
        }
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
                                    {(() => {
                                        const origArr = changes.eliminatedPlayers.original || [];
                                        const newArr = changes.eliminatedPlayers.new || [];
                                        const maxLen = Math.max(origArr.length, newArr.length);
                                        const items = [];
                                        for (let i = 0; i < maxLen; i++) {
                                            const orig = origArr[i] || '';
                                            const newVal = newArr[i] || '';
                                            if (orig !== newVal) {
                                                items.push(
                                                    <SummaryItem key={i}>
                                                        Episode {i + 1}: <ChangeIndicator>{formatQueenNames(orig)}</ChangeIndicator> → <ChangeIndicator>{formatQueenNames(newVal)}</ChangeIndicator>
                                                    </SummaryItem>
                                                );
                                            }
                                        }
                                        return items;
                                    })()}
                                </SummarySection>
                            )}
                            {changes.challengeWinners && (
                                <SummarySection>
                                    <SummaryTitle>Challenge Winners Changes:</SummaryTitle>
                                    {(() => {
                                        const origArr = changes.challengeWinners.original || [];
                                        const newArr = changes.challengeWinners.new || [];
                                        const maxLen = Math.max(origArr.length, newArr.length);
                                        const items = [];
                                        for (let i = 0; i < maxLen; i++) {
                                            const orig = origArr[i] || '';
                                            const newVal = newArr[i] || '';
                                            if (orig !== newVal) {
                                                items.push(
                                                    <SummaryItem key={i}>
                                                        Episode {i + 1}: <ChangeIndicator>{formatQueenNames(orig)}</ChangeIndicator> → <ChangeIndicator>{formatQueenNames(newVal)}</ChangeIndicator>
                                                    </SummaryItem>
                                                );
                                            }
                                        }
                                        return items;
                                    })()}
                                </SummarySection>
                            )}
                            {changes.lipSyncWinners && (
                                <SummarySection>
                                    <SummaryTitle>Lip Sync Winners Changes:</SummaryTitle>
                                    {(() => {
                                        const origArr = changes.lipSyncWinners.original || [];
                                        const newArr = changes.lipSyncWinners.new || [];
                                        const maxLen = Math.max(origArr.length, newArr.length);
                                        const items = [];
                                        for (let i = 0; i < maxLen; i++) {
                                            const orig = origArr[i] || '';
                                            const newVal = newArr[i] || '';
                                            if (orig !== newVal) {
                                                items.push(
                                                    <SummaryItem key={i}>
                                                        Episode {i + 1}: <ChangeIndicator>{formatQueenNames(orig)}</ChangeIndicator> → <ChangeIndicator>{formatQueenNames(newVal)}</ChangeIndicator>
                                                    </SummaryItem>
                                                );
                                            }
                                        }
                                        return items;
                                    })()}
                                </SummarySection>
                            )}
                            {changes.lgName && (
                                <SummarySection>
                                    <SummaryTitle>League Name</SummaryTitle>
                                    <SummaryItem>
                                        <ChangeIndicator>{changes.lgName.original || '(empty)'}</ChangeIndicator> → <ChangeIndicator>{changes.lgName.new || '(empty)'}</ChangeIndicator>
                                    </SummaryItem>
                                </SummarySection>
                            )}
                            {changes.lgDescription && (
                                <SummarySection>
                                    <SummaryTitle>Description</SummaryTitle>
                                    <SummaryItem>
                                        <ChangeIndicator>{changes.lgDescription.original || '(empty)'}</ChangeIndicator> → <ChangeIndicator>{changes.lgDescription.new || '(empty)'}</ChangeIndicator>
                                    </SummaryItem>
                                </SummarySection>
                            )}
                            {changes.lgChallengePoints && (
                                <SummarySection>
                                    <SummaryTitle>Challenge Points</SummaryTitle>
                                    <SummaryItem>
                                        <ChangeIndicator>{String(changes.lgChallengePoints.original)}</ChangeIndicator> → <ChangeIndicator>{String(changes.lgChallengePoints.new)}</ChangeIndicator>
                                    </SummaryItem>
                                </SummarySection>
                            )}
                            {changes.lgLipSyncPoints && (
                                <SummarySection>
                                    <SummaryTitle>Lip Sync Points</SummaryTitle>
                                    <SummaryItem>
                                        <ChangeIndicator>{String(changes.lgLipSyncPoints.original)}</ChangeIndicator> → <ChangeIndicator>{String(changes.lgLipSyncPoints.new)}</ChangeIndicator>
                                    </SummaryItem>
                                </SummarySection>
                            )}
                            {changes.lgBonusPoints && (
                                <SummarySection>
                                    <SummaryTitle>Bonus Points</SummaryTitle>
                                    {changes.lgBonusPoints.original.map((orig, idx) => {
                                        const newVal = changes.lgBonusPoints.new[idx];
                                        if (orig !== newVal) {
                                            const parse = (s) => {
                                                const parts = (s || '').split('|');
                                                return { category: parts[0] || '(unknown)', points: parts[1] || '(none)' };
                                            };
                                            const o = parse(orig);
                                            const n = parse(newVal);
                                            return (
                                                <SummaryItem key={idx}>
                                                    <ChangeIndicator>{o.category}: {o.points} points</ChangeIndicator> → <ChangeIndicator>{n.category}: {n.points} points</ChangeIndicator>
                                                </SummaryItem>
                                            );
                                        }
                                        return null;
                                    })}
                                </SummarySection>
                            )}
                            {changes.lgSwap && (
                                <SummarySection>
                                    <SummaryTitle>Swap Rules</SummaryTitle>
                                    {(() => {
                                        const fmt = (s, isOriginal = false) => {
                                            if (!s) return '(empty)';
                                            const parts = s.split('|');
                                            if (parts.length === 1) {
                                                // legacy numeric-only
                                                return `Swap Number: ${parts[0]}`;
                                            }
                                            const [type, val] = parts;
                                            // If val is missing, try to extract a number from the original string as fallback
                                            let displayVal = val;
                                            if ((!displayVal || displayVal === '') && typeof s === 'string') {
                                                const m = s.match(/(\d+)/);
                                                if (m) displayVal = m[1];
                                            }
                                            // If still missing and we're formatting the original value, derive from league data
                                            if ((!displayVal || displayVal === '') && isOriginal) {
                                                if (type === 'NumberOfEpisodes') {
                                                    const weeks = Math.max((leagueData.lgChallengeWinners || []).length, (leagueData.lgLipSyncWinners || []).length);
                                                    if (weeks > 0) displayVal = String(weeks);
                                                } else if (type === 'NumberOfQueensRemaining') {
                                                    const q = (leagueData.lgQueenNames || []).length;
                                                    if (q > 0) displayVal = String(q);
                                                }
                                            }
                                            if (type === 'NumberOfEpisodes') return `Number of Episodes: ${displayVal || '(not set)'}`;
                                            if (type === 'NumberOfQueensRemaining') return `Number of Queens Remaining: ${displayVal || '(not set)'}`;
                                            return s;
                                        };
                                        return (
                                            <SummaryItem>
                                                <ChangeIndicator>{fmt(changes.lgSwap.original, true)}</ChangeIndicator> → <ChangeIndicator>{fmt(changes.lgSwap.new, false)}</ChangeIndicator>
                                            </SummaryItem>
                                        );
                                    })()}
                                </SummarySection>
                            )}
                            {changes.lgDeadline && (
                                <SummarySection>
                                    <SummaryTitle>Weekly SubmissionDeadline</SummaryTitle>
                                    <SummaryItem>
                                        <ChangeIndicator>{changes.lgDeadline.original ? (new Date(changes.lgDeadline.original)).toLocaleString() : '(empty)'}</ChangeIndicator> → <ChangeIndicator>{changes.lgDeadline.new ? (new Date(changes.lgDeadline.new)).toLocaleString() : '(empty)'}</ChangeIndicator>
                                    </SummaryItem>
                                </SummarySection>
                            )}
                        </>
                    ) : (
                        <>
                            {changes.plName && (
                                <SummarySection>
                                    <SummaryTitle>Player Name</SummaryTitle>
                                    <SummaryItem>
                                        <ChangeIndicator>{changes.plName.original || '(empty)'}</ChangeIndicator> → <ChangeIndicator>{changes.plName.new || '(empty)'}</ChangeIndicator>
                                    </SummaryItem>
                                </SummarySection>
                            )}
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
                            These changes will be recorded in the league history.
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
                        <Title>Admin Editing Page</Title>
                        <ChoiceContainer>
                            <ChoiceCard onClick={handleEditLeague}>
                                <ChoiceTitle>Edit League Entries</ChoiceTitle>
                                <ChoiceDescription>
                                Modify eliminated queens, challenge winners, lip sync winners, and more!
                                </ChoiceDescription>
                            </ChoiceCard>
                            <ChoiceCard onClick={() => setMode('player-select')}>
                                <ChoiceTitle>Edit Player Entries</ChoiceTitle>
                                <ChoiceDescription>
                                Modify a specific player&apos;s rankings, weekly picks, and bonus predictions
                                </ChoiceDescription>
                            </ChoiceCard>
                        </ChoiceContainer>
                        <AdminWarningBanner />
                    </ContentWrapper>
                </Container>
                <ErrorPopup open={errorPopup} onClose={() => setErrorPopup(false)} message={errorMessage} />
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
                        <AdminWarningBanner />
                        <PlayerListContainer>
                            {allPlayers.map(player => (
                                <PlayerCard key={player.id} onClick={() => handleEditPlayer(player)}>
                                    <PlayerName>{player.plName}</PlayerName>
                                </PlayerCard>
                            ))}
                        </PlayerListContainer>
                    </ContentWrapper>
                </Container>
                <ErrorPopup open={errorPopup} onClose={() => setErrorPopup(false)} message={errorMessage} />
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
                        <AdminWarningBanner />
                    
                        <EditorContainer>
                            {(() => {
                                const leagueValidation = validateLeague();
                                return leagueValidation.errors.length > 0 ? (
                                    <Box sx={{ mb: 2 }}>
                                        {leagueValidation.errors.map((err, i) => (
                                            <Typography key={i} sx={{ color: 'error.main', fontSize: '0.95rem' }}>{err}</Typography>
                                        ))}
                                    </Box>
                                ) : null;
                            })()}
                            <Section>
                                <SectionTitle>League Settings</SectionTitle>
                                <Typography variant="body2" sx={{ mb: 2, color: '#666', fontSize: '0.9rem' }}>
                                    Edit basic league details and scoring rules.
                                </Typography>
                                <EntryRow>
                                    <EntryLabel>League Name:</EntryLabel>
                                    <TextField fullWidth value={editedLgName} onChange={(e) => setEditedLgName(e.target.value)} />
                                </EntryRow>
                                <EntryRow>
                                    <EntryLabel>Description:</EntryLabel>
                                    <TextField fullWidth multiline rows={2} value={editedLgDescription} onChange={(e) => setEditedLgDescription(e.target.value)} />
                                </EntryRow>
                                <EntryRow>
                                    <EntryLabel>Challenge Points:</EntryLabel>
                                    <TextField type="number" value={editedChallengePoints ?? ''} onChange={(e) => setEditedChallengePoints(e.target.value === '' ? null : parseInt(e.target.value, 10))} />
                                    <EntryLabel sx={{ ml: 2 }}>Lip Sync Points:</EntryLabel>
                                    <TextField type="number" value={editedLipSyncPoints ?? ''} onChange={(e) => setEditedLipSyncPoints(e.target.value === '' ? null : parseInt(e.target.value, 10))} />
                                </EntryRow>
                                <SectionTitle sx={{ mt: 2 }}>Bonus Points</SectionTitle>
                                {editedBonusPoints.map((bp, idx) => {
                                    const parts = bp.split('|');
                                    const category = parts[0] || '';
                                    const points = parts[1] || '';
                                    const btype = parts[2] || 'queens';
                                    return (
                                        <EntryRow key={idx} sx={{ alignItems: 'center' }}>
                                            <EntryLabel sx={{ flex: 1, minWidth: 220 }}>{category}</EntryLabel>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <Typography sx={{ whiteSpace: 'nowrap', color: '#333' }}>Points:</Typography>
                                                <FormControl sx={{ minWidth: 160 }}>
                                                    <Select
                                                        displayEmpty
                                                        value={points || ''}
                                                        onChange={(e) => {
                                                            const next = [...editedBonusPoints];
                                                            next[idx] = `${category}|${e.target.value}|${btype}`;
                                                            setEditedBonusPoints(next);
                                                        }}
                                                    >
                                                        <MenuItem value="" disabled>Points</MenuItem>
                                                        {Array.from({ length: 30 }, (_, i) => i + 1).map((number) => (
                                                            <MenuItem key={number} value={number}>{number}</MenuItem>
                                                        ))}
                                                    </Select>
                                                </FormControl>
                                            </Box>
                                        </EntryRow>
                                    );
                                })}
                                <EntryRow sx={{ mt: 2 }}>
                                    <EntryLabel>Swap Rules:</EntryLabel>
                                    <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' }, alignItems: 'center', width: '100%' }}>
                                        <FormControl sx={{ minWidth: { xs: '100%', sm: 200 }, width: { xs: '100%', sm: 'auto' } }}>
                                            <Select
                                                displayEmpty
                                                value={editedLgSwapType}
                                                onChange={(e) => { setEditedLgSwapType(e.target.value); setEditedLgSwapPoints(''); }}
                                            >
                                                <MenuItem value="" disabled>Type</MenuItem>
                                                <MenuItem value="NumberOfEpisodes">Number of Episodes</MenuItem>
                                                <MenuItem value="NumberOfQueensRemaining">Number of Queens remaining</MenuItem>
                                            </Select>
                                        </FormControl>
                                        <FormControl sx={{ minWidth: { xs: '100%', sm: 120 }, width: { xs: '100%', sm: 'auto' } }}>
                                            <Select
                                                displayEmpty
                                                value={editedLgSwapPoints ?? ''}
                                                onChange={(e) => setEditedLgSwapPoints(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                                            >
                                                <MenuItem value="" disabled>Number</MenuItem>
                                                {(editedLgSwapType === 'NumberOfQueensRemaining'
                                                    ? (allQueens.length > 0 ? Array.from({ length: allQueens.length }, (_, i) => i + 1) : [0])
                                                    : Array.from({ length: 30 }, (_, i) => i + 1)
                                                ).map((number) => (
                                                    <MenuItem key={number} value={number}>{number}</MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                    </Box>
                                </EntryRow>
                                <EntryRow>
                                    <EntryLabel>Deadline:</EntryLabel>
                                    <TextField
                                        type="datetime-local"
                                        value={editedLgDeadline ? editedLgDeadline.slice(0, 16) : ''}
                                        onChange={(e) => setEditedLgDeadline(e.target.value ? new Date(e.target.value).toISOString() : '')}
                                    />
                                </EntryRow>
                            </Section>
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
                                    // Treat an empty entry as a single (placeholder) slot so placement
                                    // calculations show the correct ordinal immediately after adding.
                                    const queensInThisEntryCount = Math.max(1, queensInThisEntry.length);
                                
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
                                
                                    const isEmpty = !entry || entry.trim() === '';
                                    return (
                                        <EntryRow key={index} sx={isEmpty ? { borderColor: 'error.main', background: 'rgba(255, 0, 0, 0.03)' } : {}}>
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
                                            {isEmpty && (
                                                <Typography sx={{ color: 'error.main', ml: 1, fontSize: '0.85rem' }}>Required</Typography>
                                            )}
                                        </EntryRow>
                                    );
                                })}
                                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
                                    <ConfirmButton
                                        variant="outlined"
                                        onClick={() => {
                                            const totalQueens = allQueens.length || 0;
                                            if ((editedEliminatedPlayers || []).length >= totalQueens) return;
                                            setEditedEliminatedPlayers([...editedEliminatedPlayers, '']);
                                        }}
                                        startIcon={<AddIcon />}
                                        disabled={(editedEliminatedPlayers || []).length >= (allQueens.length || 0)}
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
                                    disabled={Object.keys(getLeagueChanges()).length === 0 || !validateLeague().valid}
                                >
                                Review Changes
                                </ConfirmButton>
                            </ActionButtons>
                        </EditorContainer>
                    </ContentWrapper>
                </Container>
                <ErrorPopup open={errorPopup} onClose={() => setErrorPopup(false)} message={errorMessage} />
                {renderSummaryDialog()}
            </>
        );
    }

    // Render player editor
    if (mode === 'player' && selectedPlayer) {
        const totalQueens = allQueens.length;
        const validatePlayer = () => {
            const errors = [];
            if (!editedRankings || editedRankings.length === 0) {
                errors.push('Elimination order cannot be empty.');
            } else {
                editedRankings.forEach((entry, idx) => {
                    if (!entry || entry.trim() === '') {
                        const placement = totalQueens - idx;
                        errors.push(`${getOrdinal(placement)} place is empty.`);
                    }
                });
            }
            return { valid: errors.length === 0, errors };
        };

        const handleRankingChange = (index, value) => {
            const total = totalQueens || 0;
            const base = (editedRankings && editedRankings.length) ? editedRankings.slice() : Array.from({ length: total }, () => '');
            // ensure length covers the index
            while (base.length < total) base.push('');
            // Clear any other occurrences of this queen to prevent duplication
            for (let i = 0; i < base.length; i++) {
                if (i !== index && base[i] === value) base[i] = '';
            }
            base[index] = value;
            setEditedRankings(base);
        };
        
        return (
            <>
                <Container>
                    <ContentWrapper>
                        <BackButton variant="outlined" onClick={() => { setMode('player-select'); setSelectedPlayer(null); setChanges({}); }}>
                        ← Back to Player List
                        </BackButton>
                        <Title>Edit {editedPlName || selectedPlayer.plName}&apos;s Entries</Title>
                        <AdminWarningBanner />
                    
                        <EditorContainer>
                            <EntryRow>
                                <EntryLabel>Player Name:</EntryLabel>
                                <TextField fullWidth value={editedPlName} onChange={(e) => setEditedPlName(e.target.value)} />
                            </EntryRow>
                            <Section>
                                <SectionTitle>Elimination Order Rankings (First Eliminated to Winner)</SectionTitle>
                                <Typography variant="body2" sx={{ mb: 2, color: '#666', fontSize: '0.9rem' }}>
                                Edit the player&apos;s predicted elimination order from first eliminated to winner.
                                </Typography>
                                {(() => {
                                    const playerValidation = validatePlayer();
                                    const displayRankings = (editedRankings && editedRankings.length) ? editedRankings : Array.from({ length: totalQueens }, () => '');
                                    return [...displayRankings].reverse().map((queen, reversedIndex) => {
                                        const index = displayRankings.length - 1 - reversedIndex;
                                        // Calculate placement from total queens
                                        const placement = totalQueens - index;
                                        const isEmpty = !queen || queen.trim() === '';
                                        return (
                                            <EntryRow key={index} sx={isEmpty ? { borderColor: 'error.main', background: 'rgba(255, 0, 0, 0.03)' } : {}}>
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
                                                {isEmpty && (
                                                    <Typography sx={{ color: 'error.main', ml: 1, fontSize: '0.85rem' }}>Required</Typography>
                                                )}
                                            </EntryRow>
                                        );
                                    });
                                })()}

                            </Section>

                            <Section>
                                <SectionTitle>Weekly Winners Predictions</SectionTitle>
                                <Typography variant="body2" sx={{ mb: 2, color: '#666', fontSize: '0.9rem' }}>
                                Edit the player&apos;s weekly challenge winner predictions.
                                </Typography>
                                {(() => {
                                    const numWeeks = Array.isArray(leagueData?.lgChallengeWinners) ? leagueData.lgChallengeWinners.length : 0;
                                    const displayWinners = (editedWinners && editedWinners.length) ? editedWinners : Array.from({ length: numWeeks }, () => '');
                                    return [...displayWinners].reverse().map((entry, reversedIndex) => {
                                        const index = displayWinners.length - 1 - reversedIndex;
                                        return (
                                            <EntryRow key={index}>
                                                <EntryLabel>Week {index + 1}:</EntryLabel>
                                                <FormControl fullWidth>
                                                    <Select
                                                        value={entry || ''}
                                                        onChange={(e) => {
                                                            const base = displayWinners.slice();
                                                            base[index] = e.target.value;
                                                            setEditedWinners(base);
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
                                    });
                                })()}
                            </Section>

                            <Section>
                                <SectionTitle>Bonus Predictions</SectionTitle>
                                <Typography variant="body2" sx={{ mb: 2, color: '#666', fontSize: '0.9rem' }}>
                                Edit the player&apos;s bonus category predictions.
                                </Typography>
                                {(() => {
                                    const bonusPoints = leagueData?.lgBonusPoints || [];
                                    const bonusArr = Array.isArray(bonusPoints) ? bonusPoints : bonusPoints ? [bonusPoints] : [];
                                    const displayBonuses = (editedBonuses && editedBonuses.length) ? editedBonuses : bonusArr.map(bp => {
                                        const cat = String(bp || '').split('|')[0] || '';
                                        return `${cat}|`;
                                    });

                                    return displayBonuses.map((entry, index) => {
                                        const parts = String(entry || '').split('|');
                                        const category = parts[0] || '';
                                        const answer = parts[1] || '';

                                        const matchingBonus = bonusArr.find(bp => String(bp || '').split('|')[0] === category);
                                        const bonusType = matchingBonus ? String((matchingBonus.split('|')[2] || '')).toLowerCase().trim() : 'queens';

                                        return (
                                            <EntryRow key={index}>
                                                <EntryLabel>{category}:</EntryLabel>
                                                <FormControl fullWidth>
                                                    {bonusType === 'number' ? (
                                                        <Select
                                                            value={answer || ''}
                                                            onChange={(e) => {
                                                                const next = displayBonuses.slice();
                                                                next[index] = `${category}|${e.target.value}`;
                                                                setEditedBonuses(next);
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
                                                                const next = displayBonuses.slice();
                                                                next[index] = `${category}|${e.target.value}`;
                                                                setEditedBonuses(next);
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
                                                                const next = displayBonuses.slice();
                                                                next[index] = `${category}|${e.target.value}`;
                                                                setEditedBonuses(next);
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
                                    });
                                })()}
                            </Section>

                            <ActionButtons>
                                <CancelButton variant="outlined" onClick={handleBack}>
                                Cancel
                                </CancelButton>
                                <ConfirmButton
                                    variant="contained"
                                    onClick={handlePreviewChanges}
                                    disabled={Object.keys(getPlayerChanges()).length === 0 || !validatePlayer().valid}
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
