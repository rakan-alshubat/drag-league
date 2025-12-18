import HomePage from "@/files/HomePage";
import { NextSeo } from 'next-seo';

export default function Home() {
    return (
        <>
            <NextSeo
                title="Home — Drag League"
                description="Join competitive drag leagues, create and join leagues, and track player rankings and Maxi challenge winners on Drag League."
                canonical="/"
            />
            <HomePage />
        </>
    );
}