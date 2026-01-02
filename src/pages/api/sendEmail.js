import sgMail from '@sendgrid/mail';
import { secret } from '@aws-amplify/backend';

// Configure SendGrid with API key from environment variables
if (process.env.SENDGRID_API_KEY) {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

// Temporary diagnostic log: masked key and env presence (remove after debugging)
{
    try {
        const raw = process.env.SENDGRID_API_KEY || '';
        const masked = raw ? `***${String(raw).slice(-4)}` : 'MISSING';
    } catch (e) {
        console.log('sendEmail diagnostic log failed', e && e.message);
    }
}

export default async function handler(req, res) {
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

    const { to, subject, html, text } = req.body || {};
    if (!to || !subject || (!html && !text)) {
        return res.status(400).json({ error: "Missing required fields: to, subject, html/text" });
    }

    // Check if SendGrid API key is configured
    if (!process.env.SENDGRID_API_KEY) {
        console.error('SendGrid API key not configured');
        return res.status(500).json({ 
            error: "SendGrid API key not configured. Please set SENDGRID_API_KEY environment variable." 
        });
    }

    // Check if from email is configured
    if (!process.env.SENDGRID_FROM_EMAIL) {
        console.error('SendGrid from email not configured');
        return res.status(500).json({ 
            error: "Sender email not configured. Please set SENDGRID_FROM_EMAIL environment variable." 
        });
    }

    const toAddresses = Array.isArray(to) ? to : [to];

    // Configure sender with optional custom name
    const fromEmail = process.env.SENDGRID_FROM_EMAIL;
    const fromName = process.env.SENDGRID_FROM_NAME || 'Drag League';
    
    const msg = {
        to: toAddresses,
        from: {
            email: fromEmail,
            name: fromName
        },
        subject: subject,
        text: text || '',
        html: html || '',
        replyTo: process.env.SENDGRID_REPLY_TO_EMAIL || undefined,
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
