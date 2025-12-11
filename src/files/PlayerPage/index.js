import { useEffect, useState } from 'react';
import { useRouter } from "next/router";
import { getCurrentUser, signOut } from "aws-amplify/auth";
import LoadingWheel from "@/files/LoadingWheel";
import parseToArray from '@/helpers/parseToArray';
import { generateClient } from 'aws-amplify/api'
import { getUsers} from "@/graphql/queries";
import { createUsers } from '@/graphql/mutations';
import ErrorPopup from "../ErrorPopUp";
import { onCreateUsers, onUpdateUsers, onDeleteUsers } from '@/graphql/subscriptions';
import { Box, Typography, Button } from '@mui/material';
import { 
    WelcomeBanner, 
    WelcomeText, 
    ContentContainer, 
    LeagueSection, 
    LeagueList, 
    LeagueLink, 
    ButtonContainer } from './PlayerPage.styles';

export default function PlayerPage() {
    const [loading, setLoading] = useState(true);
    const [errorPopup, setErrorPopup] = useState(false);
    const router = useRouter();
    const client = generateClient()

    const [userID, setUserID] = useState('');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [leagues, setLeagues] = useState([]);
    const [pendingLeagues, setPendingLeagues] = useState([]);
    
    useEffect(() => {
        getCurrentUser()
            .then(user => {
                async function checkAndSaveUser() {
                    try {
                        const results = await client.graphql({
                            query: getUsers,
                            variables: { id: user.signInDetails.loginId.toLowerCase() }
                        })
                        console.log('User fetch result:', results);
            
                        if(results.data.getUsers === null) {
                            const newUser = {
                                id: user.signInDetails.loginId.toLowerCase(),
                            }
                            const createResult = await client.graphql({
                                query: createUsers,
                                variables: { input: newUser }
                            });
                            console.log('New user created:', createResult);
                            setUserID(newUser.id);
                        }else{
                            setUserID(results.data.getUsers.id || '');
                            setName(results.data.getUsers.name || '');
                            setEmail(results.data.getUsers.email || '');
                            setLeagues(results.data.getUsers.leagues || []); 
                            setPendingLeagues(results.data.getUsers.pendingLeagues || []);
                        }

                    } catch (error){
                        console.error('Error with user data:', error);
                    } finally {
                        setLoading(false)
                    }
                }
                checkAndSaveUser();
            })
            .catch(() => {
                router.push('/SignIn')
            });
    }, []);

    useEffect(() => {
        if (!userID) return;
        const subs = [];

        const subUpdate = client.graphql({ query: onUpdateUsers }).subscribe({
            next: ({ value }) => {
                const updated = value?.data?.onUpdateUsers;
                if (updated && updated.id === userID) {
                    setName(updated.name || '');
                    setEmail(updated.email || '');
                    setLeagues(updated.leagues || []);
                    setPendingLeagues(updated.pendingLeagues || []);
                }
            },
            error: err => console.warn('onUpdateUsers sub error', err)
        });
        subs.push(subUpdate);

        const subCreate = client.graphql({ query: onCreateUsers }).subscribe({
            next: ({ value }) => {
                const created = value?.data?.onCreateUsers;
                if (created && created.id === userID) {
                    setName(created.name || '');
                    setEmail(created.email || '');
                    setLeagues(created.leagues || []);
                    setPendingLeagues(created.pendingLeagues || []);
                }
            },
            error: err => console.warn('onCreateUsers sub error', err)
        });
        subs.push(subCreate);

        const subDelete = client.graphql({ query: onDeleteUsers }).subscribe({
            next: ({ value }) => {
                const deleted = value?.data?.onDeleteUsers;
                if (deleted && deleted.id === userID) {
                    // user deleted — send them to sign-in
                    router.push('/SignIn');
                }
            },
            error: err => console.warn('onDeleteUsers sub error', err)
        });
        subs.push(subDelete);

        return () => {
            subs.forEach(s => s && typeof s.unsubscribe === 'function' && s.unsubscribe());
        };
    }, [userID, client, router]);

    const handleSignOut = async () => {
        try{
            await signOut()
            router.push('/')
        } catch (error) {
            console.error('Could not sign out')
        }
    }
    
    if(loading){
        return (
            <LoadingWheel />
        )
    }

    return (
        <Box>
            <WelcomeBanner>
                <WelcomeText>Welcome, Player!</WelcomeText>
            </WelcomeBanner>

            <ContentContainer>
                <LeagueSection>
                    <Typography variant="h6">Leagues</Typography>
                    <LeagueList>
                        {sortedLeagues(leagues).map((league) => (
                            <LeagueLink key={league.id} onClick={() => router.push(`/League/${league.id}`)}>
                                {league.name}
                            </LeagueLink>
                        ))}
                    </LeagueList>

                    <Typography variant="h6" sx={{ mt: 3 }}>Pending Leagues</Typography>
                    <LeagueList>
                        {sortedLeagues(pendingLeagues).map((league) => (
                            <LeagueLink key={league.id} onClick={() => router.push(`/League/${league.id}`)}>
                                {league.name}
                            </LeagueLink>
                        ))}
                    </LeagueList>
                </LeagueSection>

                <ButtonContainer>
                    <Button
                        variant="contained"
                        onClick={() => { router.push('/CreateLeague'); }}
                    >
                        Create League
                    </Button>
                    <Button
                        variant="contained"
                        onClick={() => {
                            // open popup showing the three-way (search) version
                            setSwapPopupVersion('three');
                            setShowSwapPopup(true);
                        }}
                    >
                        Search Leagues
                    </Button>
                </ButtonContainer>
            </ContentContainer>

            <ErrorPopup
                open={errorPopup}
                onClose={() => setErrorPopup(false)}
                message="An error occurred while creating the league."
            />
        </Box>
    );
}

function sortedLeagues(leagueArray) {
    let sortedLeagues = [];
    leagueArray.forEach((element) => {
        sortedLeagues.push({
            date: parseToArray(element)[0],
            id: parseToArray(element)[1],
            name: parseToArray(element)[2],
        });
    })
    return sortedLeagues.sort((a, b) => new Date(b.date) - new Date(a.date));
}