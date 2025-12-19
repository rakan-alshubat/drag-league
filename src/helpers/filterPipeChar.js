/**
 * Removes the pipe character (|) from input strings to prevent parsing errors
 * @param {string} value - The input value to filter
 * @returns {string} - The filtered value without pipe characters
 */
export function filterPipeCharacter(value) {
    if (typeof value !== 'string') return value;
    return value.replace(/\|/g, '');
}

/**
 * Creates an onChange handler that filters out pipe characters
 * @param {Function} callback - The original onChange callback
 * @returns {Function} - A wrapped onChange handler that filters pipe characters
 */
export function createPipeFilteredOnChange(callback) {
    return (event) => {
        if (event?.target?.value !== undefined) {
            const filteredValue = filterPipeCharacter(event.target.value);
            // Update the input value immediately
            if (event.target.value !== filteredValue) {
                event.target.value = filteredValue;
            }
            // Create a new event object with filtered value
            const filteredEvent = {
                ...event,
                target: {
                    ...event.target,
                    value: filteredValue
                }
            };
            callback(filteredEvent);
        } else {
            callback(event);
        }
    };
}
