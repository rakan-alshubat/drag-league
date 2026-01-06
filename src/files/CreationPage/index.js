import { getCurrentUser } from "@aws-amplify/auth";
import { generateClient } from 'aws-amplify/api'
import { useRouter } from "next/router";
import { getUsers} from "@/graphql/queries";
import Link from "next/link";
import { createLeague, updateLeague, updateUsers, createPlayer, deleteLeague } from '@/graphql/mutations';
import { serverLogInfo, serverLogError } from '@/helpers/serverLog';
import LoadingWheel from "@/files/LoadingWheel";
import { filterPipeCharacter } from "@/helpers/filterPipeChar";
import { FormContainer,
    FormSection,
    SectionTitle,
    StyledTextField,
    StyledSelect,
    InputGroup,
    CreationTitleBox,
    InputGroupWithCheckbox, 
    StyledCheckbox, 
    CheckboxLabel, 
    BonusPointContainer, 
    BonusPointRow,
    SubmitContainer,
    SubmitButton,
    CancelButton,
    SectionWrapper,
    ExplanationText,
    DescriptionBox,
    DescriptionText,
    TitleRow,
    ErrorAlert} from "./CreationPage.styles";
import { MenuItem, Alert } from "@mui/material";
import { useState, useEffect} from "react";
import ErrorPopup from "../ErrorPopUp";


