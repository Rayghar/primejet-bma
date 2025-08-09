// src/services/loggingService.js
// This service is now configured to output logs directly to the browser console.

/**
 * A centralized logging service to record application events and errors in the console.
 * @param {'DEBUG' | 'INFO' | 'WARN' | 'ERROR'} level - The severity level of the log.
 * @param {string} message - A concise description of the event or error.
 * @param {object} details - An object containing additional context (e.g., component name, error stack).
 */
export const logAppEvent = (level, message, details = {}) => {
    // We only log 'DEBUG' level messages when not in a production environment
    // to avoid cluttering the console for live users.
    if (level === 'DEBUG' && process.env.NODE_ENV === 'production') {
        return;
    }

    const logMessage = `%c[${level}]%c ${message}`;
    
    let levelColor = 'color: gray;'; // Default for DEBUG
    switch (level) {
        case 'INFO':
            levelColor = 'color: #1E90FF; font-weight: bold;'; // DodgerBlue
            break;
        case 'WARN':
            levelColor = 'color: #FFD700; font-weight: bold;'; // Gold
            break;
        case 'ERROR':
            levelColor = 'color: #DC143C; font-weight: bold;'; // Crimson
            break;
        default:
            break;
    }

    // Log the formatted message and the details object
    console.log(logMessage, levelColor, 'color: inherit;', details);
};
