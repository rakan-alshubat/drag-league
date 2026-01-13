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
                {/* Recommended: provide PNG apple-touch-icon (180x180) for iOS */}
                <link rel="apple-touch-icon" sizes="180x180" href="/icons/apple-touch-icon.png" />
                {/* Fallback favicons for various platforms */}
                <link rel="icon" type="image/png" sizes="192x192" href="/icons/icon-192.png" />
                <link rel="icon" type="image/png" sizes="512x512" href="/icons/icon-512.png" />
                <meta name="msapplication-TileImage" content="/icons/icon-192.png" />
                
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
