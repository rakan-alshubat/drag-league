
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
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Typography from '@mui/material/Typography';
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
    const [showIosHelpDialog, setShowIosHelpDialog] = React.useState(false);

    const DISMISS_KEY = 'dragleagueInstallDismissed';
    const REMIND_UNTIL_KEY = 'dragleagueInstallRemindUntil';
    const REMIND_DAYS_DEFAULT = 7;
    const now = () => new Date().getTime();
    const remindUntil = (days) => now() + days * 24 * 60 * 60 * 1000;

    const getDismissed = () => {
        try { return localStorage.getItem(DISMISS_KEY) === 'true'; } catch { return false; }
    };
    const getRemindUntil = () => {
        try { return parseInt(localStorage.getItem(REMIND_UNTIL_KEY) || '0', 10); } catch { return 0; }
    };

    const maybeShowPrompt = (triggeredInstallPrompt = null) => {
        try {
            if (getDismissed()) return;
            if (getRemindUntil() > now()) return; // quiet period
            if (isInStandaloneMode()) return; // already installed
            // show
            setInstallPrompt(triggeredInstallPrompt);
            setShowInstallPrompt(true);
        } catch (e) {
            // ignore
            setInstallPrompt(triggeredInstallPrompt);
            setShowInstallPrompt(true);
        }
    };

    const handleDontShow = () => {
        try { localStorage.setItem(DISMISS_KEY, 'true'); } catch {}
        setShowInstallPrompt(false);
    };

    const handleRemindLater = (days = REMIND_DAYS_DEFAULT) => {
        try { localStorage.setItem(REMIND_UNTIL_KEY, String(remindUntil(days))); } catch {}
        setShowInstallPrompt(false);
    };

    const isIos = () => {
        if (typeof navigator === 'undefined') return false;
        const ua = navigator.userAgent || '';
        return /iphone|ipad|ipod/i.test(ua);
    };
    const isInStandaloneMode = () => {
        if (typeof navigator === 'undefined') return false;
        return ('standalone' in navigator) && (navigator.standalone === true);
    };

    React.useEffect(() => {
        // PWA Install Prompt
        const handleBeforeInstallPrompt = (e) => {
            e.preventDefault();
            maybeShowPrompt(e);
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

    // iOS fallback: show install instructions because Safari doesn't fire beforeinstallprompt
    React.useEffect(() => {
        try {
            if (isIos() && !isInStandaloneMode() && !installPrompt) {
                // only show fallback if native prompt didn't fire and not dismissed / not in quiet period
                if (!getDismissed() && getRemindUntil() <= now()) {
                    setInstallPrompt({ iosFallback: true });
                    setShowInstallPrompt(true);
                    console.log('iOS fallback: showing install snackbar');
                }
            }
        } catch (err) {
            // ignore
        }
    }, [installPrompt]);

    // listen for external requests (from pages) to open the iOS help dialog
    React.useEffect(() => {
        const handler = () => {
            try { setShowIosHelpDialog(true); } catch (e) {}
        };
        if (typeof window !== 'undefined') {
            window.addEventListener('dragleagueShowIosHelp', handler);
        }
        return () => {
            if (typeof window !== 'undefined') {
                window.removeEventListener('dragleagueShowIosHelp', handler);
            }
        };
    }, []);

    const handleInstallClick = () => {
        if (installPrompt) {
            installPrompt.prompt();
            installPrompt.userChoice.then((choiceResult) => {
                if (choiceResult.outcome === 'accepted') {
                    console.log('User accepted the install prompt');
                    try { localStorage.setItem(DISMISS_KEY, 'true'); } catch {}
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
                        <Component
                            {...pageProps}
                            installPrompt={installPrompt}
                            onInstallClick={handleInstallClick}
                            onShowIosHelp={() => setShowIosHelpDialog(true)}
                            onRemindLater={handleRemindLater}
                            onDontShow={handleDontShow}
                        />
                    </Box>
                    <Footer />
                </Box>

                <Snackbar
                    open={showInstallPrompt}
                    onClose={() => setShowInstallPrompt(false)}
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                    sx={{ bottom: { xs: 40, sm: 24 } }}
                >
                    {installPrompt && installPrompt.iosFallback ? (
                        <Alert
                            severity="info"
                            sx={{
                                background: 'linear-gradient(135deg, #FF1493 0%, #C71585 100%)',
                                color: 'white',
                                fontWeight: 600,
                                '& .MuiAlert-icon': { color: 'white' },
                                boxShadow: '0 8px 24px rgba(255, 20, 147, 0.3)',
                                px: 2,
                            }}
                            onClose={() => setShowInstallPrompt(false)}
                        >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
                                <Typography sx={{ fontWeight: 700, mr: 1 }}>To install on iOS</Typography>
                                <Typography sx={{ opacity: 0.95 }}>Tap Share → Add to Home Screen</Typography>
                                <Box sx={{ ml: 'auto', display: 'flex', gap: 1, mt: { xs: 1, sm: 0 } }}>
                                    <Button color="inherit" size="small" onClick={() => setShowIosHelpDialog(true)} sx={{ background: 'rgba(255,255,255,0.08)' }}>How to</Button>
                                    <Button color="inherit" size="small" onClick={() => handleRemindLater()} sx={{ background: 'rgba(255,255,255,0.06)' }}>Remind</Button>
                                    <Button color="inherit" size="small" onClick={() => handleDontShow()} sx={{ background: 'rgba(255,255,255,0.02)' }}>Don&apos;t show</Button>
                                </Box>
                            </Box>
                        </Alert>
                    ) : (
                        <Alert
                            severity="info"
                            sx={{
                                background: 'linear-gradient(135deg, #FF1493 0%, #C71585 100%)',
                                color: 'white',
                                fontWeight: 600,
                                '& .MuiAlert-icon': { color: 'white' },
                                boxShadow: '0 8px 24px rgba(255, 20, 147, 0.3)',
                                px: 2,
                            }}
                            onClose={() => setShowInstallPrompt(false)}
                        >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
                                <Typography sx={{ fontWeight: 700, mr: 1 }}>Install Drag League</Typography>
                                <Typography sx={{ opacity: 0.95 }}>Add Drag League to your device for quick access</Typography>
                                <Box sx={{ ml: 'auto', display: 'flex', gap: 1, mt: { xs: 1, sm: 0 } }}>
                                    <Button color="inherit" size="small" onClick={handleInstallClick} sx={{ background: 'rgba(255,255,255,0.08)' }}>Install</Button>
                                    <Button color="inherit" size="small" onClick={() => handleRemindLater()} sx={{ background: 'rgba(255,255,255,0.06)' }}>Remind me later</Button>
                                    <Button color="inherit" size="small" onClick={() => handleDontShow()} sx={{ background: 'rgba(255,255,255,0.02)' }}>Don&apos;t show</Button>
                                </Box>
                            </Box>
                        </Alert>
                    )}
                </Snackbar>

                <Dialog open={showIosHelpDialog} onClose={() => setShowIosHelpDialog(false)}>
                    <DialogTitle>Add to Home Screen (iOS)</DialogTitle>
                    <DialogContent>
                        <Typography sx={{ mb: 1 }}>1. Tap the Share button (the square with an up arrow).</Typography>
                        <Typography sx={{ mb: 1 }}>2. Choose &quot;Add to Home Screen&quot;.</Typography>
                        <Typography sx={{ mb: 1 }}>3. Confirm the name and tap &quot;Add&quot;.</Typography>
                    </DialogContent>
                    <DialogTitle>Add to Home Screen (Android)</DialogTitle>
                    <DialogContent>
                        <Typography sx={{ mb: 1 }}>1. Click Install.</Typography>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleInstallClick} variant="contained">Install</Button>
                        <Button onClick={() => setShowIosHelpDialog(false)}>Close</Button>
                    </DialogActions>
                </Dialog>
            </ThemeProvider>
        </CacheProvider>
    );
}