/**
 * Send logs to server-side for CloudWatch logging
 * Useful for debugging production issues
 */
export async function serverLog(message, data = null, level = 'info') {
    try {
        // Only send to server in production
        if (process.env.NODE_ENV === 'development') {
            console.log(`[SERVER LOG] ${message}`, data);
            return;
        }

        await fetch('/api/log', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                level,
                message,
                data
            })
        });
    } catch (error) {
        // Fail silently - don't break app if logging fails
        console.error('Failed to send server log:', error);
    }
}

// Convenience methods
export const serverLogInfo = (message, data) => serverLog(message, data, 'info');
export const serverLogError = (message, data) => serverLog(message, data, 'error');
export const serverLogWarn = (message, data) => serverLog(message, data, 'warn');
export const serverLogDebug = (message, data) => serverLog(message, data, 'debug');
