export default function formatError(err) {
    try {
        if (!err) return 'An unexpected error occurred.';
        if (typeof err === 'string') return err;
        if (err.message) return String(err.message);
        // GraphQL errors often come as { errors: [{ message }] }
        if (Array.isArray(err.errors)) return err.errors.map(e => e.message || JSON.stringify(e)).join('; ');
        // Axios-like responses
        if (err.response && err.response.body) {
            try {
                return typeof err.response.body === 'string' ? err.response.body : JSON.stringify(err.response.body);
            } catch (e) {
                return String(err.response.body);
            }
        }
        if (err.response && err.response.data) {
            try {
                return typeof err.response.data === 'string' ? err.response.data : JSON.stringify(err.response.data);
            } catch (e) {
                return String(err.response.data);
            }
        }
        // Try stringify with non-enumerable props too
        try { return JSON.stringify(err, Object.getOwnPropertyNames(err)); } catch (e) { return String(err); }
    } catch (e) {
        return 'An unexpected error occurred.';
    }
}
