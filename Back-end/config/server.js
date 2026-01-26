module.exports = ({ env }) => ({
  url: 'https://camiseria-urbana-backend.onrender.com',

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
