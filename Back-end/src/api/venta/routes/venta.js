'use strict';

/**
 * venta router
 */

module.exports = {
  routes: [
    {
      method: 'GET',
      path: '/ventas',
      handler: 'venta.find',
      config: {
        auth: false,
      },
    },
    {
      method: 'GET',
      path: '/ventas/:id',
      handler: 'venta.findOne',
      config: {
        auth: false,
      },
    },
    {
      method: 'POST',
      path: '/ventas',
      handler: 'venta.create',
      config: {
        auth: false,
      },
    },
    {
      method: 'PUT',
      path: '/ventas/:id',
      handler: 'venta.update',
      config: {
        auth: false,
      },
    },
    {
      method: 'DELETE',
      path: '/ventas/:id',
      handler: 'venta.delete',
      config: {
        auth: false,
      },
    },
    {
      method: 'POST',
      path: '/ventas/fromCarrito',
      handler: 'venta.fromCarrito',
      config: {
        auth: false,
      },
    },
    {
      method: 'POST',
      path: '/ventas/revertir',
      handler: 'venta.revertir',
      config: {
        auth: false,
      },
    },
  ],
};
