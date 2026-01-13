import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
    return (
        <Html lang="en">
            <Head>
                {/* PWA Manifest */}
                {/* Cache-busted manifest to force clients to fetch latest on deploy */}
                <link rel="manifest" href={`/manifest.json?v=${process.env.NEXT_PUBLIC_MANIFEST_VERSION || process.env.npm_package_version || Date.now()}`} />
                <meta name="theme-color" content="#FF1493" />
                
                {/* iOS PWA Support */}
                <meta name="apple-mobile-web-app-capable" content="yes" />
                <meta name="apple-mobile-web-app-status-bar-style" content="default" />
                <meta name="apple-mobile-web-app-title" content="Drag League" />
                {/* iOS Home Screen icons (multiple sizes) */}
                <link rel="apple-touch-icon" sizes="120x120" href="/icons/apple-touch-icon-120.png" />
                <link rel="apple-touch-icon" sizes="152x152" href="/icons/apple-touch-icon-152.png" />
                <link rel="apple-touch-icon" sizes="167x167" href="/icons/apple-touch-icon-167.png" />
                <link rel="apple-touch-icon" sizes="180x180" href="/icons/apple-touch-icon-180.png" />
                {/* Fallback favicons for various platforms */}
                <link rel="icon" type="image/png" sizes="192x192" href="/icons/icon-192.png" />
                <link rel="icon" type="image/png" sizes="512x512" href="/icons/icon-512.png" />
                {/* maskable icon for Android */}
                <link rel="icon" type="image/png" sizes="512x512" href="/icons/icon-512-maskable.png" />
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
