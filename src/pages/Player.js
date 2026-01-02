import PlayerPage from "@/files/PlayerPage";
import { secret } from '@aws-amplify/backend';
import { NextSeo } from 'next-seo';

export default function Player(){
    console.log(secret('SENDGRID_FROM_EMAIL'));
    return (
        <>
            <NextSeo title="Player — Drag League" description="Your account, leagues, and submissions on Drag League." />
            <PlayerPage />
        </>
    );
}