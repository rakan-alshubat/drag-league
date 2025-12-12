import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { generateClient } from 'aws-amplify/api'
import { createPlayer, updateLeague, deleteLeague, createUsers, updateUsers, deletePlayer } from '@/graphql/mutations';
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
    TableHeaderRow,
    TableHeaderCell,
    TableRow,
    TableCell,
    StatusChip,
    EmptyState,
    EmptyStateText,
    BottomActionBar,
    InviteSectionHeader
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

                client.graphql({
                    query: updateLeague,
                    variables: {
                        input: {
                            id: League.id,
                            lgFinished: 'active',
                            lgHistory: [...currentHistory, historyEntry]
                        }
                    }
                }).then((result) => {
                    console.log('League auto-started:', result);
                    router.push(`/League/${League.id}`)
                }).catch(err => {
                    console.error('Error auto-starting league:', err);
                });
            }
        };

        checkDeadline();
        const interval = setInterval(checkDeadline, DEADLINE_CHECK_INTERVAL_MS);

        return () => clearInterval(interval);
    }, [League?.lgRankingDeadline, League?.lgFinished, League?.id, isAdmin, client, router]);

    const currentPlayerData = () => {
        if (Player && Array.isArray(Player)) {
            return Player.map((player) => {
                const row = {
                    name: player.plName,
                    role: player.plStatus,
                    submitted: player.plRankings ? 'Submitted' : 'Pending',
                    email: player.id.toLowerCase()
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

    const handlePlayerSubmit = () => {
        router.push(`/Rank/${League.id}`)
    };

    const handleAcceptRequest = (player) => {
        setPopUpTitle('Accept player?')
        setPopUpDescription('Are you sure you want to accept this player?')
        setPickedPlayer(player.email)
        setDisplayName(player.name)
        setConfirmOpen(true)
    };

    const handleDeclineRequest = (player) => {
        setPopUpTitle('Decline player?')
        setPopUpDescription('This will decline the join request from this player')
        setPickedPlayer(player.email)
        setDisplayName(player.name)
        setConfirmOpen(true)
    };

    const handleKickRequest = (player) => {
        setPopUpTitle('Revoke invite?')
        setPopUpDescription('This will revoke the invite from this player')
        setPickedPlayer(player.email)
        setDisplayName(player.name)
        setConfirmOpen(true)
    };

    const handleStartLeague = () => {
        setPopUpTitle('Start League?')
        setPopUpDescription('You cant add any more players after this')
        setConfirmOpen(true)
    };

    const handleDeleteLeague = () => {
        setPopUpTitle('Delete League?')
        setPopUpDescription('All settings and submissions will be deleted. this cant be undone')
        setConfirmOpen(true)
    }

    const handleInvitePlayer = () => {
        setPopUpTitle('Invite Player')
        setPopUpDescription('')
        setConfirmOpen(true)
    }

    const handlePromoteRequest = (player) => {
        setPopUpTitle('Promote to Admin')
        setPopUpDescription('You sure you want this player to be admin?')
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
                    <PrimaryButton
                        startIcon={<GroupAddIcon />}
                        onClick={() => handleInvitePlayer()}
                    >
                        Invite Players
                    </PrimaryButton>
                    <SecondaryButton
                        startIcon={<EmojiEventsIcon />}
                        onClick={() => handleStartLeague()}
                    >
                        Start League
                    </SecondaryButton>
                </ActionRow>
            )}

            <CardSection elevation={0}>
                <SectionHeader variant="h5">
                    <PeopleIcon /> Current Players
                </SectionHeader>
                {currentPlayerData().length > 0 ? (
                    <TableContainer>
                        <TableHeaderRow>
                            <TableHeaderCell>Name</TableHeaderCell>
                            <TableHeaderCell>Role</TableHeaderCell>
                            <TableHeaderCell>Rankings</TableHeaderCell>
                        </TableHeaderRow>
                        {currentPlayerData().map((player, idx) => (
                            <TableRow key={idx}>
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
                                            {isAdmin && (
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
                                                        onClick={() => handlePlayerSubmit()}
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
                            </TableRow>
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
                        <TableHeaderRow isAdmin={isAdmin}>
                            <TableHeaderCell>Name</TableHeaderCell>
                            <TableHeaderCell>Status</TableHeaderCell>
                                        {isAdmin && <TableHeaderCell>Actions</TableHeaderCell>}
                        </TableHeaderRow>
                        {pendingPlayerData().map((player, idx) => (
                                <TableRow key={idx} isAdmin={isAdmin}>
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
                                                {player.status === 'invited' && (
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
                                                )}
                                            </TableCell>
                                        )}
                            </TableRow>
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

                            const startResult = await client.graphql({
                                query: updateLeague,
                                variables: {
                                    input: {
                                        id: League.id,
                                        lgFinished: 'active',
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

                                // Get the current user's name from Player data
                                const currentUserPlayer = Player?.find(p => p.id?.toLowerCase() === userEmail?.toLowerCase());
                                const currentUserName = currentUserPlayer?.plName || 'A league admin';

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
                            console.log('Player promoted to admin:', promoteResult);
                            router.reload();
                        } else if(popUpTitle === 'Accept player?'){
                            const updatedPending = (League.lgPendingPlayers || []).filter(p => {
                                    const pl = p.split('|').map(s => s.trim()).filter(Boolean)
                                    // compare by email (pl[1]) to avoid name mismatches
                                    return pl[1]?.toLowerCase() !== pickedPlayer?.toLowerCase();
                                });

                            const createPlayerResult = await client.graphql({
                                query: createPlayer,
                                variables: { input: { leagueId: League.id, plEmail: pickedPlayer, plName: displayName, plStatus: 'Player' } }
                            });
                            console.log('Player accepted and created:', createPlayerResult);

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
                            router.reload();
                        } else if(popUpTitle === 'Kick player?'){
                            const kickResult = await client.graphql({
                                query: deletePlayer,
                                variables: { input: { id: pickedPlayer } }
                            });
                            console.log('Player kicked:', kickResult);

                            const currentHistory = League.lgHistory || [];
                            const historyEntry = new Date().toISOString() + '. Player ' + displayName + ' was removed from the league';

                            await client.graphql({
                                query: updateLeague,
                                variables: {
                                    input: {
                                        id: League.id,
                                        lgHistory: [...currentHistory, historyEntry]
                                    }
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
                <Typography variant="body2">{popUpDescription}</Typography>
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
                            <Typography variant="body2" sx={{ color: 'text.secondary' }}>or share invite link</Typography>
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
                            <Typography variant="caption" sx={{ color: 'success.main', textAlign: 'center' }}>
                                {popUpCopySuccess}
                            </Typography>
                        )}
                    </Box>
                )}
            </PopUp>
        </PageContainer>
    );
}
