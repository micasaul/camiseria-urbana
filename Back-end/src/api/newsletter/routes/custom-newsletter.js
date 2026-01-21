'use strict';

module.exports = {
  routes: [
    {
      method: 'POST',
      path: '/newsletters/suscribir',
      handler: 'newsletter.suscribir',
      config: {
        auth: false,
      },
    },
  ],
};
