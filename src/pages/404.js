import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import NotFoundPage from "@/files/NotFoundPage";

export default function Custom404() {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return null;
    }

    return <NotFoundPage />;
    
}
