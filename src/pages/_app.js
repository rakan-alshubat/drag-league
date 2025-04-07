
import * as React from 'react';
import Head from 'next/head';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { CacheProvider } from '@emotion/react';
import theme from '../styles/theme'
import Navbar from '@/components/NavBar';
import createEmotionCache from '../styles/createEmotionCache';
import Background from 'src/media/Background.jpg'

// Client-side cache, shared for the whole session of the user in the browser.
const clientSideEmotionCache = createEmotionCache();


export default function MyApp(props) {
  const { Component, emotionCache = clientSideEmotionCache, pageProps } = props;
  return (
    <CacheProvider value={emotionCache}>
      <Navbar />
      <Head>
        <meta name="viewport" content="initial-scale=1, width=device-width" />
      </Head>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <div style={{ backgroundImage: `url(${Background.src})`, backgroundSize: 'cover', backgroundSize: 'f'}}>.
          <Component {...pageProps} />.
        </div>
      </ThemeProvider>
    </CacheProvider>
  );
}