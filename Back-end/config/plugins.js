module.exports = ({ env }) => ({
    'users-permissions': { 
        config: {
            jwt: {
                expiresIn: '7d',
            },
            jwtSecret: env('JWT_SECRET'),
            providers: {
                google: {
                    clientId: env('GOOGLE_CLIENT_ID'),
                    clientSecret: env('GOOGLE_CLIENT_SECRET'),
                },
            },
        },
    },
    email: {
        config: {
            provider: 'nodemailer',
            providerOptions: {
                host: env('MAIL_HOST'),
                port: env('MAIL_PORT'),
                secure: env.bool('MAIL_SECURE', false),
                auth: {
                    user: env('MAIL_USER'),
                    pass: env('MAIL_PASS'),
                },
            },
            settings: {
                defaultFrom: env('MAIL_USER'),
                defaultReplyTo: env('MAIL_USER'),
            },
        },
    },
});
