const siteUrl = 'https://dr91fo3klsf8b.amplifyapp.com';

module.exports = {
    title: 'Drag League',
    titleTemplate: '%s',
    defaultTitle: 'Drag League',
    description: 'Drag League - competitive lip sync leagues and player rankings.',
    openGraph: {
        type: 'website',
        locale: 'en_US',
        url: siteUrl,
        site_name: 'Drag League',
        images: [
            {
                url: `${siteUrl}/og-image.png`,
                width: 1200,
                height: 630,
                alt: 'Drag League',
            },
        ],
    },
    twitter: {
        handle: '@dragleague',
        site: '@dragleague',
        cardType: 'summary_large_image',
    },
};
