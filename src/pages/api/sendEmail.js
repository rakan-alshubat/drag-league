import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';

export default async function handler(req, res) {
    // Handle preflight OPTIONS request
    if (req.method === 'OPTIONS') {
        res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
        return res.status(200).end();
    }

    console.log('START sendEmail API request');

    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

    const { to, subject, html, text } = req.body || {};
    if (!to || !subject || (!html && !text)) {
        return res.status(400).json({ error: "Missing required fields: to, subject, html/text" });
    }


    const fromEmail = "noreply@drag-league.com";
    const fromName = 'Drag League';
    const replyToEmail = "noreply@drag-league.com";
    const region = 'us-west-2';

    // Check if from email is configured
    if (!fromEmail) {
        console.error('SES from email not configured');
        return res.status(500).json({ 
            error: "Sender email not configured. Please set SES_FROM_EMAIL environment variable." 
        });
    }

    // Initialize SES client - uses AWS credentials from Amplify environment
    const sesClient = new SESClient({ region });

    const toAddresses = Array.isArray(to) ? to : [to];

    // Build email parameters
    const params = {
        Source: `${fromName} <${fromEmail}>`,
        Destination: {
            ToAddresses: toAddresses,
        },
        Message: {
            Subject: {
                Data: subject,
                Charset: 'UTF-8',
            },
            Body: {},
        },
    };

    // Add text and/or html content
    if (text && text.trim()) {
        params.Message.Body.Text = {
            Data: text,
            Charset: 'UTF-8',
        };
    }
    if (html && html.trim()) {
        params.Message.Body.Html = {
            Data: html,
            Charset: 'UTF-8',
        };
    }

    // Add reply-to if configured
    if (replyToEmail) {
        params.ReplyToAddresses = [replyToEmail];
    }

    try {
        console.log('Sending email via SES to:', toAddresses);
        const command = new SendEmailCommand(params);
        const result = await sesClient.send(command);
        
        return res.status(200).json({ 
            ok: true, 
            messageId: result.MessageId,
            message: 'Email sent successfully' 
        });
    } catch (err) {
        console.error("SES send error details:", {
            message: err.message,
            code: err.code || err.name,
            statusCode: err.$metadata?.httpStatusCode,
        });
        
        // Provide helpful error messages
        let errorMessage = err?.message || "Send failed";
        
        if (err.name === 'MessageRejected') {
            errorMessage = 'Email was rejected by SES. Check that your from address is verified.';
        } else if (err.name === 'MailFromDomainNotVerifiedException') {
            errorMessage = 'The sender email domain is not verified in SES.';
        } else if (err.name === 'ConfigurationSetDoesNotExistException') {
            errorMessage = 'SES configuration set not found.';
        }
        
        return res.status(500).json({ 
            error: errorMessage,
            code: err.code,
            details: process.env.NODE_ENV === 'development' ? err.response?.body : undefined
        });
    }
}
