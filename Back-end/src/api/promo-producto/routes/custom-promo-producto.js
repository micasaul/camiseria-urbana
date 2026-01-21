'use strict';

module.exports = {
  routes: [
    {
      method: 'GET',
      path: '/promo-productos/activa',
      handler: 'promo-producto.activa',
      config: {
        auth: false,
      },
    },
    {
      method: 'GET',
      path: '/promo-productos/activas/productos',
      handler: 'promo-producto.activarYListar',
      config: {
        auth: false,
      },
    },
  ],
};