export default function CreationPage({ editMode = false, leagueData = null }){
    const [queensNumber, setQueensNumber] = useState('');
    const [pointValue, setPointValue] = useState('');
    const [queenNames, setQueenNames] = useState({});
    const [leagueName, setLeagueName] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [leagueDescription, setLeagueDescription] = useState('');
    const [publicLeague, setPublicLeague] = useState(false);
    const [lipSyncAssassin, setLipSyncAssassin] = useState(false);
    const [swap, setSwap] = useState(false);
    const [swapType, setSwapType] = useState('');
    const [swapPoints, setSwapPoints] = useState('');
    const [bonusPoints, setBonusPoints] = useState(false);
    const [bonusCategories, setBonusCategories] = useState('');
    const [categoryData, setCategoryData] = useState({});
    const [lipSyncPoints, setLipSyncPoints] = useState('');
    const [deadline, setDeadline] = useState('');
    const [rankingDeadline, setRankingDeadline] = useState('');
    const [adminEmail, setAdminEmail] = useState('');
    const [leaguesList, setLeaguesList] = useState([]);

    const [nameError, setNameError] = useState(false);
    const [playerNameError, setPlayerNameError] = useState(false);
    const [queenNumberError, setQueenNumberError] = useState(false);
    const [queenNamesError, setQueenNamesError] = useState(false);
    const [rankingDeadlineError, setRankingDeadlineError] = useState(false);
    const [deadlineError, setDeadlineError] = useState(false);
    const [lipSyncAssassinError, setLipSyncAssassinError] = useState(false);
    const [swapError, setSwapError] = useState(false);
    const [categoryNumberError, setCategoryNumberError] = useState(false);
    const [categoryTypeError, setCategoryTypeError] = useState(false);

    const [loading, setLoading] = useState(true);
    const [errorPopup, setErrorPopup] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [validationErrorPopup, setValidationErrorPopup] = useState(false);
    const [deadlineMatchError, setDeadlineMatchError] = useState(false);

    const router = useRouter();
    const client = generateClient()



    const numbers = Array.from({ length: 30 }, (_, i) => i + 1);

    useEffect(() => {
        if (!queensNumber) return;
        setQueenNames(prev => {
            const cleanedNames = Object.fromEntries(
                Object.entries(prev).filter(([key]) => parseInt(key) < queensNumber)
            );
            return getSortedQueenNamesObject(cleanedNames);
        });
    }, [queensNumber]);

    useEffect(() => {
        if (!bonusCategories) return;
        setCategoryData(prev => {
            const cleanedCategories = Object.fromEntries(
                Object.entries(prev).filter(([key]) => parseInt(key) < bonusCategories)
            );
            return cleanedCategories;
        });
    }, [bonusCategories]);

    useEffect(() => {
        const localClient = generateClient();
        getCurrentUser()
            .then(user => {
                async function getUserData() {
                    try {
                        const results = await localClient.graphql({
                            query: getUsers,
                            variables: { id: user.signInDetails.loginId.toLowerCase() }
                        });
                        setAdminEmail(results.data.getUsers.id || '');
                        setLeaguesList(results.data.getUsers.leagues || []);
                    } catch (error) {
                        await serverLogError('Error fetching user data', { error: error.message });
                    } finally {
                        setLoading(false);
                    }
                }
                getUserData();
            })
            .catch(() => {
                try { window.location.assign('/SignIn'); } catch (e) { /* ignore */ }
            });
    }, []);

    // Prefill form when in edit mode
    useEffect(() => {
        if (!editMode || !leagueData) return;
        try {
            setLeagueName(leagueData.lgName || '');
            setLeagueDescription(leagueData.lgDescription || '');
            setPublicLeague(Boolean(leagueData.lgPublic));
            setPointValue(Number(leagueData.lgChallengePoints) || 0);
            setLipSyncAssassin(Boolean(leagueData.lgLipSyncPoints && leagueData.lgLipSyncPoints > 0));
            setLipSyncPoints(Number(leagueData.lgLipSyncPoints) || '');
            // swap stored as "type|points" or empty
            if (leagueData.lgSwap) {
                const parts = String(leagueData.lgSwap || '').split('|').map(s => s.trim());
                setSwap(Boolean(parts[0]));
                setSwapType(parts[0] || '');
                setSwapPoints(parts[1] || '');
            }
            // bonus categories
            if (Array.isArray(leagueData.lgBonusPoints) && leagueData.lgBonusPoints.length > 0) {
                setBonusPoints(true);
                setBonusCategories(leagueData.lgBonusPoints.length);
                const parsed = {};
                leagueData.lgBonusPoints.forEach((b, i) => {
                    const p = String(b || '').split('|').map(s => s.trim());
                    parsed[i] = { name: p[0] || '', points: p[1] || '', type: p[2] || '' };
                });
                setCategoryData(parsed);
            }
            // queens
            const q = Array.isArray(leagueData.lgQueenNames) ? leagueData.lgQueenNames : [];
            setQueensNumber(q.length);
            const qObj = {};
            q.forEach((name, idx) => { qObj[idx] = name; });
            setQueenNames(qObj);

            // deadlines: convert ISO to local datetime-local string
            const toLocal = (iso) => {
                if (!iso) return '';
                const d = new Date(iso);
                const tzOffset = d.getTimezoneOffset();
                return new Date(d.getTime() - tzOffset * 60000).toISOString().slice(0,16);
            }
            setDeadline(leagueData.lgDeadline ? toLocal(leagueData.lgDeadline) : '');
            setRankingDeadline(leagueData.lgRankingDeadline ? toLocal(leagueData.lgRankingDeadline) : '');
        } catch (e) {
            serverLogWarn('Failed to prefill creation form', { error: e.message });
        }
    }, [editMode, leagueData]);

    const handleQueenNameChange = (index, value) => {
        setQueenNames(prev => ({
            ...prev,
            [index]: value
        }));
    };

    const handleCategoryDataChange = (index, field, value) => {
        setCategoryData(prev => ({
            ...prev,
            [index]: {
                ...prev[index],
                [field]: value
            }
        }));
    };

    const getSortedQueenNamesObject = (namesObj) => {
        const list = Object.entries(namesObj)
            .map(([idx, name]) => ({ idx: Number(idx), name: String(name || '').trim() }))
            .filter(item => item.name.length > 0);

        list.sort((a, b) =>
            a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
        );

        const sortedObj = {};
        list.forEach((item, i) => {
            sortedObj[i] = item.name;
        });
        return sortedObj;
    };

    const checkForErrors = () => {
        let hasError = false;

        if (String(leagueName || '').trim() === '') {
            setNameError(true);
            hasError = true;
        }
        // displayName is required for creating a league, but not when editing
        if (!editMode && String(displayName || '').trim() === '') {
            setPlayerNameError(true);
            hasError = true;
        }
        if (!queensNumber || queensNumber <= 0) {
            setQueenNumberError(true);
            hasError = true;
        }
        if (Object.keys(queenNames).length < queensNumber) {
            setQueenNamesError(true);
            hasError = true;
        }
        if (pointValue > 0 && !deadline) {
            setDeadlineError(true);
            hasError = true;
        }
        if (pointValue > 0 && deadline && rankingDeadline) {
            const rankingDate = new Date(rankingDeadline);
            const pointsDate = new Date(deadline);
            if (rankingDate >= pointsDate) {
                setDeadlineMatchError(true);
                hasError = true;
            }
        }
        if (lipSyncAssassin && (!lipSyncPoints || lipSyncPoints <= 0)) {
            setLipSyncAssassinError(true);
            hasError = true;
        }
        if (swap && (!swapType || !swapPoints)) {
            setSwapError(true);
            hasError = true;
        }
        if (bonusPoints) {
            if (!bonusCategories || bonusCategories <= 0) {
                setCategoryNumberError(true);
                hasError = true;
            }
            for (let i = 0; i < bonusCategories; i++) {
                const category = categoryData[i];
                if (!category || !category.name || (category.points === undefined || category.points === null) || !category.type) {
                    setCategoryTypeError(true);
                    hasError = true;
                    break;
                }
            }
        }
        if (String(rankingDeadline || '').trim() === '') {
            setRankingDeadlineError(true);
            hasError = true;
        }

        if (hasError) setValidationErrorPopup(true);
        return hasError;
    };

    async function handleSubmitChange(event) {
        if (event && typeof event.preventDefault === 'function') event.preventDefault();

        // ensure adminEmail is present before building the league input
        if (!adminEmail || String(adminEmail).trim() === '') {
            setErrorMessage('Unable to determine your user id. Please sign in again.');
            setErrorPopup(true);
            return;
        }

        // build arrays
        const queenArray = Object.values(queenNames || {})
            .map(s => String(s || '').trim())
            .filter(Boolean);

        const bonusArray = Object.values(categoryData || {})
            .map(c => {
                if (!c) return null;
                const name = String(c.name || '').trim();
                const points = String(c.points || '').trim();
                const type = String(c.type || '').trim();
                return (name && points && type) ? `${name}|${points}|${type}` : null;
            })
            .filter(Boolean);

        const historyEntry = new Date().toISOString() + (editMode ? ('. League updated by ' + (displayName)) : ('. League created by ' + displayName));

        const league = {
            lgName: leagueName,
            lgDescription: leagueDescription || '',
            lgAdmin: [adminEmail],
            lgPendingPlayers: editMode ? undefined : [],
            lgFollowers: editMode ? undefined : [],
            lgHistory: editMode ? ([...(leagueData?.lgHistory || []), historyEntry]) : [historyEntry],
            lgQueenNames: queenArray,
            lgPublic: publicLeague,
            lgFullyPrivate: !publicLeague,
            lgChallengePoints: Number(pointValue) || 0,
            lgLipSyncPoints: lipSyncAssassin && Number(lipSyncPoints) || 0,
            lgBonusPoints: bonusArray.length ? bonusArray : null,
            lgSwap: (swap && swapType && swapPoints) && `${swapType}|${swapPoints}` || '',
            lgDeadline: (Number(pointValue) > 0 && deadline) ? new Date(deadline).toISOString() : null,
            lgRankingDeadline: rankingDeadline && new Date(rankingDeadline).toISOString(),
            lgFinished: 'not started',
        };

        const input = Object.fromEntries(
            Object.entries(league).filter(([_, v]) => v !== undefined && v !== null)
        );

        if (checkForErrors()) return;

        // ensure adminEmail is present
        if (!adminEmail || String(adminEmail).trim() === '') {
            setErrorMessage('Unable to determine your user id. Please sign in again.');
            setErrorPopup(true);
            return;
        }

        // If editing, call updateLeague
        if (editMode && leagueData && leagueData.id) {
            try {
                const updateInput = { id: leagueData.id, ...input };
                await client.graphql({ query: updateLeague, variables: { input: updateInput } });
                await serverLogInfo('League updated in edit mode', { leagueId: leagueData.id, leagueName: leagueName });
                router.push('/League/' + leagueData.id);
                return;
            } catch (err) {
                await serverLogError('Failed to update league', { leagueId: leagueData.id, error: err.message });
                setErrorMessage('Failed to update league.');
                setErrorPopup(true);
                return;
            }
        }

        // create new league (original flow)
        let createdLeagueId = null;
        const prevLeaguesList = Array.isArray(leaguesList) ? [...leaguesList] : [];

        try {
            const newLeague = await client.graphql({
                query: createLeague,
                variables: { input: input }
            });
            createdLeagueId = newLeague?.data?.createLeague?.id;
            if (!createdLeagueId) throw new Error('League created but missing id');
            await serverLogInfo('League created', { leagueId: createdLeagueId, leagueName: leagueName, adminEmail: adminEmail });

            const newLeagueEntry = `${newLeague.data.createLeague.createdAt}|${createdLeagueId}|${leagueName}`;
            const updatedLeaguesList = [...prevLeaguesList, newLeagueEntry];
            setLeaguesList(updatedLeaguesList);

            // update user leagues; if this fails, rollback created league
            try {
                await client.graphql({
                    query: updateUsers,
                    variables: { input: { id: adminEmail, leagues: updatedLeaguesList } }
                });
                await serverLogInfo('User updated with new league', { userId: adminEmail, leagueId: createdLeagueId });
            } catch (err) {
                try { await client.graphql({ query: deleteLeague, variables: { input: { id: createdLeagueId } } }); } catch (delErr) { await serverLogError('Rollback delete failed', { error: delErr.message }); }
                throw err;
            }

            // create the admin player record; if this fails, rollback user update and league
            try {
                await client.graphql({
                    query: createPlayer,
                    variables: { input: { leagueId: createdLeagueId, plEmail: adminEmail, plName: displayName, plStatus: 'Admin' } }
                });
                await serverLogInfo('Admin player created', { leagueId: createdLeagueId, playerEmail: adminEmail, playerName: displayName });
            } catch (err) {
                try { await client.graphql({ query: updateUsers, variables: { input: { id: adminEmail, leagues: prevLeaguesList } } }); } catch (revertErr) { await serverLogError('Rollback user revert failed', { error: revertErr.message }); }
                try { await client.graphql({ query: deleteLeague, variables: { input: { id: createdLeagueId } } }); } catch (delErr) { await serverLogError('Rollback delete failed', { error: delErr.message }); }
                throw err;
            }

            router.push('/League/' + createdLeagueId);
        } catch (error) {
            await serverLogError('Failed to create league', { adminEmail: adminEmail, error: error.message });
            setErrorMessage('Failed to create league.');
            setErrorPopup(true);
        }
    };

    const frequencyOptions = [
        { value: 'Queens', label: 'Queens' },
        { value: 'Number', label: 'Number' },
        { value: 'Yes/No', label: 'Yes/No' },
    ];

    if(loading){
        return (
            <LoadingWheel />
        )
    }

    return(
        <FormContainer>
            <CreationTitleBox>{editMode ? 'Edit League' : 'Create New League'}</CreationTitleBox>

            <DescriptionBox>
                <DescriptionText>
                    Welcome to the Drag League Creation Page! Here, you can set up your very own league to compete with friends and fellow drag enthusiasts where you can predict the elimination order of the season.<br /> <br /> Fill out the details below to customize your league, including the number of queens, scoring system, and some optional bonus categories. Once you&apos;ve completed the form, submit your league and get ready to compete and predict the outcomes of your favorite drag competition! Good luck, and don&apos;t fuck it up!
                </DescriptionText>
            </DescriptionBox>

            <DescriptionBox>
                <DescriptionText>
                    Not sure how to play? Visit the <Link href="/HowToPlay">How To Play</Link> page for more information.
                </DescriptionText>
            </DescriptionBox>
            
            <SectionWrapper>
                <FormSection>
                    <TitleRow>
                        <SectionTitle>League Name/Title</SectionTitle>
                        {nameError && (
                            <ErrorAlert severity="error">Missing league name/title</ErrorAlert>
                        )}
                    </TitleRow>
                    <ExplanationText>Give your league a fun name/title. This will be at the top of the league page.</ExplanationText>
                    <StyledTextField
                        placeholder="League Name"
                        value={leagueName}
                        onChange={(e) => {
                            const filtered = filterPipeCharacter(e.target.value);
                            setLeagueName(filtered);
                            if(filtered.trim() !== ''){
                                setNameError(false);
                            }
                        }}
                    />
                </FormSection>
            </SectionWrapper>

            {!editMode && (
                <SectionWrapper>
                    <FormSection>
                        <TitleRow>
                            <SectionTitle>Your Display Name</SectionTitle>
                            {playerNameError && (
                                <ErrorAlert severity="error">Missing your name</ErrorAlert>
                            )}
                        </TitleRow>
                        <ExplanationText>This is YOUR name that you will use for this league and how people will know who you are in the ranking. You can use different display names for different leagues.</ExplanationText>
                        <StyledTextField
                            placeholder="e.g. Sam, Hannah, MM flip it around? WW!!! Anything!"
                            value={displayName}
                            onChange={(e) => {
                                const filtered = filterPipeCharacter(e.target.value);
                                setDisplayName(filtered);
                                if(filtered.trim() !== ''){
                                    setPlayerNameError(false);
                                }
                            }}
                        />
                    </FormSection>
                </SectionWrapper>
            )}

            <SectionWrapper>

                <FormSection>
                    <TitleRow>
                        <SectionTitle>League Description</SectionTitle>
                    </TitleRow>
                    <ExplanationText>Let everyone know what this league is all about <em>(optional)</em>.</ExplanationText>
                    <StyledTextField
                        placeholder="e.g. Season 18 is gonna be sickening!"
                        multiline
                        rows={4}
                        value={leagueDescription}
                        onChange={(e) => setLeagueDescription(filterPipeCharacter(e.target.value))}
                    />
                </FormSection>
            </SectionWrapper>

            <SectionWrapper>
                <FormSection>
                    <TitleRow>
                        <SectionTitle>Number of Drag Queens</SectionTitle>
                        {queenNumberError && (
                            <ErrorAlert severity="error">Missing number of queens</ErrorAlert>
                        )}
                    </TitleRow>
                    <ExplanationText>Choose the number of drag queens participating in the season you&apos;re watching. If you&apos;re ranking them after the first episode airs, feel free to have the number be the total queens minus one, or have that queen be a freebie for everyone.</ExplanationText>
                    <InputGroup>
                        <StyledSelect
                            value={queensNumber}
                            onChange={(e) => {
                                setQueensNumber(e.target.value)
                                if(e.target.value && e.target.value > 0){
                                    setQueenNumberError(false);
                                }
                            }}
                            displayEmpty
                        >
                            <MenuItem value="" disabled>Queens</MenuItem>
                            {numbers.map((number) => (
                                <MenuItem key={number} value={number}>
                                    {number}
                                </MenuItem>
                            ))}
                        </StyledSelect>
                    </InputGroup>
                </FormSection>

                {queensNumber && (
                    <FormSection>
                        <TitleRow>
                            <SectionTitle>Drag Queen Names</SectionTitle>
                            {queenNamesError && (
                                <ErrorAlert severity="error">Missing queen names</ErrorAlert>
                            )}
                        </TitleRow>
                        {Array.from({ length: queensNumber }, (_, index) => (
                            <StyledTextField
                                key={index}
                                placeholder={`Drag Queen ${index + 1}`}
                                value={queenNames[index] || ''}
                                onChange={(e) => {
                                    const filtered = filterPipeCharacter(e.target.value);
                                    handleQueenNameChange(index, filtered);
                                    if(filtered.trim() !== ''){
                                        setQueenNamesError(false);
                                    }
                                }}
                            />
                        ))}
                    </FormSection>
                )}
            </SectionWrapper>
            <SectionWrapper>

                <FormSection>
                    <TitleRow>
                        <SectionTitle>Set Ranking Deadline</SectionTitle>
                        {rankingDeadlineError && (
                            <ErrorAlert severity="error">Missing ranking deadline</ErrorAlert>
                        )}
                    </TitleRow>
                    <ExplanationText>Select a date and time for the players to lock in their initial rankings of the queens for the season. You can either set it after Meet The Queens airs, or you can wait an episode or two to get a better impression of the queens.</ExplanationText>
                    <StyledTextField
                        type="datetime-local"
                        value={rankingDeadline}
                        onChange={(e) => {
                            setRankingDeadline(e.target.value)
                            if(e.target.value){
                                setRankingDeadlineError(false);
                            }
                        }}
                        InputLabelProps={{ shrink: true }}
                    />
                </FormSection>
            </SectionWrapper>

            <SectionWrapper>
                <FormSection>
                    <TitleRow>

                        <InputGroupWithCheckbox>
                            <CheckboxLabel
                                control={<StyledCheckbox checked={publicLeague} onChange={(e) => setPublicLeague(e.target.checked)} />}
                                label=""
                            />
                            <SectionTitle>Public League</SectionTitle>
                        </InputGroupWithCheckbox>
                    </TitleRow>
                    <ExplanationText>
                        If checked, your league will be viewable by anyone.
                    </ExplanationText>
                </FormSection>
            </SectionWrapper>

            <SectionWrapper>
                <FormSection>
                    <TitleRow>
                        <SectionTitle>Points per Maxi Challenge Win</SectionTitle>
                    </TitleRow>
                    <ExplanationText>
                        Choose the number of points a player earns for guessing the correct winner of each week&apos;s maxi challenge. Players will each submit their weekly pick to earn extra points. <br/> <br/>
                        For a balanced game, it is recommended to choose half the total number of queens participating this season (e.g. 15 queens {'=>'} 7 points rounding down). <br/> <br/>
                        For a more pure game of prediction, consider assigning 0 points for maxi challenges and focusing solely on elimination predictions.
                    </ExplanationText>
                    <InputGroup>
                        <StyledSelect
                            value={pointValue}
                            onChange={(e) => setPointValue(e.target.value)}
                            displayEmpty
                        >
                            <MenuItem label="" value="">Points</MenuItem>
                            <MenuItem value={0}>0</MenuItem>
                            {numbers.map((number) => (
                                <MenuItem key={number} value={number}>
                                    {number}
                                </MenuItem>
                            ))}
                        </StyledSelect>
                    </InputGroup>
                </FormSection>
            </SectionWrapper>

            {pointValue > 0 && (<SectionWrapper>
                <FormSection>
                    <TitleRow>
                        <SectionTitle>Set Maxi Challenge Deadline</SectionTitle>
                        {deadlineError && (
                            <ErrorAlert severity="error">Missing Maxi Challenge Deadline.</ErrorAlert>
                        )}
                    </TitleRow>
                    <ExplanationText>
                        Select a set date and time for players to submit their weekly Maxi Challenge predictions. This deadline will repeat every week at the same time until the season ends. Ideally, the deadline for player submissions should be before the episode airs and after the ranking deadline by a day or two.
                    </ExplanationText>
                    {deadlineMatchError && (
                        <ErrorAlert severity="error">Points deadline must be after ranking deadline</ErrorAlert>
                    )}
                    <StyledTextField
                        type="datetime-local"
                        value={deadline}
                        onChange={(e) => {
                            setDeadline(e.target.value)
                            if(rankingDeadline){
                                const rankingDate = new Date(rankingDeadline);
                                const pointsDate = new Date(e.target.value);
                                if(rankingDate >= pointsDate){
                                    setDeadlineMatchError(true);
                                } else {
                                    setDeadlineMatchError(false);
                                }
                            } else {
                                setDeadlineMatchError(false);
                            }
                            if(e.target.value){
                                setDeadlineError(false);
                            }
                        }}
                        InputLabelProps={{ shrink: true }}
                    />
                </FormSection>
            </SectionWrapper>
            )}

            <SectionWrapper>
                <TitleRow>
                    <InputGroupWithCheckbox>
                        <CheckboxLabel
                            control={<StyledCheckbox checked={lipSyncAssassin} onChange={(e) => {
                                setLipSyncAssassin(e.target.checked);
                                if (!e.target.checked) {
                                    setLipSyncPoints('');
                                    setLipSyncAssassinError(false);
                                }
                            }} />}
                            label=""
                        />
                        <SectionTitle>Lip Sync Assassin (optional)</SectionTitle>
                        {lipSyncAssassin && (
                            <StyledSelect
                                value={lipSyncPoints}
                                onChange={(e) => {
                                    setLipSyncPoints(e.target.value)
                                    if(e.target.value && e.target.value > 0){
                                        setLipSyncAssassinError(false);
                                    }}
                                }
                                displayEmpty
                                style={{ minWidth: 120 }}
                            >
                                <MenuItem value="" disabled>Points</MenuItem>
                                {numbers.map((number) => (
                                    <MenuItem key={number} value={number}>
                                        {number}
                                    </MenuItem>
                                ))}
                            </StyledSelect>
                        )}
                    </InputGroupWithCheckbox>
                    {lipSyncAssassinError && (
                        <ErrorAlert severity="error">Missing Lip Sync Assassin Points, or you can uncheck the box.</ErrorAlert>
                    )}
                </TitleRow>
                <ExplanationText>
                    If you&apos;re looking to add another element to the league, have players predict who will be the Lip Sync Assassin of the season. The Lip Sync Assassin is the queen who wins the most Lip Syncs For Your Life (or for the win). <br/> <br/>
                    The recommendation is to select the same amount of points as the Maxi Challenge wins.<br/> <br/>
                    Note: You can also count the LaLaPaRuZa lip syncs in the total number of lip sync wins. (e.g. if a queen wins 3 regular lip syncs and 2 during the LaLaPaRuZa, they have a total of 5 lip sync wins).
                </ExplanationText>
            </SectionWrapper>

            <SectionWrapper>
                <TitleRow>
                    <InputGroupWithCheckbox>
                        <CheckboxLabel
                            control={<StyledCheckbox checked={swap} onChange={(e) => {
                                const checked = e.target.checked;
                                setSwap(checked);
                                if (!checked) {
                                    setSwapType('');
                                    setSwapPoints('');
                                    setSwapError(false);
                                }
                            }} />}
                            label=""
                        />
                        <SectionTitle>Swap (optional)</SectionTitle>
                    </InputGroupWithCheckbox>
                    {swapError && (
                        <ErrorAlert severity="error">Missing Swap Deadline, or you can uncheck the box.</ErrorAlert>
                    )}
                </TitleRow>
                <ExplanationText>
                    Another feature is to give the players the ability to swap two queens&apos; rankings once during the season. This can happen after a certain number of episodes, or when a certain number of queens remain in the competition. <br/> <br/>
                </ExplanationText>
 
                {swap && (
                    <InputGroup>
                        <StyledSelect
                            value={swapType}
                            onChange={(e) => {
                                setSwapType(e.target.value)
                                setSwapPoints('');
                                if(e.target.value){
                                    setSwapError(false);
                                }}
                            }
                            displayEmpty
                            style={{ minWidth: 160 }}
                        >
                            <MenuItem value="" disabled>Type</MenuItem>
                            <MenuItem value="NumberOfEpisodes">Number of Episodes</MenuItem>
                            <MenuItem value="NumberOfQueensRemaining">Number of Queens remaining</MenuItem>
                        </StyledSelect>
 
                        <StyledSelect
                            value={swapPoints}
                            onChange={(e) => {
                                setSwapPoints(e.target.value)
                                if(e.target.value && e.target.value > 0){
                                    setSwapError(false);
                                }}
                            }
                            displayEmpty
                            style={{ minWidth: 120 }}
                        >
                            <MenuItem value="" disabled>Number</MenuItem>
                            {(swapType === 'NumberOfQueensRemaining'
                                ? (queensNumber > 0 
                                    ? Array.from({ length: queensNumber }, (_, i) => i + 1)
                                    : [0])
                                : numbers
                            ).map((number) => (
                                <MenuItem key={number} value={number}>
                                    {number}
                                </MenuItem>
                            ))}
                        </StyledSelect>
                    </InputGroup>
                )}
            </SectionWrapper>

            <SectionWrapper>
                <TitleRow>
                    <InputGroupWithCheckbox>
                        <CheckboxLabel
                            control={<StyledCheckbox checked={bonusPoints} onChange={(e) => {
                                setBonusPoints(e.target.checked);
                                if (!e.target.checked) {
                                    setBonusCategories('');
                                    setCategoryData({});
                                    setCategoryNumberError(false);
                                    setCategoryTypeError(false);
                                }
                            }} />}
                            label=""
                        />
                        <SectionTitle>Bonus Points (optional)</SectionTitle>
                    </InputGroupWithCheckbox>
                    {categoryNumberError && (
                        <ErrorAlert severity="error">Missing Number of Bonus Categories, or you can uncheck the box.</ErrorAlert>
                    )}
                    {categoryTypeError && (
                        <ErrorAlert severity="error">Missing Bonus Category information, or you can lower the total number of categories.</ErrorAlert>
                    )}
                </TitleRow>
                <ExplanationText>Miss Congeniality? Golden Boot? How many times a queen cries? Here is when you can add your own bonus categories for the players to earn extra points. Feel free to get creative!</ExplanationText>
                {bonusPoints && (
                    <BonusPointContainer>
                        <FormSection>
                            <SectionTitle>Number of Bonus Categories</SectionTitle>
                            <StyledSelect
                                value={bonusCategories}
                                onChange={(e) => {
                                    setBonusCategories(e.target.value)
                                    if(e.target.value && e.target.value > 0){
                                        setCategoryNumberError(false);
                                        setCategoryTypeError(false);
                                    }}
                                }
                                displayEmpty
                            >
                                <MenuItem value="" disabled>Select number of categories</MenuItem>
                                {Array.from({ length: 30 }, (_, i) => i + 1).map((number) => (
                                    <MenuItem key={number} value={number}>
                                        {number}
                                    </MenuItem>
                                ))}
                            </StyledSelect>
                        </FormSection>

                        {bonusCategories > 0 && (
                            <FormSection>
                                <SectionTitle>Bonus Categories</SectionTitle>
                                <ExplanationText>
                                    Bonus categories accept three types:<br/>
                                    • <strong>Queens</strong> — pick a queen by name (e.g. &quot;Miss Congeniality&quot;). Players select one of the season&apos;s queens; a correct pick earns the category points.<br/>
                                    • <strong>Number</strong> — submit a numeric value (e.g. &quot;What&apos;s the Badonkadonk Tank lever number&quot;).<br/>
                                    • <strong>Yes/No</strong> — a binary question (e.g. &quot;Will there be a double elimination this season?&quot;). Players answer Yes or No; correct answers earn the points.<br/>
                                    For each category enter the <em>question/category</em>, assign the <em>points</em>, and choose the <em>type</em>.
                                </ExplanationText>
                                {Array.from({ length: bonusCategories }, (_, index) => (
                                    <BonusPointRow key={index}>
                                        <StyledTextField
                                            placeholder={`Category ${index + 1}`}
                                            value={categoryData[index]?.name || ''}
                                            onChange={(e) => {
                                                const filtered = filterPipeCharacter(e.target.value);
                                                handleCategoryDataChange(index, 'name', filtered);
                                                if(filtered.trim() !== ''){
                                                    setCategoryTypeError(false);
                                                }}
                                            }
                                        />
                                        <StyledSelect
                                            value={categoryData[index]?.points || ''}
                                            onChange={(e) => {
                                                handleCategoryDataChange(index, 'points', e.target.value)
                                                if(e.target.value && e.target.value > 0){
                                                    setCategoryTypeError(false);
                                                }
                                            }}
                                            displayEmpty
                                        >
                                            <MenuItem value="" disabled>Points</MenuItem>
                                            {numbers.map((number) => (
                                                <MenuItem key={number} value={number}>
                                                    {number}
                                                </MenuItem>
                                            ))}
                                        </StyledSelect>
                                        <StyledSelect
                                            value={categoryData[index]?.type || ''}
                                            onChange={(e) => {
                                                handleCategoryDataChange(index, 'type', e.target.value)
                                                if(e.target.value){
                                                    setCategoryTypeError(false);
                                                }}
                                            }
                                            displayEmpty
                                        >
                                            <MenuItem value="" disabled>type</MenuItem>
                                            {frequencyOptions.map((option) => (
                                                <MenuItem key={option.value} value={option.value}>
                                                    {option.label}
                                                </MenuItem>
                                            ))}
                                        </StyledSelect>
                                    </BonusPointRow>
                                ))}
                            </FormSection>
                        )}
                    </BonusPointContainer>
                )}
            </SectionWrapper>
            {editMode && (
                <Alert severity="warning" sx={{ mb: 2 }}>
                    You are editing an existing league — If submissions have been made, make sure the players edit their rankings as some things might have changed. Proceed with caution.
                </Alert>
            )}
            <SubmitContainer>
                <CancelButton
                    variant="outlined"
                    onClick={() => {
                        if (editMode && leagueData && leagueData.id) {
                            router.push('/League/' + leagueData.id);
                        } else {
                            router.push('/Player');
                        }
                    }}
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
                    {editMode ? 'Save Changes' : 'Create League'}
                </SubmitButton>
            </SubmitContainer>
            <ErrorPopup
                open={errorPopup}
                onClose={() => { setErrorPopup(false); setErrorMessage(''); }}
                message={errorMessage || 'An error occurred while creating the league.'}
            />
            <ErrorPopup
                open={validationErrorPopup}
                onClose={() => setValidationErrorPopup(false)}
                message="Please fill in all required fields. Check the form for missing information."
            />
        </FormContainer>
    )
}