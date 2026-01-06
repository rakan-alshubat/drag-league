/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    env: {
        SES_FROM_EMAIL: process.env.SES_FROM_EMAIL,
        SES_FROM_NAME: process.env.SES_FROM_NAME,
        SES_REPLY_TO_EMAIL: process.env.SES_REPLY_TO_EMAIL,
        SES_REGION: process.env.SES_REGION,
        SES_ACCESS_KEY_ID: process.env.SES_ACCESS_KEY_ID,
        SES_SECRET_ACCESS_KEY: process.env.SES_SECRET_ACCESS_KEY,
    }
}

module.exports = nextConfig
