import PlayerPage from "@/files/PlayerPage";
import { NextSeo } from 'next-seo';

export default function Player(){
    return (
        <>
            <NextSeo title="Player — Drag League" description="Your account, leagues, and submissions on Drag League." />
            <PlayerPage />
        </>
    );
}