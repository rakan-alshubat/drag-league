// AWS Lambda handler example: read SendGrid API key from AWS Secrets Manager
// and send email via SendGrid. Deploy this as an Amplify Function or Lambda
// and give the function an IAM policy allowing `secretsmanager:GetSecretValue` on the secret.

import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';
import sgMail from '@sendgrid/mail';

const secretsClient = new SecretsManagerClient({});

async function getSendGridKey(secretName) {
    const cmd = new GetSecretValueCommand({ SecretId: secretName });
    const res = await secretsClient.send(cmd);
    if (!res.Payload && !res.SecretString) throw new Error('Secret has no value');
    const raw = res.SecretString || Buffer.from(res.SecretBinary, 'base64').toString('utf8');
    try {
    // allow either raw string or JSON like {"SENDGRID_API_KEY":"..."}
        const parsed = JSON.parse(raw);
        return parsed.SENDGRID_API_KEY || parsed.sendgrid_api_key || raw;
    } catch (e) {
        return raw;
    }
}

export const handler = async (event) => {
    try {
        const secretName = process.env.SENDGRID_SECRET_NAME;
        if (!secretName) return { statusCode: 500, body: JSON.stringify({ error: 'SENDGRID_SECRET_NAME not set' }) };

        const key = await getSendGridKey(secretName);
        if (!key) return { statusCode: 500, body: JSON.stringify({ error: 'SendGrid key not found in secret' }) };

        // set the key for the sendgrid client
        sgMail.setApiKey(key);

        // handle OPTIONS preflight
        const method = (event.httpMethod || event.requestContext?.http?.method || '').toUpperCase();
        const corsHeaders = {
            'Access-Control-Allow-Origin': process.env.CORS_ORIGIN || '*',
            'Access-Control-Allow-Headers': 'Content-Type,Authorization',
            'Access-Control-Allow-Methods': 'POST,OPTIONS',
        };
        if (method === 'OPTIONS') return { statusCode: 204, headers: corsHeaders, body: '' };

        // payload: if invoked via REST, event.body contains JSON
        const payload = typeof event.body === 'string' ? JSON.parse(event.body || '{}') : event.body || {};
        const { to, subject, text, html } = payload;
        if (!to || !subject || (!text && !html)) {
            return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: 'Missing required fields: to, subject, text/html' }) };
        }

        const toAddrs = Array.isArray(to) ? to : [to];
        const fromEmail = process.env.SENDGRID_FROM_EMAIL || 'noreply@example.com';
        const fromName = process.env.SENDGRID_FROM_NAME || 'Drag League';

        const msg = {
            to: toAddrs,
            from: { email: fromEmail, name: fromName },
            subject,
            text: text || '',
            html: html || '',
            replyTo: process.env.SENDGRID_REPLY_TO_EMAIL || undefined,
        };

        await sgMail.send(msg);
        return { statusCode: 200, headers: corsHeaders, body: JSON.stringify({ ok: true }) };
    } catch (err) {
        console.error('sendgrid-lambda error', err && err.message, err && err.response && err.response.body);
        return { statusCode: err.statusCode || 500, body: JSON.stringify({ error: err.message || 'Send failed' }) };
    }
};

// export const handler = async (event) => {
//   // TODO implement
//   const response = {
//     statusCode: 200,
//     body: JSON.stringify('Hello from Lambda!'),
//   };
//   return response;
// };
