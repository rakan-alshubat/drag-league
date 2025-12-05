import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";

// Configure SES client with credentials from environment variables
const ses = new SESClient({ 
    region: process.env.AWS_REGION || 'us-west-2',
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    }
});

export default async function handler(req, res) {
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

    const { to, subject, html, text } = req.body || {};
    if (!to || !subject || (!html && !text)) {
        return res.status(400).json({ error: "Missing required fields: to, subject, html/text" });
    }

    // Check if AWS credentials are configured
    if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
        console.error('AWS credentials not configured');
        return res.status(500).json({ 
            error: "AWS credentials not configured. Please set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY environment variables." 
        });
    }

    const toAddresses = Array.isArray(to) ? to : [to];

    const params = {
        Destination: { ToAddresses: toAddresses },
        Message: {
            Subject: { Charset: "UTF-8", Data: subject },
            Body: {
                Html: html ? { Charset: "UTF-8", Data: html } : undefined,
                Text: text ? { Charset: "UTF-8", Data: text } : undefined,
            },
        },
        Source: process.env.SES_FROM_EMAIL || 'drag.league1@gmail.com', // must be a verified SES identity
        // Add reply-to address if configured
        ReplyToAddresses: process.env.SES_REPLY_TO_EMAIL ? [process.env.SES_REPLY_TO_EMAIL] : undefined,
    };

    try {
        console.log('Attempting to send email via SES...');
        console.log('To:', toAddresses);
        console.log('From:', params.Source);
        console.log('Subject:', subject);
        
        const result = await ses.send(new SendEmailCommand(params));
        console.log('Email sent successfully:', result);
        
        return res.status(200).json({ ok: true, messageId: result.MessageId });
    } catch (err) {
        console.error("SES send error details:", {
            name: err.name,
            message: err.message,
            code: err.$metadata?.httpStatusCode,
            requestId: err.$metadata?.requestId,
        });
        
        // Provide helpful error messages
        let errorMessage = err?.message || "Send failed";
        
        if (err.name === 'MessageRejected' || err.message?.includes('Email address is not verified')) {
            errorMessage = `Email address not verified in AWS SES. Please verify '${params.Source}' in the AWS SES console.`;
        } else if (err.name === 'InvalidParameterValue') {
            errorMessage = 'Invalid email parameters. Check that email addresses are valid.';
        } else if (err.name === 'CredentialsProviderError' || err.message?.includes('credentials')) {
            errorMessage = 'AWS credentials error. Check your AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY.';
        }
        
        return res.status(500).json({ 
            error: errorMessage,
            code: err.name,
            details: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
}
