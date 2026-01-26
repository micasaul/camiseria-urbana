module.exports = ({ env }) => ({
  url: env('PUBLIC_URL', 'http://localhost:1337'),

  app: {
    keys: env.array('APP_KEYS'),
  },
  
  proxy: true,

  auth: {
    secret: env('ADMIN_JWT_SECRET'),
  },

  webhooks: {
    populateRelations: env.bool('WEBHOOKS_POPULATE_RELATIONS', false),
  },
});
