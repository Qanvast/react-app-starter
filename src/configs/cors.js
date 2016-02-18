export default {
    options: {},
    mode: process.env.CORS_MODE || 'relaxed', // You can do either strict or relaxed.
    whitelist: [
        'https://pro-wip.qanvast.com',
        'https://pro-uat.qanvast.com',
        'https://pro.qanvast.com',
        'https://getquotes.qanvast.com',
        'https://qanvast.com'
    ]
};
