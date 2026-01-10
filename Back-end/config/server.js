module.exports = ({ env }) => ({
  url: env('BACKEND_URL', 'http://localhost:1337'),

  app: {
    keys: env.array('APP_KEYS'),
  },

  auth: {
    secret: env('ADMIN_JWT_SECRET'),
  },

  webhooks: {
    populateRelations: env.bool('WEBHOOKS_POPULATE_RELATIONS', false),
  },
});
