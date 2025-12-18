import HowToPlayPage from "@/files/HowToPlayPage";
import { NextSeo } from 'next-seo';

export default function HowToPlay() {
    return (
        <>
            <NextSeo title="How To Play — Drag League" description="Learn how to participate in Drag League competitions and submit performances." />
            <HowToPlayPage />
        </>
    );
}
