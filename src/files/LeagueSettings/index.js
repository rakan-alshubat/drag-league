import React, { useState } from 'react';
import { useRouter } from 'next/router';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Switch from '@mui/material/Switch';
import PublicIcon from '@mui/icons-material/Public';
import LockIcon from '@mui/icons-material/Lock';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import EditIcon from '@mui/icons-material/Edit';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { generateClient } from 'aws-amplify/api';
import { updatePlayer, updateLeague, deleteLeague, deletePlayer, createPlayer } from '@/graphql/mutations';
import { playersByLeagueId, listUsers } from '@/graphql/queries';
import PopUp from '@/files/PopUp';
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
    const [privacyAction, setPrivacyAction] = useState(null);
    const [deleteLeagueAction, setDeleteLeagueAction] = useState(false);
    const [deletePlayerAction, setDeletePlayerAction] = useState(false);

    const client = generateClient();

    // Get all players from props (pages pass `playersData`) or fallback to leagueData.players
    const allPlayers = Array.isArray(playersData) && playersData.length ? playersData : (leagueData?.players || []);
    const currentUserId = (userData?.id || '').toLowerCase();
    const players = (allPlayers || []).filter(p => {
        const pid = (p.id || '').toLowerCase();
        const pEmail = (p.plEmail || '').toLowerCase();
        return pid !== currentUserId && pEmail !== currentUserId;
    });
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
            alert('Failed to request to join.');
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
            const historyEntry = new Date().toISOString() + '. ' + (userData.name || userData.id) + ' accepted invite';
            await client.graphql({ query: updateLeague, variables: { input: { id: leagueData.id, lgPendingPlayers: updatedPending, lgHistory: [...currentHistory, historyEntry] } } });
            // create player record
            await client.graphql({ query: createPlayer, variables: { input: { leagueId: leagueData.id, plEmail: userData.id, plName: userData.name || '', plStatus: 'Member' } } });
            window.location.reload();
        } catch (err) {
            console.error('Accept invite failed', err);
            alert('Failed to accept invite.');
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
            const historyEntry = new Date().toISOString() + '. ' + (userData.name || userData.id) + ' declined invite';
            await client.graphql({ query: updateLeague, variables: { input: { id: leagueData.id, lgPendingPlayers: updatedPending, lgHistory: [...currentHistory, historyEntry] } } });
            window.location.reload();
        } catch (err) {
            console.error('Decline invite failed', err);
            alert('Failed to decline invite.');
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
            const historyEntry = new Date().toISOString() + '. ' + selectedPlayer.plName + ' was promoted to admin';

            await client.graphql({
                query: updateLeague,
                variables: {
                    input: {
                        id: leagueData.id,
                        lgAdmin: updatedAdmins,
                        lgHistory: [...currentHistory, historyEntry]
                    }
                }
            });

            console.log('Player promoted to admin successfully');
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

            console.log('Privacy setting updated successfully');
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
            console.log('Starting league deletion cascade...');

            // Step 1: Get all players in the league
            const playersResult = await client.graphql({
                query: playersByLeagueId,
                variables: { leagueId: leagueData.id, limit: 1000 }
            });
            const playersToDelete = playersResult?.data?.playersByLeagueId?.items || [];
            console.log(`Found ${playersToDelete.length} players to delete`);

            // Step 2: Delete all player records
            for (const player of playersToDelete) {
                await client.graphql({
                    query: deletePlayer,
                    variables: { input: { id: player.id } }
                });
                console.log(`Deleted player: ${player.plName}`);
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
                    console.log(`Updated user: ${user.id}`);
                }
            }

            // Step 5: Finally, delete the league itself
            await client.graphql({
                query: deleteLeague,
                variables: { input: { id: leagueData.id } }
            });
            console.log('League deleted successfully');
            console.log('Cascade deletion completed successfully');

            setConfirmOpen(false);
            setDeleteLeagueAction(false);
            // Redirect to player page
            router.push('/Player');
        } catch (error) {
            console.error('Error deleting league:', error);
            alert('Failed to delete league. Please try again.');
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
                alert('Failed to remove player.');
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
                                            {!isAdmin && (
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
        </Root>
    );
}