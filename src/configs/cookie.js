export default {
    secret: 'FFXDUiIWWF5ttQyq8irUhIFRfi94lt',
    defaultOptions: {
        httpOnly: true,
        maxAge: 7 * 24 * 60 * 60 * 1000, // 1 week
        secure: process.env.NODE_ENV === 'production', // Use HTTPS in production only
        signed: true // Encrypted
    }
};
