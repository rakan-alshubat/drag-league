import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { generateClient } from 'aws-amplify/api'
import { createPlayer, updateLeague, deleteLeague, createUsers, updateUsers, deletePlayer } from '@/graphql/mutations';
import { getUsers } from '@/graphql/queries';
import { sendEmailAPI } from "@/helpers/sendEmail";
import { filterPipeCharacter } from "@/helpers/filterPipeChar";
import { Box, Typography, Button, IconButton, Tooltip, TextField, Alert } from "@mui/material";
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import PersonAddAltSharpIcon from '@mui/icons-material/PersonAddAltSharp';
import PopUp from "@/files/PopUp";
import Countdown from "@/files/Countdown";
import checkPrivacy from "@/helpers/chechPrivacy";
import { PageContainer,
    Title,
    DescriptionBox,
    ButtonRow,
    SquareSection,
    SectionHeader,
    DynamicGrid,
    GridHeader,
    GridItem,
    RowContainer,
    RowGrid,
    ColumnHeader,
    RowItem} from "./NewLeague.styles";

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

    const [pickedPlayer, setPickedPlayer] = useState('');

    const playerHeaders = ["Name", "Role", "Queens ranked?"];
    const pendingHeaders = ["Name", "Status"];

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

                const row = [player.plName, player.plStatus, (player.plRankings ? 'Submitted' : 'Pending')];
                row._email = player.id.toLowerCase();
                return row;
            });
        }
        return [];
    }

    const pendingPlayerData = () => {
        let pendingPlayers = []
        League?.lgPendingPlayers.forEach((player) => {
            const pl = player.split('|').map(s => s.trim()).filter(Boolean)
            pendingPlayers.push([pl[2], pl[1]]);
        });
        return pendingPlayers
    }

    const rules = () => {
        const swap = League?.lgSwap.split('|').map(s => s.trim()).filter(Boolean)
        return [
            // (League?.lgPublic ? 'This League is public' : 'This league is private'),
            (League?.lgChallengePoints > 0 ? 'Predicting maxi challenge winners is worth ' + League?.lgChallengePoints + ' points!' : 'Predicting weekly maxi winners is disabled'),
            (League?.lgDeadline === 'manual' ? 'The admin will manually stop taking submissions' : 'The deadline to submit the weekly maxi winner prediction is ' + formatDeadline(League?.lgDeadline)),
            (League?.lgChallengePoints > 0 ? 'Predcting the lip sync assassin of the season is worth ' + League?.lgLipSyncPoints + ' points!' : 'Predicting the lip sync assasin is disabled'),
            (League?.lgSwap === '' ? 'The admin has disabled swaps for this season' : 'Swaps will happen' + (swap[0] === 'Number of Episodes' ? ' after ' + swap[1] + ' episodes' : ' when there are ' + swap[1] + ' Queens remaining'))
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
            bonuses.push('The bonus category is ' + bonusInfo[0] + ', and its worth ' + bonusInfo[1] + ' points')
        })
        return bonuses
    }

    const handlePlayerSubmit = () => {
        router.push(`/Rank/${League.id}`)
    };

    const handleAcceptRequest = (row) => {
        setPopUpTitle('Accept player?')
        setPopUpDescription('Are you sure you want to accept this player?')
        setPickedPlayer(row._email)
        setConfirmOpen(true)
    };

    const handleDeclineRequest = (row) => {
        setPopUpTitle('Kick player?')
        setPopUpDescription('This will revoke the invite from this player')
        setPickedPlayer(row._email)
        setConfirmOpen(true)
    };

    const handleKickRequest = (row) => {
        setPopUpTitle('Revoke invite?')
        setPopUpDescription('This will revoke the invite from this player')
        setPickedPlayer(row._email)
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

    const handlePromoteRequest = (row) => {
        setPopUpTitle('Promote to Admin')
        setPopUpDescription('You sure you want this player to be admin?')
        setPickedPlayer(row._email)
        setConfirmOpen(true)
    }

    const renderRowTable = (headers, rows, columns) => (
        <RowContainer>
            <RowGrid columns={columns}>
                {headers.map((h) => (
                    <ColumnHeader key={h}>{h}</ColumnHeader>
                ))}
            </RowGrid>

            {rows.map((row, rIdx) => (
                <RowGrid key={rIdx} columns={columns} sx={{ mt: 0 }}>
                    {Array.from({ length: columns }).map((_, cIdx) => (
                        <RowItem key={cIdx}>
                            {(() => {
                                const nameCol = headers.indexOf('Name');
                                const cell = row[cIdx];
                                if (typeof cell === 'string' && cell.toLowerCase().trim() === 'requested') {
                                    return (
                                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                                            requesting to join
                                            {isAdmin && (
                                                <>
                                                    <Tooltip title="Accept">
                                                        <IconButton
                                                            size="small"
                                                            color="success"
                                                            onClick={() => handleAcceptRequest(row)}
                                                        >
                                                            <CheckIcon fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                    <Tooltip title="Decline">
                                                        <IconButton
                                                            size="small"
                                                            color="error"
                                                            onClick={() => handleDeclineRequest(row)}
                                                        >
                                                            <CloseIcon fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                </>
                                            )}
                                        </Box>
                                    );
                                }
                                // show a button when the cell explicitly indicates "not submitted"
                                if (typeof cell === 'string' && cell.toLowerCase().trim() === 'pending') {
                                    const playerName = (nameCol >= 0 && row[nameCol]) ? String(row[nameCol]).toLowerCase().trim() : '';
                                    const loggedIn = userEmail ? String(userEmail).toLowerCase().trim() : '';

                                    // Use email stored on the row (player.id)
                                    let playerEmail = row._email || '';

                                    const canSubmit = isAdmin || (playerEmail && loggedIn && playerEmail === loggedIn);
                                    if (canSubmit) {
                                        return (
                                            <Button
                                                size="small"
                                                variant="contained"
                                                color="primary"
                                                onClick={() => handlePlayerSubmit()}
                                            >
                                                Submit your ranking
                                            </Button>
                                        );
                                    }
                                    return <Typography variant="body2">Not yet</Typography>;
                                }
                                if (typeof cell === 'string' && cell.toLowerCase().trim() === 'invited') {
                                    return (
                                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                                            Pending
                                            {isAdmin && (
                                                <Tooltip title="kick">
                                                    <IconButton
                                                        size="small"
                                                        color="error"
                                                        onClick={() => handleKickRequest(row)}
                                                    >
                                                        <CloseIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                            )}
                                        </Box>
                                    );
                                }
                                if (typeof cell === 'string' && cell.toLowerCase().trim() === 'player') {
                                    return (
                                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                                            Player
                                            {isAdmin && (
                                                <Tooltip title="Promote to Admin">
                                                    <IconButton
                                                        size="small"
                                                        color="info"
                                                        onClick={() => handlePromoteRequest(row)}
                                                    >
                                                        <PersonAddAltSharpIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                            )}
                                        </Box>
                                    );
                                }
                                // otherwise render the cell value
                                return cell !== undefined ? cell : '';
                            })()}
                        </RowItem>
                    ))}
                </RowGrid>
            ))}
        </RowContainer>
    );

    return (
        <PageContainer>
            <Title variant="h4">{League?.lgName}</Title>

            {(League?.lgDescription && League.lgDescription.length > 0) && (
                <DescriptionBox>
                    <Typography variant="body1">{League?.lgDescription}</Typography>
                </DescriptionBox>
            )}

            {League?.lgRankingDeadline && (
                <Box sx={{ mb: 3 }}>
                    <Countdown 
                        deadline={League.lgRankingDeadline} 
                        label="Ranking Submission Deadline" 
                    />
                </Box>
            )}

            <ButtonRow>
                {isAdmin && (
                    <>
                        <Button variant="contained" color="primary" onClick={() => handleInvitePlayer()}>
                            invite players
                        </Button>

                        <Button variant="contained" color="secondary" onClick={() => handleStartLeague()}>
                            start league
                        </Button>
                    </>
                )}
            </ButtonRow>

            <SquareSection>
                <SectionHeader variant="h6">Current Players</SectionHeader>
                <Box sx={{ p: 2, flex: 1 }}>
                    {renderRowTable(playerHeaders, currentPlayerData(), playerHeaders.length)}
                </Box>
            </SquareSection>

            <Box sx={{ mb: 2 }}>
                <GridHeader variant="h6">Meet The Queens</GridHeader>
                <DynamicGrid columns={3} gap={2}>
                    {League?.lgQueenNames.map(it => (
                        <GridItem key={it}>
                            <Typography variant="subtitle1" align="center" sx={{ whiteSpace: 'normal' }}>
                                {it}
                            </Typography>
                        </GridItem>
                    ))}
                </DynamicGrid>
            </Box>

            <Box sx={{ mb: 2 }}>
                <GridHeader variant="h6">League Rules</GridHeader>
                <DynamicGrid columns={2} gap={2}>
                    {rules().map(it => (
                        <GridItem key={it}>
                            <Typography variant="subtitle1" align="center" sx={{ whiteSpace: 'normal' }}>
                                {it}
                            </Typography>
                        </GridItem>
                    ))}
                </DynamicGrid>
            </Box>

            <Box sx={{ mb: 2 }}>
                <GridHeader variant="h6">Bonus rules!</GridHeader>
                <DynamicGrid columns={1} gap={2}>
                    {bonusRules().map(it => (
                        <GridItem key={it}>
                            <Typography variant="subtitle1" align="center" sx={{ whiteSpace: 'normal' }}>
                                {it}
                            </Typography>
                        </GridItem>
                    ))}
                </DynamicGrid>
            </Box>

            <SquareSection>
                <SectionHeader variant="h6">Pending players
                    {isAdmin && (
                        <ButtonRow >
                            <Button variant="contained" color="primary" onClick={() => handleInvitePlayer()}>
                                invite players
                            </Button>
                        </ButtonRow>
                    )}
                </SectionHeader>
                <Box sx={{ p: 2, flex: 1 }}>
                    {renderRowTable(pendingHeaders, pendingPlayerData(), pendingHeaders.length)}
                </Box>
            </SquareSection>

            <ButtonRow sx={{ justifyContent: 'space-between' }}>
                {isAdmin && (
                    <>
                        <Button variant="contained" color="error" onClick={() => handleDeleteLeague()}>
                            Delete League
                        </Button>
                        <Button variant="contained" color="secondary" onClick={() => handleStartLeague()}>
                            start league
                        </Button>
                    </>
                )}
            </ButtonRow>

            <PopUp
                open={confirmOpen}
                title={popUpTitle}
                confirmText={popUpTitle === 'Delete League?' ? 'Delete' : 'Start'}
                cancelText="Cancel"
                loading={confirmLoading}
                onCancel={() => {
                    setConfirmOpen(false);
                    setPopUpNameInput('');
                    setPopUpEmailInput('');
                    setPopUpError('');
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
                            const deleteResult = await client.graphql({
                                query: deleteLeague,
                                variables: { input: { id: League.id } }
                            });
                            console.log('League deleted:', deleteResult);
                            router.push(`/Player`)
                        } else if(popUpTitle === 'Invite Player'){
                            const inviteName = popUpNameInput.trim();
                            const inviteEmail = popUpEmailInput.trim().toLowerCase();
                            if (inviteName && inviteEmail) {
                                const updatedPending = League.lgPendingPlayers || [];
                                updatedPending.push(`invited|${inviteName}|${inviteEmail}`);
                                
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
                                    const updateResult = await client.graphql({
                                        query: updateUsers,
                                        variables: { input: { id: inviteEmail, pendingLeagues: [...(results.data.getUsers.pendingLeagues || []), League.id] } }
                                    });
                                    console.log('User pending leagues updated:', updateResult);
                                }
                                try {
                                    const inviteHtml = `
                                        <!DOCTYPE html>
                                        <html>
                                        <head>
                                            <meta charset="utf-8">
                                            <meta name="viewport" content="width=device-width, initial-scale=1.0">
                                        </head>
                                        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
                                            <div style="background-color: #B3F7DC; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                                                <h2 style="margin: 0; color: #1a1a1a;">🎭 Drag League Invitation</h2>
                                            </div>
                                            <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px;">
                                                <p>Hi there!</p>
                                                <p>You've been invited to join <strong>${League?.lgName}</strong> on Drag League!</p>
                                                <p style="margin: 25px 0;">
                                                    <a href="https://drag-league.com/Player" 
                                                       style="background-color: #B3F7DC; color: #1a1a1a; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                                                        Accept Invitation
                                                    </a>
                                                </p>
                                                <p style="color: #666; font-size: 14px;">
                                                    If the button doesn't work, copy and paste this link into your browser:<br>
                                                    <a href="https://drag-league.com/Player" style="color: #1a1a1a;">https://drag-league.com/Player</a>
                                                </p>
                                            </div>
                                            <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 12px;">
                                                <p>This email was sent by Drag League. If you didn't expect this invitation, you can safely ignore this email.</p>
                                            </div>
                                        </body>
                                        </html>
                                    `;
                                    await sendEmailAPI({
                                        to: inviteEmail,
                                        subject: `You're invited to join ${League?.lgName} on Drag League`,
                                        html: inviteHtml,
                                        text: `Hi there!\n\nYou've been invited to join ${League?.lgName} on Drag League!\n\nClick here to accept: https://drag-league.com/Player\n\nIf you didn't expect this invitation, you can safely ignore this email.\n\n- Drag League`
                                    });
                                } catch (e) {
                                    setPopUpError("Failed to send invite email");
                                    return;
                                }
                                setPopUpNameInput('');
                                setPopUpEmailInput('');

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
                            router.push(`/League/${League.id}`)
                        } else if(popUpTitle === 'Accept player?'){
                            const updatedPending = (League.lgPendingPlayers || []).filter(p => {
                                const pl = p.split('|').map(s => s.trim()).filter(Boolean)
                                return pl[2].toLowerCase() !== pickedPlayer.toLowerCase();
                            });
                            
                            const createPlayerResult = await client.graphql({
                                query: createPlayer,
                                variables: { input: { id: adminEmail, leagueId: League.id, plName: displayName, plStatus: 'Player' } }
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
                            router.push(`/League/${League.id}`)
                        } else if(popUpTitle === 'Revoke invite?'){
                            const updatedPending = (League.lgPendingPlayers || []).filter(p => {
                                const pl = p.split('|').map(s => s.trim()).filter(Boolean)
                                return pl[2].toLowerCase() !== pickedPlayer.toLowerCase();
                            });
                            
                            const currentHistory = League.lgHistory || [];
                            const historyEntry = new Date().toISOString() + '. Invite revoked for ' + pickedPlayer;
                            
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
                            router.push(`/League/${League.id}`)
                        }else if(popUpTitle === 'Decline player?'){
                            const updatedPending = (League.lgPendingPlayers || []).filter(p => {
                                const pl = p.split('|').map(s => s.trim()).filter(Boolean)
                                return pl[2].toLowerCase() !== pickedPlayer.toLowerCase();
                            });
                            
                            const currentHistory = League.lgHistory || [];
                            const historyEntry = new Date().toISOString() + '. Join request declined for ' + pickedPlayer;
                            
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
                            router.push(`/League/${League.id}`)
                        } else if(popUpTitle === 'Kick player?'){
                            const kickResult = await client.graphql({
                                query: deletePlayer,
                                variables: { input: { id: pickedPlayer } }
                            });
                            console.log('Player kicked:', kickResult);
                            
                            const currentHistory = League.lgHistory || [];
                            const historyEntry = new Date().toISOString() + '. Player ' + pickedPlayer + ' was removed from the league';
                            
                            await client.graphql({
                                query: updateLeague,
                                variables: { 
                                    input: { 
                                        id: League.id,
                                        lgHistory: [...currentHistory, historyEntry]
                                    } 
                                }
                            });
                            router.push(`/League/${League.id}`)
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
                            label='name'
                            value={popUpNameInput}
                            onChange={(e) => setPopUpNameInput(filterPipeCharacter(e.target.value))}
                        />
                        <TextField
                            fullWidth
                            rows={3}
                            label='email'
                            value={popUpEmailInput}
                            onChange={(e) => setPopUpEmailInput(filterPipeCharacter(e.target.value))}
                        />
                    </Box>
                )}
            </PopUp>
        </PageContainer>
    );
}