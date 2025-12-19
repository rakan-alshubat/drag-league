import { getCurrentUser } from "@aws-amplify/auth";
import { generateClient } from 'aws-amplify/api'
import { useRouter } from "next/router";
import Link from "next/link";
import { updatePlayer, updateLeague } from "@/graphql/mutations";
import { filterPipeCharacter } from "@/helpers/filterPipeChar";
import LoadingWheel from "@/files/LoadingWheel";
import ErrorPopup from '@/files/ErrorPopUp';
import { FormContainer,
    FormSection,
    SectionTitle,
    StyledTextField,
    StyledSelect,
    CreationTitleBox,
    SubmitContainer,
    SubmitButton,
    CancelButton,
    SectionWrapper,
    ExplanationText,
    DescriptionBox,
    DescriptionText,
    StyledLink,
    TitleRow,} from "./RankingsPage.styles";
import { BackButton } from "./RankingsPage.styles";
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import { MenuItem } from "@mui/material";
import { useEffect, useState, useRef } from "react";

export default function RankingsPage(props){

    const League = props.leagueInfo?.leagueInfo ?? props.leagueInfo ?? null;
    const User = props.userInfo?.userInfo ?? props.userInfo ?? null;
    const Player = props.playersInfo?.playersInfo ?? props.playersInfo ?? null;
    const isEditMode = props.isEditMode || false;

    const [queenNames, setQueenNames] = useState({});
    const [displayName, setDisplayName] = useState('');

    const [playerNameError, setPlayerNameError] = useState(false);
    const [queenNamesError, setQueenNamesError] = useState(false);

    const [missingQueenIndices, setMissingQueenIndices] = useState([]);

    const [loading, setLoading] = useState(false);
    const [errorPopup, setErrorPopup] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [attemptedSubmit, setAttemptedSubmit] = useState(false);

    const [showOptionalSection, setShowOptionalSection] = useState(false);
    const [optionalQueen, setOptionalQueen] = useState('');

    const [showOptionalBonusSection, setShowOptionalBonusSection] = useState(() => Boolean(League?.lgBonusPoints && League.lgBonusPoints.length > 0));

    const [optionalBonusQueen, setOptionalBonusQueen] = useState('');

    const [optionalQueenError, setOptionalQueenError] = useState(false);
    const [optionalBonusError, setOptionalBonusError] = useState(false);
    const [missingOptionalRowIndices, setMissingOptionalRowIndices] = useState([]);

    const router = useRouter();
    const client = generateClient()
    const timeoutRef = useRef(null);
    const { id } = router.query;

    const lgQueenNames = League?.lgQueenNames ?? [];
    const numbers = Array.from({ length: 30 }, (_, i) => i + 1)

    const parseBonusPoints = (bonusArr = []) => {
        const rawArr = Array.isArray(bonusArr) ? bonusArr : (bonusArr ? [bonusArr] : []);
        return rawArr.map((item, index) => {
            const parts = item.split('|');
            return {
                id: `bonus-${index}`,
                title: parts[0],
                number: parts[1],
                type: parts[2].toLowerCase().trim(),
                value: '',
            };
        });
    };
    // Keep optionalRows in sync with League data (skip in edit mode with saved bonuses)
    useEffect(() => {
        if (!isEditMode || !Player?.plBonuses) {
            const raw = League?.lgBonusPoints ?? [];
            const parsed = parseBonusPoints(raw);
            setOptionalRows(parsed);
            setShowOptionalBonusSection(Array.isArray(raw) ? raw.length > 0 : Boolean(raw));
        }
    }, [League?.lgBonusPoints, isEditMode, Player?.plBonuses]);

    // Show lip sync assassin section if points value is greater than 0
    useEffect(() => {
        const points = League?.lgLipSyncPoints || 0;

        setShowOptionalSection(points > 0);
    }, [League?.lgLipSyncPoints]);

    // Pre-populate display name for first-time submissions
    useEffect(() => {
        const hasNoRankings = !Player?.plRankings || !Array.isArray(Player.plRankings) || Player.plRankings.length === 0;
        if (!isEditMode && hasNoRankings) {
            const fromQuery = router?.query?.displayName;
            if (fromQuery) {
                setDisplayName(String(fromQuery));
            } else if (User?.name) {
                setDisplayName(User.name);
            }
        }
    }, [isEditMode, Player?.plRankings, User?.name, router?.query?.displayName]);

    // Populate form in edit mode
    useEffect(() => {
        if (isEditMode && Player?.plRankings && Array.isArray(Player.plRankings) && Player.plRankings.length > 0) {

            // Set display name
            if (Player.plName) {
                setDisplayName(Player.plName);
            }
            
            // Populate queen rankings
            const rankingsObj = {};
            Player.plRankings.forEach((queenName, index) => {
                rankingsObj[index] = queenName;
            });
            setQueenNames(rankingsObj);
            
            // Populate lip sync assassin if exists
            if (Player.plLipSyncAssassin) {
                setOptionalQueen(Player.plLipSyncAssassin);
            }
            
            // Populate bonus categories if they exist
            if (Player.plBonuses && Array.isArray(Player.plBonuses) && Player.plBonuses.length > 0) {
                const bonusArr = Player.plBonuses;
                const raw = League?.lgBonusPoints ?? [];
                const parsed = parseBonusPoints(raw);

                // Extract answer from "category|answer" format
                const updatedRows = parsed.map((row, idx) => {
                    const savedItem = bonusArr[idx] || '';
                    const parts = savedItem.split('|');
                    const answer = parts.length > 1 ? parts[1] : '';
                    
                    return {
                        ...row,
                        value: answer
                    };
                });

                setOptionalRows(updatedRows);
            }
        }
    }, [isEditMode, Player, League?.lgBonusPoints]);

    const checkForErrors = () => {
        let hasError = false;
        setAttemptedSubmit(true);


        if(displayName.trim() === ''){
            setPlayerNameError(true);
            hasError = true;
        }if(!hasError){
            setPlayerNameError(false);
            setQueenNamesError(false);
        }

        const missing = Array.from({ length: lgQueenNames.length }, (_, i) => {
            return (!queenNames[i] || queenNames[i] === '') ? i : -1;
        }).filter(i => i !== -1);

        if (missing.length > 0) {
            setQueenNamesError(true);
            setMissingQueenIndices(missing);
            hasError = true;
        } else {
            setQueenNamesError(false);
            setMissingQueenIndices([]);
        }

        // optional single-dropdown section validation
        if (showOptionalSection) {
            if (!optionalQueen || optionalQueen === '') {
                setOptionalQueenError(true);
                hasError = true;
            } else {
                setOptionalQueenError(false);
            }
        } else {
            setOptionalQueenError(false);
        }

        // optional bonus rows validation
        if (showOptionalBonusSection) {
            const missingOpt = optionalRows.map((r, i) => (!r.value || r.value === '') ? i : -1).filter(i => i !== -1);
            if (missingOpt.length > 0) {
                setOptionalBonusError(true);
                setMissingOptionalRowIndices(missingOpt);
                hasError = true;
            } else {
                setOptionalBonusError(false);
                setMissingOptionalRowIndices([]);
            }
        } else {
            setOptionalBonusError(false);
            setMissingOptionalRowIndices([]);
        }

        return hasError;
    }

    const getOrdinal = (n) => {
        const s = ["th","st","nd","rd"],
            v = n % 100;
        return n + (s[(v-20)%10] || s[v] || s[0]);
    };

    async function handleSubmitChange(event){
        if (event && typeof event.preventDefault === 'function') event.preventDefault();

        if(checkForErrors()){
            return;
        }

        // Prevent submissions if the ranking deadline has passed
        try {
            const deadline = League?.lgRankingDeadline ? new Date(League.lgRankingDeadline).getTime() : null;
            if (deadline && Date.now() >= deadline) {
                setErrorMessage('Unable to submit: the ranking deadline has passed.');
                setErrorPopup(true);
                return;
            }
        } catch (err) {
            // ignore parse errors and allow submit to proceed
        }

        // Prevent submissions if the league hasn't started yet
        if (League?.lgFinished !== 'not started') {
            setErrorMessage('Unable to submit: this league has started.');
            setErrorPopup(true);
            return;
        }

        setLoading(true);

        try {
            // build payload
            const rankingsArray = Array.from({ length: lgQueenNames.length }, (_, i) => queenNames[i] || '');
            const bonusValues = (optionalRows || []).map(r => {
                const category = (r.title || '').toString().trim();
                const answer = (r.value ?? '').toString().trim();
                return `${category}|${answer}`;
            });

            // Use the player's actual ID from the database
            if (!Player?.id) {
                console.error('Player ID is missing:', Player);
                setErrorMessage('Error: Player information is missing. Please try refreshing the page.');
                setErrorPopup(true);
                setLoading(false);
                return;
            }

            const input = {
                id: Player.id,
                plEmail: Player.plEmail || User?.id || '',
                plName: displayName.trim(),
                plStatus: Player.plStatus || 'Player',
                plLipSyncAssassin: optionalQueen || '',
                plRankings: rankingsArray,
                plBonuses: bonusValues,
                leagueId: League?.id || null,
            };

            const updatePlayerWithInput = await client.graphql({
                query: updatePlayer,
                variables: { input }
            });

            // Add history entry to league
            const currentHistory = League?.lgHistory || [];
            const historyEntry = new Date().toISOString() + '. ' + displayName.trim() + ' submitted their rankings';
            
            await client.graphql({
                query: updateLeague,
                variables: { 
                    input: { 
                        id: League?.id, 
                        lgHistory: [...currentHistory, historyEntry]
                    } 
                }
            });

            setLoading(false);
            router.push('/League/' + League?.id);
        } catch (error) {
            console.error('Error submitting rankings:', error);
            console.error('Error details:', error?.errors, error?.message);
            setLoading(false);
            
            // Show user-friendly error message
            setErrorMessage('Unable to submit your rankings. Try again later, or make sure the deadline hasn\'t passed');
            setErrorPopup(true);
        }
    };

    const [optionalRows, setOptionalRows] = useState(() => parseBonusPoints(League?.lgBonusPoints || []));

    const updateOptionalRow = (index, changes) => {
        setOptionalRows(prev => {
            const next = [...prev];
            next[index] = { ...next[index], ...changes };
            return next;
        });
        setMissingOptionalRowIndices(prev => prev.filter(i => i !== index));
        // if no missing rows remain, clear error
        setTimeout(() => {
            setOptionalBonusError(prev => {
                const stillMissing = (missingOptionalRowIndices || []).filter(i => i !== index);
                return stillMissing.length > 0;
            });
        }, 0);
    };

    const renderRowDropdown = (row, rowIndex) => {
        const isMissing = attemptedSubmit && missingOptionalRowIndices.includes(rowIndex);
        const missingStyle = isMissing ? { border: '2px solid rgba(220,20,60,0.85)', backgroundColor: '#fff3f3', borderRadius: 4 } : undefined;

        const t = (row.type || 'queens').toString().toLowerCase().trim();
        switch (t) {
        case 'number':
            return (
                <StyledSelect
                    value={row.value}
                    onChange={(e) => updateOptionalRow(rowIndex, { value: e.target.value })}
                    displayEmpty
                    style={{ width: '100%', ...missingStyle }}
                >
                    <MenuItem value="" disabled>Select a number</MenuItem>
                    {numbers.map(n => <MenuItem key={`${row.id}-num-${n}`} value={n}>{n}</MenuItem>)}
                </StyledSelect>
            );
        case 'yes/no':
            return (
                <StyledSelect
                    value={row.value}
                    onChange={(e) => updateOptionalRow(rowIndex, { value: e.target.value })}
                    displayEmpty
                    style={{ width: '100%', ...missingStyle }}
                >
                    <MenuItem value="" disabled>Select Yes or No</MenuItem>
                    <MenuItem key={`${row.id}-yes`} value="yes">Yes</MenuItem>
                    <MenuItem key={`${row.id}-no`} value="no">No</MenuItem>
                </StyledSelect>
            );

        case 'queens':
        default:
            return (
                <StyledSelect
                    value={row.value}
                    onChange={(e) => updateOptionalRow(rowIndex, { value: e.target.value })}
                    displayEmpty
                    style={{ width: '100%', ...missingStyle }}
                >
                    <MenuItem value="" disabled>Select a Queen</MenuItem>
                    {lgQueenNames.map((queen, i) => (
                        <MenuItem key={`${row.id}-queen-${i}`} value={queen}>{queen}</MenuItem>
                    ))}
                </StyledSelect>
            );
        }
    };

    if(loading){
        return (
            <LoadingWheel />
        )
    }

    return(
        <FormContainer>
            <BackButton
                startIcon={<ArrowBackIosNewIcon fontSize="small" />}
                onClick={() => router.push('/League/' + (League?.id || id))}
            >
                Back
            </BackButton>
            <CreationTitleBox>{isEditMode ? `Edit Rankings - ${League?.lgName}` : League?.lgName}</CreationTitleBox>
            <DescriptionBox>
                <DescriptionText>
                    {isEditMode ? 
                        'Update your rankings below. You can change your queen elimination order, lip sync assassin pick, and bonus category predictions.' :
                        League?.lgDescription
                    }
                </DescriptionText>
            </DescriptionBox>

            {!isEditMode && (
                <DescriptionBox>
                    <DescriptionText>
                        First league? Not sure how the points work? Visit the <Link href="/HowToPlay" passHref legacyBehavior><StyledLink>How To Play</StyledLink></Link> page for more information.
                    </DescriptionText>
                </DescriptionBox>
            )}

            <SectionWrapper>
                <ErrorPopup open={errorPopup} onClose={() => setErrorPopup(false)} message={errorMessage} />
                <FormSection>
                    <TitleRow>
                        <SectionTitle>Your Name</SectionTitle>
                    </TitleRow>
                    <ExplanationText>This is the display name you&apos;ll use for this league. Other players will see this name.</ExplanationText>
                    <StyledTextField label="Display Name"
                        value={displayName}
                        onChange={(e) => {
                            const filtered = filterPipeCharacter(e.target.value);
                            setDisplayName(filtered);
                            if (filtered.trim() !== '') setPlayerNameError(false);
                        }}
                        // show visual error only after first submit attempt
                        style={attemptedSubmit && playerNameError ? { border: '2px solid rgba(220,20,60,0.85)', backgroundColor: '#fff3f3', borderRadius: 4 } : undefined}
                        error={attemptedSubmit && playerNameError} />
                </FormSection>
            </SectionWrapper>

            <SectionWrapper>

                {lgQueenNames.length > 0 && (
                    <FormSection>
                        <TitleRow>
                            <SectionTitle>Queen Rankings</SectionTitle>
                        </TitleRow>
                        <ExplanationText>
                            Rank all the queens from most likely to win (1st place) to least likely. <strong>Points are based on accuracy!</strong>
                            <br /><br />
                            <strong>How Ranking Points Work:</strong>
                            <br />
                            • <strong>Exact match:</strong> You get the full points (equal to the number of queens this season). For example, if there are {lgQueenNames.length} queens and you correctly predict a queen&apos;s exact position, you earn {lgQueenNames.length} points!
                            <br />
                            • <strong>Close match:</strong> For each position you&apos;re off by, you lose 1 point. So if you&apos;re 1 spot off, you get {Math.max(0, lgQueenNames.length - 1)} points; 2 spots off gets {Math.max(0, lgQueenNames.length - 2)} points, and so on.
                            <br />
                        </ExplanationText>
                        {Array.from({ length: lgQueenNames.length }, (_, index) => {
                            const currentVal = queenNames[index] || '';
                            const isMissing = attemptedSubmit && missingQueenIndices.includes(index)

                            return (
                                <div
                                    key={`queen-row-${index}`}
                                    style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%'}}
                                >
                                    <div style={{ minWidth: 40, textAlign: 'right', fontWeight: 600 }}>
                                        {getOrdinal(index + 1)}
                                    </div>
                                    <StyledSelect
                                        value={currentVal}
                                        style={{
                                            flex: 1,
                                            minWidth: 0,
                                            border: isMissing ? '2px solid rgba(220,20,60,0.85)' : undefined,
                                            backgroundColor: isMissing ? '#fff3f3' : undefined,
                                            borderRadius: isMissing ? 4 : undefined
                                        }}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            setQueenNames(prev => {
                                                const prevVal = prev[index] || '';
                                                // find if selected value exists in another slot
                                                const otherEntry = Object.entries(prev).find(([k, v]) => Number(k) !== index && v === val);
                                                let next;
                                                if (otherEntry) {
                                                    // swap values between slots
                                                    const otherIndex = Number(otherEntry[0]);
                                                    next = { ...prev };
                                                    next[otherIndex] = prevVal || ''; // move current to other slot (or clear)
                                                    next[index] = val;
                                                } else {
                                                    // normal selection (no duplicates)
                                                    next = { ...prev, [index]: val };
                                                }

                                                if(attemptedSubmit){
                                                    const missingAfter = Array.from({ length: lgQueenNames.length }, (_, i) =>
                                                        (!next[i] || next[i] === '') ? i : -1
                                                    ).filter(i => i !== -1);

                                                    if (missingAfter.length === 0) {
                                                        setQueenNamesError(false);
                                                        setMissingQueenIndices([]);
                                                    } else {
                                                        setQueenNamesError(true);
                                                        setMissingQueenIndices(missingAfter);
                                                    }
                                                }else{
                                                    setQueenNamesError(false);
                                                    setMissingQueenIndices([]);
                                                }

                                                return next;
                                            });
                                            if (e.target.value && e.target.value !== '') {
                                                setQueenNamesError(false);
                                            }
                                        }}
                                        displayEmpty
                                    >
                                        <MenuItem value="" disabled>Queens</MenuItem>
                                        {lgQueenNames.map((queen, i) => {
                                            const isPickedElsewhere = Object.entries(queenNames)
                                                .some(([k, v]) => Number(k) !== index && v === queen);
                                            const isAvailable = !isPickedElsewhere;
                                            return (
                                                <MenuItem
                                                    key={`${queen}-${i}`}
                                                    value={queen}
                                                    style={{
                                                        backgroundColor: isAvailable ? '#e6ffed' : undefined,
                                                        color: isPickedElsewhere ? '#999' : undefined,
                                                    }}
                                                >
                                                    {queen}
                                                </MenuItem>
                                            );
                                        })}
                                    </StyledSelect>
                                </div>
                            );
                        })}
                    </FormSection>
                )}
            </SectionWrapper>

            {/* Optional section: title, description, and a full-width single dropdown */}
            {showOptionalSection && (
                <SectionWrapper>
                    <FormSection>
                        <TitleRow>
                            <SectionTitle>Lip Sync Assassin</SectionTitle>
                        </TitleRow>
                        <ExplanationText>
                            Pick the queen you think will win the most Lip Syncs For Your Life (or for the win) this season. The queen with the most lip sync wins becomes the Lip Sync Assassin!
                        </ExplanationText>
                        <div style={{ marginTop: 8, marginBottom: 4, fontSize: 13, color: '#444', fontWeight: 500 }}>
                            Points: {League?.lgLipSyncPoints || 0}
                        </div>
                        <div style={{ width: '100%' }}>
                            <StyledSelect
                                value={optionalQueen}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    setOptionalQueen(val);
                                    if (val && val !== '') setOptionalQueenError(false);
                                }}
                                displayEmpty
                                style={{ width: '100%', ...(attemptedSubmit && optionalQueenError ? { border: '2px solid rgba(220,20,60,0.85)', backgroundColor: '#fff3f3', borderRadius: 4 } : {}) }}
                            >
                                <MenuItem value="" disabled>Select a Queen</MenuItem>
                                {lgQueenNames.map((queen, i) => (
                                    <MenuItem key={`optional-${queen}-${i}`} value={queen}>
                                        {queen}
                                    </MenuItem>
                                ))}
                            </StyledSelect>
                        </div>
                    </FormSection>
                </SectionWrapper>
            )}

            {showOptionalBonusSection && (
                <SectionWrapper>
                    <FormSection>
                        <TitleRow>
                            <SectionTitle>Bonus Rules</SectionTitle>
                        </TitleRow>
                        <ExplanationText>
                            Make your predictions for these bonus categories to earn extra points! Choose wisely.
                        </ExplanationText>

                        <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 12 }}>
                            {optionalRows.map((row, idx) => (
                                <div key={`optional-row-${row.id}`} style={{ display: 'flex', gap: 12, alignItems: 'center', width: '100%' }}>
                                    <div style={{ minWidth: 220, maxWidth: 220, flexShrink: 0 }}>
                                        <div style={{ fontWeight: 700, whiteSpace: 'normal', overflowWrap: 'anywhere', wordBreak: 'break-word' }}>
                                            {row.title}
                                        </div>
                                        <div style={{ fontSize: 13, color: '#444', marginTop: 4 }}>Points: {row.number}</div>
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        {renderRowDropdown(row, idx)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </FormSection>
                </SectionWrapper>
            )}

            <SubmitContainer>
                <CancelButton
                    variant="outlined"
                    onClick={() => router.push(`/League/${League?.id}`)}
                    type="button"
                >
                    Cancel
                </CancelButton>
                <SubmitButton
                    variant="contained"
                    color="primary"
                    onClick={handleSubmitChange}
                    onChange={handleSubmitChange} // included per request (buttons also accept onChange)
                >
                    {isEditMode ? 'Update Rankings' : 'Submit Rankings'}
                </SubmitButton>
            </SubmitContainer>
        </FormContainer>
    )
}