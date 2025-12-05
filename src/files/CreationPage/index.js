import { getCurrentUser } from "@aws-amplify/auth";
import { generateClient } from 'aws-amplify/api'
import { useRouter } from "next/router";
import { getUsers} from "@/graphql/queries";
import Link from "next/link";
import { createLeague, updateUsers, createPlayer  } from '@/graphql/mutations';
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
import { MenuItem } from "@mui/material";
import { useState, useEffect} from "react";
import ErrorPopup from "../ErrorPopUp";

export default function CreationPage(){
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
    const [deadlineEnabled, setDeadlineEnabled] = useState(false);
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
    const [validationErrorPopup, setValidationErrorPopup] = useState(false);
    const [deadlineMatchError, setDeadlineMatchError] = useState(false);

    const router = useRouter();
    const client = generateClient()

    const numbers = Array.from({ length: 30 }, (_, i) => i + 1);

    useEffect(() => {
        if (queensNumber) {
            const cleanedNames = Object.fromEntries(
                Object.entries(queenNames).filter(([key]) => parseInt(key) < queensNumber)
            );
            setQueenNames(getSortedQueenNamesObject(cleanedNames));
        }
    }, [queensNumber]);

    useEffect(() => {
        if (bonusCategories) {
            const cleanedCategories = Object.fromEntries(
                Object.entries(categoryData).filter(([key]) => parseInt(key) < bonusCategories)
            );
            setCategoryData(cleanedCategories);
        }
    }, [bonusCategories]);

    useEffect(() => { 
        getCurrentUser()
            .then(user => {
                async function getUserData() {
                    try {
                        const results = await client.graphql({
                            query: getUsers,
                            variables: { id: user.signInDetails.loginId.toLowerCase() }
                        })
                        setAdminEmail(results.data.getUsers.id || '');
                        setLeaguesList(results.data.getUsers.leagues || []);
                    } catch (error) {
                        console.error('Error fetching user data:', error);
                    } finally {
                        setLoading(false);
                    }
                }
                getUserData()
            })
            .catch(() => {
                router.push('/SignIn')
            });
    }, []);

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

        if(leagueName.trim() === ''){
            setNameError(true);
            hasError = true;
        }
        if(displayName.trim() === ''){
            setPlayerNameError(true);
            hasError = true;
        }
        if(!queensNumber || queensNumber <= 0){
            setQueenNumberError(true);
            hasError = true;
        }if(Object.keys(queenNames).length < queensNumber){
            setQueenNamesError(true);
            hasError = true;
        }if(deadlineEnabled && !deadline){
            setDeadlineError(true);
            hasError = true;
        }    if(deadlineEnabled && deadline && rankingDeadline){
            const rankingDate = new Date(rankingDeadline);
            const pointsDate = new Date(deadline);
            if(rankingDate >= pointsDate){
                setDeadlineMatchError(true);
                hasError = true;
            }
        }if(lipSyncAssassin && (!lipSyncPoints || lipSyncPoints <= 0)){
            setLipSyncAssassinError(true);
            hasError = true;
        }if(swap && (!swapType || !swapPoints)){
            setSwapError(true);
            hasError = true;
        }if(bonusPoints){
            if(!bonusCategories || bonusCategories <= 0){
                setCategoryNumberError(true);
                hasError = true;
            }
            for(let i = 0; i < bonusCategories; i++){
                const category = categoryData[i];
                if(!category || !category.name || !category.points || !category.type){
                    setCategoryTypeError(true);
                    hasError = true;
                    break;
                }
            }
        }if(rankingDeadline.trim() === ''){
            setRankingDeadlineError(true);
            hasError = true;
        }
        if(!hasError){
            // No errors found, reset all error states
            setNameError(false);
            setPlayerNameError(false);
            setQueenNumberError(false);
            setQueenNamesError(false);
            setDeadlineError(false);
            setLipSyncAssassinError(false);
            setSwapError(false);
            setCategoryNumberError(false);
            setCategoryTypeError(false);
            setRankingDeadlineError(false);
        }else{
            setValidationErrorPopup(true);
        }

        return hasError;
    }

    async function handleSubmitChange(event){
        if (event && typeof event.preventDefault === 'function') event.preventDefault();

        const queenArray = Object.values(queenNames || {})
            .map(s => (s || '').trim())
            .filter(Boolean);
        
        const bonusArray = Object.values(categoryData || {})
            .map(c => {
                if (!c) return null;
                const name = (c.name || '').trim();
                const points = (c.points || '').trim();
                const type = (c.type || '').trim();
                return (name && points && type) ? `${name}|${points}|${type}` : null;
            })
            .filter(Boolean);

        const league = {
            lgName: leagueName,
            lgDescription: leagueDescription || '',
            lgAdmin: [adminEmail],
            lgPendingPlayers: [],  
            lgFollowers: [],
            lgHistory: [new Date().toISOString() + '. League created by ' + displayName],
            lgQueenNames: queenArray,
            lgPublic: publicLeague,
            lgFullyPrivate: false,
            lgChallengePoints: Number(pointValue) || 0,
            lgLipSyncPoints: lipSyncAssassin && Number(lipSyncPoints) || 0,
            lgBonusPoints: bonusArray.length ? bonusArray : null,
            lgSwap: (swap && swapType && swapPoints) && `${swapType}|${swapPoints}` || '',
            lgDeadline: deadline && new Date(deadline).toISOString(),
            lgRankingDeadline: rankingDeadline && new Date(rankingDeadline).toISOString(),
            lgFinished: 'not started',
        };

        const input = Object.fromEntries(
            Object.entries(league).filter(([_, v]) => v !== undefined && v !== null)
        );

        if(checkForErrors()){
            return;
        }

        try {
            const newLeague = await client.graphql({
                query: createLeague,
                variables: { input: input }
            });
            console.log('League created:', newLeague);

            const newLeagueEntry = `${newLeague.data.createLeague.createdAt}|${newLeague.data.createLeague.id}|${leagueName}`;
            const updatedLeaguesList = [...leaguesList, newLeagueEntry];
            setLeaguesList(updatedLeaguesList);
            
            const updateUser = await client.graphql({
                query: updateUsers,
                variables: { input: { id: adminEmail, leagues: updatedLeaguesList } }
            });
            console.log('User leagues updated:', updateUser);
            
            const createNewPlayer = await client.graphql({
                query: createPlayer,
                variables: { input: { id: adminEmail, leagueId: newLeague.data.createLeague.id, plName: displayName, plStatus: 'Admin' } }
            });
            console.log('Admin player created:', createNewPlayer);
            
            router.push('/League/' + newLeague.data.createLeague.id);
        }catch (error) {
            console.error('Error creating league:', error);
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
            <CreationTitleBox>Create New League</CreationTitleBox>

            <DescriptionBox>
                <DescriptionText>
                    Welcome to the Drag League Creation Page! Here, you can set up your very own league to compete with friends and fellow drag enthusiasts where you can predict the elimination order of the season.<br /> <br /> Fill out the details below to customize your league, including the number of queens, scoring system, and some optional bonus categories. Once you&apos;ve completed the form, submit your league and get ready to compete and predict the outcomes of your favorite drag competition! Good luck, and don&apos;t fuck it up!
                </DescriptionText>
            </DescriptionBox>

            <DescriptionBox>
                <DescriptionText>
                    Not sure how to play? Visit the <Link href="/rules">How To Play</Link> page for more information.
                </DescriptionText>
            </DescriptionBox>
            
            <SectionWrapper>
                <FormSection>
                    <TitleRow>
                        <SectionTitle>League Name</SectionTitle>
                        {nameError && (
                            <ErrorAlert severity="error">Missing league name</ErrorAlert>
                        )}
                    </TitleRow>
                    <ExplanationText>Give your league a fun name. This is visible to other users.</ExplanationText>
                    <StyledTextField placeholder="Name" onChange={(e) => {
                        const filtered = filterPipeCharacter(e.target.value);
                        setLeagueName(filtered);
                        if(filtered.trim() !== ''){
                            setNameError(false);
                        }
                    }} />
                </FormSection>
            </SectionWrapper>

            <SectionWrapper>
                <FormSection>
                    <TitleRow>
                        <SectionTitle>Your Display Name</SectionTitle>
                        {playerNameError && (
                            <ErrorAlert severity="error">Missing your name</ErrorAlert>
                        )}
                    </TitleRow>
                    <ExplanationText>This is the name you will use for this league. You can use different display names for different leagues.</ExplanationText>
                    <StyledTextField placeholder="e.g. Sam, Hannah, MM flip it around? WW!!! Anything!" onChange={(e) => {
                        const filtered = filterPipeCharacter(e.target.value);
                        setDisplayName(filtered);
                        if(filtered.trim() !== ''){
                            setPlayerNameError(false);
                        }
                    }} />
                </FormSection>
            </SectionWrapper>

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
                    <ExplanationText>Choose the number of queens participating in the season you&apos;re watching.</ExplanationText>
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
                <TitleRow>
                    <InputGroupWithCheckbox>
                        <CheckboxLabel
                            control={<StyledCheckbox />}
                            label="Set weekly Maxi Challenge Deadline (optional)"
                            onChange={(e) => {
                                const checked = e.target.checked;
                                setDeadlineEnabled(checked);
                                if (!checked) {
                                    setDeadline('')
                                    setDeadlineError(false);
                                }
                            }}
                        />
                    </InputGroupWithCheckbox>
                    {deadlineError && (
                        <ErrorAlert severity="error">Missing Maxi Challenge Deadline, or you can uncheck the box.</ErrorAlert>
                    )}
                </TitleRow>
                <ExplanationText>
                    Select a set date and time for players to submit their weekly Maxi Challenge predictions. if not set, you as the admin will manually submit the weekly results of the episode to close the submissions. <br/> <br/>
                    Ideally, the deadline for player submissions should be before the episode airs and after the ranking deadline by a day or two. <br/> <br/>
                </ExplanationText>
                {deadlineEnabled && (
                    <FormSection>
                        <SectionTitle>Deadline (date & time)</SectionTitle>
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
                )}
            </SectionWrapper>
            )}

            <SectionWrapper>
                <TitleRow>
                    <InputGroupWithCheckbox>
                        <CheckboxLabel
                            control={<StyledCheckbox />}
                            label="Lip Sync Assassin (optional)"
                            onChange={(e) => {
                                setLipSyncAssassin(e.target.checked);
                                if (!e.target.checked) {
                                    setLipSyncPoints('');
                                    setLipSyncAssassinError(false);
                                }
                            }}
                        />
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
                            control={<StyledCheckbox />}
                            label="Swap (optional)"
                            onChange={(e) => {
                                const checked = e.target.checked;
                                setSwap(checked);
                                if (!checked) {
                                    setSwapType('');
                                    setSwapPoints('');
                                    setSwapError(false);
                                }
                            }}
                        />
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
                            control={<StyledCheckbox />}
                            label="Bonus Points (optional)"
                            onChange={(e) => {
                                setBonusPoints(e.target.checked);
                                if (!e.target.checked) {
                                    setBonusCategories('');
                                    setCategoryData({});
                                    setCategoryNumberError(false);
                                    setCategoryTypeError(false);
                                }
                            }}
                        />
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
                                    The types of categories can be a name of a queen (e.g. Miss Congeniality), a number (e.g. The Badonkadonk Tank lever number), or a yes/no question (e.g. Does a double elimination happen this season?).
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
                    Create League
                </SubmitButton>
            </SubmitContainer>
            <ErrorPopup
                open={errorPopup}
                onClose={() => setErrorPopup(false)}
                message="An error occurred while creating the league."
            />
            <ErrorPopup
                open={validationErrorPopup}
                onClose={() => setValidationErrorPopup(false)}
                message="Please fill in all required fields. Check the form for missing information."
            />
        </FormContainer>
    )
}