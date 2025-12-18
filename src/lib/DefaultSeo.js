import React from 'react';
import Head from 'next/head';
import SEO from '../../next-seo.config';

export default function DefaultSeo() {
    const { title, defaultTitle, titleTemplate, description, openGraph, twitter } = SEO || {};
    const og = openGraph || {};
    return (
        <Head>
            <title>{defaultTitle || title}</title>
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
