import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { generateClient } from 'aws-amplify/api'
import { createPlayer, updateLeague, deleteLeague, createUsers, updateUsers, deletePlayer, updatePlayer } from '@/graphql/mutations';
import { getUsers, playersByLeagueId, listUsers } from '@/graphql/queries';
import { sendEmailAPI } from "@/helpers/sendEmail";
import { filterPipeCharacter } from "@/helpers/filterPipeChar";
import { Box, Typography, IconButton, Tooltip, TextField, Alert } from "@mui/material";
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import PersonAddAltSharpIcon from '@mui/icons-material/PersonAddAltSharp';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import PeopleIcon from '@mui/icons-material/People';
import RuleIcon from '@mui/icons-material/Rule';
import GroupAddIcon from '@mui/icons-material/GroupAdd';
import EditIcon from '@mui/icons-material/Edit';
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
    const [isAdmin, setIsAdmin] = useState(() => {
        if(League?.lgAdmin.includes(userEmail)){
            return true;
        } else {
            return false;
        }
    });

    const [confirmOpen, setConfirmOpen] = useState(false);
    const [confirmLoading, setConfirmLoading] = useState(false);
    const [popUpTitle, setPopUpTitle] = useState('');
    const [popUpDescription, setPopUpDescription] = useState('');
    const [popUpNameInput, setPopUpNameInput] = useState('');
    const [popUpEmailInput, setPopUpEmailInput] = useState('');
    const [popUpError, setPopUpError] = useState('');
    const [popUpCopySuccess, setPopUpCopySuccess] = useState('');

    const [pickedPlayer, setPickedPlayer] = useState('');
    const [displayName, setDisplayName] = useState('');

    useEffect(() => {
        if (!League?.lgRankingDeadline || League?.lgFinished === 'active') return;

        const checkDeadline = () => {
            const deadlineDate = new Date(League.lgRankingDeadline);
            const now = new Date();

            if (now >= deadlineDate && isAdmin) {
                const currentHistory = League.lgHistory || [];
                const historyEntry = new Date().toISOString() + '. Ranking deadline passed - league automatically started';

                (async () => {
                    try {
                        // fetch players for this league
                        const playersResult = await client.graphql({ query: playersByLeagueId, variables: { leagueId: League.id, limit: 1000 } });
                        const players = playersResult?.data?.playersByLeagueId?.items || [];

                        // delete players who didn't submit
                        const toDelete = players.filter(p => !p.plRankings || (Array.isArray(p.plRankings) && p.plRankings.length === 0));
                        for (const p of toDelete) {
                            try {
                                await client.graphql({ query: deletePlayer, variables: { input: { id: p.id } } });
                            } catch (e) {
                                console.warn('Failed to delete player during auto-start cleanup:', p.id, e);
                            }

                            // remove league from user's leagues array if present
                            try {
                                const targetEmail = String(p.plEmail || p.id || '').toLowerCase().trim();
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
                        console.log('League auto-started:', result);
                        router.push(`/League/${League.id}`);
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
        console.log('league: ',League)
        console.log('player: ',Player)
        console.log('user: ',User)
        const swap = League?.lgSwap?.split('|').map(s => s.trim()).filter(Boolean) || []
        return [
            (League?.lgChallengePoints > 0 ? `Predicting the weekly Maxi Challenge winners is worth <strong>${League?.lgChallengePoints} points</strong>` : 'Predicting weekly Maxi Challenge winners is disabled'),
            (League?.lgDeadline === 'manual' ? 'The admin will manually stop taking submissions' : `The deadline to submit weekly Maxi Challenge predictions is <strong>${formatDeadline(League?.lgDeadline)}</strong>`),
            (League?.lgLipSyncPoints > 0 ? `Predicting the lip sync assassin is worth <strong>${League?.lgLipSyncPoints} points</strong>` : 'Predicting the lip sync assassin is disabled'),
            (League?.lgSwap === '' || !League?.lgSwap ? 'The admin has disabled swaps for this season' : `Swaps will happen ${swap[0] === 'Number of Episodes' ? `after <strong>${swap[1]} episodes</strong>` : `when there are <strong>${swap[1]} Queens remaining</strong>`}`)
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
        setPopUpDescription(<InviteSectionTitle>{player.name} has requested to join. Accepting will add them as a player who can submit rankings immediately. Continue?</InviteSectionTitle>)
        setPickedPlayer(player.email)
        setDisplayName(player.name)
        setConfirmOpen(true)
    };

    const handleDeclineRequest = (player) => {
        setPopUpTitle('Decline player?')
        setPopUpDescription(<InviteSectionTitle>Decline {player.name}&apos;s request to join? They won&apos;t be added to the league and won&apos;t be notified further.</InviteSectionTitle>)
        setPickedPlayer(player.email)
        setDisplayName(player.name)
        setConfirmOpen(true)
    };

    const handleKickRequest = (player) => {
        setPopUpTitle('Revoke invite?')
        setPopUpDescription(<InviteSectionTitle>Revoke the invite for {player.name}? They will no longer be able to accept the invitation using the invite link.</InviteSectionTitle>)
        setPickedPlayer(player.email)
        setDisplayName(player.name)
        setConfirmOpen(true)
    };

    const handleRemovePlayer = (player) => {
        setPopUpTitle('Kick player?')
        setPopUpDescription(<InviteSectionTitle>Remove {player.name} from the league? This will delete their player record and submissions.</InviteSectionTitle>)
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
                    <InviteSectionTitle>Starting the league will close registrations and freeze the player list for {League?.lgName}. This cannot be undone.</InviteSectionTitle>
                    <Box sx={{ mt: 2 }}>
                        <Alert severity="warning">{notSubmitted.length} player{notSubmitted.length > 1 ? 's' : ''} have not submitted rankings: {previewNames}{notSubmitted.length > 10 ? ', ...' : ''}</Alert>
                        <Typography variant="body2" sx={{ mt: 1 }}>You can still start the league, but missing submissions will not be counted.</Typography>
                    </Box>
                </Box>
            )
            setConfirmOpen(true)
            return;
        }

        setPopUpTitle('Start League?')
        setPopUpDescription(<InviteSectionTitle>Starting the league will close registrations and freeze the player list for {League?.lgName}. Make sure you&apos;re ready — this cannot be undone.</InviteSectionTitle>)
        setConfirmOpen(true)
    };

    const handleDeleteLeague = () => {
        setPopUpTitle('Delete League?')
        setPopUpDescription(<InviteSectionTitle>This will permanently delete {League?.lgName} and all its data (players, submissions, settings). This action cannot be undone. Are you sure you want to proceed?</InviteSectionTitle>)
        setConfirmOpen(true)
    }

    const handleInvitePlayer = () => {
        setPopUpTitle('Invite Player')
        setPopUpDescription(<InviteSectionTitle>Invite a new player by entering their name and email, or share the invite link below. Invited players can accept to join your league.</InviteSectionTitle>)
        setConfirmOpen(true)
    }

    const handlePromoteRequest = (player) => {
        setPopUpTitle('Promote to Admin')
        setPopUpDescription(<InviteSectionTitle>Promote {player.name} to league admin? They&apos;ll get permissions to manage invites, start the league, and update settings.</InviteSectionTitle>)
        setPickedPlayer(player.email)
        setDisplayName(player.name)
        setConfirmOpen(true)
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

            {isAdmin && (
                <ActionRow>
                    <SecondaryButton
                        startIcon={<EmojiEventsIcon />}
                        onClick={() => handleStartLeague()}
                    >
                        Start League
                    </SecondaryButton>
                </ActionRow>
            )}

            <CardSection elevation={0}>
                <InviteSectionHeader>
                    <SectionHeader variant="h5" sx={{ mb: 0 }}>
                        <PeopleIcon /> Current Players
                    </SectionHeader>
                    {isAdmin && (
                        <PrimaryButton
                            size="small"
                            startIcon={<GroupAddIcon />}
                            onClick={() => handleInvitePlayer()}
                        >
                            Invite
                        </PrimaryButton>
                    )}
                </InviteSectionHeader>
                {currentPlayerData().length > 0 ? (
                    <TableContainer>
                        <TableHeaderRowCurrent isAdmin={isAdmin}>
                            <TableHeaderCell>Name</TableHeaderCell>
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
                                                    <PrimaryButton
                                                        size="small"
                                                        onClick={() => handlePlayerSubmit(player.name)}
                                                    >
                                                        Submit Rankings
                                                    </PrimaryButton>
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
                                        <StatusChip
                                            label="Submitted"
                                            statuscolor="submitted"
                                            size="small"
                                            icon={<CheckIcon />}
                                        />
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
                    {rules().map((rule, idx) => (
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
                    {isAdmin && (
                        <PrimaryButton
                            size="small"
                            startIcon={<GroupAddIcon />}
                            onClick={() => handleInvitePlayer()}
                        >
                            Invite
                        </PrimaryButton>
                    )}
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
                confirmText={popUpTitle === 'Delete League?' ? 'Delete' : popUpTitle === 'Start League?' ? 'Start' : popUpTitle === 'Invite Player' ? 'Send Invite' : 'Confirm'}
                cancelText="Cancel"
                loading={confirmLoading}
                confirmVariant={popUpTitle === 'Delete League?' ? 'danger' : popUpTitle === 'Start League?' ? 'success' : popUpTitle === 'Invite Player' ? 'primary' : popUpTitle === 'Promote to Admin' ? 'primary' : popUpTitle === 'Accept player?' ? 'primary' : popUpTitle === 'Decline player?' ? 'danger' : popUpTitle === 'Revoke invite?' ? 'danger' : popUpTitle === 'Kick player?' ? 'danger' : 'primary'}
                icon={
                    popUpTitle === 'Delete League?' ? <CloseIcon sx={{ color: '#cc0000' }} /> :
                        popUpTitle === 'Start League?' ? <EmojiEventsIcon sx={{ color: '#1e7e34' }} /> :
                            popUpTitle === 'Invite Player' ? <GroupAddIcon sx={{ color: '#FF1493' }} /> :
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
                }}
                onConfirm={async () => {
                    try {
                        setConfirmLoading(true);
                        setPopUpError('');

                        if(popUpTitle === 'Start League?'){
                            const currentHistory = League.lgHistory || [];
                            const historyEntry = new Date().toISOString() + '. League manually started by admin';

                            try {
                                // fetch players and delete those who didn't submit
                                const playersResult = await client.graphql({ query: playersByLeagueId, variables: { leagueId: League.id, limit: 1000 } });
                                const players = playersResult?.data?.playersByLeagueId?.items || [];
                                const toDelete = players.filter(p => !p.plRankings || (Array.isArray(p.plRankings) && p.plRankings.length === 0));

                                for (const p of toDelete) {
                                    try {
                                        await client.graphql({ query: deletePlayer, variables: { input: { id: p.id } } });
                                        console.log('Deleted unsubmitted player:', p.id);
                                    } catch (e) {
                                        console.warn('Failed to delete unsubmitted player:', p.id, e);
                                    }

                                    // remove league from user's leagues array if present
                                    try {
                                        const targetEmail = String(p.plEmail || p.id || '').toLowerCase().trim();
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
                                                    console.log('Removed league reference from user:', userObj.id);
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
                            console.log('League started:', startResult);
                            router.push(`/League/${League.id}`)
                        } else if(popUpTitle === 'Delete League?'){
                            // Comprehensive cascade delete
                            console.log('Starting league deletion cascade...');

                            // Step 1: Get all players in the league
                            const playersResult = await client.graphql({
                                query: playersByLeagueId,
                                variables: { leagueId: League.id, limit: 1000 }
                            });
                            const players = playersResult?.data?.playersByLeagueId?.items || [];
                            console.log(`Found ${players.length} players to delete`);

                            // Step 2: Delete all player records
                            for (const player of players) {
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
                                    console.log(`Updated user: ${user.id}`);
                                }
                            }

                            // Step 5: Finally, delete the league itself
                            const deleteResult = await client.graphql({
                                query: deleteLeague,
                                variables: { input: { id: League.id } }
                            });
                            console.log('League deleted:', deleteResult);
                            console.log('Cascade deletion completed successfully');

                            // Close popup and redirect
                            setConfirmOpen(false);
                            window.location.href = '/Player';
                        } else if(popUpTitle === 'Invite Player'){
                            const inviteName = popUpNameInput.trim();
                            const inviteEmail = popUpEmailInput.trim().toLowerCase();
                            if (inviteName && inviteEmail) {
                                const updatedPending = League.lgPendingPlayers || [];
                                // don't add duplicate pending invites for the same email
                                const alreadyPending = updatedPending.some(p => {
                                    const parts = String(p || '').split('|').map(s => s.trim()).filter(Boolean);
                                    return (parts[1] && parts[1].toLowerCase() === inviteEmail.toLowerCase()) || (parts[2] && parts[2].toLowerCase() === inviteEmail.toLowerCase());
                                });
                                if (alreadyPending) {
                                    setPopUpError('That user already has a pending invite.');
                                    return;
                                }
                                updatedPending.push(`invited|${inviteEmail}|${inviteName}`);

                                const currentHistory = League.lgHistory || [];
                                const historyEntry = new Date().toISOString() + '. ' + inviteName + ' (' + inviteEmail + ') was invited to join';

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
                                console.log('Player invited:', inviteResult);

                                const results = await client.graphql({
                                    query: getUsers,
                                    variables: { id: inviteEmail }
                                })
                                console.log('User fetch result:', results);

                                if(results.data.getUsers === null) {
                                    const newUser = {
                                        id: inviteEmail,
                                    }
                                    const createResult = await client.graphql({
                                        query: createUsers,
                                        variables: { input: newUser }
                                    });
                                    console.log('New user created:', createResult);
                                }else{
                                    const existingPending = results.data.getUsers.pendingLeagues || [];
                                    if (!existingPending.includes(League.id)) {
                                        const updateResult = await client.graphql({
                                            query: updateUsers,
                                            variables: { input: { id: inviteEmail, pendingLeagues: [...existingPending, League.id] } }
                                        });
                                        console.log('User pending leagues updated:', updateResult);
                                    } else {
                                        console.log('User already has this league in pendingLeagues');
                                    }
                                }

                                // Get the current user's name from Player data (match by plEmail first, fallback to id), then fallback to User.name
                                const currentUserPlayer = Player?.find(p => {
                                    const emailOrId = String(p.plEmail || p.id || '').toLowerCase();
                                    return emailOrId === String(userEmail || '').toLowerCase();
                                });
                                const currentUserName = currentUserPlayer?.plName || User?.name || 'A league admin';

                                try {
                                    const inviteHtml = `
                                        <!DOCTYPE html>
                                        <html lang="en">
                                        <head>
                                            <meta charset="UTF-8">
                                            <meta name="viewport" content="width=device-width, initial-scale=1.0">
                                            <meta http-equiv="X-UA-Compatible" content="IE=edge">
                                        </head>
                                        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif;">
                                            <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f4f4f4;">
                                                <tr>
                                                    <td style="padding: 20px 0;">
                                                        <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                                                            <!-- Header -->
                                                            <tr>
                                                                <td style="background: linear-gradient(135deg, #FF1493 0%, #9B30FF 50%, #FFD700 100%); padding: 30px 20px; text-align: center;">
                                                                    <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700; text-shadow: 0 2px 4px rgba(0,0,0,0.3);">
                                                                        🏁 Drag League Invitation
                                                                    </h1>
                                                                </td>
                                                            </tr>

                                                            <!-- Main Content -->
                                                            <tr>
                                                                <td style="padding: 40px 30px;">
                                                                    <p style="margin: 0 0 20px 0; font-size: 16px; color: #333;">Hi there!</p>

                                                                    <p style="margin: 0 0 20px 0; font-size: 16px; color: #333;">
                                                                        <strong style="color: #1a1a1a;">${currentUserName}</strong> has invited you to join
                                                                        <strong style="color: #1a1a1a;">${League?.lgName}</strong> on Drag League!
                                                                    </p>

                                                                    <p style="margin: 0 0 30px 0; font-size: 16px; color: #555;">
                                                                        Join the competition to rank queens, predict winners, and compete with your friends throughout the season.
                                                                    </p>

                                                                    <!-- CTA Button -->
                                                                    <table role="presentation" style="margin: 0 auto;">
                                                                        <tr>
                                                                            <td style="text-align: center; padding: 20px 0;">
                                                                                <a href="https://drag-league.com/Player"
                                                                                   style="background: linear-gradient(135deg, #FF1493 0%, #C71585 100%); color: #ffffff; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 16px; display: inline-block; box-shadow: 0 4px 12px rgba(255, 20, 147, 0.4); text-shadow: 0 1px 2px rgba(0,0,0,0.2);">
                                                                                    Accept Invitation
                                                                                </a>
                                                                            </td>
                                                                        </tr>
                                                                    </table>

                                                                    <!-- Fallback Link -->
                                                                    <p style="margin: 30px 0 0 0; padding: 20px; background-color: #fff5f8; border-radius: 8px; font-size: 14px; color: #666; border-left: 4px solid #FF1493;">
                                                                        <strong style="color: #FF1493;">Button not working?</strong><br>
                                                                        Copy and paste this link into your browser:<br>
                                                                        <a href="https://drag-league.com/Player" style="color: #FF1493; word-break: break-all; font-weight: 600;">https://drag-league.com/Player</a>
                                                                    </p>
                                                                </td>
                                                            </tr>

                                                            <!-- Footer -->
                                                            <tr>
                                                                <td style="padding: 30px; background-color: #f9f9f9; border-top: 1px solid #e0e0e0;">
                                                                    <p style="margin: 0 0 10px 0; font-size: 12px; color: #999; text-align: center; line-height: 1.5;">
                                                                        This is an automated notification from Drag League.<br>
                                                                        If you didn't expect this invitation, you can safely ignore this email.
                                                                    </p>
                                                                    <p style="margin: 15px 0 0 0; font-size: 12px; text-align: center;">
                                                                        <a href="https://drag-league.com/Support" style="color: #FF1493; text-decoration: underline; font-weight: 600;">Contact Support</a>
                                                                        <span style="color: #ccc; margin: 0 8px;">|</span>
                                                                        <a href="https://drag-league.com/FAQ" style="color: #FF1493; text-decoration: underline; font-weight: 600;">FAQ</a>
                                                                    </p>
                                                                    <p style="margin: 15px 0 0 0; font-size: 11px; color: #aaa; text-align: center;">
                                                                        © 2025 Drag League. All rights reserved.
                                                                    </p>
                                                                </td>
                                                            </tr>
                                                        </table>
                                                    </td>
                                                </tr>
                                            </table>
                                        </body>
                                        </html>
                                    `;
                                    await sendEmailAPI({
                                        to: inviteEmail,
                                        subject: `You're invited to join ${League?.lgName} on Drag League`,
                                        html: inviteHtml,
                                        text: `🏁 DRAG LEAGUE INVITATION\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\nHi there!\n\n${currentUserName} has invited you to join "${League?.lgName}" on Drag League!\n\nJoin the competition to rank queens, predict winners, and compete with your friends throughout the season.\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n🔗 ACCEPT YOUR INVITATION:\nhttps://drag-league.com/Player\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\nThis is an automated notification from Drag League.\nIf you didn't expect this invitation, you can safely ignore this email.\n\nNeed help? Visit: https://drag-league.com/Support\nHave questions? Check our FAQ: https://drag-league.com/FAQ\n\n© 2025 Drag League. All rights reserved.`
                                    });
                                } catch (e) {
                                    setPopUpError("Failed to send invite email");
                                    return;
                                }
                                setPopUpNameInput('');
                                setPopUpEmailInput('');
                                router.push(`/League/${League.id}`)
                            } else {
                                setPopUpError('Both name and email are required to invite a player.');
                                return;
                            }

                        } else if(popUpTitle === 'Promote to Admin'){
                            const updatedAdmins = League.lgAdmin || [];
                            updatedAdmins.push(pickedPlayer.trim().toLowerCase());

                            const currentHistory = League.lgHistory || [];
                            const historyEntry = new Date().toISOString() + '. ' + displayName + ' was promoted to admin';

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
                            console.log('Player promoted to admin (league updated):', promoteResult);

                            // Also update the player's plStatus so UI reflects admin role
                            try {
                                await client.graphql({
                                    query: updatePlayer,
                                    variables: {
                                        input: {
                                            id: pickedPlayer,
                                            plStatus: 'Admin'
                                        }
                                    }
                                });
                                console.log('Player record updated to Admin:', pickedPlayer);
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
                                variables: { input: { id: normalizedEmail, leagueId: League.id, plEmail: normalizedEmail, plName: displayName, plStatus: 'Player' } }
                            });
                            console.log('Player accepted and created:', createPlayerResult);

                            // Update the requesting user's record: add this league to `leagues` and remove from `pendingLeagues`
                            try {
                                const userRes = await client.graphql({ query: getUsers, variables: { id: pickedPlayer } });
                                const userObj = userRes?.data?.getUsers;
                                const leagueEntry = `${new Date().toISOString()}|${League.id}|${League?.lgName || ''}`;

                                if (!userObj) {
                                    // create a minimal user record with this league
                                    await client.graphql({ query: createUsers, variables: { input: { id: pickedPlayer, leagues: [leagueEntry], pendingLeagues: [] } } });
                                    console.log('Created user record for accepted player:', pickedPlayer);
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
                                    console.log('Updated user leagues/pendingLeagues for:', userObj.id);
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
                            console.log('League updated after accept:', updateResult);
                            router.reload();
                        } else if(popUpTitle === 'Revoke invite?'){
                            const updatedPending = (League.lgPendingPlayers || []).filter(p => {
                                const pl = p.split('|').map(s => s.trim()).filter(Boolean)
                                // compare by email (pl[1]) to avoid name mismatches
                                return pl[1]?.toLowerCase() !== displayName?.toLowerCase() && pl[1]?.toLowerCase() !== pickedPlayer?.toLowerCase();
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
                            console.log('Invite revoked:', revokeResult);

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
                                        console.log('Removed pending league reference from user:', userObj.id);
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
                            console.log('Player declined:', declineResult);
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
                                            console.log('Removed pending league reference from requester:', userObj.id);
                                        }
                                    }
                                }
                            } catch (e) {
                                console.warn('Failed to remove pending league from requester record:', e);
                            }

                            router.reload();
                        } else if(popUpTitle === 'Kick player?'){
                            const kickResult = await client.graphql({
                                query: deletePlayer,
                                variables: { input: { id: pickedPlayer } }
                            });
                            console.log('Player kicked:', kickResult);

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
                                        console.log('Removed league reference from user:', userObj.id);
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
                                console.log('Removed from admins:', normalizedPicked);
                            }

                            await client.graphql({
                                query: updateLeague,
                                variables: {
                                    input: updateInput
                                }
                            });
                            router.reload();
                        }

                        setConfirmOpen(false);
                        setPopUpNameInput('');
                        setPopUpEmailInput('');
                    } catch (err) {
                        console.error('Error performing action:', err);
                        setPopUpError(err?.message || String(err) || 'An error occurred');
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
                {popUpTitle === 'Invite Player' && (
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
                        <Box sx={{ mt: 1, mb: 1, textAlign: 'center' }}>
                            <InviteText variant="body2">or share invite link</InviteText>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                            <TextField
                                fullWidth
                                label="Invite link"
                                value={(typeof window !== 'undefined' ? window.location.origin : 'https://drag-league.com') + '/Player?invite=' + (League?.id || '')}
                                InputProps={{ readOnly: true }}
                                onClick={(e) => { e.target.select && e.target.select(); }}
                            />
                            <Tooltip title="Copy invite link">
                                <IconButton
                                    sx={{
                                        color: '#FF1493',
                                        '&:hover': { backgroundColor: 'rgba(255, 20, 147, 0.1)' }
                                    }}
                                    onClick={async () => {
                                        const link = (typeof window !== 'undefined' ? window.location.origin : 'https://drag-league.com') + '/Player?invite=' + (League?.id || '');
                                        try {
                                            await navigator.clipboard.writeText(link);
                                            setPopUpCopySuccess('Copied!');
                                            setTimeout(() => setPopUpCopySuccess(''), 2500);
                                        } catch (e) {
                                            setPopUpError('Failed to copy link');
                                        }
                                    }}
                                >
                                    <ContentCopyIcon />
                                </IconButton>
                            </Tooltip>
                        </Box>
                        {popUpCopySuccess && (
                            <InviteText variant="caption" sx={{ color: 'success.main' }}>
                                {popUpCopySuccess}
                            </InviteText>
                        )}
                    </Box>
                )}
            </PopUp>
        </PageContainer>
    );
}
