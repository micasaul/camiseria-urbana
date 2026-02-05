'use strict';

/**
 * cupon router
 */

module.exports = {
  routes: [
    {
      method: 'POST',
      path: '/cupones/crear-con-usuarios',
      handler: 'cupon.crearConUsuarios',
      config: {
        policies: [],
        auth: false,
      },
    },
    {
      method: 'GET',
      path: '/cupones',
      handler: 'cupon.find',
      config: {},
    },
    {
      method: 'GET',
      path: '/cupones/:id',
      handler: 'cupon.findOne',
      config: {},
    },
    {
      method: 'POST',
      path: '/cupones',
      handler: 'cupon.create',
      config: {},
    },
    {
      method: 'PUT',
      path: '/cupones/:id',
      handler: 'cupon.update',
      config: {},
    },
    {
      method: 'DELETE',
      path: '/cupones/:id',
      handler: 'cupon.delete',
      config: {},
    },
  ],
};
