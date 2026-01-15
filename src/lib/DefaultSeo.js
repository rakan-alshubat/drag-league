import React from 'react';
import Head from 'next/head';
import SEO from '../../next-seo.config';

export default function DefaultSeo() {
    const { title, defaultTitle, titleTemplate, description, openGraph, twitter } = SEO || {};
    const og = openGraph || {};
    const renderTitle = () => {
        if (title) {
            if (titleTemplate) return titleTemplate.replace('%s', title);
            return title;
        }
        return defaultTitle || title || '';
    };

    return (
        <Head>
            <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
            <link rel="icon" href="/favicon.png" type="image/png" sizes="any" />
            <link rel="alternate icon" href="/favicon.ico" />
            <link rel="mask-icon" href="/favicon.svg" color="#FF1493" />
            <meta name="theme-color" content="#FF1493" />
            <title>{renderTitle()}</title>
            {description && <meta name="description" content={description} />}
            {title && <meta property="og:title" content={title} />}
            {description && <meta property="og:description" content={description} />}
            {og.url && <meta property="og:url" content={og.url} />}
            {og.site_name && <meta property="og:site_name" content={og.site_name} />}
            {og.images && og.images[0] && <meta property="og:image" content={og.images[0].url} />}
            <meta name="twitter:card" content={(twitter && twitter.cardType) || 'summary'} />
            {twitter && twitter.handle && <meta name="twitter:creator" content={twitter.handle} />}
        </Head>
    );
}
