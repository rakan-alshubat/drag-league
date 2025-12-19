import FAQPage from "@/files/FAQPage";
import { NextSeo } from 'next-seo';

export default function FAQ() {
    return (
        <>
            <NextSeo title="FAQ - Drag League" description="Frequently asked questions about Drag League." />
            <FAQPage />
        </>
    );
}
