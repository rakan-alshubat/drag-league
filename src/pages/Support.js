import SupportPage from "@/files/SupportPage";
import { NextSeo } from 'next-seo';

export default function Support() {
    return (
        <>
            <NextSeo title="Support" description="Get help with Drag League — contact, FAQs, and troubleshooting." />
            <SupportPage />
        </>
    );
}
