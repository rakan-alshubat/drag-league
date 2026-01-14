import { serverLogError } from "@/helpers/serverLog";

export default async function handler(req, res) {
    // Set CORS headers
    const origin = req.headers.origin;
    if (origin) {
        res.setHeader('Access-Control-Allow-Origin', origin);
        res.setHeader('Access-Control-Allow-Credentials', 'true');
    }
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    // Handle preflight
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { level = 'info', message, data } = req.body;
        
        const timestamp = new Date().toISOString();
        const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
        
        switch (level.toLowerCase()) {
        case 'error':
            console.error(logMessage, data || '');
            break;
        case 'warn':
            console.warn(logMessage, data || '');
            break;
        case 'debug':
            console.debug(logMessage, data || '');
            break;
        default:
            console.info(logMessage, data || '');
        }
        
        return res.status(200).json({ success: true, logged: true });
    } catch (error) {
        console.error('Logging API error:', error);
        return res.status(500).json({ error: 'Failed to log' });
    }
}
