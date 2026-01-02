import sgMail from '@sendgrid/mail';

export default async function handler(req, res) {
    console.log('=== HANDLER STARTED ===', {
        method: req.method,
        bodyKeys: Object.keys(req.body || {})
    });

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

    console.log('Retrieved env vars:', {
        secretAPIKey: secretAPIKey,
        secretFromEmail: secretFromEmail,
        secretReplyToEmail: secretReplyToEmail,
        secretFromName: secretFromName
    });

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
