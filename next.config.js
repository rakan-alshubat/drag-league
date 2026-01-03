/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    // Required for API routes to work on Amplify
    output: 'standalone',
    env: {
        SENDGRID_API_KEY: process.env.SENDGRID_API_KEY,
        SENDGRID_FROM_EMAIL: process.env.SENDGRID_FROM_EMAIL,
        SENDGRID_FROM_NAME: process.env.SENDGRID_FROM_NAME,
        SENDGRID_REPLY_TO_EMAIL: process.env.SENDGRID_REPLY_TO_EMAIL,
    }
}

module.exports = nextConfig
