module.exports = ({ env }) => ({
  url: env('BACKEND_URL'),

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
