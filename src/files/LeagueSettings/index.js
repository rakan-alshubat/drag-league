import React, { useState } from 'react';
import { useRouter } from 'next/router';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Switch from '@mui/material/Switch';
import TextField from '@mui/material/TextField';
import PublicIcon from '@mui/icons-material/Public';
import LockIcon from '@mui/icons-material/Lock';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import EditIcon from '@mui/icons-material/Edit';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import EmailIcon from '@mui/icons-material/Email';
import { generateClient } from 'aws-amplify/api';
import { updatePlayer, updateLeague, deleteLeague, deletePlayer, createPlayer } from '@/graphql/mutations';
import { playersByLeagueId, listUsers } from '@/graphql/queries';
import PopUp from '@/files/PopUp';
import ErrorPopup from '@/files/ErrorPopUp';
import {
    Root,
    Title,
    SettingSection,
    SectionTitle,
    List,
    StyledAccordion,
    StyledSummary,
    SummaryText,
    StyledDetails,
} from './LeagueSettings.styles';

export default function LeagueSettings(props) {
    const { leagueData, userData, playersData } = props;
    const router = useRouter();
    
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [confirmLoading, setConfirmLoading] = useState(false);
    const [popUpTitle, setPopUpTitle] = useState('');
    const [popUpDescription, setPopUpDescription] = useState('');
    const [selectedPlayer, setSelectedPlayer] = useState(null);
    const [errorPopup, setErrorPopup] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [privacyAction, setPrivacyAction] = useState(null);
    const [deleteLeagueAction, setDeleteLeagueAction] = useState(false);
    const [deletePlayerAction, setDeletePlayerAction] = useState(false);
    const [emailSending, setEmailSending] = useState(false);
    const [emailSuccess, setEmailSuccess] = useState('');
    const [emailPopupOpen, setEmailPopupOpen] = useState(false);
    const [emailMessage, setEmailMessage] = useState('');
    const [emailError, setEmailError] = useState('');

    const client = generateClient();

    // Get all players from props (pages pass `playersData`) or fallback to leagueData.players
    const allPlayers = Array.isArray(playersData) && playersData.length ? playersData : (leagueData?.players || []);
    const currentUserId = (userData?.id || '').toLowerCase();
    // Include the current user in the list so they can see themselves
    const players = (allPlayers || []);
    const admins = leagueData?.lgAdmin || [];
    const pending = leagueData?.lgPendingPlayers || [];
    const currentUserIsMember = (allPlayers || []).some(p => {
        const pid = (p.id || '').toLowerCase();
        const pEmail = (p.plEmail || '').toLowerCase();
        return pid === currentUserId || pEmail === currentUserId;
    });
    const currentUserIsPending = (pending || []).map(s=>String(s||'').toLowerCase()).includes(currentUserId);
    
    // Privacy states
    const isPublic = leagueData?.lgPublic ?? true;

    const handlePromotePlayer = (player) => {
        setSelectedPlayer(player);
        setPopUpTitle('Promote to Admin');
        setPopUpDescription(`Are you sure you want to promote ${player.plName} to admin status?`);
        setConfirmOpen(true);
    };

    const handleKickPlayer = (player) => {
        setSelectedPlayer(player);
        setDeletePlayerAction(true);
        setPopUpTitle('Kick Player');
        setPopUpDescription(`Are you sure you want to remove ${player.plName} from this league? This action will delete their player entry.`);
        setConfirmOpen(true);
    };

    const handleEmailAllPlayers = async () => {
        if (!players || players.length === 0) {
            setErrorMessage('No players to email.');
            setErrorPopup(true);
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
                .map(p => p.plEmail)
                .filter(email => email && email.trim() !== '');

            if (playerEmails.length === 0) {
                setErrorMessage('No valid player emails found.');
                setErrorPopup(true);
                setEmailSending(false);
                return;
            }

            const leagueName = leagueData?.lgName || 'Your League';
            
            // Find sender name from multiple sources
            let senderName = 'League Admin';
            const currentUserId = (userData?.id || '').toLowerCase();
            
            // Try to find the current user in the players list first (priority 1)
            const currentPlayer = players.find(p => {
                const pEmail = (p.plEmail || '').toLowerCase();
                const pId = (p.id || '').toLowerCase();
                return pEmail === currentUserId || pId === currentUserId;
            });
            
            if (currentPlayer?.plName && currentPlayer.plName.trim() !== '') {
                senderName = currentPlayer.plName;
            } else if (userData?.name && userData.name.trim() !== '') {
                // Fallback to userData name (priority 2)
                senderName = userData.name;
            }
            
            const leagueUrl = `${window.location.origin}/League/${leagueData?.id}`;
            const userMessage = emailMessage.trim();

            // Use the sendEmail helper to send notification with custom styling
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
                                        <!-- Header -->
                                        <tr>
                                            <td style="background: linear-gradient(135deg, #FF1493 0%, #9B30FF 50%, #FFD700 100%); padding: 30px 20px; text-align: center;">
                                                <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700; text-shadow: 0 2px 4px rgba(0,0,0,0.3);">
                                                    🏁 Message from ${senderName}
                                                </h1>
                                            </td>
                                        </tr>
                                        
                                        <!-- Main Content -->
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
                                                
                                                <!-- CTA Button -->
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
                                                
                                                <!-- Fallback Link -->
                                                <p style="margin: 30px 0 0 0; padding: 20px; background-color: #fff5f8; border-radius: 8px; font-size: 14px; color: #666; border-left: 4px solid #FF1493;">
                                                    <strong style="color: #FF1493;">Button not working?</strong><br>
                                                    Copy and paste this link into your browser:<br>
                                                    <a href="${leagueUrl}" style="color: #FF1493; word-break: break-all; font-weight: 600;">${leagueUrl}</a>
                                                </p>
                                            </td>
                                        </tr>
                                        
                                        <!-- Footer -->
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
            const currentHistory = leagueData?.lgHistory || [];
            const historyEntry = `${new Date().toISOString()}. [ANNOUNCEMENT] ${senderName} sent an announcement to all players: "${userMessage.length > 100 ? userMessage.substring(0, 100) + '...' : userMessage}"`;
            
            await client.graphql({
                query: updateLeague,
                variables: {
                    input: {
                        id: leagueData.id,
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
            setErrorMessage('Failed to send email to players. Please try again.');
            setErrorPopup(true);
        } finally {
            setEmailSending(false);
        }
    };

    const handleRequestJoin = async () => {
        if (!userData?.id) return;
        try {
            setConfirmLoading(true);
            const updatedPending = [...(leagueData.lgPendingPlayers || [])];
            if (!updatedPending.includes(userData.id.toLowerCase())) updatedPending.push(userData.id.toLowerCase());
            await client.graphql({
                query: updateLeague,
                variables: { input: { id: leagueData.id, lgPendingPlayers: updatedPending } }
            });
            window.location.reload();
        } catch (err) {
            console.error('Request join failed', err);
            setErrorMessage('Failed to request to join.');
            setErrorPopup(true);
        } finally {
            setConfirmLoading(false);
        }
    };

    const handleAcceptInvite = async () => {
        if (!userData?.id) return;
        try {
            setConfirmLoading(true);
            // remove from pending
            const updatedPending = (leagueData.lgPendingPlayers || []).filter(p => (p || '').toLowerCase() !== userData.id.toLowerCase());
            // update league pending and history
            const currentHistory = leagueData.lgHistory || [];
            const accepterName = userData?.name || 'A user';
            const historyEntry = new Date().toISOString() + '. ' + accepterName + ' accepted invite';
            await client.graphql({ query: updateLeague, variables: { input: { id: leagueData.id, lgPendingPlayers: updatedPending, lgHistory: [...currentHistory, historyEntry] } } });
            // create player record
            await client.graphql({ query: createPlayer, variables: { input: { leagueId: leagueData.id, plEmail: userData.id, plName: userData.name || '', plStatus: 'Member' } } });
            window.location.reload();
        } catch (err) {
            console.error('Accept invite failed', err);
            setErrorMessage('Failed to accept invite.');
            setErrorPopup(true);
        } finally {
            setConfirmLoading(false);
        }
    };

    const handleDeclineInvite = async () => {
        if (!userData?.id) return;
        try {
            setConfirmLoading(true);
            const updatedPending = (leagueData.lgPendingPlayers || []).filter(p => (p || '').toLowerCase() !== userData.id.toLowerCase());
            const currentHistory = leagueData.lgHistory || [];
            const declinerName = userData?.name || 'A user';
            const historyEntry = new Date().toISOString() + '. ' + declinerName + ' declined invite';
            await client.graphql({ query: updateLeague, variables: { input: { id: leagueData.id, lgPendingPlayers: updatedPending, lgHistory: [...currentHistory, historyEntry] } } });
            window.location.reload();
        } catch (err) {
            console.error('Decline invite failed', err);
            setErrorMessage('Failed to decline invite.');
            setErrorPopup(true);
        } finally {
            setConfirmLoading(false);
        }
    };

    const handleConfirmPromote = async () => {
        if (!selectedPlayer) return;

        try {
            setConfirmLoading(true);

            // Update player's plStatus to 'Admin'
            await client.graphql({
                query: updatePlayer,
                variables: {
                    input: {
                        id: selectedPlayer.id,
                        leagueId: selectedPlayer.leagueId,
                        plStatus: 'Admin'
                    }
                }
            });

            // Add player email to league's lgAdmin array
            const updatedAdmins = [...admins];
            if (!updatedAdmins.includes(selectedPlayer.id.toLowerCase())) {
                updatedAdmins.push(selectedPlayer.id.toLowerCase());
            }

            const currentHistory = leagueData.lgHistory || [];
            const adminName = (userData?.name || userData?.id) || 'Admin';
            const historyEntry = `${new Date().toISOString()}. [ADMIN EDIT] Admin ${adminName} promoted ${selectedPlayer.plName} to admin`;

            const resp = await client.graphql({
                query: updateLeague,
                variables: {
                    input: {
                        id: leagueData.id,
                        lgAdmin: updatedAdmins,
                        lgHistory: [...currentHistory, historyEntry]
                    }
                }
            });


            setConfirmOpen(false);
            // Refresh the page to show updated data
            window.location.reload();
        } catch (error) {
            console.error('Error promoting player:', error);
        } finally {
            setConfirmLoading(false);
        }
    };

    const isPlayerAdmin = (player) => {
        return player.plStatus === 'Admin' || admins.includes(player.id.toLowerCase());
    };

    const handlePrivacyToggle = (field, newValue, title, description) => {
        setPrivacyAction({ field, value: newValue });
        setPopUpTitle(title);
        setPopUpDescription(description);
        setConfirmOpen(true);
    };

    const handleConfirmPrivacy = async () => {
        if (!privacyAction) return;

        try {
            setConfirmLoading(true);

            const currentHistory = leagueData.lgHistory || [];
            let historyEntry = '';

            if (privacyAction.field === 'lgPublic') {
                historyEntry = new Date().toISOString() + '. League visibility changed to ' + (privacyAction.value ? 'Public' : 'Private');
            }

            await client.graphql({
                query: updateLeague,
                variables: {
                    input: {
                        id: leagueData.id,
                        [privacyAction.field]: privacyAction.value,
                        lgHistory: [...currentHistory, historyEntry]
                    }
                }
            });

            setConfirmOpen(false);
            setPrivacyAction(null);
            // Refresh the page to show updated data
            window.location.reload();
        } catch (error) {
            console.error('Error updating privacy setting:', error);
        } finally {
            setConfirmLoading(false);
        }
    };

    const handleDeleteLeague = () => {
        setDeleteLeagueAction(true);
        setPopUpTitle('Delete League?');
        setPopUpDescription('This will permanently delete the league and all associated player data. This action cannot be undone. Are you sure?');
        setConfirmOpen(true);
    };

    const handleConfirmDeleteLeague = async () => {
        try {
            setConfirmLoading(true);

            // Step 1: Get all players in the league
            const playersResult = await client.graphql({
                query: playersByLeagueId,
                variables: { leagueId: leagueData.id, limit: 1000 }
            });
            const playersToDelete = playersResult?.data?.playersByLeagueId?.items || [];

            // Step 2: Delete all player records
            for (const player of playersToDelete) {
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
            const { updateUsers } = await import('@/graphql/mutations');
            for (const user of allUsers) {
                let needsUpdate = false;
                let updatedLeagues = user.leagues || [];
                let updatedPendingLeagues = user.pendingLeagues || [];

                // Remove from leagues array (format: "timestamp|leagueId|leagueName")
                const filteredLeagues = updatedLeagues.filter(league => {
                    const parts = league.split('|');
                    return parts[1] !== leagueData.id;
                });
                if (filteredLeagues.length !== updatedLeagues.length) {
                    updatedLeagues = filteredLeagues;
                    needsUpdate = true;
                }

                // Remove from pendingLeagues array
                const filteredPendingLeagues = updatedPendingLeagues.filter(leagueId => leagueId !== leagueData.id);
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
            await client.graphql({
                query: deleteLeague,
                variables: { input: { id: leagueData.id } }
            });

            setConfirmOpen(false);
            setDeleteLeagueAction(false);
            // Redirect to player page
            router.push('/Player');
        } catch (error) {
            console.error('Error deleting league:', error);
            setErrorMessage('Failed to delete league. Please try again.');
            setErrorPopup(true);
        } finally {
            setConfirmLoading(false);
        }
    };

    const handleConfirm = async () => {
        if (deleteLeagueAction) {
            await handleConfirmDeleteLeague();
        } else if (deletePlayerAction && selectedPlayer) {
            // delete selected player
            try {
                setConfirmLoading(true);
                await client.graphql({
                    query: deletePlayer,
                    variables: { input: { id: selectedPlayer.id } }
                });
                // reload to refresh players list
                window.location.reload();
            } catch (err) {
                console.error('Error deleting player:', err);
                setErrorMessage('Failed to remove player.');
                setErrorPopup(true);
            } finally {
                setConfirmLoading(false);
            }
        } else if (selectedPlayer) {
            await handleConfirmPromote();
        } else if (privacyAction) {
            await handleConfirmPrivacy();
        }
    };

    return (
        <Root>
            <Title variant="h5">League Settings</Title>


            <SettingSection>
                <SectionTitle>Players ({players.length})</SectionTitle>
                
                <List>
                    {players.length > 0 ? (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                            {players.map((player, idx) => {
                                const isAdmin = isPlayerAdmin(player);
                                const pid = (player.id || '').toLowerCase();
                                const pEmail = (player.plEmail || '').toLowerCase();
                                const isCurrentUser = pid === currentUserId || pEmail === currentUserId;

                                return (
                                    <Box
                                        key={player.id || idx}
                                        sx={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            padding: { xs: '10px', sm: '12px 16px' },
                                            borderRadius: 8,
                                            background: 'linear-gradient(135deg, rgba(255, 245, 248, 0.6) 0%, rgba(245, 235, 255, 0.6) 100%)',
                                            border: '1px solid rgba(255, 20, 147, 0.12)',
                                        }}
                                    >
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Typography sx={{ fontWeight: 600, color: '#333', fontSize: { xs: '0.95rem', sm: '1rem' } }}>
                                                {player.plName}
                                            </Typography>
                                            {isAdmin && (
                                                <Chip
                                                    label="Admin"
                                                    size="small"
                                                    sx={{
                                                        background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
                                                        color: 'white',
                                                        fontWeight: 600,
                                                        fontSize: '0.75rem',
                                                    }}
                                                />
                                            )}
                                        </Box>
                                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                                            {!isAdmin && !isCurrentUser && (
                                                <Tooltip title="Promote to Admin">
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => handlePromotePlayer(player)}
                                                        sx={{
                                                            color: '#9B30FF',
                                                            '&:hover': {
                                                                background: 'rgba(155, 48, 255, 0.08)',
                                                            },
                                                        }}
                                                    >
                                                        <AdminPanelSettingsIcon />
                                                    </IconButton>
                                                </Tooltip>
                                            )}

                                            {!isCurrentUser && (
                                                <Tooltip title="Kick player">
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => handleKickPlayer(player)}
                                                        sx={{
                                                            color: '#ff4444',
                                                            '&:hover': {
                                                                background: 'rgba(255, 68, 68, 0.08)',
                                                            },
                                                        }}
                                                    >
                                                        <DeleteForeverIcon />
                                                    </IconButton>
                                                </Tooltip>
                                            )}
                                        </Box>
                                    </Box>
                                );
                            })}
                        </Box>
                    ) : (
                        <Typography variant="body2" color="text.secondary">
                            No players in the league.
                        </Typography>
                    )}
                </List>
            </SettingSection>
            
            {/* Privacy Section */}
            <SettingSection>
                <SectionTitle>Privacy Settings</SectionTitle>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {/* Public/Private Toggle */}
                    <Box
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '16px',
                            borderRadius: '8px',
                            background: 'linear-gradient(135deg, rgba(255, 245, 248, 0.6) 0%, rgba(245, 235, 255, 0.6) 100%)',
                            border: '1px solid rgba(255, 20, 147, 0.2)',
                        }}
                    >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            {isPublic ? <PublicIcon sx={{ color: '#50C878' }} /> : <LockIcon sx={{ color: '#FF1493' }} />}
                            <Box>
                                <Typography sx={{ fontWeight: 600, color: '#333' }}>
                                    League Visibility
                                </Typography>
                                <Typography sx={{ fontSize: '0.85rem', color: '#666' }}>
                                    {isPublic ? 'Anyone can view this league' : 'Only members can view this league'}
                                </Typography>
                            </Box>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Chip
                                label={isPublic ? 'Public' : 'Private'}
                                size="small"
                                sx={{
                                    background: isPublic 
                                        ? 'linear-gradient(135deg, #50C878 0%, #3CB371 100%)'
                                        : 'linear-gradient(135deg, #FF1493 0%, #C71585 100%)',
                                    color: 'white',
                                    fontWeight: 600,
                                }}
                            />
                            <Switch
                                checked={isPublic}
                                onChange={(e) => handlePrivacyToggle(
                                    'lgPublic',
                                    e.target.checked,
                                    e.target.checked ? 'Make League Public?' : 'Make League Private?',
                                    e.target.checked 
                                        ? 'Are you sure you want to make this league public? Anyone will be able to view it.'
                                        : 'Are you sure you want to make this league private? Only members will be able to view it.'
                                )}
                                sx={{
                                    '& .MuiSwitch-switchBase.Mui-checked': {
                                        color: '#50C878',
                                    },
                                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                                        backgroundColor: '#50C878',
                                    },
                                }}
                            />
                        </Box>
                    </Box>
                </Box>
            </SettingSection>

            {/* Admin Tools Section */}
            <SettingSection>
                <SectionTitle>Admin Tools</SectionTitle>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {/* Email All Players */}
                    <Box
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '16px',
                            borderRadius: '8px',
                            background: 'linear-gradient(135deg, rgba(255, 245, 248, 0.6) 0%, rgba(245, 235, 255, 0.6) 100%)',
                            border: '1px solid rgba(255, 20, 147, 0.2)',
                        }}
                    >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <EmailIcon sx={{ color: '#FF1493' }} />
                            <Box>
                                <Typography sx={{ fontWeight: 600, color: '#333' }}>
                                    Send Announcement
                                </Typography>
                                <Typography sx={{ fontSize: '0.85rem', color: '#666' }}>
                                    Send a notification email to all league members
                                </Typography>
                            </Box>
                        </Box>
                        <Button
                            variant="contained"
                            onClick={() => setEmailPopupOpen(true)}
                            disabled={emailSending}
                            sx={{
                                background: 'linear-gradient(135deg, #FF1493 0%, #C71585 100%)',
                                color: 'white',
                                fontWeight: 600,
                                textTransform: 'none',
                                '&:hover': {
                                    background: 'linear-gradient(135deg, #E6127A 0%, #B01070 100%)',
                                },
                                '&:disabled': {
                                    background: '#ccc',
                                    color: '#666',
                                },
                            }}
                        >
                            Send Announcement
                        </Button>
                    </Box>
                    
                    {emailSuccess && (
                        <Box
                            sx={{
                                padding: '12px 16px',
                                borderRadius: '8px',
                                background: 'linear-gradient(135deg, rgba(80, 200, 120, 0.1) 0%, rgba(60, 179, 113, 0.1) 100%)',
                                border: '1px solid rgba(80, 200, 120, 0.3)',
                            }}
                        >
                            <Typography sx={{ color: '#50C878', fontWeight: 600, fontSize: '0.9rem' }}>
                                ✓ {emailSuccess}
                            </Typography>
                        </Box>
                    )}
                    
                    {/* Admin Edit Page */}
                    <Box
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '16px',
                            borderRadius: '8px',
                            background: 'linear-gradient(135deg, rgba(255, 245, 248, 0.6) 0%, rgba(245, 235, 255, 0.6) 100%)',
                            border: '1px solid rgba(255, 20, 147, 0.2)',
                        }}
                    >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <EditIcon sx={{ color: '#9B30FF' }} />
                            <Box>
                                <Typography sx={{ fontWeight: 600, color: '#333' }}>
                                    Admin Edit Page
                                </Typography>
                                <Typography sx={{ fontSize: '0.85rem', color: '#666' }}>
                                    Access advanced league management and editing tools
                                </Typography>
                            </Box>
                        </Box>
                        <Button
                            variant="contained"
                            onClick={() => router.push(`/AdminEdit?leagueId=${leagueData?.id}`)}
                            sx={{
                                background: 'linear-gradient(135deg, #9B30FF 0%, #7A1CAC 100%)',
                                color: 'white',
                                fontWeight: 600,
                                textTransform: 'none',
                                '&:hover': {
                                    background: 'linear-gradient(135deg, #8A2BE2 0%, #6A0DAD 100%)',
                                },
                            }}
                        >
                            Open Admin Edit
                        </Button>
                    </Box>
                </Box>
            </SettingSection>

            <SettingSection>
                <SectionTitle sx={{ color: '#ff4444' }}>Danger Zone</SectionTitle>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Box
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '16px',
                            borderRadius: '8px',
                            background: 'linear-gradient(135deg, rgba(255, 68, 68, 0.05) 0%, rgba(204, 0, 0, 0.05) 100%)',
                            border: '2px solid rgba(255, 68, 68, 0.3)',
                        }}
                    >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <DeleteForeverIcon sx={{ color: '#ff4444', fontSize: 32 }} />
                            <Box>
                                <Typography sx={{ fontWeight: 600, color: '#ff4444' }}>
                                    Delete League
                                </Typography>
                                <Typography sx={{ fontSize: '0.85rem', color: '#666' }}>
                                    Permanently delete this league and all player data. This cannot be undone.
                                </Typography>
                            </Box>
                        </Box>
                        <Button
                            variant="contained"
                            onClick={handleDeleteLeague}
                            sx={{
                                background: 'linear-gradient(135deg, #ff4444 0%, #cc0000 100%)',
                                color: 'white',
                                fontWeight: 600,
                                textTransform: 'none',
                                '&:hover': {
                                    background: 'linear-gradient(135deg, #e63939 0%, #b30000 100%)',
                                },
                            }}
                        >
                            Delete League
                        </Button>
                    </Box>
                </Box>
            </SettingSection>


            <PopUp
                open={confirmOpen}
                title={popUpTitle}
                confirmText={deleteLeagueAction ? "Delete" : selectedPlayer ? "Promote" : "Confirm"}
                cancelText="Cancel"
                loading={confirmLoading}
                onCancel={() => {
                    setConfirmOpen(false);
                    setSelectedPlayer(null);
                    setPrivacyAction(null);
                    setDeleteLeagueAction(false);
                }}
                onConfirm={handleConfirm}
            >
                {popUpDescription}
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
                        Enter your message to send to all {players.length} player{players.length !== 1 ? 's' : ''} in this league.
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
            
            <ErrorPopup open={errorPopup} onClose={() => setErrorPopup(false)} message={errorMessage} />
        </Root>
    );
}