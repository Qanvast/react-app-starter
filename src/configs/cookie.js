'use strict';

export default {
    secret: 'FFXDUiIWWF5ttQyq8irUhIFRfi94lt',
    defaultOptions: {
        httpOnly: true,
        maxAge: 1 * 60 * 60 * 1000, // 1 hour
        secure: true, // Use HTTPS only
        signed: true // Encrypted
    }
}
