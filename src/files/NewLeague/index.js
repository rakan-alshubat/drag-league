import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { generateClient } from 'aws-amplify/api'
import { fetchAuthSession } from 'aws-amplify/auth';
import { SESClient, SendTemplatedEmailCommand } from '@aws-sdk/client-ses';
import { serverLogInfo, serverLogError, serverLogWarn } from '@/helpers/serverLog';
import { createPlayer, updateLeague, deleteLeague, createUsers, updateUsers, deletePlayer, updatePlayer } from '@/graphql/mutations';
import { getUsers, playersByLeagueId, listUsers } from '@/graphql/queries';
import { filterPipeCharacter } from "@/helpers/filterPipeChar";
import { Box, Typography, IconButton, Tooltip, TextField, Alert, InputAdornment, Button } from "@mui/material";
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import PersonAddAltSharpIcon from '@mui/icons-material/PersonAddAltSharp';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import PeopleIcon from '@mui/icons-material/People';
import RuleIcon from '@mui/icons-material/Rule';
import GroupAddIcon from '@mui/icons-material/GroupAdd';
import EditIcon from '@mui/icons-material/Edit';
import EmailIcon from '@mui/icons-material/Email';
import PopUp from "@/files/PopUp";
import Countdown from "@/files/Countdown";
import {
    PageContainer,
    Title,
    HeroBanner,
    HeroText,
    InfoBanner,
    ActionRow,
    PrimaryButton,
    SecondaryButton,
    DangerButton,
    CardSection,
    SectionHeader,
    GridLayout,
    GridCard,
    GridCardText,
    QueenNameText,
    TableContainer,
    TableHeaderRowCurrent,
    TableHeaderRowPending,
    TableHeaderCell,
    TableRowCurrent,
    TableRowPending,
    TableCell,
    StatusChip,
    EmptyState,
    EmptyStateText,
    InviteText,
    BottomActionBar,
    InviteSectionHeader,
    InviteSectionTitle
} from "./NewLeague.styles";

const DEADLINE_CHECK_INTERVAL_MS = 60000; // Check deadline every 60 seconds

