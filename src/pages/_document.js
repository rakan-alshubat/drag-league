import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
    return (
        <Html lang="en">
            <Head>
                <link rel="apple-touch-icon" href="/apple-touch-icon-v2.png" />

                <meta name="apple-mobile-web-app-capable" content="yes" />
                <meta name="apple-mobile-web-app-title" content="Drag League" />

            </Head>
            <body>
                <Main sx={{background: 'blue'}}/>
                <NextScript />
            </body>
        </Html>
    )
}
