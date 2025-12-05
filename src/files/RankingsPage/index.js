import { getCurrentUser } from "@aws-amplify/auth";
import { generateClient } from 'aws-amplify/api'
import { useRouter } from "next/router";
import { updatePlayer, updateLeague } from "@/graphql/mutations";
import LoadingWheel from "@/files/LoadingWheel";
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
    TitleRow,} from "./RankingsPage.styles";
import { MenuItem } from "@mui/material";
import { useEffect, useState, useRef } from "react";

export default function RankingsPage(props){

    const League = props.leagueInfo?.leagueInfo ?? props.leagueInfo ?? null;
    const User = props.userInfo?.userInfo ?? props.userInfo ?? null;
    const Player = props.playersInfo?.playersInfo ?? props.playersInfo ?? null;

    const [queenNames, setQueenNames] = useState({});
    const [displayName, setDisplayName] = useState('');

    const [playerNameError, setPlayerNameError] = useState(false);
    const [queenNamesError, setQueenNamesError] = useState(false);

    const [missingQueenIndices, setMissingQueenIndices] = useState([]);

    const [loading, setLoading] = useState(false);
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
    // Keep optionalRows and showOptionalBonusSection in sync with League data
    useEffect(() => {
        const raw = League?.lgBonusPoints ?? [];
        const parsed = parseBonusPoints(raw);
        setOptionalRows(parsed);
        setShowOptionalBonusSection(Array.isArray(raw) ? raw.length > 0 : Boolean(raw));
    }, [League?.lgBonusPoints]);
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

        setLoading(true);

        // build payload
        const rankingsArray = Array.from({ length: lgQueenNames.length }, (_, i) => queenNames[i] || '');
        const bonusValues = (optionalRows || []).map(r => {
            const category = (r.title || '').toString().trim();
            const answer = (r.value ?? '').toString().trim();
            return `${category}|${answer}`;
        });

        const input = {
            // prefer existing player id if provided, otherwise try to derive from current user + league
            id: Player?.id || User?.id || null,
            plName: displayName.trim(),
            plStatus: Player?.plStatus || '',
            plLipSyncAssassin: optionalQueen || '',
            plRankings: rankingsArray,
            plBonuses: bonusValues,
            leagueId: League?.id || null,
        };

        const updatePlayerWithInput = await client.graphql({
            query: updatePlayer,
            variables: { input }
        });
        console.log('Player rankings submitted:', updatePlayerWithInput);
        
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
        // debug the incoming row and normalized type
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
                    <MenuItem value="" disabled>Pick number</MenuItem>
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
                    <MenuItem value="" disabled>Pick</MenuItem>
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
                    <MenuItem value="" disabled>Pick queen</MenuItem>
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
            <CreationTitleBox>{League?.lgName}</CreationTitleBox>
            <DescriptionBox>
                <DescriptionText>
                    {League?.lgDescription}
                </DescriptionText>
            </DescriptionBox>

            <SectionWrapper>
                <FormSection>
                    <TitleRow>
                        <SectionTitle>Your Name</SectionTitle>
                    </TitleRow>
                    <ExplanationText>This is the name you will use inside this league (displayed to others).</ExplanationText>
                    <StyledTextField label="Name"
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
                            <SectionTitle>Queen Ranking</SectionTitle>
                        </TitleRow>
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
                            Pick the queen you think will be the lip sync assassin of the season.
                        </ExplanationText>
                        <div style={{ width: '100%', marginTop: 8 }}>
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
                                <MenuItem value="" disabled>Queens</MenuItem>
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
                            <SectionTitle>Bonus rules</SectionTitle>
                        </TitleRow>
                        <ExplanationText>
                            Select your choices for the bonus point categories below.
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
                    onClick={() => router.push('/Player')}
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
                    Submit Rankings
                </SubmitButton>
            </SubmitContainer>
        </FormContainer>
    )
}