export default function NewLeague( userData ) {

    const League = userData.leagueData
    const User = userData.userData
    const Player = userData.playersData

    const router = useRouter();
    const client = generateClient();

    const [userEmail, setUserEmail] = useState(User?.id || '');
    const [isAdmin, setIsAdmin] = useState(false);
    const [deadlineHandled, setDeadlineHandled] = useState(false);

    // Keep local userEmail and isAdmin in sync when props update (fixes invite button visibility)
    useEffect(() => {
        const normalized = String(User?.id || '').toLowerCase().trim();
        setUserEmail(normalized);

        try {
            const admins = Array.isArray(League?.lgAdmin) ? League.lgAdmin : [];
            const normalizedAdmins = admins.map(a => String(a || '').toLowerCase().trim());
            setIsAdmin(normalized && normalizedAdmins.includes(normalized));
        } catch (e) {
            setIsAdmin(false);
        }
    }, [User?.id, League?.lgAdmin]);

    

    const [confirmOpen, setConfirmOpen] = useState(false);
    const [confirmLoading, setConfirmLoading] = useState(false);
    const [popUpTitle, setPopUpTitle] = useState('');
    const [popUpDescription, setPopUpDescription] = useState('');
    const [popUpNameInput, setPopUpNameInput] = useState('');
    const [popUpEmailInput, setPopUpEmailInput] = useState('');
    const [popUpError, setPopUpError] = useState('');
    const [popUpCopySuccess, setPopUpCopySuccess] = useState('');
    const [inviteProcessed, setInviteProcessed] = useState(false);

    const [pickedPlayer, setPickedPlayer] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [shareCopySuccess, setShareCopySuccess] = useState('');
    
    // Announcement state
    const [emailPopupOpen, setEmailPopupOpen] = useState(false);
    const [emailMessage, setEmailMessage] = useState('');
    const [emailError, setEmailError] = useState('');
    const [emailSending, setEmailSending] = useState(false);
    const [emailSuccess, setEmailSuccess] = useState('');

    useEffect(() => {
        if (!League?.lgRankingDeadline || League?.lgFinished === 'active') return;

        const checkDeadline = () => {
            if (deadlineHandled) return;
            const deadlineDate = new Date(League.lgRankingDeadline);
            const now = new Date();

            if (now >= deadlineDate) {
                const currentHistory = League.lgHistory || [];
                const historyEntry = new Date().toISOString() + '. Ranking deadline passed - league automatically started';

                (async () => {
                    try {
                        // fetch players for this league
                        const playersResult = await client.graphql({ query: playersByLeagueId, variables: { leagueId: League.id, limit: 1000 } });
                        const players = playersResult?.data?.playersByLeagueId?.items || [];

                        // delete players who didn't submit
                        const toDelete = players.filter(p => !p.plRankings || (Array.isArray(p.plRankings) && p.plRankings.length === 0));
                        const adminEmails = Array.isArray(League?.lgAdmin) ? League.lgAdmin.map(a => String(a || '').toLowerCase().trim()) : [];
                        for (const p of toDelete) {
                            const targetEmail = String(p.plEmail || p.id || '').toLowerCase().trim();
                            if (targetEmail && adminEmails.includes(targetEmail)) {

                                continue;
                            }

                            try {
                                await client.graphql({ query: deletePlayer, variables: { input: { id: p.id } } });
                            } catch (e) {
                                serverLogWarn('Failed to delete player during auto-start cleanup', { playerId: p.id, error: e.message });
                            }

                            // remove league from user's leagues array if present
                            try {
                                if (targetEmail) {
                                    const userRes = await client.graphql({ query: getUsers, variables: { id: targetEmail } });
                                    const userObj = userRes?.data?.getUsers;
                                    if (userObj) {
                                        const userLeagues = Array.isArray(userObj.leagues) ? userObj.leagues.slice() : [];
                                        const filteredLeagues = userLeagues.filter(entry => {
                                            const parts = String(entry || '').split('|').map(s => s.trim());
                                            return parts[1] !== League.id;
                                        });
                                        if (filteredLeagues.length !== userLeagues.length) {
                                            await client.graphql({ query: updateUsers, variables: { input: { id: userObj.id, leagues: filteredLeagues } } });
                                        }
                                    }
                                }
                            } catch (e) {
                                serverLogWarn('Failed to update user record during auto-start cleanup', { playerId: p.id, error: e.message });
                            }
                        }

                        // Also remove this league from any users' pendingLeagues so they no longer see it as pending
                        try {
                            const pendingList = Array.isArray(League.lgPendingPlayers) ? League.lgPendingPlayers.slice() : [];
                            for (const raw of pendingList) {
                                try {
                                    if (!raw) continue;
                                    const parts = String(raw || '').split('|').map(s => s.trim()).filter(Boolean);
                                    const email = parts.length >= 2 ? (parts[1] || '') : String(raw || '').trim();
                                    const normalized = String(email || '').toLowerCase();
                                    if (!normalized) continue;
                                    const userRes = await client.graphql({ query: getUsers, variables: { id: normalized } });
                                    const userObj = userRes?.data?.getUsers;
                                    if (userObj) {
                                        const existingPending = Array.isArray(userObj.pendingLeagues) ? userObj.pendingLeagues.slice() : [];
                                        const filteredPending = existingPending.filter(pid => pid !== League.id);
                                        if (filteredPending.length !== existingPending.length) {
                                            await client.graphql({ query: updateUsers, variables: { input: { id: userObj.id, pendingLeagues: filteredPending } } });
                                        }
                                    }
                                } catch (e) {
                                    serverLogWarn('Failed to remove pending league from user during auto-start cleanup', { rawData: raw, error: e.message });
                                }
                            }
                        } catch (e) {
                            serverLogWarn('Failed to process pending users during auto-start cleanup', { error: e.message });
                        }

                        const result = await client.graphql({
                            query: updateLeague,
                            variables: {
                                input: {
                                    id: League.id,
                                    lgFinished: 'active',
                                    lgPendingPlayers: [],
                                    lgHistory: [...currentHistory, historyEntry]
                                }
                            }
                        });
                        serverLogInfo('League auto-started', { leagueId: League.id, leagueName: League.lgName });
                        setDeadlineHandled(true);
                        return;
                    } catch (err) {
                        serverLogError('Error auto-starting league (cleanup)', { error: err.message });
                    }
                })();
            }
        };

        checkDeadline();
        const interval = setInterval(checkDeadline, DEADLINE_CHECK_INTERVAL_MS);

        return () => clearInterval(interval);
    }, [League?.lgRankingDeadline, League?.lgFinished, League?.id, isAdmin, client, router]);

    const currentPlayerData = () => {
        if (Player && Array.isArray(Player)) {
            return Player.map((player) => {
                const emailRaw = player.plEmail || player.id || '';
                const row = {
                    name: player.plName,
                    role: player.plStatus,
                    submitted: player.plRankings ? 'Submitted' : 'Pending',
                    email: String(emailRaw).toLowerCase()
                };
                return row;
            });
        }
        return [];
    }

    const pendingPlayerData = () => {
        let pendingPlayers = []
        League?.lgPendingPlayers?.forEach((player) => {
            const pl = player.split('|').map(s => s.trim()).filter(Boolean)
            if (pl.length >= 3) {
                pendingPlayers.push({
                    name: pl[2],
                    status: pl[0],
                    email: pl[1]
                });
            }
        });
        return pendingPlayers
    }

    const rules = () => {
        const swap = League?.lgSwap?.split('|').map(s => s.trim()).filter(Boolean) || []
        return [
            (League?.lgChallengePoints > 0 ? `Predicting the weekly Maxi Challenge winners is worth <strong>${League?.lgChallengePoints} points</strong>` : 'Predicting weekly Maxi Challenge winners is disabled'),
            (League?.lgChallengePoints > 0 ? `The deadline to submit weekly Maxi Challenge predictions is <strong>${formatDeadline(League?.lgDeadline)}</strong>` : ``),
            (League?.lgLipSyncPoints > 0 ? `Predicting the Lip Sync Assassin is worth <strong>${League?.lgLipSyncPoints} points</strong>` : 'Predicting the Lip Sync Assassin is disabled'),
            (League?.lgSwap === '' || !League?.lgSwap ? 'The admin has disabled swaps for this season' : `Swaps will happen ${swap[0] === 'NumberOfEpisodes' ? `after <strong>${swap[1]} Episodes</strong>` : `when there are <strong>${swap[1]} Queens remaining</strong>`}`),
            (League?.lgPublic ? `The league is <strong>public</strong> and visible to anyone with the link` : `The league is <strong>private</strong> and only visible to players`),
        ]
    }

    const formatDeadline = (iso) => {
        if (!iso) return '';
        try {
            const d = new Date(iso);
            if (Number.isNaN(d.getTime())) return iso;
            const day = d.toLocaleDateString(undefined, { weekday: 'long' });
            const time = d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
            return `${day}s at ${time}`;
        } catch (e) {
            return iso;
        }
    };

    const bonusRules = () => {
        let bonuses = []
        League?.lgBonusPoints?.forEach((bonus) => {
            const bonusInfo = bonus.split('|').map(s => s.trim()).filter(Boolean)
            if (bonusInfo.length >= 2) {
                bonuses.push(`${bonusInfo[0]} — <strong>${bonusInfo[1]} points</strong>`)
            }
        })
        return bonuses
    }

    const handlePlayerSubmit = (name) => {
        const query = name ? `?displayName=${encodeURIComponent(name)}` : '';
        router.push(`/Rank/${League.id}${query}`)
    };

    const handleAcceptRequest = (player) => {
        setPopUpTitle('Accept player?')
        setPopUpDescription(<InviteSectionTitle>{player.name} has requested to join. Do you want to accept them?</InviteSectionTitle>)
        setPickedPlayer(player.email)
        setDisplayName(player.name)
        setConfirmOpen(true)
    };

    const handleDeclineRequest = (player) => {
        setPopUpTitle('Decline player?')
        setPopUpDescription(<InviteSectionTitle>Decline {player.name}&apos;s request to join?</InviteSectionTitle>)
        setPickedPlayer(player.email)
        setDisplayName(player.name)
        setConfirmOpen(true)
    };

    const handleKickRequest = (player) => {
        setPopUpTitle('Revoke invite?')
        setPopUpDescription(<InviteSectionTitle>Revoke the invite for {player.name}? They will no longer be able to accept the invitation.</InviteSectionTitle>)
        setPickedPlayer(player.email)
        setDisplayName(player.name)
        setConfirmOpen(true)
    };

    const handleRemovePlayer = (player) => {
        setPopUpTitle('Kick player?')
        setPopUpDescription(<InviteSectionTitle>Remove {player.name} from the league? This will delete their submissions and all their data from the league.</InviteSectionTitle>)
        setPickedPlayer(player.email)
        setDisplayName(player.name)
        setConfirmOpen(true)
    };

    const handleStartLeague = () => {
        // Determine players who have not submitted (exclude 'requested' entries)
        const allPlayers = Array.isArray(Player) ? Player.filter(p => String((p.plStatus || '')).toLowerCase() !== 'requested') : [];
        const notSubmitted = allPlayers.filter(p => {
            return !p.plRankings || (Array.isArray(p.plRankings) && p.plRankings.length === 0);
        });

        if (notSubmitted.length > 0) {
            const previewNames = notSubmitted.map(p => p.plName || p.plEmail || p.id).slice(0, 10).join(', ');
            setPopUpTitle('Start League?')
            setPopUpDescription(
                <Box>
                    <InviteSectionTitle>Starting the league will close registrations for {League?.lgName} and you will not be able to add players or change certain settings. proceed?</InviteSectionTitle>
                    <Box sx={{ mt: 2 }}>
                        <Alert severity="warning">{notSubmitted.length} player{notSubmitted.length > 1 ? 's' : ''} have not submitted rankings: {previewNames}{notSubmitted.length > 10 ? ', ...' : ''}</Alert>
                        <Typography variant="body2" sx={{ mt: 1 }}>You can still start the league, but players with missing submissions will be removed from the league.</Typography>
                    </Box>
                </Box>
            )
            setConfirmOpen(true)
            return;
        }

        setPopUpTitle('Start League?')
        setPopUpDescription(<InviteSectionTitle>Starting the league will close registrations for {League?.lgName} and you will not be able to add players or change certain settings. Make sure you&apos;re ready — proceed?</InviteSectionTitle>)
        setConfirmOpen(true)
    };

    const handleDeleteLeague = () => {
        setPopUpTitle('Delete League?')
        setPopUpDescription(<InviteSectionTitle>This will permanently delete {League?.lgName} and all its data (players, submissions, settings). This action cannot be undone. Are you sure you want to proceed?</InviteSectionTitle>)
        setConfirmOpen(true)
    }

    const handleInvitePlayer = () => {
        setPopUpTitle('Invite Player')
        setPopUpDescription(<InviteSectionTitle>Invite a new player by entering their name and email.</InviteSectionTitle>)
        setConfirmOpen(true)
    }
    
    const handleEmailAllPlayers = async () => {
        const players = currentPlayerData();
        
        if (!players || players.length === 0) {
            setEmailError('No players to email.');
            return;
        }

        if (!emailMessage || emailMessage.trim() === '') {
            setEmailError('Please enter a message to send.');
            return;
        }

        setEmailSending(true);
        setEmailSuccess('');
        setEmailError('');
        
        try {
            const playerEmails = players
                .map(p => p.email)
                .filter(email => email && email.trim() !== '');

            if (playerEmails.length === 0) {
                setEmailError('No valid player emails found.');
                setEmailSending(false);
                return;
            }

            const leagueName = League?.lgName || 'Your League';
            
            // Find sender name
            let senderName = 'League Admin';
            const currentUserId = (User?.id || '').toLowerCase();
            
            const currentPlayer = players.find(p => {
                const pEmail = (p.email || '').toLowerCase();
                return pEmail === currentUserId;
            });
            
            if (currentPlayer?.name && currentPlayer.name.trim() !== '') {
                senderName = currentPlayer.name;
            } else if (User?.name && User.name.trim() !== '') {
                senderName = User.name;
            }
            
            const leagueUrl = `${window.location.origin}/League/${League?.id}`;
            const userMessage = emailMessage;

            serverLogInfo('Sending announcement email via SES', { playerCount: playerEmails.length, leagueId: League?.id });
            
            // Get AWS credentials from Amplify Auth
            const session = await fetchAuthSession();
            const credentials = session.credentials;

            // Create SES client with user's credentials
            const sesClient = new SESClient({
                region: 'us-west-2',
                credentials: credentials
            });

            // Send individual emails to each player for privacy
            let successCount = 0;
            let failCount = 0;
            
            for (const email of playerEmails) {
                try {
                    const command = new SendTemplatedEmailCommand({
                        Source: '"Drag League" <noreply@drag-league.com>',
                        Destination: {
                            ToAddresses: [email],
                        },
                        Template: 'DragLeagueAnnouncement',
                        TemplateData: JSON.stringify({
                            senderName: senderName,
                            leagueName: leagueName,
                            message: userMessage,
                            leagueUrl: leagueUrl,
                            supportUrl: `${window.location.origin}/Support`,
                            faqUrl: `${window.location.origin}/FAQ`
                        }),
                        ReplyToAddresses: ['noreply@drag-league.com']
                    });

                    await sesClient.send(command);
                    successCount++;
                } catch (emailError) {
                    failCount++;
                    serverLogError('Failed to send email to individual recipient', {
                        leagueId: League?.id,
                        recipientEmail: email,
                        error: emailError.message
                    });
                }
            }

            serverLogInfo('Announcement email batch completed', {
                leagueId: League?.id,
                leagueName: League?.lgName,
                senderName: senderName,
                totalRecipients: playerEmails.length,
                successCount: successCount,
                failCount: failCount,
                messageLength: userMessage.length
            });

            // Add to league history
            const currentHistory = League?.lgHistory || [];
            const historyEntry = `${new Date().toISOString()}. [ANNOUNCEMENT] ${senderName} sent an announcement to all players: "${userMessage}"`;
            
            await client.graphql({
                query: updateLeague,
                variables: {
                    input: {
                        id: League.id,
                        lgHistory: [...currentHistory, historyEntry]
                    }
                }
            });
            serverLogInfo('League history updated with announcement', { leagueId: League.id, leagueName: League.lgName });

            const resultMessage = failCount > 0 
                ? `Email sent to ${successCount} of ${playerEmails.length} players. ${failCount} failed.`
                : `Email sent successfully to ${successCount} player${successCount > 1 ? 's' : ''}!`;
            
            setEmailSuccess(resultMessage);
            setEmailPopupOpen(false);
            setEmailMessage('');

        } catch (error) {
            serverLogError('Failed to send announcement email', {
                leagueId: League?.id,
                leagueName: League?.lgName,
                error: error.message,
                errorName: error.name,
                recipientCount: playerEmails?.length || 0
            });
            
            let errorMsg = 'Failed to send email to players. ';
            if (error.message.includes('403')) {
                errorMsg += 'Access forbidden - check environment variables in Amplify Console.';
            } else if (error.message.includes('401')) {
                errorMsg += 'Unauthorized - authentication may be required.';
            } else {
                errorMsg += 'Please try again.';
            }
            
            setEmailError(errorMsg);
        } finally {
            setEmailSending(false);
        }
    };

    const handlePromoteRequest = (player) => {
        setPopUpTitle('Promote to Admin')
        setPopUpDescription(<InviteSectionTitle>Promote {player.name} to league admin? They&apos;ll also get permissions to manage invites, start the league, and update settings as well as submitting the weekly results.</InviteSectionTitle>)
        setPickedPlayer(player.email)
        setDisplayName(player.name)
        setConfirmOpen(true)
    }

    const currentUserIsMember = () => {
        const logged = String(userEmail || '').toLowerCase().trim();
        if (!logged) return false;
        return Array.isArray(Player) && Player.some(p => {
            const emailOrId = String(p.plEmail || p.id || '').toLowerCase().trim();
            return emailOrId === logged;
        });
    }

    // Returns 'invited', 'requested', or null for the current user
    const currentUserPendingType = () => {
        const logged = String(userEmail || '').toLowerCase().trim();
        if (!logged) return null;
        const pendingList = Array.isArray(League?.lgPendingPlayers) ? League.lgPendingPlayers : [];
        for (const p of pendingList) {
            const raw = String(p || '').trim();
            if (!raw) continue;
            if (!raw.includes('|')) {
                if (raw.toLowerCase() === logged) return 'invited';
                continue;
            }
            const parts = raw.split('|').map(s => s.trim()).filter(Boolean);
            const type = parts[0] ? String(parts[0]).toLowerCase() : '';
            const email = parts[1] ? String(parts[1]).toLowerCase().trim() : '';
            const name = parts[2] ? String(parts[2]).toLowerCase().trim() : '';
            if (email === logged || name === logged) {
                return type === 'requested' ? 'requested' : 'invited';
            }
        }
        // fallback: if user record shows this league in pendingLeagues, treat as requested
        try {
            if (User?.pendingLeagues && Array.isArray(User.pendingLeagues) && User.pendingLeagues.includes(League.id)) return 'requested';
        } catch (e) {
            // ignore
        }
        return null;
    }
    
    // Get most recent announcement from league history
    const getMostRecentAnnouncement = () => {
        try {
            const history = League?.lgHistory || [];
            if (!history || history.length === 0) return null;
            
            // Filter for announcements and sort by date (most recent first)
            const announcements = [];
            for (const entry of history) {
                if (!entry || typeof entry !== 'string') continue;
                const parts = entry.split('. ');
                const dateStr = parts[0];
                const text = parts.slice(1).join('. ') || '';
                
                if (!text.startsWith('[ANNOUNCEMENT]')) continue;
                
                const parsed = new Date(dateStr);
                if (isNaN(parsed.getTime())) continue;
                
                // Extract the actual message from the announcement
                // Format: "[ANNOUNCEMENT] Name sent an announcement to all players: "message""
                const messageMatch = text.match(/[""](.+)[""]$/s);
                const message = messageMatch ? messageMatch[1] : text.replace(/\[ANNOUNCEMENT\].*?:\s*/, '').replace(/^[""]|[""]$/g, '').trim();
                const senderMatch = text.match(/\[ANNOUNCEMENT\]\s*(.+?)\s+sent an announcement/);
                const sender = senderMatch ? senderMatch[1] : 'Admin';
                
                announcements.push({
                    date: parsed,
                    message: message,
                    sender: sender,
                    fullText: text
                });
            }
            
            if (announcements.length === 0) return null;
            
            // Sort by date descending and return the most recent
            announcements.sort((a, b) => b.date - a.date);
            return announcements[0];
        } catch (e) {
            serverLogWarn('Error getting recent announcement', { error: e.message });
            return null;
        }
    };
    
    const recentAnnouncement = getMostRecentAnnouncement();


    const handleRequestJoinOpen = () => {
        setPopUpTitle('Request to join');
        setPopUpDescription(<InviteSectionTitle>Please enter the name you&apos;d like to display in this league. This will help the admin identify you.</InviteSectionTitle>);
        setPopUpNameInput('');
        setPopUpError('');
        setConfirmOpen(true);
    }

    const handleAcceptInviteUser = async () => {
        try {
            setConfirmLoading(true);
            const normalized = String(userEmail || '').toLowerCase().trim();
            // find pending entry name if available (pending format: type|email|name)
            const pendingList = Array.isArray(League?.lgPendingPlayers) ? League.lgPendingPlayers : [];
            let pendingName = '';
            for (const raw of pendingList) {
                if (!raw) continue;
                const parts = String(raw || '').split('|').map(s => s.trim()).filter(Boolean);
                const emailPart = parts[1] ? String(parts[1]).toLowerCase().trim() : String(raw || '').toLowerCase().trim();
                if (emailPart === normalized) {
                    pendingName = parts[2] || '';
                    break;
                }
            }

            const updatedPending = pendingList.filter(p => {
                const pl = String(p || '').split('|').map(s => s.trim()).filter(Boolean);
                return pl[1]?.toLowerCase() !== normalized;
            });

            const playerNameToUse = pendingName || User?.name || '';
            const createPlayerResult = await client.graphql({ query: createPlayer, variables: { input: { leagueId: League.id, plEmail: normalized, plName: playerNameToUse, plStatus: 'Player' } } });
            try {
                const userRes = await client.graphql({ query: getUsers, variables: { id: normalized } });
                const userObj = userRes?.data?.getUsers;
                const leagueEntry = `${new Date().toISOString()}|${League.id}|${League?.lgName || ''}`;

                if (!userObj) {
                    await client.graphql({ query: createUsers, variables: { input: { id: normalized, leagues: [leagueEntry], pendingLeagues: [] } } });
                    serverLogInfo('User created when accepting invite', { userId: normalized, leagueId: League.id });
                } else {
                    const existingLeagues = Array.isArray(userObj.leagues) ? userObj.leagues.slice() : [];
                    const existingPending = Array.isArray(userObj.pendingLeagues) ? userObj.pendingLeagues.slice() : [];
                    if (!existingLeagues.some(l => String(l||'').split('|')[1] === League.id)) existingLeagues.push(leagueEntry);
                    const filteredPending = existingPending.filter(pid => String(pid) !== String(League.id));
                    await client.graphql({ query: updateUsers, variables: { input: { id: userObj.id, leagues: existingLeagues, pendingLeagues: filteredPending } } });
                    serverLogInfo('User updated when accepting invite', { userId: userObj.id, leagueId: League.id });
                }
            } catch (e) {
                serverLogWarn('Failed to update user record after accepting invite', { error: e.message });
            }

            const currentHistory = League.lgHistory || [];
            const accepterName = pendingName || User?.name || 'A user';
            const historyEntry = new Date().toISOString() + '. ' + accepterName + ' accepted invite';
            await client.graphql({ query: updateLeague, variables: { input: { id: League.id, lgPendingPlayers: updatedPending, lgHistory: [...currentHistory, historyEntry] } } });
            serverLogInfo('Invite accepted, league updated', { leagueId: League.id, userId: userEmail, userName: accepterName });
        } catch (err) {
            serverLogError('Accept invite failed', { error: err.message });
            setPopUpError('Failed to accept invite.');
        } finally {
            setConfirmLoading(false);
        }
    }

    const handleDeclineInviteUser = async () => {
        try {
            setConfirmLoading(true);
            const normalized = String(userEmail || '').toLowerCase().trim();
            const updatedPending = (League.lgPendingPlayers || []).filter(p => {
                const pl = String(p || '').split('|').map(s => s.trim()).filter(Boolean);
                return pl[1]?.toLowerCase() !== normalized;
            });
            const currentHistory = League.lgHistory || [];
            const declinerName = User?.name || 'A user';
            const historyEntry = new Date().toISOString() + '. ' + declinerName + ' declined invite';
            await client.graphql({ query: updateLeague, variables: { input: { id: League.id, lgPendingPlayers: updatedPending, lgHistory: [...currentHistory, historyEntry] } } });
            serverLogInfo('Invite declined, league updated', { leagueId: League.id, userId: userEmail, userName: declinerName });
        } catch (err) {
            serverLogError('Decline invite failed', { error: err.message });
            setPopUpError('Failed to decline invite.');
        } finally {
            setConfirmLoading(false);
        }
    }

    return (
        <PageContainer>
            <Title variant="h3">{League?.lgName}</Title>

            {(League?.lgDescription && League.lgDescription.length > 0) && (
                <HeroBanner elevation={0}>
                    <HeroText variant="body1">{League?.lgDescription}</HeroText>
                </HeroBanner>
            )}

            {League?.lgRankingDeadline && (
                <InfoBanner>
                    <Countdown
                        deadline={League.lgRankingDeadline}
                        label="Ranking Submission Deadline"
                        leagueName={League?.lgName || 'Drag League'}
                        leagueUrl={typeof window !== 'undefined' ? window.location.href : ''}
                    />
                </InfoBanner>
            )}

            {League?.lgPublic && !currentUserIsMember() && userEmail && (
                <ActionRow sx={{ mb: 2, justifyContent: 'center' }}>
                    {(() => {
                        const pendingType = currentUserPendingType();
                        if (pendingType === 'invited') {
                            return (
                                <>
                                    <PrimaryButton size="small" onClick={handleAcceptInviteUser} disabled={confirmLoading}>Accept</PrimaryButton>
                                    <DangerButton size="small" onClick={handleDeclineInviteUser} disabled={confirmLoading}>Decline</DangerButton>
                                </>
                            );
                        }
                        if (pendingType === 'requested') {
                            return (
                                <PrimaryButton size="small" disabled>Request received — admin reviewing</PrimaryButton>
                            );
                        }
                        return (
                            <PrimaryButton size="small" onClick={handleRequestJoinOpen} disabled={confirmLoading}>Request to join</PrimaryButton>
                        );
                    })()}
                </ActionRow>
            )}

            {recentAnnouncement && (
                <Box sx={{ mt: 2, mb: 3 }}>
                    <Alert 
                        severity="info"
                        sx={{
                            background: 'linear-gradient(135deg, rgba(255, 245, 248, 0.8) 0%, rgba(245, 235, 255, 0.8) 100%)',
                            border: '1px solid rgba(255, 20, 147, 0.3)',
                            borderRadius: '12px',
                            overflowWrap: 'break-word',
                            wordWrap: 'break-word',
                            wordBreak: 'break-word',
                            '& .MuiAlert-icon': {
                                color: '#FF1493'
                            },
                            '& .MuiAlert-message': {
                                overflowWrap: 'break-word',
                                wordWrap: 'break-word',
                                wordBreak: 'break-word',
                                width: '100%'
                            }
                        }}
                    >
                        <Typography sx={{ fontWeight: 600, color: '#333', mb: 0.5, overflowWrap: 'break-word', wordWrap: 'break-word', wordBreak: 'break-word' }}>
                            📢 Latest Announcement from {recentAnnouncement.sender}
                        </Typography>
                        <Typography sx={{ color: '#666', fontSize: '0.95rem', fontStyle: 'italic', whiteSpace: 'pre-wrap', wordBreak: 'break-word', overflowWrap: 'break-word', wordWrap: 'break-word' }}>
                            &ldquo;{recentAnnouncement.message}&rdquo;
                        </Typography>
                    </Alert>
                </Box>
            )}

            {(League?.lgHistory || []).some(h => String(h).includes('League updated by')) ? (
                <Box sx={{ mt: 1 }}>
                    <Alert severity="warning">League rules were updated by an admin — please review changes and check your submissions to make sure all the info is still there.</Alert>
                </Box>
            ) : null}

            {(() => {
                const history = League?.lgHistory || [];
                const reopenEntry = history.slice().reverse().find(h => String(h).includes('[ADMIN EDIT]') && String(h).includes('reopened the league'));
                if (!reopenEntry) return null;
                
                try {
                    const parts = reopenEntry.split('. ');
                    const text = parts.slice(1).join('. ') || '';
                    const adminMatch = text.match(/\[ADMIN EDIT\]\s*(.+?)\s+reopened the league/);
                    const adminName = adminMatch ? adminMatch[1] : 'An admin';
                    const deadlineMatch = text.match(/new ranking deadline:\s*(.+)$/i);
                    const deadline = deadlineMatch ? deadlineMatch[1] : '';
                    
                    return (
                        <Box sx={{ mt: 1, mb: 2 }}>
                            <Alert 
                                severity="info"
                                sx={{
                                    background: 'linear-gradient(135deg, rgba(255, 243, 205, 0.9) 0%, rgba(255, 236, 229, 0.9) 100%)',
                                    border: '1px solid rgba(255, 152, 0, 0.3)',
                                    borderRadius: '8px',
                                    '& .MuiAlert-icon': {
                                        color: '#FF8C00'
                                    }
                                }}
                            >
                                <Typography sx={{ fontWeight: 600, color: '#8a5800' }}>
                                    🔄 League Reopened
                                </Typography>
                                <Typography sx={{ color: '#6b4a00', fontSize: '0.9rem' }}>
                                    {adminName} has reopened this league. {deadline && `New ranking deadline: ${deadline}`}
                                </Typography>
                            </Alert>
                        </Box>
                    );
                } catch (e) {
                    return null;
                }
            })()}

            {isAdmin && League?.lgFinished === 'not started' && (
                <>
                    <ActionRow>
                        <SecondaryButton
                            startIcon={<EditIcon />}
                            onClick={() => router.push(`/CreateLeague?edit=${League.id}`)}
                        >
                            Edit
                        </SecondaryButton>
                        <SecondaryButton
                            startIcon={<EmailIcon />}
                            onClick={() => setEmailPopupOpen(true)}
                        >
                            Announcement
                        </SecondaryButton>
                        <SecondaryButton
                            startIcon={<EmojiEventsIcon />}
                            onClick={() => handleStartLeague()}
                        >
                            Start League
                        </SecondaryButton>
                    </ActionRow>

                </>
            )}

            <CardSection elevation={0}>
                <InviteSectionHeader>
                    <SectionHeader variant="h5" sx={{ mb: 0 }}>
                        <PeopleIcon /> Current Players
                    </SectionHeader>
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                        {isAdmin && (
                            <PrimaryButton
                                size="small"
                                startIcon={<GroupAddIcon />}
                                onClick={() => handleInvitePlayer()}
                            >
                                Invite
                            </PrimaryButton>
                        )}
                        <PrimaryButton
                            size="small"
                            startIcon={<ContentCopyIcon />}
                            onClick={() => {
                                try {
                                    const inviteLink = (typeof window !== 'undefined' ? window.location.origin : 'https://drag-league.com') + '/League/' + (League?.id || '');
                                    navigator.clipboard.writeText(inviteLink);
                                    setShareCopySuccess('Link copied');
                                    setTimeout(() => setShareCopySuccess(''), 3000);
                                } catch (e) {
                                    setShareCopySuccess('Copy failed');
                                    setTimeout(() => setShareCopySuccess(''), 3000);
                                }
                            }}
                        >
                            Share
                        </PrimaryButton>
                        {shareCopySuccess ? (
                            <Typography variant="caption" sx={{ color: 'success.main' }}>{shareCopySuccess}</Typography>
                        ) : null}
                    </Box>
                </InviteSectionHeader>
                
                {currentPlayerData().length > 0 ? (
                    <TableContainer>
                        <TableHeaderRowCurrent isAdmin={true}>
                            <TableHeaderCell>
                                <Box component="span" sx={{ display: { xs: 'inline', sm: 'none' } }}>Players</Box>
                                <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>Name</Box>
                            </TableHeaderCell>
                            <TableHeaderCell>Role</TableHeaderCell>
                            <TableHeaderCell>Rankings</TableHeaderCell>
                            <TableHeaderCell>Actions</TableHeaderCell>
                        </TableHeaderRowCurrent>
                        {currentPlayerData().reverse().map((player, idx) => (
                            <TableRowCurrent key={idx} isAdmin={true}>
                                <TableCell sx={{ justifyContent: { xs: 'flex-start', sm: 'center' } }}>
                                    <Typography variant="body1" fontWeight={600}>
                                        {player.name}
                                    </Typography>
                                </TableCell>
                                <TableCell>
                                    {(String(player.role || player.plStatus || '')).toLowerCase() === 'requested' ? (
                                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                                            <StatusChip
                                                label="Requesting to join"
                                                statuscolor="requested"
                                                size="small"
                                            />
                                            {isAdmin && (
                                                <>
                                                    <Tooltip title="Accept">
                                                        <IconButton
                                                            size="small"
                                                            sx={{
                                                                color: '#4caf50',
                                                                '&:hover': { backgroundColor: 'rgba(76, 175, 80, 0.1)' }
                                                            }}
                                                            onClick={() => handleAcceptRequest(player)}
                                                        >
                                                            <CheckIcon fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                    <Tooltip title="Decline">
                                                        <IconButton
                                                            size="small"
                                                            sx={{
                                                                color: '#f44336',
                                                                '&:hover': { backgroundColor: 'rgba(244, 67, 54, 0.1)' }
                                                            }}
                                                            onClick={() => handleDeclineRequest(player)}
                                                        >
                                                            <CloseIcon fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                </>
                                            )}
                                        </Box>
                                    ) : (String(player.role || player.plStatus || '')).toLowerCase() === 'player' ? (
                                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                                            <StatusChip
                                                label="Player"
                                                statuscolor="player"
                                                size="small"
                                            />
                                        </Box>
                                    ) : (
                                        <StatusChip
                                            label={player.role}
                                            statuscolor="admin"
                                            size="small"
                                        />
                                    )}
                                </TableCell>
                                <TableCell>
                                    {(String(player.submitted || '')).toLowerCase() === 'pending' ? (
                                        (() => {
                                            const loggedIn = userEmail ? String(userEmail).toLowerCase().trim() : '';
                                            const playerEmail = player.email || '';
                                            const canSubmit = (playerEmail && loggedIn && playerEmail === loggedIn);

                                            if (canSubmit) {
                                                return (
                                                    <Box sx={{ display: 'flex', justifyContent: { xs: 'center', sm: 'flex-start' }, width: { xs: '100%', sm: 'auto' } }}>
                                                        <PrimaryButton
                                                            size="small"
                                                            onClick={() => handlePlayerSubmit(player.name)}
                                                            sx={{ width: { xs: 'auto !important' }, padding: { xs: '8px 14px' }, whiteSpace: 'nowrap' }}
                                                        >
                                                            Submit Rankings
                                                        </PrimaryButton>
                                                    </Box>
                                                );
                                            }
                                            return (
                                                <StatusChip
                                                    label="Not Submitted"
                                                    statuscolor="pending"
                                                    size="small"
                                                />
                                            );
                                        })()
                                    ) : (
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <StatusChip
                                                label="Submitted"
                                                statuscolor="submitted"
                                                size="small"
                                                icon={<CheckIcon />}
                                            />
                                            {(() => {
                                                const loggedIn = userEmail ? String(userEmail).toLowerCase().trim() : '';
                                                const playerEmail = player.email || '';
                                                const canEdit = (playerEmail && loggedIn && playerEmail === loggedIn && League?.lgFinished === 'not started');
                                                if (!canEdit) return null;
                                                return (
                                                    <Tooltip title="Edit Rankings">
                                                        <IconButton
                                                            size="small"
                                                            sx={{ color: '#1976d2' }}
                                                            onClick={() => router.push(`/Rank/${League.id}?edit=true`)}
                                                        >
                                                            <EditIcon fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                );
                                            })()}
                                        </Box>
                                    )}
                                </TableCell>
                                <TableCell>
                                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                                        {(() => {
                                            const loggedIn = userEmail ? String(userEmail).toLowerCase().trim() : '';
                                            const playerEmail = player.email ? String(player.email).toLowerCase().trim() : '';
                                            const isCurrentUser = playerEmail === loggedIn;
                                            
                                            // Admin actions
                                            if (isAdmin) {
                                                return (
                                                    <>
                                                        {(String(player.role || player.plStatus || '')).toLowerCase() === 'player' && (
                                                            <Tooltip title="Promote to Admin">
                                                                <IconButton
                                                                    size="small"
                                                                    sx={{
                                                                        color: '#FF1493',
                                                                        '&:hover': { backgroundColor: 'rgba(255, 20, 147, 0.1)' }
                                                                    }}
                                                                    onClick={() => handlePromoteRequest(player)}
                                                                >
                                                                    <PersonAddAltSharpIcon fontSize="small" />
                                                                </IconButton>
                                                            </Tooltip>
                                                        )}
                                                        {!isCurrentUser && (
                                                            <Tooltip title="Remove player">
                                                                <IconButton
                                                                    size="small"
                                                                    sx={{
                                                                        color: '#f44336',
                                                                        '&:hover': { backgroundColor: 'rgba(244, 67, 54, 0.08)' }
                                                                    }}
                                                                    onClick={() => handleRemovePlayer(player)}
                                                                >
                                                                    <CloseIcon fontSize="small" />
                                                                </IconButton>
                                                            </Tooltip>
                                                        )}
                                                    </>
                                                );
                                            }
                                            
                                            // Non-admin can remove themselves
                                            if (isCurrentUser) {
                                                return (
                                                    <Tooltip title="Leave League">
                                                        <IconButton
                                                            size="small"
                                                            sx={{
                                                                color: '#f44336',
                                                                '&:hover': { backgroundColor: 'rgba(244, 67, 54, 0.08)' }
                                                            }}
                                                            onClick={() => handleRemovePlayer(player)}
                                                        >
                                                            <CloseIcon fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                );
                                            }
                                            
                                            return null;
                                        })()}
                                    </Box>
                                </TableCell>
                            </TableRowCurrent>
                        ))}
                    </TableContainer>
                ) : (
                    <EmptyState>
                        <PeopleIcon sx={{ fontSize: 48, color: 'text.secondary', opacity: 0.5 }} />
                        <EmptyStateText>No players yet</EmptyStateText>
                    </EmptyState>
                )}
            </CardSection>

            <CardSection elevation={0}>
                <SectionHeader variant="h5">
                    <EmojiEventsIcon /> Meet The Queens
                </SectionHeader>
                <GridLayout columns={3}>
                    {League?.lgQueenNames?.map((queen, idx) => (
                        <GridCard key={idx} elevation={0}>
                            <QueenNameText>{queen}</QueenNameText>
                        </GridCard>
                    ))}
                </GridLayout>
            </CardSection>

            <CardSection elevation={0}>
                <SectionHeader variant="h5">
                    <RuleIcon /> League Rules
                </SectionHeader>
                <GridLayout columns={2}>
                    {rules().filter(Boolean).map((rule, idx) => (
                        <GridCard key={idx} elevation={0}>
                            <GridCardText dangerouslySetInnerHTML={{ __html: rule }} />
                        </GridCard>
                    ))}
                </GridLayout>
            </CardSection>

            {bonusRules().length > 0 && (
                <CardSection elevation={0}>
                    <SectionHeader variant="h5">
                        <EmojiEventsIcon /> Bonus Categories
                    </SectionHeader>
                    <GridLayout columns={1}>
                        {bonusRules().map((bonus, idx) => (
                            <GridCard key={idx} elevation={0}>
                                <GridCardText dangerouslySetInnerHTML={{ __html: bonus }} />
                            </GridCard>
                        ))}
                    </GridLayout>
                </CardSection>
            )}

            <CardSection elevation={0}>
                <InviteSectionHeader>
                    <SectionHeader variant="h5" sx={{ mb: 0 }}>
                        <GroupAddIcon /> Pending Players
                    </SectionHeader>
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                        {isAdmin && (
                            <PrimaryButton
                                size="small"
                                startIcon={<GroupAddIcon />}
                                onClick={() => handleInvitePlayer()}
                            >
                                Invite
                            </PrimaryButton>
                        )}
                        <PrimaryButton
                            size="small"
                            startIcon={<ContentCopyIcon />}
                            onClick={() => {
                                try {
                                    const inviteLink = (typeof window !== 'undefined' ? window.location.origin : 'https://drag-league.com') + '/League/' + (League?.id || '');
                                    navigator.clipboard.writeText(inviteLink);
                                    setShareCopySuccess('Link copied');
                                    setTimeout(() => setShareCopySuccess(''), 3000);
                                } catch (e) {
                                    setShareCopySuccess('Copy failed');
                                    setTimeout(() => setShareCopySuccess(''), 3000);
                                }
                            }}
                        >
                            Share
                        </PrimaryButton>
                        {shareCopySuccess ? (
                            <Typography variant="caption" sx={{ color: 'success.main' }}>{shareCopySuccess}</Typography>
                        ) : null}
                    </Box>
                </InviteSectionHeader>
                {pendingPlayerData().length > 0 ? (
                    <TableContainer>
                        <TableHeaderRowPending isAdmin={isAdmin}>
                            <TableHeaderCell>Name</TableHeaderCell>
                            <TableHeaderCell>Status</TableHeaderCell>
                            {isAdmin && <TableHeaderCell>Actions</TableHeaderCell>}
                        </TableHeaderRowPending>
                        {pendingPlayerData().map((player, idx) => (
                            <TableRowPending key={idx} isAdmin={isAdmin}>
                                <TableCell sx={{ justifyContent: { xs: 'flex-start', sm: 'center' } }}>
                                    <Typography variant="body1" fontWeight={600}>
                                        {player.name}
                                    </Typography>
                                </TableCell>
                                <TableCell>
                                    <StatusChip
                                        label={player.status === 'invited' ? 'Invited' : 'Pending'}
                                        statuscolor={player.status === 'invited' ? 'invited' : 'pending'}
                                        size="small"
                                    />
                                </TableCell>
                                {isAdmin && (
                                    <TableCell>
                                        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', alignItems: 'center' }}>
                                            {player.status === 'invited' ? (
                                                <Tooltip title="Revoke Invite">
                                                    <IconButton
                                                        size="small"
                                                        sx={{
                                                            color: '#f44336',
                                                            '&:hover': { backgroundColor: 'rgba(244, 67, 54, 0.1)' }
                                                        }}
                                                        onClick={() => handleKickRequest(player)}
                                                    >
                                                        <CloseIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                            ) : (
                                                // pending/requested -> show accept/decline icons
                                                <>
                                                    <Tooltip title="Accept Request">
                                                        <IconButton
                                                            size="small"
                                                            sx={{
                                                                color: '#4caf50',
                                                                '&:hover': { backgroundColor: 'rgba(76, 175, 80, 0.08)' }
                                                            }}
                                                            onClick={() => handleAcceptRequest(player)}
                                                        >
                                                            <CheckIcon fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                    <Tooltip title="Decline Request">
                                                        <IconButton
                                                            size="small"
                                                            sx={{
                                                                color: '#f44336',
                                                                '&:hover': { backgroundColor: 'rgba(244, 67, 54, 0.08)' }
                                                            }}
                                                            onClick={() => handleDeclineRequest(player)}
                                                        >
                                                            <CloseIcon fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                </>
                                            )}
                                        </Box>
                                    </TableCell>
                                )}
                            </TableRowPending>
                        ))}
                    </TableContainer>
                ) : (
                    <EmptyState>
                        <GroupAddIcon sx={{ fontSize: 48, color: 'text.secondary', opacity: 0.5 }} />
                        <EmptyStateText>No pending invites</EmptyStateText>
                    </EmptyState>
                )}
            </CardSection>

            {isAdmin && (
                <BottomActionBar>
                    <DangerButton onClick={() => handleDeleteLeague()}>
                        Delete League
                    </DangerButton>
                    <SecondaryButton
                        startIcon={<EmojiEventsIcon />}
                        onClick={() => handleStartLeague()}
                    >
                        Start League
                    </SecondaryButton>
                </BottomActionBar>
            )}

            <PopUp
                open={confirmOpen}
                title={popUpTitle}
                confirmText={inviteProcessed && popUpTitle === 'Invite Player' ? 'Done' : (popUpTitle === 'Delete League?' ? 'Delete' : popUpTitle === 'Start League?' ? 'Start' : popUpTitle === 'Invite Player' ? 'Send Invite' : popUpTitle === 'Request to join' ? 'Request' : 'Confirm')}
                cancelText={(inviteProcessed && popUpTitle === 'Invite Player') ? '' : 'Cancel'}
                loading={confirmLoading}
                confirmVariant={popUpTitle === 'Delete League?' ? 'danger' : popUpTitle === 'Start League?' ? 'success' : popUpTitle === 'Invite Player' ? 'primary' : popUpTitle === 'Promote to Admin' ? 'primary' : popUpTitle === 'Accept player?' ? 'primary' : popUpTitle === 'Decline player?' ? 'danger' : popUpTitle === 'Revoke invite?' ? 'danger' : popUpTitle === 'Kick player?' ? 'danger' : 'primary'}
                icon={
                    popUpTitle === 'Delete League?' ? <CloseIcon sx={{ color: '#cc0000' }} /> :
                        popUpTitle === 'Start League?' ? <EmojiEventsIcon sx={{ color: '#1e7e34' }} /> :
                            popUpTitle === 'Invite Player' ? <GroupAddIcon sx={{ color: '#FF1493' }} /> : popUpTitle === 'Request to join' ? <GroupAddIcon sx={{ color: '#FF1493' }} /> :
                                popUpTitle === 'Promote to Admin' ? <PersonAddAltSharpIcon sx={{ color: '#FF1493' }} /> :
                                    popUpTitle === 'Accept player?' ? <CheckIcon sx={{ color: '#4caf50' }} /> :
                                        popUpTitle === 'Decline player?' ? <CloseIcon sx={{ color: '#f44336' }} /> :
                                            popUpTitle === 'Revoke invite?' ? <CloseIcon sx={{ color: '#f44336' }} /> :
                                                popUpTitle === 'Kick player?' ? <CloseIcon sx={{ color: '#f44336' }} /> : null
                }
                onCancel={() => {
                    setConfirmOpen(false);
                    setPopUpNameInput('');
                    setPopUpEmailInput('');
                    setPopUpError('');
                    setPopUpCopySuccess('');
                    setInviteProcessed(false);
                }}
                onConfirm={async () => {
                    try {
                        // If invite already processed, Confirm acts as Close
                        if (popUpTitle === 'Invite Player' && inviteProcessed) {
                            setConfirmOpen(false);
                            setInviteProcessed(false);
                            setPopUpDescription('');
                            setPopUpCopySuccess('');
                            return;
                        }
                        setConfirmLoading(true);
                        setPopUpError('');

                        if(popUpTitle === 'Start League?'){
                            const currentHistory = League.lgHistory || [];
                            
                            // Get admin name from Player data or User data
                            let adminName = 'an admin';
                            const currentUserId = (User?.id || '').toLowerCase().trim();
                            
                            if (currentUserId && Array.isArray(Player)) {
                                const currentPlayer = Player.find(p => {
                                    const pEmail = (p.plEmail || p.id || '').toLowerCase().trim();
                                    return pEmail === currentUserId;
                                });
                                
                                if (currentPlayer?.plName && currentPlayer.plName.trim() !== '') {
                                    adminName = currentPlayer.plName;
                                } else if (User?.name && User.name.trim() !== '') {
                                    adminName = User.name;
                                }
                            } else if (User?.name && User.name.trim() !== '') {
                                adminName = User.name;
                            }
                            
                            const historyEntry = new Date().toISOString() + '. League manually started by ' + adminName;

                            try {
                                // fetch players and delete those who didn't submit
                                const playersResult = await client.graphql({ query: playersByLeagueId, variables: { leagueId: League.id, limit: 1000 } });
                                const players = playersResult?.data?.playersByLeagueId?.items || [];
                                const toDelete = players.filter(p => !p.plRankings || (Array.isArray(p.plRankings) && p.plRankings.length === 0));

                                const adminEmailsManual = Array.isArray(League?.lgAdmin) ? League.lgAdmin.map(a => String(a || '').toLowerCase().trim()) : [];
                                for (const p of toDelete) {
                                    const targetEmail = String(p.plEmail || p.id || '').toLowerCase().trim();

                                    try {
                                        await client.graphql({ query: deletePlayer, variables: { input: { id: p.id } } });
                                    } catch (e) {
                                        serverLogWarn('Failed to delete unsubmitted player(s)', { error: e.message });
                                    }

                                    if (targetEmail && adminEmailsManual.includes(targetEmail)) {
                                        continue;
                                    }

                                    // remove league from user's leagues array if present
                                    try {
                                        if (targetEmail) {
                                            const userRes = await client.graphql({ query: getUsers, variables: { id: targetEmail } });
                                            const userObj = userRes?.data?.getUsers;
                                            if (userObj) {
                                                const userLeagues = Array.isArray(userObj.leagues) ? userObj.leagues.slice() : [];
                                                const filteredLeagues = userLeagues.filter(entry => {
                                                    const parts = String(entry || '').split('|').map(s => s.trim());
                                                    return parts[1] !== League.id;
                                                });
                                                if (filteredLeagues.length !== userLeagues.length) {
                                                    await client.graphql({ query: updateUsers, variables: { input: { id: userObj.id, leagues: filteredLeagues } } });
                                                }
                                            }
                                        }
                                    } catch (e) {
                                        serverLogWarn('Failed to update user after deleting unsubmitted player', { playerId: p.id, error: e.message });
                                    }
                                }
                            } catch (e) {
                                serverLogWarn('Error during start-league cleanup', { error: e.message });
                            }

                            // remove pending league references from users (so invited/requested users no longer see it)
                            try {
                                const pendingList = Array.isArray(League.lgPendingPlayers) ? League.lgPendingPlayers.slice() : [];
                                for (const raw of pendingList) {
                                    try {
                                        if (!raw) continue;
                                        const parts = String(raw || '').split('|').map(s => s.trim()).filter(Boolean);
                                        const email = parts.length >= 2 ? (parts[1] || '') : String(raw || '').trim();
                                        const normalized = String(email || '').toLowerCase();
                                        if (!normalized) continue;
                                        const userRes = await client.graphql({ query: getUsers, variables: { id: normalized } });
                                        const userObj = userRes?.data?.getUsers;
                                        if (userObj) {
                                            const existingPending = Array.isArray(userObj.pendingLeagues) ? userObj.pendingLeagues.slice() : [];
                                            const filteredPending = existingPending.filter(pid => pid !== League.id);
                                            if (filteredPending.length !== existingPending.length) {
                                                await client.graphql({ query: updateUsers, variables: { input: { id: userObj.id, pendingLeagues: filteredPending } } });
                                            }
                                        }
                                    } catch (e) {
                                        serverLogWarn('Failed to remove pending league from user during manual-start cleanup', { rawData: raw, error: e.message });
                                    }
                                }
                            } catch (e) {
                                serverLogWarn('Failed to process pending users during manual-start cleanup', { error: e.message });
                            }

                            const startResult = await client.graphql({
                                query: updateLeague,
                                variables: {
                                    input: {
                                        id: League.id,
                                        lgFinished: 'active',
                                        lgPendingPlayers: [],
                                        lgHistory: [...currentHistory, historyEntry]
                                    }
                                }
                            });
                            serverLogInfo('League manually started', { leagueId: League.id, leagueName: League.lgName });
                        } else if(popUpTitle === 'Delete League?'){

                            // Step 1: Get all players in the league
                            const playersResult = await client.graphql({
                                query: playersByLeagueId,
                                variables: { leagueId: League.id, limit: 1000 }
                            });
                            const players = playersResult?.data?.playersByLeagueId?.items || [];

                            // Step 2: Delete all player records
                            for (const player of players) {
                                await client.graphql({
                                    query: deletePlayer,
                                    variables: { input: { id: player.id } }
                                });
                            }
                            serverLogInfo('All players deleted from league', { leagueId: League.id, playerCount: players.length });

                            // Step 3: Get all users to remove league references
                            const allUsersResult = await client.graphql({
                                query: listUsers,
                                variables: { limit: 10000 }
                            });
                            const allUsers = allUsersResult?.data?.listUsers?.items || [];

                            // Step 4: Update each user's leagues and pendingLeagues arrays
                            for (const user of allUsers) {
                                let needsUpdate = false;
                                let updatedLeagues = user.leagues || [];
                                let updatedPendingLeagues = user.pendingLeagues || [];

                                // Remove from leagues array (format: "timestamp|leagueId|leagueName")
                                const filteredLeagues = updatedLeagues.filter(league => {
                                    const parts = league.split('|');
                                    return parts[1] !== League.id;
                                });
                                if (filteredLeagues.length !== updatedLeagues.length) {
                                    updatedLeagues = filteredLeagues;
                                    needsUpdate = true;
                                }

                                // Remove from pendingLeagues array
                                const filteredPendingLeagues = updatedPendingLeagues.filter(leagueId => leagueId !== League.id);
                                if (filteredPendingLeagues.length !== updatedPendingLeagues.length) {
                                    updatedPendingLeagues = filteredPendingLeagues;
                                    needsUpdate = true;
                                }

                                // Update user if leagues were removed
                                if (needsUpdate) {
                                    await client.graphql({
                                        query: updateUsers,
                                        variables: {
                                            input: {
                                                id: user.id,
                                                leagues: updatedLeagues,
                                                pendingLeagues: updatedPendingLeagues
                                            }
                                        }
                                    });
                                }
                            }

                            // Step 5: Finally, delete the league itself
                            const deleteResult = await client.graphql({
                                query: deleteLeague,
                                variables: { input: { id: League.id } }
                            });
                            serverLogInfo('League deleted', { leagueId: League.id, leagueName: League.lgName });

                            // Close popup and redirect
                            setConfirmOpen(false);
                            window.location.href = '/Player';
                        } else if(popUpTitle === 'Invite Player'){
                            const inviteName = popUpNameInput.trim();
                            const inviteEmail = popUpEmailInput.trim().toLowerCase();
                            if (inviteName && inviteEmail) {
                                const updatedPending = League.lgPendingPlayers || [];
                                const normalizedInviteEmail = String(inviteEmail || '').toLowerCase().trim();

                                // don't add duplicate pending invites for the same email
                                const alreadyPending = updatedPending.some(p => {
                                    const parts = String(p || '').split('|').map(s => s.trim()).filter(Boolean);
                                    const pendingEmail = parts[1] ? String(parts[1]).toLowerCase().trim() : (parts[2] ? String(parts[2]).toLowerCase().trim() : '');
                                    return pendingEmail === normalizedInviteEmail;
                                });

                                // don't invite an existing admin
                                const isAdminEmail = Array.isArray(League?.lgAdmin) && League.lgAdmin.some(a => String(a || '').toLowerCase().trim() === normalizedInviteEmail);

                                // don't invite a player that's already in the league
                                const isExistingPlayer = Array.isArray(Player) && Player.some(p => {
                                    const emailOrId = String(p.plEmail || p.id || '').toLowerCase().trim();
                                    return emailOrId === normalizedInviteEmail;
                                });

                                if (alreadyPending) {
                                    setPopUpError('That user already has a pending invite.');
                                    return;
                                }
                                if (isAdminEmail) {
                                    setPopUpError('That email belongs to a league admin.');
                                    return;
                                }
                                if (isExistingPlayer) {
                                    setPopUpError('That email is already a player in this league.');
                                    return;
                                }
                                updatedPending.push(`invited|${inviteEmail}|${inviteName}`);

                                const currentHistory = League.lgHistory || [];
                                const inviterPlayer = Player?.find(p => {
                                    const emailOrId = String(p.plEmail || p.id || '').toLowerCase();
                                    return emailOrId === String(userEmail || '').toLowerCase();
                                });
                                const inviterName = inviterPlayer?.plName || User?.name || 'A league admin';
                                const historyEntry = `${new Date().toISOString()}. ${inviteName} was invited to join by ${inviterName}`;

                                const inviteResult = await client.graphql({
                                    query: updateLeague,
                                    variables: {
                                        input: {
                                            id: League.id,
                                            lgPendingPlayers: updatedPending,
                                            lgHistory: [...currentHistory, historyEntry]
                                        }
                                    }
                                });
                                serverLogInfo('Player invited to league', { leagueId: League.id, inviteeName: inviteName, inviteeEmail: inviteEmail });

                                const results = await client.graphql({
                                    query: getUsers,
                                    variables: { id: inviteEmail }
                                })

                                if(results.data.getUsers === null) {
                                    const newUser = {
                                        id: inviteEmail,
                                    }
                                    const createResult = await client.graphql({
                                        query: createUsers,
                                        variables: { input: newUser }
                                    });
                                    serverLogInfo('User created for invite', { userId: inviteEmail });
                                }else{
                                    const existingPending = results.data.getUsers.pendingLeagues || [];
                                    if (!existingPending.includes(League.id)) {
                                        const updateResult = await client.graphql({
                                            query: updateUsers,
                                            variables: { input: { id: inviteEmail, pendingLeagues: [...existingPending, League.id] } }
                                        });
                                        serverLogInfo('User pendingLeagues updated for invite', { userId: inviteEmail, leagueId: League.id });
                                    }
                                }

                                // Send invite email using SES template
                                const inviteLink = (typeof window !== 'undefined' ? window.location.origin : 'https://drag-league.com') + '/League/' + (League?.id || '');
                                try {
                                    // Get AWS credentials from Amplify Auth
                                    const session = await fetchAuthSession();
                                    const credentials = session.credentials;

                                    // Create SES client
                                    const sesClient = new SESClient({
                                        region: 'us-west-2',
                                        credentials: credentials
                                    });

                                    // Send templated email
                                    const command = new SendTemplatedEmailCommand({
                                        Source: '"Drag League" <noreply@drag-league.com>',
                                        Destination: {
                                            ToAddresses: [inviteEmail],
                                        },
                                        Template: 'DragLeagueInvitation',
                                        TemplateData: JSON.stringify({
                                            inviterName: inviterName,
                                            leagueName: League?.lgName || 'a league',
                                            inviteLink: inviteLink,
                                            supportUrl: `${window.location.origin}/Support`,
                                            faqUrl: `${window.location.origin}/FAQ`
                                        }),
                                        ReplyToAddresses: ['noreply@drag-league.com']
                                    });

                                    await sesClient.send(command);
                                    
                                    serverLogInfo('Invite email sent', {
                                        leagueId: League?.id,
                                        leagueName: League?.lgName,
                                        inviterName: inviterName,
                                        inviteeEmail: inviteEmail,
                                        inviteeName: inviteName
                                    });
                                } catch (emailError) {
                                    serverLogError('Failed to send invite email', {
                                        leagueId: League?.id,
                                        leagueName: League?.lgName,
                                        inviteeEmail: inviteEmail,
                                        error: emailError.message
                                    });
                                    // Don't block the invite flow if email fails - user can still use the link
                                }

                                // Show a shareable invite link and simple instructions
                                setPopUpNameInput('');
                                setPopUpEmailInput('');
                                setPopUpDescription(
                                    <Box sx={{ mt: 2 }}>
                                        <Typography variant="body1" sx={{ mb: 1 }}>
                                            ✉️ Invite sent to <strong>{inviteName}</strong> ({inviteEmail})! They&apos;ll receive an email with instructions. You can also share this link directly:
                                        </Typography>
                                        <TextField
                                            fullWidth
                                            label="Invite link"
                                            value={inviteLink}
                                            InputProps={{
                                                readOnly: true,
                                                endAdornment: (
                                                    <InputAdornment position="end">
                                                        <Tooltip title="Copy link">
                                                            <IconButton
                                                                edge="end"
                                                                onClick={() => { try { navigator.clipboard.writeText(inviteLink); setPopUpCopySuccess('Link copied to clipboard'); } catch {} }}
                                                            >
                                                                <ContentCopyIcon />
                                                            </IconButton>
                                                        </Tooltip>
                                                    </InputAdornment>
                                                )
                                            }}
                                        />
                                    </Box>
                                );
                                setInviteProcessed(true);
                            } else {
                                setPopUpError('Both name and email are required to invite a player.');
                                return;
                            }

                        } else if (popUpTitle === 'Request to join') {
                            const requestName = popUpNameInput.trim();
                            const requestEmail = String(userEmail || '').trim().toLowerCase();
                            if (!requestName) {
                                setPopUpError('Please enter a display name to request to join.');
                                return;
                            }

                            const updatedPending = League.lgPendingPlayers || [];
                            // avoid duplicate pending entries
                            const alreadyPending = updatedPending.some(p => {
                                const parts = String(p || '').split('|').map(s => s.trim()).filter(Boolean);
                                return parts[1] && parts[1].toLowerCase() === requestEmail;
                            });
                            if (alreadyPending) {
                                setPopUpError('You already have a pending request.');
                                return;
                            }

                            updatedPending.push(`requested|${requestEmail}|${requestName}`);
                            const currentHistoryReq = League.lgHistory || [];
                            const historyEntryReq = new Date().toISOString() + '. ' + requestName + ' requested to join';

                            await client.graphql({ query: updateLeague, variables: { input: { id: League.id, lgPendingPlayers: updatedPending, lgHistory: [...currentHistoryReq, historyEntryReq] } } });
                            serverLogInfo('User requested to join league', { leagueId: League.id, requestName: requestName, requestEmail: requestEmail });

                            // Send email notification to all admins
                            try {
                                const adminEmails = Array.isArray(League.lgAdmin) ? League.lgAdmin : [];
                                const leagueUrl = `${window.location.origin}/League/${League.id}`;

                                // Get AWS credentials from Amplify Auth
                                const session = await fetchAuthSession();
                                const credentials = session.credentials;

                                // Create SES client
                                const sesClient = new SESClient({
                                    region: 'us-west-2',
                                    credentials: credentials
                                });

                                // Get all players to find admin names
                                const playersResult = await client.graphql({ query: playersByLeagueId, variables: { leagueId: League.id, limit: 1000 } });
                                const players = playersResult?.data?.playersByLeagueId?.items || [];

                                // Send email to each admin
                                for (const adminEmail of adminEmails) {
                                    try {
                                        // Get admin's player name in the league if available
                                        let adminName = 'Admin';
                                        const adminPlayer = players.find(p => (p.plEmail || '').toLowerCase() === adminEmail.toLowerCase());
                                        if (adminPlayer && adminPlayer.plName) {
                                            adminName = adminPlayer.plName;
                                        } else {
                                            // Fallback to user name
                                            try {
                                                const adminRes = await client.graphql({ query: getUsers, variables: { id: adminEmail.toLowerCase() } });
                                                adminName = adminRes?.data?.getUsers?.name;
                                            } catch (e) {
                                                adminName = 'Admin';
                                            }
                                        }

                                        const command = new SendTemplatedEmailCommand({
                                            Source: '"Drag League" <noreply@drag-league.com>',
                                            Destination: {
                                                ToAddresses: [adminEmail],
                                            },
                                            Template: 'DragLeagueJoinRequest',
                                            TemplateData: JSON.stringify({
                                                adminName: adminName,
                                                requesterName: requestName,
                                                requesterEmail: requestEmail,
                                                leagueName: League.lgName || 'a league',
                                                leagueUrl: leagueUrl,
                                                supportUrl: `${window.location.origin}/Support`,
                                                faqUrl: `${window.location.origin}/FAQ`
                                            }),
                                            ReplyToAddresses: ['noreply@drag-league.com']
                                        });

                                        await sesClient.send(command);
                                        serverLogInfo('Join request notification email sent', {
                                            leagueId: League.id,
                                            adminEmail: adminEmail,
                                            requesterName: requestName,
                                            requesterEmail: requestEmail
                                        });
                                    } catch (emailError) {
                                        serverLogError('Failed to send join request email to admin', {
                                            leagueId: League.id,
                                            adminEmail: adminEmail,
                                            error: emailError.message
                                        });
                                    }
                                }
                            } catch (emailError) {
                                serverLogError('Failed to send join request emails', {
                                    leagueId: League.id,
                                    error: emailError.message
                                });
                                // Don't block the request flow if email fails
                            }

                            try {
                                const userRes = await client.graphql({ query: getUsers, variables: { id: requestEmail } });
                                const userObj = userRes?.data?.getUsers;
                                if (!userObj) {
                                    await client.graphql({ query: createUsers, variables: { input: { id: requestEmail, leagues: [], pendingLeagues: [League.id] } } });
                                    serverLogInfo('User created for join request', { userId: requestEmail, leagueId: League.id });
                                } else {
                                    const existingPending = Array.isArray(userObj.pendingLeagues) ? userObj.pendingLeagues.slice() : [];
                                    if (!existingPending.includes(League.id)) {
                                        await client.graphql({ query: updateUsers, variables: { input: { id: userObj.id, pendingLeagues: [...existingPending, League.id] } } });
                                        serverLogInfo('User pendingLeagues updated for join request', { userId: userObj.id, leagueId: League.id });
                                    }
                                }
                            } catch (e) {
                                serverLogWarn('Failed to update user pending leagues for request', { error: e.message });
                            }

                            setPopUpNameInput('');
                            setPopUpEmailInput('');

                        } else if(popUpTitle === 'Promote to Admin'){
                            const updatedAdmins = League.lgAdmin || [];
                            updatedAdmins.push(pickedPlayer.trim().toLowerCase());

                            const currentHistory = League.lgHistory || [];
                            const historyEntry = new Date().toISOString() + '. ' + displayName + ' was promoted to admin.';

                            const promoteResult = await client.graphql({
                                query: updateLeague,
                                variables: {
                                    input: {
                                        id: League.id,
                                        lgAdmin: updatedAdmins,
                                        lgHistory: [...currentHistory, historyEntry]
                                    }
                                }
                            });
                            serverLogInfo('Player promoted to admin', { leagueId: League.id, promotedEmail: pickedPlayer, promotedName: displayName });


                            // Also update the player's plStatus so UI reflects admin role
                            try {
                                // Resolve player id (pickedPlayer is an email string in many flows)
                                let targetPlayerId = pickedPlayer;
                                if (Array.isArray(Player)) {
                                    const found = Player.find(p => (String(p.plEmail || p.id || '').toLowerCase()) === String(pickedPlayer || '').toLowerCase());
                                    if (found && found.id) targetPlayerId = found.id;
                                }
                                    if (targetPlayerId) {
                                        // If targetPlayerId looks like an email (no UUID id), try to resolve to real player id
                                        let resolvedId = targetPlayerId;
                                        try {
                                            const looksLikeEmail = String(targetPlayerId || '').includes('@');
                                            if (looksLikeEmail) {
                                                const playersRes = await client.graphql({ query: playersByLeagueId, variables: { leagueId: League.id, limit: 1000 } });
                                                const items = playersRes?.data?.playersByLeagueId?.items || playersRes?.data?.playersByLeagueId || [];
                                                const found = Array.isArray(items) ? items.find(p => String(p.plEmail || p.id || '').toLowerCase() === String(targetPlayerId || '').toLowerCase()) : null;
                                                if (found && found.id) resolvedId = found.id;
                                            }
                                        } catch (e) {
                                            // ignore lookup errors and proceed with whatever id we have
                                        }

                                        try {
                                            await client.graphql({
                                                query: updatePlayer,
                                                variables: {
                                                    input: {
                                                        id: resolvedId,
                                                        plStatus: 'Admin'
                                                    }
                                                }
                                            });
                                            serverLogInfo('Player status updated to Admin', { playerId: resolvedId, leagueId: League.id });
                                        } catch (errUpdatePlayer) {
                                            serverLogWarn('Failed to update player status', { error: errUpdatePlayer.message });
                                        }

                                        // Also update parent/local players list immediately if setter is provided
                                        try {
                                            if (typeof userData.setPlayersData === 'function') {
                                                userData.setPlayersData(prev => {
                                                    const list = Array.isArray(prev) ? prev.slice() : [];
                                                    const idx = list.findIndex(p => (p.id === resolvedId) || ((p.plEmail || '').toLowerCase() === String(pickedPlayer || '').toLowerCase()));
                                                    if (idx >= 0) {
                                                        const updated = { ...(list[idx] || {}), plStatus: 'Admin' };
                                                        list[idx] = updated;
                                                    }
                                                    return list;
                                                });
                                            }
                                        } catch (e) {}
                                    }
                            } catch (errUpdatePlayer) {
                                serverLogWarn('Failed to update player status', { error: errUpdatePlayer.message });
                            }


                        } else if(popUpTitle === 'Accept player?'){
                            const updatedPending = (League.lgPendingPlayers || []).filter(p => {
                                const pl = p.split('|').map(s => s.trim()).filter(Boolean)
                                // compare by email (pl[1]) to avoid name mismatches
                                return pl[1]?.toLowerCase() !== pickedPlayer?.toLowerCase();
                            });

                            const normalizedEmail = pickedPlayer ? String(pickedPlayer).toLowerCase().trim() : '';
                            const createPlayerResult = await client.graphql({
                                query: createPlayer,
                                variables: { input: { leagueId: League.id, plEmail: normalizedEmail, plName: displayName, plStatus: 'Player' } }
                            });
                            serverLogInfo('Player created from accepted request', { leagueId: League.id, playerEmail: normalizedEmail, playerName: displayName });

                            // Update the requesting user's record: add this league to `leagues` and remove from `pendingLeagues`
                            try {
                                const userRes = await client.graphql({ query: getUsers, variables: { id: pickedPlayer } });
                                const userObj = userRes?.data?.getUsers;
                                const leagueEntry = `${new Date().toISOString()}|${League.id}|${League?.lgName || ''}`;

                                if (!userObj) {
                                    // create a minimal user record with this league
                                    await client.graphql({ query: createUsers, variables: { input: { id: pickedPlayer, leagues: [leagueEntry], pendingLeagues: [] } } });
                                    serverLogInfo('User created when accepting request', { userId: pickedPlayer, leagueId: League.id });
                                } else {
                                    const existingLeagues = Array.isArray(userObj.leagues) ? userObj.leagues.slice() : [];
                                    const existingPending = Array.isArray(userObj.pendingLeagues) ? userObj.pendingLeagues.slice() : [];

                                    // Add league to leagues array if not present
                                    const alreadyInLeagues = existingLeagues.some(l => {
                                        const parts = String(l || '').split('|').map(s => s.trim());
                                        return parts[1] === League.id;
                                    });
                                    if (!alreadyInLeagues) existingLeagues.push(leagueEntry);

                                    // Remove this league from pendingLeagues
                                    const filteredPending = existingPending.filter(pid => String(pid) !== String(League.id));

                                    await client.graphql({ query: updateUsers, variables: { input: { id: userObj.id, leagues: existingLeagues, pendingLeagues: filteredPending } } });
                                    serverLogInfo('User updated when accepting request', { userId: userObj.id, leagueId: League.id });
                                }
                            } catch (e) {
                                serverLogWarn('Failed to update user record after accepting request', { error: e.message });
                            }

                            const currentHistory = League.lgHistory || [];
                            const historyEntry = new Date().toISOString() + '. ' + displayName + ' accepted and joined the league';

                            const updateResult = await client.graphql({
                                query: updateLeague,
                                variables: {
                                    input: {
                                        id: League.id,
                                        lgPendingPlayers: updatedPending,
                                        lgHistory: [...currentHistory, historyEntry]
                                    }
                                }
                            });
                            serverLogInfo('League updated after accepting player request', { leagueId: League.id, playerEmail: pickedPlayer });

                        } else if(popUpTitle === 'Revoke invite?'){
                            const updatedPending = (League.lgPendingPlayers || []).filter(p => {
                                const pl = String(p || '').split('|').map(s => s.trim()).filter(Boolean);
                                const email = pl[1] ? String(pl[1]).toLowerCase().trim() : '';
                                const name = pl[2] ? String(pl[2]).toLowerCase().trim() : '';
                                const picked = pickedPlayer ? String(pickedPlayer).toLowerCase().trim() : '';
                                const disp = displayName ? String(displayName).toLowerCase().trim() : '';
                                // Keep entries that do NOT match the invite being revoked (match by parsed email or name)
                                return email !== picked && email !== disp && name !== picked && name !== disp;
                            });

                            const currentHistory = League.lgHistory || [];
                            const historyEntry = new Date().toISOString() + '. Invite revoked for ' + displayName;

                            const revokeResult = await client.graphql({
                                query: updateLeague,
                                variables: {
                                    input: {
                                        id: League.id,
                                        lgPendingPlayers: updatedPending,
                                        lgHistory: [...currentHistory, historyEntry]
                                    }
                                }
                            });
                            serverLogInfo('Invite revoked', { leagueId: League.id, revokedName: displayName, revokedEmail: pickedPlayer });

                            // Also remove this league from the invited user's pendingLeagues (if user exists)
                            try {
                                const targetEmail = pickedPlayer ? String(pickedPlayer).toLowerCase().trim() : displayName?.toLowerCase();
                                const userRes = await client.graphql({ query: getUsers, variables: { id: targetEmail } });
                                const userObj = userRes?.data?.getUsers;
                                if (userObj) {
                                    const userPending = Array.isArray(userObj.pendingLeagues) ? userObj.pendingLeagues.slice() : [];
                                    const filteredPending = userPending.filter(pid => String(pid) !== String(League.id));
                                    if (filteredPending.length !== userPending.length) {
                                        await client.graphql({
                                            query: updateUsers,
                                            variables: { input: { id: userObj.id, pendingLeagues: filteredPending } }
                                        });
                                    }
                                }
                            } catch (e) {
                                serverLogWarn('Failed to remove pending league from user record', { error: e.message });
                            }

                            // Refresh the page so UI reflects the revoked invite

                        }else if(popUpTitle === 'Decline player?'){
                            const updatedPending = (League.lgPendingPlayers || []).filter(p => {
                                const pl = p.split('|').map(s => s.trim()).filter(Boolean)
                                // compare by email
                                return pl[1]?.toLowerCase() !== pickedPlayer?.toLowerCase();
                            });

                            const currentHistory = League.lgHistory || [];
                            const historyEntry = new Date().toISOString() + '. Join request declined for ' + displayName;

                            const declineResult = await client.graphql({
                                query: updateLeague,
                                variables: {
                                    input: {
                                        id: League.id,
                                        lgPendingPlayers: updatedPending,
                                        lgHistory: [...currentHistory, historyEntry]
                                    }
                                }
                            });
                            serverLogInfo('Player request declined', { leagueId: League.id, declinedName: displayName, declinedEmail: pickedPlayer });

                            // Also remove this league from the requesting user's pendingLeagues (if user exists)
                            try {
                                const targetEmail = pickedPlayer ? String(pickedPlayer).toLowerCase().trim() : null;
                                if (targetEmail) {
                                    const userRes = await client.graphql({ query: getUsers, variables: { id: targetEmail } });
                                    const userObj = userRes?.data?.getUsers;
                                    if (userObj) {
                                        const userPending = Array.isArray(userObj.pendingLeagues) ? userObj.pendingLeagues.slice() : [];
                                        const filteredPending = userPending.filter(pid => String(pid) !== String(League.id));
                                        if (filteredPending.length !== userPending.length) {
                                            await client.graphql({
                                                query: updateUsers,
                                                variables: { input: { id: userObj.id, pendingLeagues: filteredPending } }
                                            });
                                        }
                                    }
                                }
                            } catch (e) {
                                serverLogWarn('Failed to remove pending league from requester record', { error: e.message });
                            }

                        } else if(popUpTitle === 'Kick player?'){
                            // Resolve player id (pickedPlayer may be an email)
                            let targetDeleteId = pickedPlayer;
                            if (Array.isArray(Player)) {
                                const found = Player.find(p => (String(p.plEmail || p.id || '').toLowerCase()) === String(pickedPlayer || '').toLowerCase());
                                if (found && found.id) targetDeleteId = found.id;
                            }
                            if (targetDeleteId) {
                                const kickResult = await client.graphql({
                                    query: deletePlayer,
                                    variables: { input: { id: targetDeleteId } }
                                });
                                serverLogInfo('Player kicked from league', { leagueId: League.id, playerId: targetDeleteId, playerEmail: pickedPlayer, playerName: displayName });
                            } else {
                                serverLogWarn('Could not resolve player id for kick action', { pickedPlayer: pickedPlayer });
                            }

                            // Remove this league from the user's `leagues` array
                            try {
                                const userRes = await client.graphql({ query: getUsers, variables: { id: pickedPlayer } });
                                const userObj = userRes?.data?.getUsers;
                                if (userObj) {
                                    const userLeagues = Array.isArray(userObj.leagues) ? userObj.leagues.slice() : [];
                                    const filteredLeagues = userLeagues.filter(entry => {
                                        const parts = String(entry || '').split('|').map(s => s.trim());
                                        return parts[1] !== League.id;
                                    });
                                    if (filteredLeagues.length !== userLeagues.length) {
                                        await client.graphql({
                                            query: updateUsers,
                                            variables: { input: { id: userObj.id, leagues: filteredLeagues } }
                                        });
                                    }
                                }
                            } catch (e) {
                                serverLogWarn('Failed to remove league from user record', { error: e.message });
                            }

                            const currentHistory = League.lgHistory || [];
                            const historyEntry = new Date().toISOString() + '. Player ' + displayName + ' was removed from the league';

                            // Also remove from admins list if the removed player was an admin
                            const admins = Array.isArray(League.lgAdmin) ? League.lgAdmin.slice() : [];
                            const normalizedPicked = pickedPlayer ? String(pickedPlayer).toLowerCase().trim() : '';
                            const updatedAdmins = admins.filter(a => (a ? String(a).toLowerCase().trim() : '') !== normalizedPicked);

                            const updateInput = {
                                id: League.id,
                                lgHistory: [...currentHistory, historyEntry]
                            };
                            if (updatedAdmins.length !== admins.length) {
                                updateInput.lgAdmin = updatedAdmins;
                            }

                            await client.graphql({
                                query: updateLeague,
                                variables: {
                                    input: updateInput
                                }
                            });
                            serverLogInfo('League updated after kicking player', { leagueId: League.id, kickedEmail: pickedPlayer, wasAdmin: updatedAdmins.length !== admins.length });

                            // If the removed player is the current user, redirect them back to their Player page
                            try {
                                const normalizedPicked = pickedPlayer ? String(pickedPlayer).toLowerCase().trim() : '';
                                const normalizedCurrent = String(userEmail || '').toLowerCase().trim();
                                if (normalizedPicked && normalizedCurrent && normalizedPicked === normalizedCurrent) {
                                    setConfirmOpen(false);
                                    router.push('/Player');
                                    return;
                                }
                            } catch (e) {
                                // ignore routing errors
                            }

                        }

                        if (popUpTitle !== 'Invite Player') {
                            if (popUpTitle !== 'Invite Player' || !inviteProcessed) {
                                setConfirmOpen(false);
                                setPopUpNameInput('');
                                setPopUpEmailInput('');
                            } else {
                                // keep the popup open for Invite Player so we can show the invite link and instructions
                                setPopUpCopySuccess('');
                            }
                        } else {
                            // keep the popup open for Invite Player so we can show the invite link and instructions
                            setPopUpCopySuccess('');
                        }
                    } catch (err) {
                        serverLogError('Error performing action', { error: err.message });
                        setPopUpError('An error occurred');
                    } finally {
                        setConfirmLoading(false);
                    }
                }}
            >
                {popUpDescription}
                {popUpError ? (
                    <Box sx={{ mt: 1 }}>
                        <Alert severity="error">{popUpError}</Alert>
                    </Box>
                ) : null}
                {popUpTitle === 'Invite Player' && !inviteProcessed && (
                    <Box sx={{ mt: 2, display: 'grid', gap: 1 }}>
                        <TextField
                            fullWidth
                            rows={3}
                            label='Name'
                            value={popUpNameInput}
                            onChange={(e) => setPopUpNameInput(filterPipeCharacter(e.target.value))}
                        />
                        <TextField
                            fullWidth
                            rows={3}
                            label='Email'
                            type="email"
                            value={popUpEmailInput}
                            onChange={(e) => setPopUpEmailInput(filterPipeCharacter(e.target.value))}
                        />
                    </Box>
                )}
                {inviteProcessed && popUpCopySuccess && (
                    <Typography variant="caption" sx={{ mt: 1, color: 'success.main' }}>{popUpCopySuccess}</Typography>
                )}

                {popUpTitle === 'Request to join' && (
                    <Box sx={{ mt: 2, display: 'grid', gap: 1 }}>
                        <TextField
                            fullWidth
                            rows={3}
                            label='Display name'
                            value={popUpNameInput}
                            onChange={(e) => setPopUpNameInput(filterPipeCharacter(e.target.value))}
                        />
                    </Box>
                )}
            </PopUp>
            
            <PopUp
                open={emailPopupOpen}
                title="Send Announcement"
                confirmText={emailSending ? "Sending..." : "Send"}
                cancelText="Cancel"
                loading={emailSending}
                onCancel={() => {
                    setEmailPopupOpen(false);
                    setEmailMessage('');
                    setEmailError('');
                }}
                onConfirm={handleEmailAllPlayers}
            >
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Typography sx={{ color: '#666', fontSize: '0.95rem' }}>
                        Enter your message to send to all {currentPlayerData().length} player{currentPlayerData().length !== 1 ? 's' : ''} in this league.
                    </Typography>
                    <TextField
                        fullWidth
                        multiline
                        rows={6}
                        label="Your message"
                        value={emailMessage}
                        onChange={(e) => {
                            setEmailMessage(e.target.value);
                            setEmailError('');
                        }}
                        placeholder="Type your message here..."
                        variant="outlined"
                        error={!!emailError}
                        helperText={emailError || `${emailMessage.length} characters`}
                        sx={{
                            '& .MuiOutlinedInput-root': {
                                '&.Mui-focused fieldset': {
                                    borderColor: '#FF1493',
                                },
                            },
                            '& .MuiInputLabel-root.Mui-focused': {
                                color: '#FF1493',
                            },
                        }}
                    />
                </Box>
            </PopUp>
            
            {emailSuccess && (
                <Box
                    sx={{
                        position: 'fixed',
                        top: 20,
                        right: 20,
                        zIndex: 10000,
                        padding: '12px 16px',
                        borderRadius: '8px',
                        background: 'linear-gradient(135deg, rgba(80, 200, 120, 0.95) 0%, rgba(60, 179, 113, 0.95) 100%)',
                        border: '1px solid rgba(80, 200, 120, 0.3)',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                    }}
                >
                    <Typography sx={{ color: 'white', fontWeight: 600, fontSize: '0.9rem' }}>
                        ✓ {emailSuccess}
                    </Typography>
                </Box>
            )}
        </PageContainer>
    );
}
