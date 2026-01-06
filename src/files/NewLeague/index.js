import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { generateClient } from 'aws-amplify/api'
import { createPlayer, updateLeague, deleteLeague, createUsers, updateUsers, deletePlayer, updatePlayer } from '@/graphql/mutations';
import { getUsers, playersByLeagueId, listUsers } from '@/graphql/queries';
import { sendEmailAPI } from "@/helpers/sendEmail";
import { generateInviteEmail } from "@/helpers/inviteEmailTemplate";
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
                                console.warn('Failed to delete player during auto-start cleanup:', p.id, e);
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
                                console.warn('Failed to update user record during auto-start cleanup:', e);
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
                                    console.warn('Failed to remove pending league from user during auto-start cleanup:', raw, e);
                                }
                            }
                        } catch (e) {
                            console.warn('Failed to process pending users during auto-start cleanup:', e);
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
                        setDeadlineHandled(true);
                        // Non-admin viewers should refresh to pick up league state changes
                        try { router.reload(); } catch (e) { /* ignore */ }
                        return;
                    } catch (err) {
                        console.error('Error auto-starting league (cleanup):', err);
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
            const userMessage = emailMessage.trim();

            const response = await fetch('/api/sendEmail', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    to: playerEmails,
                    subject: `Message from ${senderName} - ${leagueName}`,
                    html: `
                        <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f4f4f4;">
                            <tr>
                                <td style="padding: 20px 0;">
                                    <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                                        <tr>
                                            <td style="background: linear-gradient(135deg, #FF1493 0%, #9B30FF 50%, #FFD700 100%); padding: 30px 20px; text-align: center;">
                                                <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700; text-shadow: 0 2px 4px rgba(0,0,0,0.3);">
                                                    🏁 Message from ${senderName}
                                                </h1>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td style="padding: 40px 30px;">
                                                <p style="margin: 0 0 20px 0; font-size: 16px; color: #333;">
                                                    <strong style="color: #1a1a1a;">${senderName}</strong> sent a message to players of 
                                                    <strong style="color: #1a1a1a;">${leagueName}</strong>
                                                </p>
                                                <div style="margin: 30px 0; padding: 20px; background-color: #fff5f8; border-radius: 8px; border-left: 4px solid #FF1493;">
                                                    <p style="margin: 0; font-size: 16px; color: #333; white-space: pre-wrap; line-height: 1.6;">
                                                        ${userMessage.replace(/\n/g, '<br>')}
                                                    </p>
                                                </div>
                                                <table role="presentation" style="margin: 0 auto;">
                                                    <tr>
                                                        <td style="text-align: center; padding: 20px 0;">
                                                            <a href="${leagueUrl}" 
                                                               style="background: linear-gradient(135deg, #FF1493 0%, #C71585 100%); color: #ffffff; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 16px; display: inline-block; box-shadow: 0 4px 12px rgba(255, 20, 147, 0.4); text-shadow: 0 1px 2px rgba(0,0,0,0.2);">
                                                                View League
                                                            </a>
                                                        </td>
                                                    </tr>
                                                </table>
                                                <p style="margin: 30px 0 0 0; padding: 20px; background-color: #fff5f8; border-radius: 8px; font-size: 14px; color: #666; border-left: 4px solid #FF1493;">
                                                    <strong style="color: #FF1493;">Button not working?</strong><br>
                                                    Copy and paste this link into your browser:<br>
                                                    <a href="${leagueUrl}" style="color: #FF1493; word-break: break-all; font-weight: 600;">${leagueUrl}</a>
                                                </p>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td style="padding: 30px; background-color: #f9f9f9; border-top: 1px solid #e0e0e0;">
                                                <p style="margin: 0 0 10px 0; font-size: 12px; color: #999; text-align: center; line-height: 1.5;">
                                                    This is an automated notification from Drag League.<br>
                                                    You received this email because you are a member of ${leagueName}.
                                                </p>
                                                <p style="margin: 15px 0 0 0; font-size: 12px; text-align: center;">
                                                    <a href="${window.location.origin}/Support" style="color: #FF1493; text-decoration: underline; font-weight: 600;">Contact Support</a>
                                                    <span style="color: #ccc; margin: 0 8px;">|</span>
                                                    <a href="${window.location.origin}/FAQ" style="color: #FF1493; text-decoration: underline; font-weight: 600;">FAQ</a>
                                                </p>
                                                <p style="margin: 15px 0 0 0; font-size: 11px; color: #aaa; text-align: center;">
                                                    © 2026 Drag League. All rights reserved.
                                                </p>
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>
                        </table>
                    `
                })
            });

            if (!response.ok) {
                throw new Error('Failed to send email');
            }

            // Add to league history
            const currentHistory = League?.lgHistory || [];
            const historyEntry = `${new Date().toISOString()}. [ANNOUNCEMENT] ${senderName} sent an announcement to all players: "${userMessage.length > 100 ? userMessage.substring(0, 100) + '...' : userMessage}"`;
            
            await client.graphql({
                query: updateLeague,
                variables: {
                    input: {
                        id: League.id,
                        lgHistory: [...currentHistory, historyEntry]
                    }
                }
            });

            setEmailSuccess(`Email sent successfully to ${playerEmails.length} player${playerEmails.length > 1 ? 's' : ''}!`);
            setEmailPopupOpen(false);
            setEmailMessage('');
            
            // Clear success message after 5 seconds
            setTimeout(() => setEmailSuccess(''), 5000);
        } catch (error) {
            console.error('Error sending email:', error);
            setEmailError('Failed to send email to players. Please try again.');
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
                const messageMatch = text.match(/:\s*"(.+)"$/);
                const message = messageMatch ? messageMatch[1] : text.replace('[ANNOUNCEMENT]', '').trim();
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
            console.warn('Error getting recent announcement:', e);
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
                } else {
                    const existingLeagues = Array.isArray(userObj.leagues) ? userObj.leagues.slice() : [];
                    const existingPending = Array.isArray(userObj.pendingLeagues) ? userObj.pendingLeagues.slice() : [];
                    if (!existingLeagues.some(l => String(l||'').split('|')[1] === League.id)) existingLeagues.push(leagueEntry);
                    const filteredPending = existingPending.filter(pid => String(pid) !== String(League.id));
                    await client.graphql({ query: updateUsers, variables: { input: { id: userObj.id, leagues: existingLeagues, pendingLeagues: filteredPending } } });
                }
            } catch (e) {
                console.warn('Failed to update user record after accepting invite:', e);
            }

            const currentHistory = League.lgHistory || [];
            const accepterName = pendingName || User?.name || 'A user';
            const historyEntry = new Date().toISOString() + '. ' + accepterName + ' accepted invite';
            await client.graphql({ query: updateLeague, variables: { input: { id: League.id, lgPendingPlayers: updatedPending, lgHistory: [...currentHistory, historyEntry] } } });
            router.reload();
        } catch (err) {
            console.error('Accept invite failed', err);
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
            router.reload();
        } catch (err) {
            console.error('Decline invite failed', err);
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

                    {recentAnnouncement && (
                        <Box sx={{ mt: 2, mb: 3 }}>
                            <Alert 
                                severity="info"
                                sx={{
                                    background: 'linear-gradient(135deg, rgba(255, 245, 248, 0.8) 0%, rgba(245, 235, 255, 0.8) 100%)',
                                    border: '1px solid rgba(255, 20, 147, 0.3)',
                                    borderRadius: '12px',
                                    '& .MuiAlert-icon': {
                                        color: '#FF1493'
                                    }
                                }}
                            >
                                <Typography sx={{ fontWeight: 600, color: '#333', mb: 0.5 }}>
                                    📢 Latest Announcement from {recentAnnouncement.sender}
                                </Typography>
                                <Typography sx={{ color: '#666', fontSize: '0.95rem', fontStyle: 'italic' }}>
                                    "{recentAnnouncement.message}"
                                </Typography>
                            </Alert>
                        </Box>
                    )}

                    {(League?.lgHistory || []).some(h => String(h).includes('League updated by')) ? (
                        <Box sx={{ mt: 1 }}>
                            <Alert severity="warning">League rules were updated by an admin — please review changes and check your submissions to make sure all the info is still there.</Alert>
                        </Box>
                    ) : null}
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
                        <TableHeaderRowCurrent isAdmin={isAdmin}>
                            <TableHeaderCell>
                                <Box component="span" sx={{ display: { xs: 'inline', sm: 'none' } }}>Players</Box>
                                <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>Name</Box>
                            </TableHeaderCell>
                            <TableHeaderCell>Role</TableHeaderCell>
                            <TableHeaderCell>Rankings</TableHeaderCell>
                            {isAdmin && <TableHeaderCell>Actions</TableHeaderCell>}
                        </TableHeaderRowCurrent>
                        {currentPlayerData().reverse().map((player, idx) => (
                            <TableRowCurrent key={idx} isAdmin={isAdmin}>
                                <TableCell sx={{ justifyContent: { xs: 'flex-start', sm: 'center' } }}>
                                    <Typography variant="body1" fontWeight={600}>
                                        {player.name}
                                    </Typography>
                                </TableCell>
                                <TableCell>
                                    {player.role.toLowerCase() === 'requested' ? (
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
                                    ) : player.role.toLowerCase() === 'player' ? (
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
                                    {player.submitted.toLowerCase() === 'pending' ? (
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
                                {isAdmin && (
                                    <TableCell>
                                        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                                            {player.role.toLowerCase() === 'player' && (
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
                                            {(() => {
                                                const loggedIn = userEmail ? String(userEmail).toLowerCase().trim() : '';
                                                const playerEmail = player.email ? String(player.email).toLowerCase().trim() : '';
                                                // don't show remove button for the admin's own player row
                                                if (playerEmail === loggedIn) return null;
                                                return (
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
                                                );
                                            })()}
                                        </Box>
                                    </TableCell>
                                )}
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
                            try { router.reload(); } catch (e) { try { window.location.reload(); } catch (_) {} }
                            return;
                        }
                        setConfirmLoading(true);
                        setPopUpError('');

                        if(popUpTitle === 'Start League?'){
                            const currentHistory = League.lgHistory || [];
                            const adminName = (User && User.name) ? User.name : 'an admin';
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
                                        console.warn('Failed to delete unsubmitted player(s)');
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
                                        console.warn('Failed to update user after deleting unsubmitted player:', e);
                                    }
                                }
                            } catch (e) {
                                console.warn('Error during start-league cleanup:', e);
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
                                        console.warn('Failed to remove pending league from user during manual-start cleanup:', raw, e);
                                    }
                                }
                            } catch (e) {
                                console.warn('Failed to process pending users during manual-start cleanup:', e);
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
                            window.location.reload();
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
                                }else{
                                    const existingPending = results.data.getUsers.pendingLeagues || [];
                                    if (!existingPending.includes(League.id)) {
                                        const updateResult = await client.graphql({
                                            query: updateUsers,
                                            variables: { input: { id: inviteEmail, pendingLeagues: [...existingPending, League.id] } }
                                        });
                                    }
                                }

                                // Send invite email
                                const inviteLink = (typeof window !== 'undefined' ? window.location.origin : 'https://drag-league.com') + '/League/' + (League?.id || '');
                                try {
                                    const { html, text } = generateInviteEmail({
                                        inviterName: inviterName,
                                        leagueName: League?.lgName || 'a league',
                                        inviteLink: inviteLink
                                    });
                                    await sendEmailAPI({
                                        to: inviteEmail,
                                        subject: `🏁 You're invited to join ${League?.lgName || 'a league'} on Drag League!`,
                                        html: html,
                                        text: text
                                    });
                                } catch (emailError) {
                                    console.error('Failed to send invite email:', emailError);
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

                            try {
                                const userRes = await client.graphql({ query: getUsers, variables: { id: requestEmail } });
                                const userObj = userRes?.data?.getUsers;
                                if (!userObj) {
                                    await client.graphql({ query: createUsers, variables: { input: { id: requestEmail, leagues: [], pendingLeagues: [League.id] } } });
                                } else {
                                    const existingPending = Array.isArray(userObj.pendingLeagues) ? userObj.pendingLeagues.slice() : [];
                                    if (!existingPending.includes(League.id)) {
                                        await client.graphql({ query: updateUsers, variables: { input: { id: userObj.id, pendingLeagues: [...existingPending, League.id] } } });
                                    }
                                }
                            } catch (e) {
                                console.warn('Failed to update user pending leagues for request:', e);
                            }

                            setPopUpNameInput('');
                            setPopUpEmailInput('');
                            try { router.reload(); } catch (e) { try { window.location.reload(); } catch(_) {} }

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


                            // Also update the player's plStatus so UI reflects admin role
                            try {
                                // Resolve player id (pickedPlayer is an email string in many flows)
                                let targetPlayerId = pickedPlayer;
                                if (Array.isArray(Player)) {
                                    const found = Player.find(p => (String(p.plEmail || p.id || '').toLowerCase()) === String(pickedPlayer || '').toLowerCase());
                                    if (found && found.id) targetPlayerId = found.id;
                                }
                                if (targetPlayerId) {
                                    await client.graphql({
                                        query: updatePlayer,
                                        variables: {
                                            input: {
                                                id: targetPlayerId,
                                                plStatus: 'Admin'
                                            }
                                        }
                                    });
                                }
                            } catch (errUpdatePlayer) {
                                console.warn('Failed to update player status:', errUpdatePlayer);
                            }

                            router.reload();
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

                            // Update the requesting user's record: add this league to `leagues` and remove from `pendingLeagues`
                            try {
                                const userRes = await client.graphql({ query: getUsers, variables: { id: pickedPlayer } });
                                const userObj = userRes?.data?.getUsers;
                                const leagueEntry = `${new Date().toISOString()}|${League.id}|${League?.lgName || ''}`;

                                if (!userObj) {
                                    // create a minimal user record with this league
                                    await client.graphql({ query: createUsers, variables: { input: { id: pickedPlayer, leagues: [leagueEntry], pendingLeagues: [] } } });
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
                                }
                            } catch (e) {
                                console.warn('Failed to update user record after accepting request:', e);
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
                            router.reload();
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
                                console.warn('Failed to remove pending league from user record:', e);
                            }

                            // Refresh the page so UI reflects the revoked invite
                            router.reload();
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
                                console.warn('Failed to remove pending league from requester record:', e);
                            }

                            router.reload();
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
                            } else {
                                console.warn('Could not resolve player id for kick action:', pickedPlayer);
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
                                console.warn('Failed to remove league from user record:', e);
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
                            router.reload();
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
                        console.error('Error performing action:', err);
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
