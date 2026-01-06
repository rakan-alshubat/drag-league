import CreationPage from "@/files/CreationPage"
import { NextSeo } from 'next-seo';
import { useRouter } from "next/router";
import { useState, useEffect } from "react";
import { generateClient } from 'aws-amplify/api';
import { serverLogError } from '@/helpers/serverLog';
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
                    await serverLogError('Error fetching league', { error: error.message, leagueId: leagueId });
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
        return (
            <>
                <NextSeo title="Create League — Drag League" description="Create or edit a Drag League." />
                <LoadingWheel />
            </>
        );
    }

    return (
        <>
            <NextSeo title={isEditMode ? `Edit League — Drag League` : `Create League — Drag League`} description="Create or edit a Drag League." />
            <CreationPage editMode={isEditMode} leagueData={leagueData} />
        </>
    )
}