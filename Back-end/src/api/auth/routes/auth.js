'use strict';

module.exports = {
  routes: [
    {
      method: 'POST',
      path: '/auth/google-token',
      handler: 'auth.googleToken',
      config: {
        auth: false,
      },
    },
  ],
};
