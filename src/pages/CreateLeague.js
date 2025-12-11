import CreationPage from "@/files/CreationPage"
import { useRouter } from "next/router";
import { useState, useEffect } from "react";
import { generateClient } from 'aws-amplify/api';
import { getLeague } from "@/graphql/queries";
import LoadingWheel from "@/files/LoadingWheel";

export default function CreateLeague(){
    const router = useRouter();
    const { edit } = router.query; // ?edit=leagueId
    const [isEditMode, setIsEditMode] = useState(false);
    const [leagueData, setLeagueData] = useState(null);
    const [loading, setLoading] = useState(true);
    const client = generateClient();

    useEffect(() => {
        if (edit) {
            // Fetch league data for editing
            async function fetchLeague() {
                try {
                    const result = await client.graphql({
                        query: getLeague,
                        variables: { id: edit }
                    });
                    const league = result.data.getLeague;
                    
                    if (league && league.lgFinished === 'not started') {
                        setLeagueData(league);
                        setIsEditMode(true);
                    } else {
                        // League not found or already started, redirect
                        router.push('/Player');
                    }
                } catch (error) {
                    console.error('Error fetching league:', error);
                    router.push('/Player');
                } finally {
                    setLoading(false);
                }
            }
            fetchLeague();
        } else {
            // Create mode
            setIsEditMode(false);
            setLoading(false);
        }
    }, [edit]);

    if (loading) {
        return <LoadingWheel />;
    }

    return(
        <CreationPage editMode={isEditMode} leagueData={leagueData} />
    )
}