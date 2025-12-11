import React, { useState } from 'react';
import { useRouter } from 'next/router';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import PublicIcon from '@mui/icons-material/Public';
import LockIcon from '@mui/icons-material/Lock';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import EditIcon from '@mui/icons-material/Edit';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { generateClient } from 'aws-amplify/api';
import { updatePlayer, updateLeague } from '@/graphql/mutations';
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
    const { leagueData } = props;
    const router = useRouter();
    
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [confirmLoading, setConfirmLoading] = useState(false);
    const [popUpTitle, setPopUpTitle] = useState('');
    const [popUpDescription, setPopUpDescription] = useState('');
    const [selectedPlayer, setSelectedPlayer] = useState(null);
    const [privacyAction, setPrivacyAction] = useState(null);

    const client = generateClient();

    // Get all players from the league
    const players = leagueData?.players || [];
    const admins = leagueData?.lgAdmin || [];
    
    // Privacy states
    const isPublic = leagueData?.lgPublic ?? true;

    const handlePromotePlayer = (player) => {
        setSelectedPlayer(player);
        setPopUpTitle('Promote to Admin');
        setPopUpDescription(`Are you sure you want to promote ${player.plName} to admin status?`);
        setConfirmOpen(true);
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

    const handleConfirm = async () => {
        if (selectedPlayer) {
            await handleConfirmPromote();
        } else if (privacyAction) {
            await handleConfirmPrivacy();
        }
    };

    return (
        <Root>
            <Title variant="h5">League Settings</Title>

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

            {/* Players Section */}
            <SettingSection>
                <SectionTitle>Players ({players.length})</SectionTitle>
                <List>
                    {players.length > 0 ? (
                        <StyledAccordion disableGutters>
                            <StyledSummary expandIcon={<ExpandMoreIcon />}>
                                <SummaryText>View All Players</SummaryText>
                            </StyledSummary>
                            <StyledDetails>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                    {players.map((player, idx) => {
                                        const isAdmin = isPlayerAdmin(player);
                                        return (
                                            <Box
                                                key={idx}
                                                sx={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'space-between',
                                                    padding: '12px 16px',
                                                    borderRadius: '8px',
                                                    background: 'linear-gradient(135deg, rgba(255, 245, 248, 0.6) 0%, rgba(245, 235, 255, 0.6) 100%)',
                                                    border: '1px solid rgba(255, 20, 147, 0.2)',
                                                    transition: 'all 0.2s ease',
                                                    '&:hover': {
                                                        borderColor: '#FFB6D9',
                                                    },
                                                }}
                                            >
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
                                                    <Typography sx={{ fontWeight: 600, color: '#333' }}>
                                                        {player.plName}
                                                    </Typography>
                                                    <Typography sx={{ fontSize: '0.85rem', color: '#666' }}>
                                                        {player.id}
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
                                                {!isAdmin && (
                                                    <Tooltip title="Promote to Admin">
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => handlePromotePlayer(player)}
                                                            sx={{
                                                                color: '#9B30FF',
                                                                '&:hover': {
                                                                    background: 'rgba(155, 48, 255, 0.1)',
                                                                },
                                                            }}
                                                        >
                                                            <AdminPanelSettingsIcon />
                                                        </IconButton>
                                                    </Tooltip>
                                                )}
                                            </Box>
                                        );
                                    })}
                                </Box>
                            </StyledDetails>
                        </StyledAccordion>
                    ) : (
                        <Typography variant="body2" color="text.secondary">
                            No players in the league.
                        </Typography>
                    )}
                </List>
            </SettingSection>

            {/* Confirmation Dialog */}
            <PopUp
                open={confirmOpen}
                title={popUpTitle}
                confirmText={selectedPlayer ? "Promote" : "Confirm"}
                cancelText="Cancel"
                loading={confirmLoading}
                onCancel={() => {
                    setConfirmOpen(false);
                    setSelectedPlayer(null);
                    setPrivacyAction(null);
                }}
                onConfirm={handleConfirm}
            >
                {popUpDescription}
            </PopUp>
        </Root>
    );
}