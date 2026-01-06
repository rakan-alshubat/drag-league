/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    env: {
        SES_FROM_EMAIL: process.env.SES_FROM_EMAIL,
        SES_FROM_NAME: process.env.SES_FROM_NAME,
        SES_REPLY_TO_EMAIL: process.env.SES_REPLY_TO_EMAIL,
        AWS_REGION: process.env.AWS_REGION,
        AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
        AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
    }
}

module.exports = nextConfig
