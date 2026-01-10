import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
    return (
        <Html lang="en">
            <Head>
                {/* PWA Manifest */}
                <link rel="manifest" href="/manifest.json" />
                <meta name="theme-color" content="#FF1493" />
                
                {/* iOS PWA Support */}
                <meta name="apple-mobile-web-app-capable" content="yes" />
                <meta name="apple-mobile-web-app-status-bar-style" content="default" />
                <meta name="apple-mobile-web-app-title" content="Drag League" />
                <link rel="apple-touch-icon" href="/favicon.svg" />
                
                {/* Mobile Optimization */}
                <meta name="mobile-web-app-capable" content="yes" />
                <meta name="format-detection" content="telephone=no" />
            </Head>
            <body>
                <Main sx={{background: 'blue'}}/>
                <NextScript />
            </body>
        </Html>
    )
}
