import sgMail from '@sendgrid/mail';
import { SecretsManagerClient, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager";

const client = new SecretsManagerClient({ region: "us-west-2" });

async function getSecretValue(secretName) {
    try {
        const command = new GetSecretValueCommand({ SecretId: secretName });
        const response = await client.send(command);
        return JSON.parse(response.SecretString);
    } catch (error) {
        console.error("Error retrieving secret:", error);
        throw error;
    }
}

export default async function handler(req, res) {
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

    const { to, subject, html, text } = req.body || {};
    if (!to || !subject || (!html && !text)) {
        return res.status(400).json({ error: "Missing required fields: to, subject, html/text" });
    }

    const secretAPIKey = await getSecretValue("sendGridApiKey");
    const secretReplyToEmail = await getSecretValue("sendGridReplyToEmail");
    const secretFromName = await getSecretValue("sendGridFromName");
    const secretFromEmail = await getSecretValue("sendGridFromEmail");

    // Check if SendGrid API key is configured
    if (!secretAPIKey) {
        console.error('SendGrid API key not configured');
        return res.status(500).json({ 
            error: "SendGrid API key not configured. Please set SENDGRID_API_KEY environment variable." 
        });
    }

    sgMail.setApiKey(secretAPIKey);

    // Check if from email is configured
    if (!secretFromEmail) {
        console.error('SendGrid from email not configured');
        return res.status(500).json({ 
            error: "Sender email not configured. Please set SENDGRID_FROM_EMAIL environment variable." 
        });
    }

    const toAddresses = Array.isArray(to) ? to : [to];

    // Configure sender with optional custom name
    const fromEmail = secretFromEmail;
    const fromName = secretFromName || 'Drag League';
    
    const msg = {
        to: toAddresses,
        from: {
            email: fromEmail,
            name: fromName
        },
        subject: subject,
        text: text || '',
        html: html || '',
        replyTo: secretReplyToEmail || undefined,
    };

    try {
        
        const result = await sgMail.send(msg);
        
        return res.status(200).json({ 
            ok: true, 
            statusCode: result[0]?.statusCode,
            message: 'Email sent successfully' 
        });
    } catch (err) {
        console.error("SendGrid send error details:", {
            message: err.message,
            code: err.code,
            response: err.response?.body,
        });
        
        // Provide helpful error messages
        let errorMessage = err?.message || "Send failed";
        
        if (err.code === 403) {
            errorMessage = 'SendGrid API key is invalid or does not have permission to send emails.';
        } else if (err.code === 401) {
            errorMessage = 'SendGrid authentication failed. Check your API key.';
        } else if (err.response?.body?.errors) {
            errorMessage = err.response.body.errors.map(e => e.message).join(', ');
        }
        
        return res.status(500).json({ 
            error: errorMessage,
            code: err.code,
            details: process.env.NODE_ENV === 'development' ? err.response?.body : undefined
        });
    }
}
