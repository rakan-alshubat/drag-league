import sgMail from '@sendgrid/mail';

export default async function handler(req, res) {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*'); // Or specify your domain
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle preflight OPTIONS request
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    console.log('START sendEmail API request');

    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

    const { to, subject, html, text } = req.body || {};
    if (!to || !subject || (!html && !text)) {
        return res.status(400).json({ error: "Missing required fields: to, subject, html/text" });
    }

    // Get secrets from Amplify environment variables
    const secretAPIKey = process.env.SENDGRID_API_KEY;
    const secretReplyToEmail = process.env.SENDGRID_REPLY_TO_EMAIL;
    const secretFromName = process.env.SENDGRID_FROM_NAME;
    const secretFromEmail = process.env.SENDGRID_FROM_EMAIL;

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
        replyTo: secretReplyToEmail || undefined,
    };

    // Only include text/html if they have actual content
    if (text && text.trim()) {
        msg.text = text;
    }
    if (html && html.trim()) {
        msg.html = html;
    }

    try {
        console.log('Sending email with message:', msg);
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
            responseBody: JSON.stringify(err.response?.body, null, 2),
            errors: err.response?.body?.errors
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
