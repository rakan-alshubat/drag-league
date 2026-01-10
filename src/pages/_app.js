
import * as React from 'react';
import Head from 'next/head';
import { DefaultSeo } from 'next-seo';
import SEO from '../../next-seo.config';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import { CacheProvider } from '@emotion/react';
import theme from '../styles/theme'
import createEmotionCache from '../styles/createEmotionCache';
import { Amplify } from 'aws-amplify';
import config from '@/aws-exports';
import NavBar from '@/files/NavBar';
import Footer from '@/files/Footer';

// Client-side cache, shared for the whole session of the user in the browser.
const clientSideEmotionCache = createEmotionCache();

// Configure Amplify for v6 with multiple auth modes
Amplify.configure({
    Auth: {
        Cognito: {
            userPoolId: config.aws_user_pools_id,
            userPoolClientId: config.aws_user_pools_web_client_id,
            identityPoolId: config.aws_cognito_identity_pool_id,
            loginWith: {
                email: true
            }
        }
    },
    API: {
        GraphQL: {
            endpoint: config.aws_appsync_graphqlEndpoint,
            region: config.aws_appsync_region,
            defaultAuthMode: 'userPool',
            apiKey: config.aws_appsync_apiKey
        }
    }
}, {
    ssr: true
});


export default function MyApp(props) {
    const { Component, emotionCache = clientSideEmotionCache, pageProps } = props;
    const [installPrompt, setInstallPrompt] = React.useState(null);
    const [showInstallPrompt, setShowInstallPrompt] = React.useState(false);

    React.useEffect(() => {
        // PWA Install Prompt
        const handleBeforeInstallPrompt = (e) => {
            e.preventDefault();
            setInstallPrompt(e);
            setShowInstallPrompt(true);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        // Hide install prompt if app is already installed
        window.addEventListener('appinstalled', () => {
            setShowInstallPrompt(false);
            setInstallPrompt(null);
        });

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        };
    }, []);

    // Register service worker for PWA functionality and debugging
    React.useEffect(() => {
        if (typeof window === 'undefined') return;
        if ('serviceWorker' in navigator) {
            console.log('Attempting to register service worker: /sw.js');
            navigator.serviceWorker.register('/sw.js')
                .then((reg) => {
                    console.log('Service worker registered:', reg);
                    if (reg.waiting) console.log('SW waiting');
                    if (reg.installing) console.log('SW installing');
                    if (reg.active) console.log('SW active');
                })
                .catch((err) => {
                    console.warn('Service worker registration failed:', err);
                });

            navigator.serviceWorker.ready
                .then(() => console.log('Service worker ready'))
                .catch(() => {});
        } else {
            console.log('Service workers not supported in this browser');
        }
    }, []);

    const handleInstallClick = () => {
        if (installPrompt) {
            installPrompt.prompt();
            installPrompt.userChoice.then((choiceResult) => {
                if (choiceResult.outcome === 'accepted') {
                    console.log('User accepted the install prompt');
                }
                setInstallPrompt(null);
                setShowInstallPrompt(false);
            });
        }
    };

    return (
        <CacheProvider value={emotionCache}>
            <Head>
                <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5, user-scalable=yes, viewport-fit=cover" />
                <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
                <link rel="icon" href="/favicon-32.png" sizes="32x32" />
                <link rel="alternate icon" href="/favicon.ico" />
            </Head>
            <ThemeProvider theme={theme}>
                <DefaultSeo {...SEO} />
                <CssBaseline />
                <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
                    <a href="#main-content" style={{ position: 'absolute', left: -9999, top: 'auto', width: 1, height: 1, overflow: 'hidden' }} onFocus={(e)=>{e.currentTarget.style.left='8px';e.currentTarget.style.top='8px';e.currentTarget.style.width='auto';e.currentTarget.style.height='auto';e.currentTarget.style.padding='8px 12px';e.currentTarget.style.background='white';e.currentTarget.style.zIndex=9999;e.currentTarget.style.borderRadius='6px';e.currentTarget.style.boxShadow='0 4px 12px rgba(0,0,0,0.15)'}} onBlur={(e)=>{e.currentTarget.style.left='-9999px';e.currentTarget.style.top='auto';e.currentTarget.style.width='1px';e.currentTarget.style.height='1px';e.currentTarget.style.padding='0';e.currentTarget.style.background='transparent';e.currentTarget.style.zIndex='auto';e.currentTarget.style.borderRadius='0';e.currentTarget.style.boxShadow='none'}}>Skip to content</a>
                    <NavBar />
                    <Box component="main" id="main-content" sx={{ flex: 1 }}>
                        <Component {...pageProps} />
                    </Box>
                    <Footer />
                </Box>

                <Snackbar
                    open={showInstallPrompt}
                    onClose={() => setShowInstallPrompt(false)}
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                    sx={{ bottom: { xs: 40, sm: 24 } }}
                >
                    <Alert
                        severity="info"
                        sx={{
                            background: 'linear-gradient(135deg, #FF1493 0%, #C71585 100%)',
                            color: 'white',
                            fontWeight: 600,
                            '& .MuiAlert-icon': { color: 'white' },
                            boxShadow: '0 8px 24px rgba(255, 20, 147, 0.3)',
                        }}
                        action={
                            <Button
                                color="inherit"
                                size="small"
                                onClick={handleInstallClick}
                                sx={{
                                    background: 'rgba(255, 255, 255, 0.2)',
                                    fontWeight: 700,
                                    '&:hover': {
                                        background: 'rgba(255, 255, 255, 0.3)',
                                    },
                                }}
                            >
                                Install
                            </Button>
                        }
                        onClose={() => setShowInstallPrompt(false)}
                    >
                        Install the Drag League web app!
                    </Alert>
                </Snackbar>
            </ThemeProvider>
        </CacheProvider>
    );
}